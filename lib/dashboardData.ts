import { createSupabaseServerClient } from "@/lib/supabase/server";

const REVENUE_PER_COMPLETED_USD = 150;

export interface TodayAppointmentRow {
  id: string;
  client_name: string;
  service: string;
  appointment_time: string;
  status: string;
}

export interface ConversationActivityRow {
  id: string;
  detail: string;
  created_at: string;
}

function startOfUtcDay(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
}

function addUtcDays(d: Date, days: number): Date {
  const n = new Date(d);
  n.setUTCDate(n.getUTCDate() + days);
  return n;
}

function truncate(s: string, max: number): string {
  const t = s.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

/**
 * Real dashboard metrics and lists (no demo fallbacks).
 */
export async function getDashboardSnapshot(): Promise<{
  todayAppointments: TodayAppointmentRow[];
  activeClientsCount: number;
  revenueMtdUsd: number;
  completedMtdCount: number;
  activity: ConversationActivityRow[];
  errors: string[];
}> {
  const supabase = createSupabaseServerClient();
  const errors: string[] = [];
  const now = new Date();
  const dayStart = startOfUtcDay(now);
  const dayEnd = addUtcDays(dayStart, 1);

  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const nextMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));

  const [
    todayRes,
    activeRes,
    completedRes,
    convoRes,
  ] = await Promise.all([
    supabase
      .from("appointments")
      .select("id, client_name, service, appointment_time, status")
      .gte("appointment_time", dayStart.toISOString())
      .lt("appointment_time", dayEnd.toISOString())
      .order("appointment_time", { ascending: true }),
    supabase.from("clients").select("id", { count: "exact", head: true }).ilike("status", "active"),
    supabase
      .from("appointments")
      .select("id", { count: "exact", head: true })
      .gte("appointment_time", monthStart.toISOString())
      .lt("appointment_time", nextMonthStart.toISOString())
      .ilike("status", "completed"),
    supabase
      .from("conversations")
      .select("id, direction, from_phone, to_phone, body, created_at")
      .order("created_at", { ascending: false })
      .limit(12),
  ]);

  if (todayRes.error) errors.push(`today appointments: ${todayRes.error.message}`);
  if (activeRes.error) errors.push(`active clients: ${activeRes.error.message}`);
  if (completedRes.error) errors.push(`completed MTD: ${completedRes.error.message}`);
  if (convoRes.error) errors.push(`conversations: ${convoRes.error.message}`);

  const todayAppointments: TodayAppointmentRow[] = (todayRes.data ?? []).map((r) => ({
    id: String(r.id),
    client_name: String(r.client_name ?? "Client"),
    service: String(r.service ?? "—"),
    appointment_time: String(r.appointment_time),
    status: String(r.status ?? ""),
  }));

  const completedMtdCount = completedRes.count ?? 0;
  const revenueMtdUsd = completedMtdCount * REVENUE_PER_COMPLETED_USD;

  const activity: ConversationActivityRow[] = (convoRes.data ?? []).map((r) => {
    const dir = String(r.direction ?? "").toLowerCase();
    const body = truncate(String(r.body ?? ""), 100);
    const peer = dir === "inbound" ? String(r.from_phone ?? "") : String(r.to_phone ?? "");
    const label = dir === "inbound" ? "Inbound SMS" : "Outbound SMS";
    const detail = peer ? `${label} · ${peer}: ${body}` : `${label}: ${body}`;
    return {
      id: String(r.id),
      detail,
      created_at: String(r.created_at),
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
