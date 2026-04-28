import { z } from "zod";

export const createTodoSchema = z.object({
  title: z.string().min(1, "Гарчиг оруулна уу").max(200),
  body: z.string().max(2000).optional(),
  imageUrl: z.string().url().optional().or(z.literal("")),
  dueDate: z.string().datetime().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
});

export const updateTodoSchema = createTodoSchema.partial().extend({
  id: z.string().min(1),
  isCompleted: z.boolean().optional(),
  orderIndex: z.number().int().optional(),
});

export const addReactionSchema = z.object({
  contentType: z.enum(["COMMENT", "LESSON", "COURSE", "MESSAGE", "CAPSTONE"]),
  contentId: z.string().min(1),
  emoji: z.string().min(1).max(10),
});

export const sendDmSchema = z.object({
  recipientId: z.string().min(1),
  body: z.string().min(1).max(2000),
  imageUrl: z.string().url().optional().or(z.literal("")),
});

export type CreateTodoInput = z.infer<typeof createTodoSchema>;
export type UpdateTodoInput = z.infer<typeof updateTodoSchema>;
export type AddReactionInput = z.infer<typeof addReactionSchema>;
export type SendDmInput = z.infer<typeof sendDmSchema>;
