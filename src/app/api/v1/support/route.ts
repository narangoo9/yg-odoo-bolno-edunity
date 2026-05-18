import { NextResponse } from "next/server";
import { z } from "zod";
import { sendEmail } from "@/lib/email";
import { env } from "@/lib/env";
const supportSchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email().max(200),
  topic: z.string().min(1).max(80),
  message: z.string().min(10).max(5000),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = supportSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Буруу өгөгдөл. Бүх талбарыг бөглөнө үү." },
        { status: 400 },
      );
    }

    const { name, email, topic, message } = parsed.data;
    await sendEmail({
      to: env.supportEmail,
      replyTo: email,
      subject: `[EduNity Support] ${topic} — ${name}`,
      template: "support-request",
      data: { name, email, topic, message },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[support] email failed:", error);
    return NextResponse.json(
      { error: "Мессеж илгээхэд алдаа гарлаа. Дахин оролдоно уу." },
      { status: 500 },
    );
  }
}
