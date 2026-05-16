import type { ChatMessage } from "@/components/ai-agent/AiAgentMessage";
import type { AgentAction } from "@/lib/agent/agent-types";

export type ToolChip = { id: string; title: string; detail?: string };

const TOOL_LABELS: Record<string, string> = {
  create_study_plan: "✓ Төлөвлөгөө үүсгэсэн",
  create_todo: "✓ Todo нэмэгдсэн",
  create_note: "✓ Тэмдэглэл хадгалагдсан",
  update_learning_profile: "✓ Профайл шинэчлэгдсэн",
  recommend_lessons: "✓ Хичээл санал болгосон",
  summarize_lesson: "✓ Хичээл тайлбарласан",
  generate_daily_tasks: "✓ Өдрийн даалгавар үүсгэсэн",
};

export function toolLabel(name: string): string {
  return TOOL_LABELS[name] ?? `✓ ${name}`;
}

export function toolDetail(name: string, output: unknown): string | undefined {
  try {
    const o = output as Record<string, unknown>;
    if (name === "create_study_plan" && o?.todosCreated != null) {
      return `Todo: ${String(o.todosCreated)}`;
    }
    if (name === "recommend_lessons") {
      const n = Array.isArray(o?.items) ? o.items.length : 0;
      const first = Array.isArray(o?.items) && o.items[0] ? (o.items[0] as Record<string, unknown>) : null;
      const title = first?.courseTitle ? String(first.courseTitle) : null;
      return title ? `${n} · ${title}` : `${n} олдлоо`;
    }
    if (name === "create_study_plan" && o?.studyPlanId) {
      return String(o.title ?? o.studyPlanId);
    }
    if (name === "generate_daily_tasks" && o?.count != null) {
      return `${String(o.count)} todo`;
    }
    return undefined;
  } catch {
    return undefined;
  }
}

export function agentHttpErrorMn(status: number, serverError?: string): string {
  if (status === 401) return "Нэвтрэх шаардлагатай. Дахин нэвтэрнэ үү.";
  if (status === 429) return "Хэт олон хүсэлт. Хэсэг хугацааны дараа дахин оролдоно уу.";
  if (status === 503 && serverError?.includes("GROQ_API_KEY")) {
    return "GROQ_API_KEY тохируулаагүй. `.env` дээр түлхүүр нэмээд dev серверээ дахин асаана уу.";
  }
  if (serverError) return `Серверийн алдаа (${status}): ${serverError}`;
  return `Серверийн алдаа (${status}).`;
}

export interface StreamAgentOptions {
  message: string;
  conversationId?: string | null;
  currentPage?: string;
  currentCourseId?: string;
  currentLessonId?: string;
  onConversationId?: (id: string) => void;
  onText?: (assembled: string) => void;
  onTool?: (chip: ToolChip) => void;
  onUi?: (ui: { actions: AgentAction[]; suggestions: string[] }) => void;
}

export interface StreamAgentResult {
  ok: boolean;
  assistantMessage?: ChatMessage;
  errorContent?: string;
}

/** Consume NDJSON stream from POST /api/ai/agent */
export async function streamGroqAgent(
  options: StreamAgentOptions,
): Promise<StreamAgentResult> {
  const res = await fetch("/api/ai/agent", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      conversationId: options.conversationId ?? undefined,
      message: options.message,
      currentPage: options.currentPage,
      currentCourseId: options.currentCourseId,
      currentLessonId: options.currentLessonId,
    }),
  });

  if (!res.ok) {
    let serverError = "";
    try {
      const j = (await res.json()) as { error?: string };
      serverError = typeof j?.error === "string" ? j.error : "";
    } catch {
      /* non-json */
    }
    return {
      ok: false,
      errorContent: agentHttpErrorMn(res.status, serverError),
    };
  }

  if (!res.body) {
    return { ok: false, errorContent: "Сервер хариу өгсөнгүй." };
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let assembled = "";
  const tools: ToolChip[] = [];
  let actions: AgentAction[] = [];
  let suggestions: string[] = [];

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split("\n");
    buffer = parts.pop() ?? "";
    for (const line of parts) {
      const ln = line.trim();
      if (!ln) continue;
      let ev: {
        type?: string;
        text?: string;
        toolName?: string;
        output?: unknown;
        conversationId?: string;
        message?: string;
        actions?: AgentAction[];
        suggestions?: string[];
      };
      try {
        ev = JSON.parse(ln) as typeof ev;
      } catch {
        continue;
      }
      if (ev.type === "ready" && ev.conversationId) {
        options.onConversationId?.(ev.conversationId);
      }
      if (ev.type === "text" && ev.text) {
        assembled += ev.text;
        options.onText?.(assembled);
      }
      if (ev.type === "tool_result" && ev.toolName) {
        const chip: ToolChip = {
          id: crypto.randomUUID(),
          title: toolLabel(ev.toolName),
          detail: toolDetail(ev.toolName, ev.output),
        };
        tools.push(chip);
        options.onTool?.(chip);
      }
      if (ev.type === "ui" && Array.isArray(ev.actions)) {
        actions = ev.actions;
        suggestions = Array.isArray(ev.suggestions) ? ev.suggestions : [];
        options.onUi?.({ actions, suggestions });
      }
      if (ev.type === "error") {
        return {
          ok: false,
          errorContent: `Алдаа: ${String(ev.message ?? "unknown")}`,
        };
      }
      if (ev.type === "done") {
        const id = crypto.randomUUID();
        return {
          ok: true,
          assistantMessage: {
            id,
            role: "assistant",
            content: assembled || "Дууссан.",
            timestamp: Date.now(),
            toolChips: tools.length ? tools : undefined,
            actions: actions.length ? actions : undefined,
            suggestions: suggestions.length ? suggestions : undefined,
          },
        };
      }
    }
  }

  if (assembled) {
    return {
      ok: true,
      assistantMessage: {
        id: crypto.randomUUID(),
        role: "assistant",
        content: assembled,
        timestamp: Date.now(),
        toolChips: tools.length ? tools : undefined,
        actions: actions.length ? actions : undefined,
        suggestions: suggestions.length ? suggestions : undefined,
      },
    };
  }

  return { ok: false, errorContent: "Хариу дууссангүй. Дахин оролдоно уу." };
}
