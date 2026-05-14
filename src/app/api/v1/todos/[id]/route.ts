import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { ok, unauthorized, badRequest, notFound, serverError } from "@/shared/utils/api-response";
import { z } from "zod";

const updateTodoSchema = z.object({
  text: z.string().min(1).optional(),
  status: z.enum(["pending", "inProgress", "completed"]).optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  orderIndex: z.number().int().optional(),
});

const PRIORITY_MAP: Record<string, "LOW" | "MEDIUM" | "HIGH"> = {
  low: "LOW",
  medium: "MEDIUM",
  high: "HIGH",
};

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user) return unauthorized();

    const { id } = await params;
    const existing = await db.todoItem.findUnique({ where: { id } });
    if (!existing) return notFound("Todo олдсонгүй");
    if (existing.userId !== session.user.id) return unauthorized();

    const body = await req.json().catch(() => ({}));
    const parsed = updateTodoSchema.safeParse(body);
    if (!parsed.success) return badRequest("Validation failed", parsed.error.flatten().fieldErrors);

    const d = parsed.data;
    const isCompleted = d.status === "completed";

    const todo = await db.todoItem.update({
      where: { id },
      data: {
        ...(d.text !== undefined && { title: d.text }),
        ...(d.status !== undefined && {
          status: d.status,
          isCompleted,
          completedAt: isCompleted ? new Date() : null,
        }),
        ...(d.priority !== undefined && { priority: PRIORITY_MAP[d.priority] ?? "MEDIUM" }),
        ...(d.orderIndex !== undefined && { orderIndex: d.orderIndex }),
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
    console.error("PUT /api/v1/todos/[id] error:", err);
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
    const existing = await db.todoItem.findUnique({ where: { id } });
    if (!existing) return notFound("Todo олдсонгүй");
    if (existing.userId !== session.user.id) return unauthorized();

    await db.todoItem.delete({ where: { id } });
    return ok({ id });
  } catch (err) {
    console.error("DELETE /api/v1/todos/[id] error:", err);
    return serverError();
  }
}
