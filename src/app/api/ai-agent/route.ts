import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { sensitiveRateLimit } from "@/lib/cache";
import { getAgentContext } from "@/lib/agent/agent-context";
import { runAgent } from "@/lib/agent/agent-engine";

/**
 * POST /api/ai-agent
 *
 * Request body:
 *   { message: string; pageContext?: string; courseId?: string; lessonId?: string }
 *
 * Response:
 *   { reply, intent, actions, suggestions, mode }
 *
 * Works without any paid AI API — falls back to rule-based logic automatically.
 */
export async function POST(req: NextRequest) {
  // Public endpoint: anonymous users get rule-based help; authenticated users get personalized context.
  // ── Auth ────────────────────────────────────────────────────────────────────
  let userId: string | null = null;
  try {
    const session = await auth();
    userId = session?.user?.id ?? null;
  } catch {
    /* auth failure → run as anonymous with empty context */
  }

  // ── Rate limit (per user or per IP for anonymous) ──────────────────────────
  const rateLimitKey = userId
    ? `ai-agent:${userId}`
    : `ai-agent:anon:${req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown"}`;

  try {
    const rate = await sensitiveRateLimit(rateLimitKey, userId ? 60 : 20, 3600);
    if (!rate.success) {
      return NextResponse.json(
        {
          reply: "AI хүсэлтийн лимит хэтэрлээ. 1 цагийн дараа дахин оролдоно уу.",
          intent: "GENERAL_HELP",
          actions: [],
          suggestions: [],
          mode: "fallback",
        },
        { status: 429 },
      );
    }
  } catch {
    return NextResponse.json(
      {
        reply: "AI үйлчилгээ түр хүрэлцэхгүй байна. Дараа дахин оролдоно уу.",
        intent: "GENERAL_HELP",
        actions: [],
        suggestions: [],
        mode: "fallback",
      },
      { status: 503 },
    );
  }

  // ── Parse body ──────────────────────────────────────────────────────────────
  let message = "";
  let pageContext: string | undefined;
  let courseId: string | undefined;
  let lessonId: string | undefined;

  try {
    const body = (await req.json()) as {
      message?: string;
      pageContext?: string;
      courseId?: string;
      lessonId?: string;
    };
    message = (body.message ?? "").trim();
    pageContext = body.pageContext;
    courseId = body.courseId;
    lessonId = body.lessonId;
  } catch {
    return NextResponse.json(
      { reply: "Хүсэлт буруу форматтай байна.", intent: "GENERAL_HELP", actions: [], suggestions: [], mode: "fallback" },
      { status: 400 },
    );
  }

  if (!message) {
    return NextResponse.json(
      { reply: "Хоосон мессеж илгээх боломжгүй.", intent: "GENERAL_HELP", actions: [], suggestions: [], mode: "fallback" },
      { status: 400 },
    );
  }

  if (message.length > 2000) {
    return NextResponse.json(
      { reply: "Мессеж хэт урт байна (2000 тэмдэгтээс хэтрэхгүй байх).", intent: "GENERAL_HELP", actions: [], suggestions: [], mode: "fallback" },
      { status: 400 },
    );
  }

  // ── Build context ───────────────────────────────────────────────────────────
  const context = userId
    ? await getAgentContext(userId, { pageContext, courseId, lessonId })
    : {
        userId: null,
        userName: null,
        level: 1,
        xp: 0,
        streak: 0,
        enrolledCourses: [],
        activeCourse: null,
        overallProgress: 0,
        totalCompletedLessons: 0,
        totalLessons: 0,
        certificates: [],
        pageContext,
        courseId,
        lessonId,
      };

  // ── Run agent ───────────────────────────────────────────────────────────────
  try {
    const response = await runAgent({ message, context });
    return NextResponse.json({
      reply: response.message,
      intent: response.intent,
      actions: response.actions ?? [],
      suggestions: response.suggestions ?? [],
      mode: response.mode,
    });
  } catch (err) {
    console.error("[api/ai-agent] Unexpected error:", err);
    return NextResponse.json(
      {
        reply:
          "Уучлаарай, AI Agent түр ажиллахгүй байна. Гэхдээ чи өнөөдөр нэг хичээлээ үргэлжлүүлэхийг санал болгож байна 🔥",
        intent: "GENERAL_HELP",
        actions: [{ label: "Хичээл харах", type: "navigate", href: "/student/courses", variant: "primary" }],
        suggestions: ["Би юу үзэх вэ?", "Миний progress хэд вэ?"],
        mode: "fallback",
      },
      { status: 500 },
    );
  }
}
