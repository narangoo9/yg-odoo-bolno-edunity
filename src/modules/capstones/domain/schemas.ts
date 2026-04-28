import { z } from "zod";

export const submitCapstoneSchema = z.object({
  courseId: z.string().optional(),
  programId: z.string().optional(),
  title: z.string().min(3, "Гарчиг 3-аас дээш тэмдэгттэй байх ёстой"),
  description: z.string().max(2000).optional(),
  submissionUrl: z.string().url("Зөв URL оруулна уу").optional().or(z.literal("")),
  fileUrls: z.array(z.string().url()).default([]),
});

export const submitPeerReviewSchema = z.object({
  capstoneId: z.string().min(1),
  score: z.number().min(0).max(100),
  feedback: z.string().min(10, "Санал хүсэлт 10-аас дээш тэмдэгттэй байх ёстой"),
  rubricScores: z.record(z.number()).optional(),
});

export type SubmitCapstoneInput = z.infer<typeof submitCapstoneSchema>;
export type SubmitPeerReviewInput = z.infer<typeof submitPeerReviewSchema>;
