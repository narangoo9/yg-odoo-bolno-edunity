import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { updateProfileSchema } from "@/modules/auth/domain/schemas";
import { ok, unauthorized, badRequest, serverError } from "@/shared/utils/api-response";
import { revalidatePath, revalidateTag } from "next/cache";
import { revalidateUserDashboard } from "@/lib/dashboard-cache";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) return unauthorized();

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true, name: true, email: true, avatarUrl: true,
        bio: true, role: true, status: true, createdAt: true,
        emailVerified: true, organizationId: true,
      },
    });
    if (!user) return unauthorized();
    return ok(user);
  } catch {
    return serverError();
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return unauthorized();

    const body = await req.json();
    const parsed = updateProfileSchema.safeParse(body);
    if (!parsed.success) return badRequest("Validation failed", parsed.error.flatten().fieldErrors);

    const user = await db.user.update({
      where: { id: session.user.id },
      data: {
        name: parsed.data.name,
        bio: parsed.data.bio || null,
        avatarUrl: parsed.data.avatarUrl || null,
      },
      select: { id: true, name: true, email: true, bio: true, avatarUrl: true },
    });

    // Audit log
    await db.auditLog.create({
      data: {
        userId: session.user.id,
        action: "PROFILE_UPDATE",
        entity: "User",
        entityId: session.user.id,
        newData: parsed.data as object,
      },
    });

    revalidateUserDashboard(session.user.id);
    revalidateTag("admin-analytics");
    revalidatePath("/", "layout");

    return ok(user, "Профайл амжилттай шинэчлэгдлээ");
  } catch {
    return serverError();
  }
}
