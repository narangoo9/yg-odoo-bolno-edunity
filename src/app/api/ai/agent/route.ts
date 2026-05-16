import { NextRequest } from "next/server";
import { streamText, stepCountIs } from "ai";
import type { ModelMessage } from "ai";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { loadAgentContext, prismaJson } from "@/lib/ai/context";
import { EDUNITY_AGENT_SYSTEM } from "@/lib/ai/system-prompt";
import { getAgentContext } from "@/lib/agent/agent-context";
import { actionIntentHint, formatToolSummary } from "@/lib/ai/tool-summary";
import { buildAgentUiFromTools } from "@/lib/ai/tool-ui";
import { createAgentTools } from "@/lib/ai/tools";
import { getFallbackModel, getPrimaryModel } from "@/lib/ai/groq";
import { rateLimit } from "@/lib/cache";
import { agentRequestSchema } from "@/lib/validations/ai";
import type { AiMessageRole } from "@prisma/client";

export const runtime = "nodejs";
export const maxDuration = 120;

function mapDbRole(r: AiMessageRole): "user" | "assistant" | "system" {
  if (r === "USER") return "user";
  if (r === "ASSISTANT") return "assistant";
  return "system";
}

const jsonErr = (error: string, status: number) =>
  new Response(JSON.stringify({ error }), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return jsonErr("Unauthorized", 401);
  }

  const userId = session.user.id;

  const { success } = await rateLimit(`ai-agent:${userId}`, 24, 3600, "fail-open");
  if (!success) {
    return jsonErr("Rate limited", 429);
  }

  const body = await req.json().catch(() => null);
  const parsed = agentRequestSchema.safeParse(body);
  if (!parsed.success) {
    return new Response(
      JSON.stringify({ error: "Invalid body", details: parsed.error.flatten() }),
      { status: 400, headers: { "Content-Type": "application/json; charset=utf-8" } },
    );
  }

  const { conversationId, message, currentPage, currentCourseId, currentLessonId } = parsed.data;
  const pageCtx = { currentPage, currentCourseId, currentLessonId };

  const model = getPrimaryModel() ?? getFallbackModel();
  if (!model) {
    return jsonErr("GROQ_API_KEY is not configured on the server.", 503);
  }

  let aiSession =
    conversationId &&
    (await db.aiSession.findFirst({
      where: { id: conversationId, userId },
      select: { id: true },
    }));

  if (!aiSession) {
    aiSession = await db.aiSession.create({
      data: {
        userId,
        title: message.slice(0, 80),
        courseId: currentCourseId ?? null,
        lessonId: currentLessonId ?? null,
        model: "groq-llama-3.3-70b-versatile",
      },
      select: { id: true },
    });
  }

  const sessionId = aiSession.id;

  await db.aiMessage.create({
    data: {
      sessionId,
      role: "USER",
      content: message,
      metadata: prismaJson({ page: pageCtx }),
    },
  });

  const prior = await db.aiMessage.findMany({
    where: { sessionId, session: { userId } },
    orderBy: { createdAt: "asc" },
    take: 40,
    select: { role: true, content: true },
  });

  const history: ModelMessage[] = prior
    .filter((m) => m.role === "USER" || m.role === "ASSISTANT")
    .map((m) => ({
      role: mapDbRole(m.role),
      content: m.content,
    }));

  const contextBlock = await loadAgentContext(userId, sessionId, pageCtx);
  const intentHint = actionIntentHint(message);
  const system = [
    EDUNITY_AGENT_SYSTEM,
    intentHint ? `\n---\n${intentHint}` : "",
    `\n---\nCONTEXT:\n${contextBlock}`,
  ].join("");

  const tools = createAgentTools(userId, pageCtx);

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (obj: unknown) => {
        controller.enqueue(encoder.encode(`${JSON.stringify(obj)}\n`));
      };

      send({ type: "ready", conversationId: sessionId });

      let fullText = "";
      const toolEvents: Array<{ toolName: string; output: unknown }> = [];

      try {
        const result = streamText({
          model,
          system,
          messages: history,
          tools,
          stopWhen: stepCountIs(12),
          temperature: 0.25,
          maxOutputTokens: 2048,
          onError: ({ error }) => {
            send({ type: "error", message: String(error) });
          },
        });

        for await (const part of result.fullStream) {
          if (part.type === "text-delta") {
            fullText += part.text;
            send({ type: "text", text: part.text });
          } else if (part.type === "tool-result") {
            toolEvents.push({ toolName: part.toolName, output: part.output });
            send({ type: "tool_result", toolName: part.toolName, output: part.output });
          } else if (part.type === "tool-error") {
            send({ type: "tool_error", toolName: part.toolName, error: String(part.error) });
          }
        }

        const actionSummary = formatToolSummary(toolEvents);
        if (actionSummary) {
          const block = `\n\n---\n**Хийгдсэн үйлдэл (платформ):**\n${actionSummary}`;
          fullText += block;
          send({ type: "text", text: block });
        }

        const agentCtx = await getAgentContext(userId, {
          pageContext: currentPage,
          courseId: currentCourseId,
          lessonId: currentLessonId,
        });
        const ui = buildAgentUiFromTools(toolEvents, agentCtx);
        send({ type: "ui", actions: ui.actions, suggestions: ui.suggestions });

        await db.aiMessage.create({
          data: {
            sessionId,
            role: "ASSISTANT",
            content: fullText || "(empty)",
            metadata: prismaJson({
              tools: toolEvents,
              actions: ui.actions,
              suggestions: ui.suggestions,
            }),
          },
        });

        await db.aiSession.update({
          where: { id: sessionId },
          data: { updatedAt: new Date(), title: message.slice(0, 80) },
        });

        send({ type: "done", conversationId: sessionId });
      } catch (e) {
        send({ type: "error", message: e instanceof Error ? e.message : "Unknown error" });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
