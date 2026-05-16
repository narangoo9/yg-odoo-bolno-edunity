import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Server-only Supabase admin client (service role).
 * Optional: primary data access in this app uses Prisma + Postgres (Neon, Supabase-hosted, etc.).
 * Use this when you add Supabase Storage/Auth or edge functions.
 */
export function getSupabaseAdmin(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** @deprecated Prefer `getSupabaseAdmin` — kept for existing imports. */
export const getSupabaseAdminClient = getSupabaseAdmin;
