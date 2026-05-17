import { env } from "@/lib/env";

function normalizeUrl(value: string) {
  return value.replace(/\/+$/, "");
}

export function getAppUrl() {
  return normalizeUrl(env.appUrl);
}
