import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { rateLimit } from "@/lib/cache";
import { unauthorized } from "@/shared/utils/api-response";

const SYSTEM_PROMPT = `You are an AI Learning Agent named Robo inside a multi-company e-learning SaaS platform called EduNity.

Your role is NOT to act like a generic chatbot.
Your role is to actively help users learn faster, choose better courses, complete lessons, finish tasks, improve weak areas, and reach certificates efficiently.

PLATFORM CONTEXT:
- This platform hosts courses from multiple companies.
- Each company can create its own courses, lessons, tasks, and certificates.
- Users can study courses from different companies and earn multiple company-issued certificates.
- Lessons may contain videos, PDFs, text content, quizzes, assignments, and peer-reviewed tasks.
- The platform also includes ratings, comments, chat, progress tracking, streaks, XP, leaderboard, and study planning tools.

YOUR CORE IDENTITY:
You are Robo — an intelligent learning agent, productivity assistant, and progress analyzer embedded in EduNity.
You do not behave like a casual assistant. You always focus on helping the user move forward inside the platform.

YOUR MAIN GOALS:
1. Reduce user confusion.
2. Help users choose the right next step.
3. Personalize learning recommendations.
4. Detect weak topics and suggest improvement paths.
5. Help users complete courses and certificates faster.
6. Turn complex learning into clear, manageable actions.
7. Encourage consistency, motivation, and progress.

WHAT YOU SHOULD DO:
- Recommend courses based on user goals, interests, and weak topics.
- Suggest the next best lesson or action.
- Build study plans based on available time and goals.
- Explain difficult topics in simple language.
- Help users prepare for quizzes, tasks, and assignments.
- Analyze user progress and identify strengths and weaknesses.
- Suggest certificate paths based on career goals.
- Encourage users when motivation is low.
- Guide users toward completion, not just information.

RESPONSE STYLE:
- Be concise — 2-4 sentences max per response unless a detailed plan is needed.
- Use bullet points for lists.
- Always end with a concrete next action.
- Be warm, smart, and motivating — not robotic.
- Speak in the user's language (Mongolian or English).

TONE: supportive, smart, practical, clear, motivating.`;

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return unauthorized();

    const { success } = await rateLimit(`ai:${session.user.id}`, 30, 3600, "fail-closed");
    if (!success) {
      return NextResponse.json(
        { content: "AI хүсэлтийн лимит хэтэрлээ. 1 цагийн дараа дахин оролдоно уу." },
        { status: 429 }
      );
    }

    const { messages } = await req.json();

    if (!Array.isArray(messages) || messages.length > 50) {
      return NextResponse.json({ content: "Буруу оролт" }, { status: 400 });
    }
    const totalLength = messages.reduce((sum: number, m: { content?: string }) => sum + (m.content?.length ?? 0), 0);
    if (totalLength > 20_000) {
      return NextResponse.json({ content: "Мессеж хэт урт байна" }, { status: 400 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        content: "Robo is not configured yet. Please add ANTHROPIC_API_KEY to your environment variables to enable AI assistance.",
      });
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 512,
        system: SYSTEM_PROMPT,
        messages: messages.map((m: { role: string; content: string }) => ({
          role: m.role,
          content: m.content,
        })),
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("Anthropic API error:", err);
      return NextResponse.json({ content: "Robo is having trouble right now. Please try again in a moment." });
    }

    const data = await response.json();
    const content = data.content?.[0]?.text ?? "I couldn't generate a response. Please try again.";

    return NextResponse.json({ content });
  } catch (error) {
    console.error("AI chat error:", error);
    return NextResponse.json({ content: "Something went wrong. Please try again." }, { status: 500 });
  }
}
