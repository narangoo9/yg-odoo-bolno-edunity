import type { ChatMessage } from "@/components/ai-agent/AiAgentMessage";

export const ROBO_AGENT_STORAGE_KEY = "edunity-ai-agent-chat";
export const ROBO_AGENT_CONVERSATION_KEY = "edunity-ai-agent-conversation-id";
const MAX_HISTORY = 50;

export function loadRoboMessages(): ChatMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(ROBO_AGENT_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ChatMessage[];
    return Array.isArray(parsed) ? parsed.slice(-MAX_HISTORY) : [];
  } catch {
    return [];
  }
}

export function saveRoboMessages(msgs: ChatMessage[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(ROBO_AGENT_STORAGE_KEY, JSON.stringify(msgs.slice(-MAX_HISTORY)));
  } catch {
    // quota
  }
}

export function loadRoboConversationId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(ROBO_AGENT_CONVERSATION_KEY);
  } catch {
    return null;
  }
}

export function saveRoboConversationId(id: string | null): void {
  if (typeof window === "undefined") return;
  try {
    if (id) localStorage.setItem(ROBO_AGENT_CONVERSATION_KEY, id);
    else localStorage.removeItem(ROBO_AGENT_CONVERSATION_KEY);
  } catch {
    // ignore
  }
}

export function clearRoboAgentStorage(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(ROBO_AGENT_STORAGE_KEY);
    localStorage.removeItem(ROBO_AGENT_CONVERSATION_KEY);
  } catch {
    // ignore
  }
}
