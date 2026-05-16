import { type NextRequest } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { ok, unauthorized, badRequest, forbidden, notFound, serverError } from "@/shared/utils/api-response";

const patchSchema = z.object({
  content: z.string().min(1).max(5000),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) return unauthorized();

    const { id } = await params;

    const body = await req.json().catch(() => ({}));
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) return badRequest("Буруу оролт", parsed.error.flatten().fieldErrors);

    const note = await db.study_notes.findUnique({ where: { id }, select: { userId: true } });
    if (!note) return notFound("Тэмдэглэл олдсонгүй");
    if (note.userId !== session.user.id) return forbidden("Эрх хүрэлцэхгүй");

    const updated = await db.study_notes.update({
      where: { id },
      data: { content: parsed.data.content },
      select: { id: true, sectionId: true, seconds: true, content: true, createdAt: true, updatedAt: true },
    });

    return ok(updated);
  } catch (err) {
    console.error("PATCH /api/v1/learning/study-notes/[id] error:", err);
    return serverError();
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) return unauthorized();

    const { id } = await params;

    const note = await db.study_notes.findUnique({ where: { id }, select: { userId: true } });
    if (!note) return notFound("Тэмдэглэл олдсонгүй");
    if (note.userId !== session.user.id) return forbidden("Эрх хүрэлцэхгүй");

    await db.study_notes.delete({ where: { id } });
    return ok({ deleted: true });
  } catch (err) {
    console.error("DELETE /api/v1/learning/study-notes/[id] error:", err);
    return serverError();
  }
}
