import { z } from "zod";

export const createOrderSchema = z.object({
  items: z.array(
    z.object({
      courseId: z.string().optional(),
      programId: z.string().optional(),
    }).refine((d) => d.courseId || d.programId, "Курс эсвэл программ заавал шаардлагатай")
  ).min(1),
  couponCode: z.string().optional(),
  useWalletCredits: z.boolean().default(false),
});

export const requestRefundSchema = z.object({
  orderId: z.string().min(1),
  reason: z.string().min(10, "Шалтгаан 10-аас дээш тэмдэгттэй байх ёстой"),
});

export const processRefundSchema = z.object({
  refundRequestId: z.string().min(1),
  approve: z.boolean(),
  notes: z.string().optional(),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type RequestRefundInput = z.infer<typeof requestRefundSchema>;
export type ProcessRefundInput = z.infer<typeof processRefundSchema>;
