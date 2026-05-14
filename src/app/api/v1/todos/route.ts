import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { ok, unauthorized, badRequest, serverError } from "@/shared/utils/api-response";
import { z } from "zod";

const createTodoSchema = z.object({
  text: z.string().min(1, "Title required"),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  status: z.enum(["pending", "inProgress", "completed"]).default("pending"),
  orderIndex: z.number().int().default(0),
});

// Map component priority strings to DB enum
const PRIORITY_MAP: Record<string, "LOW" | "MEDIUM" | "HIGH"> = {
  low: "LOW",
  medium: "MEDIUM",
  high: "HIGH",
};

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) return unauthorized();

    const todos = await db.todoItem.findMany({
      where: { userId: session.user.id },
      orderBy: [{ orderIndex: "asc" }, { createdAt: "desc" }],
      select: {
        id: true,
        title: true,
        status: true,
        priority: true,
        isCompleted: true,
        orderIndex: true,
        createdAt: true,
      },
    });

    // Map DB shape to component shape
    const mapped = todos.map((t) => ({
      id: t.id,
      text: t.title,
      status: t.status as "pending" | "inProgress" | "completed",
      priority: t.priority.toLowerCase() as "low" | "medium" | "high",
      createdAt: t.createdAt,
      orderIndex: t.orderIndex,
    }));

    return ok(mapped);
  } catch (err) {
    console.error("GET /api/v1/todos error:", err);
    return serverError();
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return unauthorized();

    const body = await req.json().catch(() => ({}));
    const parsed = createTodoSchema.safeParse(body);
    if (!parsed.success) return badRequest("Validation failed", parsed.error.flatten().fieldErrors);

    const todo = await db.todoItem.create({
      data: {
        userId: session.user.id,
        title: parsed.data.text,
        priority: PRIORITY_MAP[parsed.data.priority] ?? "MEDIUM",
        status: parsed.data.status,
        isCompleted: parsed.data.status === "completed",
        completedAt: parsed.data.status === "completed" ? new Date() : null,
        orderIndex: parsed.data.orderIndex,
      },
    });

    return ok({
      id: todo.id,
      text: todo.title,
      status: todo.status as "pending" | "inProgress" | "completed",
      priority: todo.priority.toLowerCase() as "low" | "medium" | "high",
      createdAt: todo.createdAt,
      orderIndex: todo.orderIndex,
    });
  } catch (err) {
    console.error("POST /api/v1/todos error:", err);
    return serverError();
  }
}
