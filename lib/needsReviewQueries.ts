/**
 * Shared query helpers for the needs_human_review escalation table.
 *
 * Keeps the same column projection in one place so the dashboard, the
 * count endpoint, and the daily digest can't drift. Every query is
 * scoped by business_id — callers must supply it.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

export interface ReviewRow {
  id: string;
  business_id: string;
  recipient_phone: string;
  original_message: string;
  sent_replacement: string | null;
  trigger_types: string[];
  matched_substrings: string[];
  source_label: string | null;
  resolved: boolean;
  resolved_at: string | null;
  created_at: string;
}

const PROJECTION =
  "id, business_id, recipient_phone, original_message, sent_replacement, trigger_types, matched_substrings, source_label, resolved, resolved_at, created_at";

/** Unresolved rows for one business, newest first. */
export async function listUnresolvedForBusiness(
  supabase: SupabaseClient,
  businessId: string,
  limit = 100
): Promise<ReviewRow[]> {
  const { data, error } = await supabase
    .from("needs_human_review")
    .select(PROJECTION)
    .eq("business_id", businessId)
    .eq("resolved", false)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as ReviewRow[];
}

/** Count of unresolved rows for one business. */
export async function countUnresolvedForBusiness(
  supabase: SupabaseClient,
  businessId: string
): Promise<number> {
  const { count, error } = await supabase
    .from("needs_human_review")
    .select("id", { count: "exact", head: true })
    .eq("business_id", businessId)
    .eq("resolved", false);
  if (error) throw error;
  return count ?? 0;
}

/**
 * Rows created in the last `windowHours` for one business — used by the
 * daily digest. We deliberately do NOT mark these as "sent" anywhere;
 * the digest is a recurring view, not a queue.
 */
export async function listRecentUnresolvedForBusiness(
  supabase: SupabaseClient,
  businessId: string,
  windowHours = 24,
  limit = 50
): Promise<ReviewRow[]> {
  const since = new Date(Date.now() - windowHours * 3600 * 1000).toISOString();
  const { data, error } = await supabase
    .from("needs_human_review")
    .select(PROJECTION)
    .eq("business_id", businessId)
    .eq("resolved", false)
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as ReviewRow[];
}
