import { z } from "zod";

export const postCommentSchema = z.object({
  contentType: z.enum(["LESSON", "COURSE", "CAPSTONE", "PROGRAM"]),
  contentId: z.string().min(1),
  body: z.string().min(1, "Сэтгэгдэл хоосон байж болохгүй").max(2000),
  parentId: z.string().optional(),
});

export type PostCommentInput = z.infer<typeof postCommentSchema>;
