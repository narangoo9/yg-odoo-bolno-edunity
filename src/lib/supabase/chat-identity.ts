import { createHash } from "crypto";

const UUID_NAMESPACE = "edunity-chat-v1";

function formatUuid(hex: string) {
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    `5${hex.slice(13, 16)}`,
    ((parseInt(hex.slice(16, 18), 16) & 0x3f) | 0x80).toString(16).padStart(2, "0") + hex.slice(18, 20),
    hex.slice(20, 32),
  ].join("-");
}

export function toChatUuid(value: string) {
  const trimmed = value.trim().toLowerCase();

  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(trimmed)) {
    return trimmed;
  }

  const hex = createHash("sha256").update(`${UUID_NAMESPACE}:${trimmed}`).digest("hex");
  return formatUuid(hex);
}

