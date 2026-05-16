/** Deterministic user-facing summary from executed agent tools (Mongolian). */

export type ToolEvent = { toolName: string; output: unknown };

function asRecord(output: unknown): Record<string, unknown> | null {
  if (output && typeof output === "object") return output as Record<string, unknown>;
  return null;
}

export function formatToolSummary(events: ToolEvent[]): string {
  const lines: string[] = [];

  for (const { toolName, output } of events) {
    const o = asRecord(output);
    if (!o || o.ok === false) {
      if (o?.error) lines.push(`⚠️ ${toolName}: ${String(o.error)}`);
      continue;
    }

    switch (toolName) {
      case "create_study_plan": {
        const title = String(o.title ?? "Төлөвлөгөө");
        const days = o.durationDays != null ? String(o.durationDays) : "?";
        const todos = o.todosCreated != null ? Number(o.todosCreated) : 0;
        lines.push(`✅ **Төлөвлөгөө үүслээ:** «${title}» (${days} хоног)`);
        if (todos > 0) lines.push(`✅ **${todos} todo** нэмэгдлээ (эхний өдрүүд).`);
        lines.push(`→ Student dashboard → Todo / Notes хэсэгт харагдана.`);
        break;
      }
      case "recommend_lessons": {
        const items = Array.isArray(o.items) ? o.items : [];
        const enrolled = Array.isArray(o.enrolledCourses) ? o.enrolledCourses : [];
        if (items.length === 0 && enrolled.length === 0) {
          lines.push(
            "ℹ️ Платформ дээр тохирох **нийтэлсэн** курс олдсонгүй. `/student/catalog` руу орж шинэ курс хайна уу.",
          );
        } else {
          if (items.length > 0) {
            lines.push("✅ **Платформын бодит курс/хичээл:**");
            for (const raw of items.slice(0, 6)) {
              const it = raw as Record<string, unknown>;
              const course = String(it.courseTitle ?? "");
              const lesson = String(it.lessonTitle ?? "");
              const href = String(it.href ?? (it.courseSlug ? `/courses/${it.courseSlug}` : "/student/catalog"));
              lines.push(`- **${course}** — ${lesson} → ${href}`);
            }
          }
          if (enrolled.length > 0) {
            lines.push("📚 **Таны бүртгэлтэй курсууд:**");
            for (const raw of enrolled.slice(0, 5)) {
              const it = raw as Record<string, unknown>;
              lines.push(`- ${String(it.title ?? "")} → ${String(it.href ?? "/student/courses")}`);
            }
          }
        }
        break;
      }
      case "create_todo": {
        lines.push(`✅ Todo нэмэгдлээ: «${String(o.title ?? "")}»`);
        break;
      }
      case "create_note": {
        lines.push(`✅ Тэмдэглэл хадгалагдлаа: «${String(o.title ?? "")}»`);
        break;
      }
      case "update_learning_profile": {
        lines.push("✅ Суралцах профайл шинэчлэгдлээ.");
        break;
      }
      case "generate_daily_tasks": {
        lines.push(`✅ **${String(o.count ?? 0)}** өдрийн todo үүслээ.`);
        break;
      }
      case "summarize_lesson": {
        if (o.summary) {
          const preview = String(o.summary).slice(0, 400);
          lines.push(`✅ Хичээлийн тайлбар (${String(o.lessonTitle ?? "")}):\n${preview}${String(o.summary).length > 400 ? "…" : ""}`);
        }
        break;
      }
      default:
        break;
    }
  }

  return lines.join("\n");
}

/** Quick intent hint for Groq — must call tools, not invent data */
export function actionIntentHint(message: string): string | null {
  const m = message.toLowerCase();
  if (/санал|recommend|тохирох курс|course.*санал|хичээл.*санал/.test(m)) {
    return "USER_INTENT: MUST call recommend_lessons BEFORE answering. Never invent course titles.";
  }
  if (/төлөвлөгөө|план|plan|хөтөлбөр/.test(m)) {
    return "USER_INTENT: MUST call create_study_plan (and update_learning_profile if goals/time given). Never claim a plan exists without tool result.";
  }
  if (/streak|өдрийн|юу хийх/.test(m)) {
    return "USER_INTENT: Use generate_daily_tasks or create_todo from active study plan.";
  }
  return null;
}
