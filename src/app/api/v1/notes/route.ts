import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { ok, unauthorized, badRequest, serverError } from "@/shared/utils/api-response";
import { z } from "zod";

const createNoteSchema = z.object({
  col: z.enum(["todo", "inprogress", "review", "done"]).default("todo"),
  title: z.string().default("New Card"),
  content: z.string().default(""),
  checklist: z.array(z.object({ id: z.string(), text: z.string(), done: z.boolean() })).default([]),
  color: z.enum(["white", "violet", "amber", "emerald", "rose", "sky"]).default("white"),
  coverImage: z.string().nullable().optional(),
  tags: z.array(z.string()).default([]),
  orderIndex: z.number().int().default(0),
});

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) return unauthorized();

    const notes = await db.note.findMany({
      where: { userId: session.user.id },
      orderBy: [{ col: "asc" }, { orderIndex: "asc" }, { createdAt: "asc" }],
    });

    return ok(notes);
  } catch (err) {
    console.error("GET /api/v1/notes error:", err);
    return serverError();
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return unauthorized();

    const body = await req.json().catch(() => ({}));
    const parsed = createNoteSchema.safeParse(body);
    if (!parsed.success) return badRequest("Validation failed", parsed.error.flatten().fieldErrors);

    const note = await db.note.create({
      data: {
        userId: session.user.id,
        col: parsed.data.col,
        title: parsed.data.title,
        content: parsed.data.content,
        checklist: parsed.data.checklist,
        color: parsed.data.color,
        coverImage: parsed.data.coverImage ?? null,
        tags: parsed.data.tags,
        orderIndex: parsed.data.orderIndex,
      },
    });

    return ok(note);
  } catch (err) {
    console.error("POST /api/v1/notes error:", err);
    return serverError();
  }
}
