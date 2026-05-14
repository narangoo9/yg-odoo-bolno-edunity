import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { ok, unauthorized, badRequest, notFound, serverError } from "@/shared/utils/api-response";
import { z } from "zod";

const updateNoteSchema = z.object({
  col: z.enum(["todo", "inprogress", "review", "done"]).optional(),
  title: z.string().optional(),
  content: z.string().optional(),
  checklist: z
    .array(z.object({ id: z.string(), text: z.string(), done: z.boolean() }))
    .optional(),
  color: z.enum(["white", "violet", "amber", "emerald", "rose", "sky"]).optional(),
  coverImage: z.string().nullable().optional(),
  tags: z.array(z.string()).optional(),
  orderIndex: z.number().int().optional(),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user) return unauthorized();

    const { id } = await params;
    const existing = await db.note.findUnique({ where: { id } });
    if (!existing) return notFound("Тэмдэглэл олдсонгүй");
    if (existing.userId !== session.user.id) return unauthorized();

    const body = await req.json().catch(() => ({}));
    const parsed = updateNoteSchema.safeParse(body);
    if (!parsed.success) return badRequest("Validation failed", parsed.error.flatten().fieldErrors);

    const d = parsed.data;
    const note = await db.note.update({
      where: { id },
      data: {
        ...(d.col !== undefined && { col: d.col }),
        ...(d.title !== undefined && { title: d.title }),
        ...(d.content !== undefined && { content: d.content }),
        ...(d.checklist !== undefined && { checklist: d.checklist }),
        ...(d.color !== undefined && { color: d.color }),
        ...("coverImage" in d && { coverImage: d.coverImage ?? null }),
        ...(d.tags !== undefined && { tags: d.tags }),
        ...(d.orderIndex !== undefined && { orderIndex: d.orderIndex }),
      },
    });

    return ok(note);
  } catch (err) {
    console.error("PUT /api/v1/notes/[id] error:", err);
    return serverError();
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user) return unauthorized();

    const { id } = await params;
    const existing = await db.note.findUnique({ where: { id } });
    if (!existing) return notFound("Тэмдэглэл олдсонгүй");
    if (existing.userId !== session.user.id) return unauthorized();

    await db.note.delete({ where: { id } });
    return ok({ id });
  } catch (err) {
    console.error("DELETE /api/v1/notes/[id] error:", err);
    return serverError();
  }
}
