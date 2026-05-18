import type { SpellIssue } from "@/lib/mongolian/spellcheck";

const SPELLCHECK_SITE = "https://spellcheck.mn/";

/**
 * Optional remote spell check via Bolor / spellcheck.mn API.
 * Set BOLOR_SPELLCHECK_API_URL + BOLOR_SPELLCHECK_API_KEY in .env when available from Bolorsoft.
 */
export async function fetchBolorSpellSuggestions(text: string): Promise<SpellIssue[]> {
  const apiUrl = process.env.BOLOR_SPELLCHECK_API_URL?.trim();
  if (!apiUrl) return [];

  const apiKey = process.env.BOLOR_SPELLCHECK_API_KEY?.trim();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`;

  try {
    const res = await fetch(apiUrl, {
      method: "POST",
      headers,
      body: JSON.stringify({ text, lang: "mn" }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return [];

    const data = (await res.json()) as {
      errors?: Array<{ word: string; suggestions?: string[]; offset?: number; length?: number }>;
      mistakes?: Array<{ word: string; suggestion?: string }>;
    };

    const rows = data.errors ?? data.mistakes ?? [];
    return rows.map((row) => {
      const suggestions = "suggestions" in row ? row.suggestions : undefined;
      const single = "suggestion" in row ? row.suggestion : undefined;
      const best = suggestions?.[0] ?? single;
      return {
        type: "external_spelling" as const,
        message: best
          ? `"${row.word}" — зөв бол: "${best}" (Болорспелл)`
          : `"${row.word}" — зөв бичгийн алдаа (Болорспелл)`,
        word: row.word,
        suggestion: best,
        start: "offset" in row ? row.offset : undefined,
        end:
          "offset" in row && "length" in row && row.offset != null && row.length != null
            ? row.offset + row.length
            : undefined,
      };
    });
  } catch {
    return [];
  }
}

export function spellcheckMnExternalUrl(): string {
  return SPELLCHECK_SITE;
}
