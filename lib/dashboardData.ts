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
export interface ClientRiskRow {
  id: string;
  name: string;
  phone: string | null;
  service: string;
  last_appointment: string;
  days_since: number;
  interval_days: number;
  days_overdue: number;
  risk: "green" | "yellow" | "red";
  reminder_sent: boolean;
}

export async function getClientRiskScores(businessId: string) {
  const supabase = createSupabaseServerClient();
  const now = new Date();

  // 1. Get treatment protocols for this business
  const { data: protocols, error: protocolsError } = await supabase
    .from("treatment_protocols")
    .select("service, interval_days")
    .eq("business_id", businessId);

  if (protocolsError || !protocols || protocols.length === 0) return [];

  // Build a map of service -> interval_days (case-insensitive)
  const protocolMap = new Map<string, number>();
  for (const p of protocols) {
    protocolMap.set(p.service.toLowerCase(), p.interval_days);
  }

  // 2. Get all completed appointments with client info
  const { data: appointments, error: apptError } = await supabase
    .from("appointments")
    .select("client_id, service, scheduled_at, status, clients(id, name, phone, status)")
    .eq("business_id", businessId)
    .ilike("status", "completed")
    .order("scheduled_at", { ascending: false });

  if (apptError || !appointments || appointments.length === 0) return [];

  // 3. For each client+service combo, find the most recent appointment
  const clientServiceMap = new Map<string, {
    client_id: string;
    client_name: string;
    client_phone: string | null;
    service: string;
    scheduled_at: string;
  }>();

  for (const appt of appointments) {
    // Guard against appointments with no linked client
    if (!appt.client_id) continue;

    const serviceLower = (appt.service || "").toLowerCase();
    if (!protocolMap.has(serviceLower)) continue;

    // Supabase may return the join as an object or a single-element array
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const clientRaw = appt.clients as any;
    const client = Array.isArray(clientRaw) ? clientRaw[0] : clientRaw;
    if (!client || client.status !== "active") continue;

    const key = `${appt.client_id}::${serviceLower}`;
    if (!clientServiceMap.has(key)) {
      clientServiceMap.set(key, {
        client_id: appt.client_id,
        client_name: client.name || "Unknown",
        client_phone: client.phone || null,
        service: appt.service,
        scheduled_at: appt.scheduled_at,
      });
    }
  }

  // 4. Get the most recent outbound message per client.
  //    Only messages sent AFTER the due date count as a reminder.
  const { data: recentOutbound } = await supabase
    .from("conversations")
    .select("client_id, sent_at")
    .eq("business_id", businessId)
    .eq("direction", "outbound")
    .order("sent_at", { ascending: false });

  const outboundByClient = new Map<string, Date>();
  for (const msg of (recentOutbound || [])) {
    if (msg.client_id && !outboundByClient.has(msg.client_id)) {
      outboundByClient.set(msg.client_id, new Date(msg.sent_at));
    }
  }

  // 5. Check for upcoming/scheduled appointments (client has already rebooked)
  const { data: scheduledAppts } = await supabase
    .from("appointments")
    .select("client_id, service")
    .eq("business_id", businessId)
    .ilike("status", "scheduled")
    .gte("scheduled_at", now.toISOString());

  const hasUpcoming = new Set<string>();
  for (const appt of (scheduledAppts || [])) {
    if (!appt.client_id) continue;
    hasUpcoming.add(`${appt.client_id}::${(appt.service || "").toLowerCase()}`);
  }

  // 6. Score each client-service pair
  const results: ClientRiskRow[] = [];

  for (const [key, data] of clientServiceMap.entries()) {
    const serviceLower = data.service.toLowerCase();
    const intervalDays = protocolMap.get(serviceLower)!;
    const lastDate = new Date(data.scheduled_at);
    const dueDate = new Date(lastDate.getTime() + intervalDays * 24 * 60 * 60 * 1000);
    const daysSince = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
    const daysOverdue = daysSince - intervalDays;

    // Skip if they already have an upcoming appointment for this service
    if (hasUpcoming.has(key)) continue;

    // A reminder only counts if it was sent after the client's due date —
    // an outbound from months ago for a different service shouldn't trigger red.
    const lastOutbound = outboundByClient.get(data.client_id);
    const reminderSent = !!lastOutbound && lastOutbound >= dueDate;

    let risk: "green" | "yellow" | "red";
    if (daysOverdue < 0) {
      // Not yet due
      risk = "green";
    } else if (daysOverdue <= 14) {
      // Just became due — needs outreach
      risk = "yellow";
    } else if (reminderSent || daysOverdue > 60) {
      // Reminder was sent with no response, or severely overdue regardless
      risk = "red";
    } else {
      // 15–60 days overdue, no reminder sent yet
      risk = "yellow";
    }

    results.push({
      id: data.client_id,
      name: data.client_name,
      phone: data.client_phone,
      service: data.service,
      last_appointment: data.scheduled_at,
      days_since: daysSince,
      interval_days: intervalDays,
      days_overdue: Math.max(0, daysOverdue),
      risk,
      reminder_sent: reminderSent,
    });
  }

  // Sort: red first, then yellow, then green. Within each, most overdue first.
  const riskOrder = { red: 0, yellow: 1, green: 2 };
  results.sort((a, b) => {
    if (riskOrder[a.risk] !== riskOrder[b.risk]) return riskOrder[a.risk] - riskOrder[b.risk];
    return b.days_overdue - a.days_overdue;
  });

  return results;
}

export interface RevenueProjection {
  service: string;
  clientsDue: number;
  avgPrice: number;
  projectedRevenue: number;
}

export interface PredictiveRevenueData {
  next30Days: RevenueProjection[];
  totalProjected: number;
  totalAtRisk: number;      // revenue from clients who are overdue (might not come back)
  totalOnTrack: number;     // revenue from clients approaching their window
  alreadyBooked: number;    // revenue from scheduled appointments
  alreadyBookedCount: number; // number of already-scheduled appointments
  clientsDueCount: number;  // unbooked clients projected due
}

export async function getPredictiveRevenue(businessId: string): Promise<PredictiveRevenueData> {
  const supabase = createSupabaseServerClient();
  const now = new Date();
  const thirtyDaysOut = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  // Exclude clients whose due date was more than 90 days ago — likely churned
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

  const empty: PredictiveRevenueData = {
    next30Days: [], totalProjected: 0, totalAtRisk: 0,
    totalOnTrack: 0, alreadyBooked: 0, alreadyBookedCount: 0, clientsDueCount: 0,
  };

  // 1. Get treatment protocols
  const { data: protocols, error: protocolsError } = await supabase
    .from("treatment_protocols")
    .select("service, interval_days")
    .eq("business_id", businessId);

  if (protocolsError || !protocols || protocols.length === 0) return empty;

  const protocolMap = new Map<string, number>();
  for (const p of protocols) {
    protocolMap.set(p.service.toLowerCase(), p.interval_days);
  }

  // 2. Get average price per service from completed appointments
  const { data: priceData, error: priceError } = await supabase
    .from("appointments")
    .select("service, service_price")
    .eq("business_id", businessId)
    .ilike("status", "completed")
    .gt("service_price", 0);

  if (priceError) return empty;

  const priceSums = new Map<string, { total: number; count: number }>();
  for (const row of (priceData || [])) {
    const key = (row.service || "").toLowerCase();
    const existing = priceSums.get(key) || { total: 0, count: 0 };
    existing.total += Number(row.service_price || 0);
    existing.count += 1;
    priceSums.set(key, existing);
  }

  const avgPriceMap = new Map<string, number>();
  for (const [service, data] of priceSums.entries()) {
    avgPriceMap.set(service, Math.round(data.total / data.count));
  }

  // 3. Get most recent completed appointment per client+service
  const { data: appointments, error: apptError } = await supabase
    .from("appointments")
    .select("client_id, service, scheduled_at, clients(id, status)")
    .eq("business_id", businessId)
    .ilike("status", "completed")
    .order("scheduled_at", { ascending: false });

  if (apptError || !appointments || appointments.length === 0) return empty;

  // Key by lowercase service to avoid case-sensitivity bugs; store display name separately
  const clientServiceLatest = new Map<string, {
    client_id: string;
    serviceLower: string;
    displayName: string;
    scheduled_at: string;
  }>();

  for (const appt of appointments) {
    if (!appt.client_id) continue;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const clientRaw = appt.clients as any;
    const client = Array.isArray(clientRaw) ? clientRaw[0] : clientRaw;
    if (!client || client.status !== "active") continue;

    const serviceLower = (appt.service || "").toLowerCase();
    if (!protocolMap.has(serviceLower)) continue;

    const key = `${appt.client_id}::${serviceLower}`;
    if (!clientServiceLatest.has(key)) {
      clientServiceLatest.set(key, {
        client_id: appt.client_id,
        serviceLower,
        displayName: appt.service,
        scheduled_at: appt.scheduled_at,
      });
    }
  }

  // 4. Check for already scheduled appointments in the next 30 days
  const { data: scheduledAppts, error: scheduledError } = await supabase
    .from("appointments")
    .select("client_id, service, service_price")
    .eq("business_id", businessId)
    .ilike("status", "scheduled")
    .gte("scheduled_at", now.toISOString())
    .lte("scheduled_at", thirtyDaysOut.toISOString());

  if (scheduledError) return empty;

  const alreadyBookedSet = new Set<string>();
  let alreadyBookedRevenue = 0;
  let alreadyBookedCount = 0;
  for (const appt of (scheduledAppts || [])) {
    if (!appt.client_id) continue;
    alreadyBookedSet.add(`${appt.client_id}::${(appt.service || "").toLowerCase()}`);
    alreadyBookedRevenue += Number(appt.service_price || 0);
    alreadyBookedCount += 1;
  }

  // 5. Calculate who's due in the next 30 days.
  //    Keyed by lowercase service to prevent duplicate rows from casing differences.
  const serviceProjections = new Map<string, {
    displayName: string;
    clients: number;
    revenue: number;
    atRisk: number;
    onTrack: number;
  }>();

  for (const [key, data] of clientServiceLatest.entries()) {
    if (alreadyBookedSet.has(key)) continue;

    const intervalDays = protocolMap.get(data.serviceLower)!;
    const lastDate = new Date(data.scheduled_at);
    const dueDate = new Date(lastDate.getTime() + intervalDays * 24 * 60 * 60 * 1000);

    // Include if due within the next 30 days, or overdue within the last 90 days.
    // Clients overdue >90 days are likely churned and would inflate projections.
    if (dueDate > thirtyDaysOut) continue;
    if (dueDate < ninetyDaysAgo) continue;

    const avgPrice = avgPriceMap.get(data.serviceLower) || 0;
    const isOverdue = dueDate < now;
    const existing = serviceProjections.get(data.serviceLower) || {
      displayName: data.displayName, clients: 0, revenue: 0, atRisk: 0, onTrack: 0,
    };
    existing.clients += 1;
    existing.revenue += avgPrice;
    if (isOverdue) {
      existing.atRisk += avgPrice;
    } else {
      existing.onTrack += avgPrice;
    }
    serviceProjections.set(data.serviceLower, existing);
  }

  // 6. Build results
  const next30Days: RevenueProjection[] = [];
  let totalProjected = 0;
  let totalAtRisk = 0;
  let totalOnTrack = 0;
  let clientsDueCount = 0;

  for (const [serviceLower, data] of serviceProjections.entries()) {
    const avgPrice = avgPriceMap.get(serviceLower) || 0;
    next30Days.push({
      service: data.displayName,
      clientsDue: data.clients,
      avgPrice,
      projectedRevenue: data.revenue,
    });
    totalProjected += data.revenue;
    totalAtRisk += data.atRisk;
    totalOnTrack += data.onTrack;
    clientsDueCount += data.clients;
  }

  // Sort by projected revenue descending
  next30Days.sort((a, b) => b.projectedRevenue - a.projectedRevenue);

  return {
    next30Days,
    totalProjected,
    totalAtRisk,
    totalOnTrack,
    alreadyBooked: alreadyBookedRevenue,
    alreadyBookedCount,
    clientsDueCount,
  };
}

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
