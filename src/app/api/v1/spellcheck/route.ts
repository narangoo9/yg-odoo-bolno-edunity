import { type NextRequest } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { fetchBolorSpellSuggestions } from "@/lib/mongolian/bolorspell-client";
import { validateMongolianText } from "@/lib/mongolian/spellcheck";
import { ok, unauthorized, badRequest, serverError } from "@/shared/utils/api-response";

const schema = z.object({
  text: z.string().max(20000),
  requireCyrillic: z.boolean().optional(),
  minCyrillicRatio: z.number().min(0).max(1).optional(),
  allowLatinTransliteration: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return unauthorized();

    const body = await req.json().catch(() => ({}));
    const parsed = schema.safeParse(body);
    if (!parsed.success) return badRequest("Буруу оролт", parsed.error.flatten().fieldErrors);

    const { text, requireCyrillic, minCyrillicRatio, allowLatinTransliteration } = parsed.data;

    const local = validateMongolianText(text, {
      requireCyrillic: requireCyrillic ?? false,
      minCyrillicRatio: minCyrillicRatio ?? 0.55,
      allowLatinTransliteration: allowLatinTransliteration ?? true,
    });

    const external = await fetchBolorSpellSuggestions(text);
    const issues = [...local.issues, ...external.map((i) => ({ ...i, severity: "error" as const }))];
    const blocking = issues.filter((i) => i.severity !== "hint");

    return ok({
      ok: blocking.length === 0,
      issues,
      cyrillicRatio: local.cyrillicRatio,
      normalizedHint: local.normalizedHint,
      spellcheckUrl: "https://spellcheck.mn/",
    });
  } catch (err) {
    console.error("POST /api/v1/spellcheck error:", err);
    return serverError("Алдаа шалгах үед алдаа гарлаа.");
  }
}
