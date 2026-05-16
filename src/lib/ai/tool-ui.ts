import type { AgentAction, AgentContext } from "@/lib/agent/agent-types";
import { ACTION, messageAction, navigateAction } from "@/lib/agent/agent-actions";
import type { ToolEvent } from "@/lib/ai/tool-summary";

function asRecord(output: unknown): Record<string, unknown> | null {
  if (output && typeof output === "object") return output as Record<string, unknown>;
  return null;
}

function uniqueActions(actions: AgentAction[]): AgentAction[] {
  const seen = new Set<string>();
  return actions.filter((a) => {
    const key = `${a.type}:${a.href ?? ""}:${a.prompt ?? ""}:${a.label}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Turn executed tool outputs into navigate/message buttons + follow-up question chips
 * (same UX as the legacy rule-based agent).
 */
export function buildAgentUiFromTools(
  events: ToolEvent[],
  ctx?: Pick<AgentContext, "activeCourse" | "enrolledCourses"> | null,
): { actions: AgentAction[]; suggestions: string[] } {
  const actions: AgentAction[] = [];
  const suggestions = new Set<string>();

  for (const { toolName, output } of events) {
    const o = asRecord(output);
    if (!o || o.ok === false) continue;

    if (toolName === "recommend_lessons") {
      const items = Array.isArray(o.items) ? o.items : [];
      for (const raw of items.slice(0, 3)) {
        const it = raw as Record<string, unknown>;
        const courseId = String(it.courseId ?? "");
        const lessonId = it.lessonId ? String(it.lessonId) : null;
        const title = String(it.courseTitle ?? "Хичээл");
        if (courseId) {
          actions.push(
            navigateAction(
              lessonId ? `▶ ${title.slice(0, 24)}` : `Курс нээх: ${title.slice(0, 20)}`,
              lessonId
                ? `/student/courses/${courseId}/learn?lessonId=${lessonId}`
                : `/student/courses/${courseId}/learn`,
              actions.length === 0 ? "primary" : "secondary",
            ),
          );
        }
      }

      const enrolled = Array.isArray(o.enrolledCourses) ? o.enrolledCourses : [];
      for (const raw of enrolled.slice(0, 2)) {
        const e = raw as Record<string, unknown>;
        const courseId = String(e.courseId ?? "");
        if (courseId) {
          actions.push(
            navigateAction(
              `Үргэлжлүүлэх: ${String(e.title ?? "Миний курс").slice(0, 22)}`,
              `/student/courses/${courseId}/learn`,
              actions.length === 0 ? "primary" : "secondary",
            ),
          );
        }
      }

      suggestions.add("Миний progress хэд вэ?");
      suggestions.add("7 хоногийн план гарга");
      suggestions.add("Өнөөдөр юу хийх вэ?");
    }

    if (toolName === "create_study_plan") {
      actions.push(navigateAction("Todo харах", "/student", "primary"));
      actions.push(messageAction("Өдрийн даалгавар авах", "Өнөөдөр юу хийх вэ?"));
      suggestions.add("Надад course санал болго");
      suggestions.add("Certificate авахад юу дутуу вэ?");
    }

    if (toolName === "generate_daily_tasks") {
      actions.push(navigateAction("Todo жагсаалт", "/student", "primary"));
      suggestions.add("Миний progress харуул");
    }

    if (toolName === "create_todo") {
      actions.push(navigateAction("Todo нээх", "/student", "secondary"));
    }

    if (toolName === "create_note") {
      actions.push(navigateAction("Тэмдэглэл харах", "/student/notes", "secondary"));
    }

    if (toolName === "update_learning_profile") {
      suggestions.add("Надад course санал болго");
      suggestions.add("7 хоногийн study plan гарга");
    }

    if (toolName === "summarize_lesson") {
      suggestions.add("Өнөөдөр юу хийх вэ?");
    }
  }

  if (actions.length === 0 && ctx?.activeCourse) {
    actions.push(
      ACTION.continueLearning(ctx.activeCourse.id, ctx.activeCourse.lastLessonId),
    );
    actions.push(ACTION.courseDetail(ctx.activeCourse.id));
  }

  if (actions.length === 0) {
    actions.push(ACTION.catalog());
  }

  const defaults = [
    "Миний progress дээр үндэслээд course санал болго",
    "7 хоногийн study plan гарга",
    "Өнөөдөр юу хийх вэ?",
    "Certificate авахад юу дутуу вэ?",
  ];
  for (const s of defaults) suggestions.add(s);

  return {
    actions: uniqueActions(actions).slice(0, 4),
    suggestions: Array.from(suggestions).slice(0, 5),
  };
}
