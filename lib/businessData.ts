import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface ClientRow {
  id: string;
  name: string;
  phone: string;
  last_visit: string | null;
  status: string;
  lifetime_value: number;
}

export interface CancellationRow {
  id: string;
  client_name: string;
  client_phone: string | null;
  service: string;
  scheduled_at: string;
  reason: string | null;
}

export interface WaitlistRow {
  id: string;
  name: string;
  phone: string;
  requested_service: string;
}

export interface MissedCallRow {
  id: string;
  from_phone: string;
  to_phone: string | null;
  client_name: string | null;
  created_at: string;
}

export interface ReminderAppointmentRow {
  id: string;
  client_name: string;
  client_phone: string | null;
  service: string;
  scheduled_at: string;
  status: string;
}

export interface FollowUpRow {
  id: string;
  client_name: string;
  phone: string;
  service: string;
  scheduled_at: string;
}

export interface ReactivationRow {
  id: string;
  name: string;
  phone: string;
  email: string;
  last_visit: string | null;
}

/** All queries below are scoped to a specific business_id. */

export async function getCancellationsData(businessId: string) {
  const supabase = createSupabaseServerClient();
  const [{ data: cancellations }, { data: waitlist }] = await Promise.all([
    supabase
      .from("appointments")
      .select("id, client_name, client_phone, service, scheduled_at, reason")
      .eq("business_id", businessId)
      .ilike("status", "%cancelled%")
      .order("scheduled_at", { ascending: false })
      .limit(12),
    supabase
      .from("waitlist")
      .select("id, name, phone, requested_service")
      .eq("business_id", businessId)
      .eq("claimed", false)
      .order("added_at", { ascending: false })
      .limit(8),
  ]);

  return {
    cancellations: (cancellations ?? []).map((row) => ({
      id: String(row.id),
      client_name: String(row.client_name ?? "Client"),
      client_phone: row.client_phone != null ? String(row.client_phone) : null,
      service: String(row.service ?? ""),
      scheduled_at: String(row.scheduled_at),
      reason: row.reason != null ? String(row.reason) : null,
    })) as CancellationRow[],
    waitlist: (waitlist ?? []) as WaitlistRow[],
  };
}

export async function getMissedCallsData(businessId: string): Promise<MissedCallRow[]> {
  const supabase = createSupabaseServerClient();
  const { data } = await supabase
    .from("missed_calls")
    .select("id, from_phone, to_phone, client_name, created_at")
    .eq("business_id", businessId)
    .order("created_at", { ascending: false })
    .limit(20);

  return (data ?? []).map((row) => ({
    id: String(row.id),
    from_phone: String(row.from_phone),
    to_phone: row.to_phone != null ? String(row.to_phone) : null,
    client_name: row.client_name != null ? String(row.client_name) : null,
    created_at: String(row.created_at),
  }));
}

export async function getUpcomingReminderAppointments(
  businessId: string
): Promise<ReminderAppointmentRow[]> {
  const supabase = createSupabaseServerClient();
  const now = new Date();
  const until = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const { data } = await supabase
    .from("appointments")
    .select("id, client_name, client_phone, service, scheduled_at, status")
    .eq("business_id", businessId)
    .gte("scheduled_at", now.toISOString())
    .lte("scheduled_at", until.toISOString())
    .not("status", "ilike", "%cancelled%")
    .order("scheduled_at", { ascending: true })
    .limit(15);

  return (data ?? []).map((row) => ({
    id: String(row.id),
    client_name: String(row.client_name ?? "Client"),
    client_phone: row.client_phone != null ? String(row.client_phone) : null,
    service: String(row.service ?? "Service"),
    scheduled_at: String(row.scheduled_at),
    status: String(row.status ?? "scheduled"),
  }));
}

export async function getFollowUpData(businessId: string): Promise<FollowUpRow[]> {
  const supabase = createSupabaseServerClient();
  const now = Date.now();
  const lower = new Date(now - 48 * 60 * 60 * 1000).toISOString();
  const upper = new Date(now - 24 * 60 * 60 * 1000).toISOString();

  const { data } = await supabase
    .from("appointments")
    .select("id, client_name, service, scheduled_at, client_phone")
    .eq("business_id", businessId)
    .gte("scheduled_at", lower)
    .lte("scheduled_at", upper)
    .ilike("status", "completed")
    .order("scheduled_at", { ascending: false })
    .limit(12);

  return (data ?? []).map((row) => ({
    id: String(row.id),
    client_name: String(row.client_name ?? "Client"),
    phone: String(row.client_phone ?? "No phone"),
    service: String(row.service ?? "Service"),
    scheduled_at: String(row.scheduled_at),
  }));
}

export async function getReactivationData(businessId: string): Promise<ReactivationRow[]> {
  const supabase = createSupabaseServerClient();
  const threshold = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();

  const { data } = await supabase
    .from("clients")
    .select("id, name, phone, email, last_visit")
    .eq("business_id", businessId)
    .lte("last_visit", threshold)
    .order("last_visit", { ascending: true })
    .limit(20);

  return (data ?? []).map((row) => ({
    id: String(row.id),
    name: String(row.name ?? "Client"),
    phone: String(row.phone ?? "No phone"),
    email: String(row.email ?? ""),
    last_visit: row.last_visit ? String(row.last_visit) : null,
  }));
}

export async function getClientsData(businessId: string): Promise<ClientRow[]> {
  const supabase = createSupabaseServerClient();
  const { data } = await supabase
    .from("clients")
    .select("id, name, phone, last_visit, status, lifetime_value")
    .eq("business_id", businessId)
    .order("created_at", { ascending: false })
    .limit(50);

  return (data ?? []).map((row) => ({
    id: String(row.id),
    name: String(row.name ?? "Client"),
    phone: String(row.phone ?? ""),
    last_visit: row.last_visit ? String(row.last_visit) : null,
    status: String(row.status ?? "active"),
    lifetime_value: Number(row.lifetime_value ?? 0),
  }));
}
