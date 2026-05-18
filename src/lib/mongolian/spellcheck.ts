/**
 * Mongolian text validation for EduNity (6-р анги хэл зэрэг).
 * Detects Latin typed as Mongolian, mixed script, and optional Bolor spell hints.
 */

export type SpellIssueType =
  | "latin_in_mongolian"
  | "low_cyrillic_ratio"
  | "mixed_script_word"
  | "suspicious_transliteration"
  | "external_spelling";

export interface SpellIssue {
  type: SpellIssueType;
  message: string;
  word?: string;
  suggestion?: string;
  start?: number;
  end?: number;
  /** hint = зөвлөмж (илгээхийг хориглохгүй), error = алдаа */
  severity?: "hint" | "error";
}

export interface SpellcheckResult {
  ok: boolean;
  issues: SpellIssue[];
  cyrillicRatio: number;
  /** Cyrillic-normalized suggestion for whole text (best effort) */
  normalizedHint?: string;
}

const CYRILLIC_RE = /[\u0400-\u04FF\u0500-\u052F]/;
const LATIN_RE = /[A-Za-z]/;
const WORD_RE = /[A-Za-z\u0400-\u04FF\u0500-\u052F]+/g;
const URL_RE = /^https?:\/\//i;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Common phonetic Latin → Cyrillic (English keyboard, Mongolian intended) */
const TRANSLITERATION_MAP: Record<string, string> = {
  sain: "сайн",
  saiin: "сайн",
  baina: "байна",
  bna: "бна",
  uu: "уу",
  muu: "муу",
  bol: "бол",
  yum: "юм",
  yu: "юу",
  geh: "гэх",
  gesen: "гэсэн",
  hi: "хи",
  hereg: "хэрэг",
  ajil: "ажил",
  surah: "сурах",
  suraltsah: "суралцах",
  angi: "анги",
  hel: "хэл",
  daalgavar: "даалгавар",
  bichih: "бичих",
  unshih: "унших",
};

/** QWERTY key → Mongolian Cyrillic (standard Windows Mongolian layout, lowercase) */
const QWERTY_TO_MN: Record<string, string> = {
  q: "й",
  w: "ц",
  e: "у",
  r: "к",
  t: "е",
  y: "н",
  u: "г",
  i: "ш",
  o: "щ",
  p: "з",
  "[": "х",
  "]": "ъ",
  a: "ф",
  s: "ы",
  d: "в",
  f: "а",
  g: "п",
  h: "р",
  j: "о",
  k: "л",
  l: "д",
  ";": "ж",
  "'": "э",
  z: "я",
  x: "ч",
  c: "с",
  v: "м",
  b: "и",
  n: "т",
  m: "ь",
  ",": "ө",
  ".": "ү",
};

function isMostlyLatin(word: string): boolean {
  const letters = word.replace(/[^A-Za-z\u0400-\u04FF]/g, "");
  if (!letters) return false;
  const latin = (letters.match(/[A-Za-z]/g) ?? []).length;
  const cyr = (letters.match(/[\u0400-\u04FF]/g) ?? []).length;
  return latin > 0 && cyr === 0;
}

function hasMixedScript(word: string): boolean {
  return LATIN_RE.test(word) && CYRILLIC_RE.test(word);
}

export function qwertyToMongolianCyrillic(word: string): string {
  return word
    .toLowerCase()
    .split("")
    .map((ch) => QWERTY_TO_MN[ch] ?? ch)
    .join("");
}

export function getCyrillicRatio(text: string): number {
  const letters = text.replace(/[\s\d.,!?;:'"()[\]{}\-_/\\@#$%^&*+=<>~`|]/g, "");
  if (!letters) return 1;
  const cyr = (letters.match(/[\u0400-\u04FF\u0500-\u052F]/g) ?? []).length;
  return cyr / letters.length;
}

function isBlockingIssue(issue: SpellIssue): boolean {
  return issue.severity !== "hint";
}

export function validateMongolianText(
  text: string,
  options: {
    minLength?: number;
    requireCyrillic?: boolean;
    minCyrillicRatio?: number;
    allowUrls?: boolean;
    /** Латинаар бичих (sain baina гэх мэт) — зөвшөөрнө */
    allowLatinTransliteration?: boolean;
  } = {},
): SpellcheckResult {
  const {
    minLength = 8,
    requireCyrillic = false,
    minCyrillicRatio = 0.55,
    allowUrls = true,
    allowLatinTransliteration = true,
  } = options;

  const trimmed = text.trim();
  const issues: SpellIssue[] = [];

  if (trimmed.length < minLength) {
    return { ok: true, issues: [], cyrillicRatio: getCyrillicRatio(trimmed) };
  }

  const cyrillicRatio = getCyrillicRatio(trimmed);

  if (!allowLatinTransliteration && requireCyrillic && cyrillicRatio < minCyrillicRatio) {
    issues.push({
      type: "low_cyrillic_ratio",
      severity: "error",
      message:
        "Монгол хэлээр бичихдээ кирилл үсэг ашиглана уу. Англи үсгээр бичсэн хэсэг их байна — keyboard-оо Монгол (Кирилл) болгоод дахин бичнэ үү.",
    });
  }

  let match: RegExpExecArray | null;
  const re = new RegExp(WORD_RE.source, "gu");
  while ((match = re.exec(trimmed)) !== null) {
    const word = match[0];
    const start = match.index;
    const end = start + word.length;

    if (allowUrls && URL_RE.test(word)) continue;
    if (EMAIL_RE.test(word)) continue;
    if (word.length < 2) continue;

    if (hasMixedScript(word)) {
      issues.push({
        type: "mixed_script_word",
        severity: allowLatinTransliteration ? "hint" : "error",
        message: `"${word}" — кирилл, латин холилдсон үг байна.`,
        word,
        start,
        end,
      });
      continue;
    }

    if (!allowLatinTransliteration && isMostlyLatin(word) && word.length >= 2) {
      const lower = word.toLowerCase();
      const dictSuggestion = TRANSLITERATION_MAP[lower];
      const layoutSuggestion = qwertyToMongolianCyrillic(word);

      if (dictSuggestion) {
        issues.push({
          type: "suspicious_transliteration",
          severity: "error",
          message: `"${word}" — латинаар бичсэн бол "${dictSuggestion}" гэж кириллээр бичих ёстой байж магадгүй.`,
          word,
          suggestion: dictSuggestion,
          start,
          end,
        });
      } else if (cyrillicRatio >= 0.35 || trimmed.length > 30) {
        issues.push({
          type: "latin_in_mongolian",
          severity: "error",
          message: `"${word}" — англи үсгээр бичигдсэн. Монгол үг бол кириллээр бичнэ үү.`,
          word,
          suggestion: layoutSuggestion !== lower ? layoutSuggestion : undefined,
          start,
          end,
        });
      }
    }
  }

  const blocking = issues.filter(isBlockingIssue);

  return {
    ok: blocking.length === 0,
    issues,
    cyrillicRatio,
    normalizedHint:
      cyrillicRatio < 0.5
        ? trimmed
            .split(/\s+/)
            .map((w) => TRANSLITERATION_MAP[w.toLowerCase()] ?? (isMostlyLatin(w) ? qwertyToMongolianCyrillic(w) : w))
            .join(" ")
        : undefined,
  };
}

export function formatSpellIssues(issues: SpellIssue[]): string {
  return issues.map((i) => i.message).join(" ");
}
