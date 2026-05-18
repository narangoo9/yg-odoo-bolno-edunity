import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { updateProfileSchema } from "@/modules/auth/domain/schemas";
import { ok, unauthorized, badRequest, serverError } from "@/shared/utils/api-response";
import { revalidatePath, revalidateTag } from "next/cache";
import { revalidateUserDashboard } from "@/lib/dashboard-cache";
import { deleteUserById } from "@/lib/user/delete-user";

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

export async function DELETE() {
  try {
    const session = await auth();
    if (!session?.user?.id) return unauthorized();

    const userId = session.user.id;
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, ownedOrg: { select: { id: true } } },
    });

    if (!user) return unauthorized();
    if (user.role === "SUPER_ADMIN") {
      return badRequest("Super admin account-ыг эндээс устгах боломжгүй.");
    }
    if (user.ownedOrg) {
      return badRequest("Байгууллагын owner account устгахын өмнө owner эрхээ шилжүүлнэ үү.");
    }
    const courseCount = await db.course.count({ where: { instructorId: userId } });
    if (courseCount > 0) {
      return badRequest("Course үүсгэсэн account-ыг шууд устгах боломжгүй. Эхлээд course owner-оо шилжүүлнэ үү.");
    }

    await db.$transaction(
      async (tx) => {
        await deleteUserById(tx, userId);
      },
      { maxWait: 15_000, timeout: 60_000 },
    );

    revalidateTag("admin-analytics");
    revalidatePath("/", "layout");
    return ok({ deleted: true }, "Account устгагдлаа");
  } catch (error) {
    console.error("DELETE /api/v1/users/me error:", error);
    return serverError();
  }
}
