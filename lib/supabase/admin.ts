import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

const serverClientOptions = {
  auth: { persistSession: false, autoRefreshToken: false },
} as const;

/**
 * Service-role Supabase client — bypasses RLS.
 * Use ONLY in API routes and cron jobs, never in client components.
 */
export function createSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"
    );
  }

  return createClient(url, serviceKey, serverClientOptions);
}

/**
 * Prefer service role; otherwise use the anon key (same env as the browser).
 * Use for read-heavy routes when local dev may not have SUPABASE_SERVICE_ROLE_KEY set.
 * Production should still set the service role for consistent RLS bypass.
 */
export function createSupabaseServiceRoleOrAnon(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
  }
  if (serviceKey) {
    return createClient(url, serviceKey, serverClientOptions);
  }
  if (anonKey) {
    return createClient(url, anonKey, serverClientOptions);
  }
  throw new Error(
    "Missing SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY"
  );
}
