import { createGroq } from "@ai-sdk/groq";
import { env } from "@/lib/env";

const PRIMARY = "llama-3.3-70b-versatile" as const;
const FALLBACK = "llama-3.1-8b-instant" as const;

export function getGroqProvider() {
  const apiKey = env.groqApiKey;
  if (!apiKey) return null;
  return createGroq({ apiKey });
}

export function getPrimaryModel() {
  const groq = getGroqProvider();
  if (!groq) return null;
  return groq(PRIMARY);
}

export function getFallbackModel() {
  const groq = getGroqProvider();
  if (!groq) return null;
  return groq(FALLBACK);
}

export { PRIMARY as GROQ_PRIMARY_MODEL, FALLBACK as GROQ_FALLBACK_MODEL };
