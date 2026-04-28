import { z } from "zod";

export const submitReviewSchema = z.object({
  courseId: z.string().cuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(10, "Сэтгэгдэл 10-аас дээш тэмдэгттэй").max(1000).optional(),
});

export type SubmitReviewInput = z.infer<typeof submitReviewSchema>;
