import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface TodayAppointmentRow {
  id: string;
  client_name: string;
  service: string;
  scheduled_at: string;
  status: string;
  service_price: number;
}

export interface ConversationActivityRow {
  id: string;
  detail: string;
  sent_at: string;
}

function startOfUtcDay(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function addUtcDays(d: Date, days: number): Date {
  const n = new Date(d);
  n.setUTCDate(n.getUTCDate() + days);
  return n;
}

function truncate(s: string, max: number): string {
  const t = s.replace(/\s+/g, " ").trim();
  return t.length <= max ? t : `${t.slice(0, max - 1)}…`;
}

/**
 * Dashboard metrics scoped to a specific business.
 * Uses the cookie-based client so RLS filters by business_id.
 */
export async function getDashboardSnapshot(businessId: string) {
  const supabase = createSupabaseServerClient();
  const errors: string[] = [];
  const now = new Date();
  const dayStart = startOfUtcDay(now);
  const dayEnd = addUtcDays(dayStart, 1);

  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const nextMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));

  const [todayRes, activeRes, completedRes, revenueRes, convoRes] =
    await Promise.all([
      supabase
        .from("appointments")
        .select("id, client_name, service, scheduled_at, status, service_price")
        .eq("business_id", businessId)
        .gte("scheduled_at", dayStart.toISOString())
        .lt("scheduled_at", dayEnd.toISOString())
        .order("scheduled_at", { ascending: true }),
      supabase
        .from("clients")
        .select("id", { count: "exact", head: true })
        .eq("business_id", businessId)
        .ilike("status", "active"),
      supabase
        .from("appointments")
        .select("id", { count: "exact", head: true })
        .eq("business_id", businessId)
        .gte("scheduled_at", monthStart.toISOString())
        .lt("scheduled_at", nextMonthStart.toISOString())
        .ilike("status", "completed"),
      supabase
        .from("appointments")
        .select("service_price")
        .eq("business_id", businessId)
        .gte("scheduled_at", monthStart.toISOString())
        .lt("scheduled_at", nextMonthStart.toISOString())
        .ilike("status", "completed"),
      supabase
        .from("conversations")
        .select("id, direction, message, sent_at")
        .eq("business_id", businessId)
        .order("sent_at", { ascending: false })
        .limit(12),
    ]);

  if (todayRes.error) errors.push(`today appointments: ${todayRes.error.message}`);
  if (activeRes.error) errors.push(`active clients: ${activeRes.error.message}`);
  if (completedRes.error) errors.push(`completed MTD: ${completedRes.error.message}`);
  if (revenueRes.error) errors.push(`revenue MTD: ${revenueRes.error.message}`);
  if (convoRes.error) errors.push(`conversations: ${convoRes.error.message}`);

  const todayAppointments: TodayAppointmentRow[] = (todayRes.data ?? []).map(
    (r) => ({
      id: String(r.id),
      client_name: String(r.client_name ?? "Client"),
      service: String(r.service ?? "-"),
      scheduled_at: String(r.scheduled_at),
      status: String(r.status ?? ""),
      service_price: Number(r.service_price ?? 0),
    })
  );

  const completedMtdCount = completedRes.count ?? 0;
  const revenueMtdUsd = (revenueRes.data ?? []).reduce(
    (sum, r) => sum + Number(r.service_price ?? 0),
    0
  );

  const activity: ConversationActivityRow[] = (convoRes.data ?? []).map((r) => {
    const dir = String(r.direction ?? "").toLowerCase();
    const msg = truncate(String(r.message ?? ""), 100);
    const label = dir === "inbound" ? "Inbound SMS" : "Outbound SMS";
    return {
      id: String(r.id),
      detail: `${label}: ${msg}`,
      sent_at: String(r.sent_at ?? ""),
    };
  });

  return {
    todayAppointments,
    activeClientsCount: activeRes.count ?? 0,
    revenueMtdUsd,
    completedMtdCount,
    activity,
    errors,
  };
}
