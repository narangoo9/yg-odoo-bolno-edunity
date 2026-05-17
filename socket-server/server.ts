import { createServer, type IncomingMessage, type ServerResponse } from "http";
import { Server, type Socket } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import { jwtVerify } from "jose";
import Redis from "ioredis";
import { PrismaClient, type UserRole } from "@prisma/client";
import { z } from "zod";

type SocketUser = {
  userId: string;
  role: UserRole;
  organizationId: string | null;
  name?: string;
  image?: string | null;
};

type LessonAccess = {
  courseId: string;
  lessonId: string;
  tenantId: string;
  companyId: string | null;
};

function readEnv(name: string) {
  const value = process.env[name]?.trim();
  return value && value.length > 0 ? value : undefined;
}

function parseAllowedOrigins(value: string | undefined, fallbackOrigin: string) {
  const origins = (value ?? fallbackOrigin)
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  return origins.length > 0 ? origins : [fallbackOrigin];
}

const nodeEnv = process.env.NODE_ENV ?? "development";
const configuredAppUrl = readEnv("NEXT_PUBLIC_APP_URL");
const appUrl = configuredAppUrl ?? "http://localhost:3000";
const allowedOrigins = parseAllowedOrigins(readEnv("SOCKET_ALLOWED_ORIGINS"), appUrl);
const port = Number(readEnv("SOCKET_PORT") ?? readEnv("PORT") ?? 3001);
const databaseUrl = readEnv("DATABASE_URL");
const redisUrl = readEnv("REDIS_URL");
const authSecret = readEnv("AUTH_SECRET") ?? readEnv("NEXTAUTH_SECRET");
const missingProductionEnv = [
  databaseUrl ? null : "DATABASE_URL",
  authSecret ? null : "AUTH_SECRET or NEXTAUTH_SECRET",
  configuredAppUrl ? null : "NEXT_PUBLIC_APP_URL",
].filter((value): value is string => Boolean(value));

if (nodeEnv === "production" && missingProductionEnv.length > 0) {
  throw new Error(
    `[socket] Missing required production environment variables: ${missingProductionEnv.join(", ")}`
  );
}

if (!databaseUrl && nodeEnv !== "production") {
  console.warn("[socket] DATABASE_URL is missing. Database-backed chat events will fail until configured.");
}

const prisma = new PrismaClient({
  log: nodeEnv === "development" ? ["warn", "error"] : ["error"],
});

const roomUsers = new Map<string, Set<string>>();
const userLastMessage = new Map<string, number>();

const joinLessonSchema = z.object({
  lessonId: z.string().min(1),
  courseId: z.string().min(1).optional(),
});

const sendMessageSchema = z.object({
  lessonId: z.string().min(1),
  courseId: z.string().min(1),
  text: z.string().trim().min(1).max(2000),
  replyToId: z.string().min(1).optional(),
});

const typingSchema = z.object({
  lessonId: z.string().min(1),
});

function socketSecret() {
  if (!authSecret) throw new Error("AUTH_SECRET or NEXTAUTH_SECRET must be configured");
  return new TextEncoder().encode(authSecret);
}

function lessonRoom(lessonId: string) {
  return `lesson:${lessonId}`;
}

function sendHealth(_req: IncomingMessage, res: ServerResponse) {
  res.writeHead(200, { "content-type": "application/json" });
  res.end(JSON.stringify({ ok: true, service: "edunity-socket" }));
}

async function configureRedisAdapter(io: Server) {
  if (!redisUrl) return;

  const pubClient = new Redis(redisUrl);
  const subClient = pubClient.duplicate();

  pubClient.on("error", (error) => console.error("Redis pub error", error));
  subClient.on("error", (error) => console.error("Redis sub error", error));

  io.adapter(createAdapter(pubClient, subClient));
}

async function verifySocketUser(socket: Socket): Promise<SocketUser> {
  const token = socket.handshake.auth?.token;

  if (typeof token !== "string" || token.length === 0) {
    throw new Error("Unauthorized");
  }

  const { payload } = await jwtVerify(token, socketSecret());
  const userId = typeof payload.userId === "string" ? payload.userId : payload.sub;

  if (!userId || typeof payload.role !== "string") {
    throw new Error("Unauthorized");
  }

  return {
    userId,
    role: payload.role as UserRole,
    organizationId: typeof payload.organizationId === "string" ? payload.organizationId : null,
    name: typeof payload.name === "string" ? payload.name : undefined,
    image: typeof payload.image === "string" ? payload.image : null,
  };
}

async function assertLessonAccess(user: SocketUser, lessonId: string, courseId?: string): Promise<LessonAccess> {
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    select: {
      id: true,
      module: {
        select: {
          course: {
            select: {
              id: true,
              organizationId: true,
              instructorId: true,
              status: true,
            },
          },
        },
      },
    },
  });

  const course = lesson?.module.course;

  if (!lesson || !course || (courseId && course.id !== courseId)) {
    throw new Error("Lesson not found");
  }

  const sameOrg = course.organizationId && course.organizationId === user.organizationId;
  const canManage =
    user.role === "SUPER_ADMIN" ||
    course.instructorId === user.userId ||
    (user.role === "ORG_ADMIN" && Boolean(sameOrg));

  if (!canManage) {
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        studentId_courseId: {
          studentId: user.userId,
          courseId: course.id,
        },
      },
      select: { status: true },
    });

    if (!enrollment || enrollment.status === "CANCELLED" || enrollment.status === "EXPIRED") {
      throw new Error("Forbidden");
    }
  }

  return {
    courseId: course.id,
    lessonId: lesson.id,
    tenantId: course.organizationId ?? "global",
    companyId: course.organizationId,
  };
}

function addOnlineUser(room: string, userId: string) {
  const users = roomUsers.get(room) ?? new Set<string>();
  users.add(userId);
  roomUsers.set(room, users);
  return users.size;
}

function removeOnlineUser(room: string, userId: string) {
  const users = roomUsers.get(room);
  if (!users) return 0;

  users.delete(userId);
  if (users.size === 0) {
    roomUsers.delete(room);
    return 0;
  }

  return users.size;
}

const httpServer = createServer(sendHealth);
const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
});

io.use(async (socket, next) => {
  try {
    socket.data.user = await verifySocketUser(socket);
    socket.data.joinedLessonRooms = new Set<string>();
    next();
  } catch {
    next(new Error("Unauthorized"));
  }
});

io.on("connection", (socket) => {
  const user = socket.data.user as SocketUser;

  socket.on("lesson:join", async (rawData) => {
    try {
      const data = joinLessonSchema.parse(rawData);
      const access = await assertLessonAccess(user, data.lessonId, data.courseId);
      const room = lessonRoom(access.lessonId);

      socket.join(room);
      (socket.data.joinedLessonRooms as Set<string>).add(room);

      const onlineCount = addOnlineUser(room, user.userId);
      const messages = await prisma.lessonChatMessage.findMany({
        where: {
          lessonId: access.lessonId,
          courseId: access.courseId,
          isDeleted: false,
        },
        orderBy: { createdAt: "desc" },
        take: 50,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
            },
          },
        },
      });

      socket.emit("message:history", {
        lessonId: access.lessonId,
        onlineCount,
        messages: messages.reverse(),
      });

      socket.to(room).emit("user:online", {
        userId: user.userId,
        lessonId: access.lessonId,
        onlineCount,
      });
    } catch (error) {
      socket.emit("message:error", {
        message: error instanceof Error ? error.message : "Could not join lesson chat",
      });
    }
  });

  socket.on("lesson:leave", (rawData) => {
    const parsed = typingSchema.safeParse(rawData);
    if (!parsed.success) return;

    const room = lessonRoom(parsed.data.lessonId);
    socket.leave(room);
    (socket.data.joinedLessonRooms as Set<string>).delete(room);

    const onlineCount = removeOnlineUser(room, user.userId);
    socket.to(room).emit("user:offline", {
      userId: user.userId,
      lessonId: parsed.data.lessonId,
      onlineCount,
    });
  });

  socket.on("message:send", async (rawData) => {
    try {
      const now = Date.now();
      const last = userLastMessage.get(user.userId) ?? 0;

      if (now - last < 800) {
        socket.emit("message:error", { message: "Too fast" });
        return;
      }

      const data = sendMessageSchema.parse(rawData);
      const access = await assertLessonAccess(user, data.lessonId, data.courseId);

      userLastMessage.set(user.userId, now);

      const message = await prisma.lessonChatMessage.create({
        data: {
          tenantId: access.tenantId,
          companyId: access.companyId,
          courseId: access.courseId,
          lessonId: access.lessonId,
          userId: user.userId,
          text: data.text,
          replyToId: data.replyToId,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
            },
          },
        },
      });

      io.to(lessonRoom(access.lessonId)).emit("message:new", message);
    } catch (error) {
      socket.emit("message:error", {
        message: error instanceof Error ? error.message : "Message failed",
      });
    }
  });

  socket.on("typing:start", (rawData) => {
    const parsed = typingSchema.safeParse(rawData);
    if (!parsed.success) return;

    const room = lessonRoom(parsed.data.lessonId);
    if (!(socket.data.joinedLessonRooms as Set<string>).has(room)) return;

    socket.to(room).emit("typing:start", {
      userId: user.userId,
      lessonId: parsed.data.lessonId,
      name: user.name,
    });
  });

  socket.on("typing:stop", (rawData) => {
    const parsed = typingSchema.safeParse(rawData);
    if (!parsed.success) return;

    const room = lessonRoom(parsed.data.lessonId);
    if (!(socket.data.joinedLessonRooms as Set<string>).has(room)) return;

    socket.to(room).emit("typing:stop", {
      userId: user.userId,
      lessonId: parsed.data.lessonId,
    });
  });

  socket.on("disconnect", () => {
    for (const room of socket.data.joinedLessonRooms as Set<string>) {
      const onlineCount = removeOnlineUser(room, user.userId);
      const lessonId = room.replace("lesson:", "");

      socket.to(room).emit("user:offline", {
        userId: user.userId,
        lessonId,
        onlineCount,
      });
    }
  });
});

configureRedisAdapter(io)
  .then(() => {
    httpServer.listen(port, () => {
      console.log(`EduNity Socket.IO server running on port ${port}`);
      console.log(`Allowed origins: ${allowedOrigins.join(", ")}`);
    });
  })
  .catch((error) => {
    console.error("Failed to start socket server", error);
    process.exit(1);
  });
