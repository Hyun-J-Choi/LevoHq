import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface ClientRow {
  id: string;
  name: string;
  phone: string;
  last_visit: string | null;
  status: string;
}

export interface AppointmentRow {
  id: string;
  client_name: string;
  service: string;
  appointment_time: string;
  status: string;
}

export interface ActivityRow {
  id: string;
  message: string;
  created_at: string;
}

export interface WaitlistRow {
  id: string;
  name: string;
  phone: string;
  requested_service: string;
}

export interface CancellationRow {
  id: string;
  client_name: string;
  client_phone: string | null;
  service: string;
  appointment_time: string;
  reason: string | null;
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
  appointment_time: string;
  status: string;
}

export interface FollowUpRow {
  id: string;
  client_name: string;
  phone: string;
  service: string;
  appointment_time: string;
}

export interface ReactivationRow {
  id: string;
  name: string;
  phone: string;
  email: string;
  last_visit: string | null;
}

const fallbackClients: ClientRow[] = [
  { id: "c1", name: "Sophie Kim", phone: "(310) 555-0179", last_visit: new Date().toISOString(), status: "Active" },
  { id: "c2", name: "Maya Patel", phone: "(424) 555-0132", last_visit: new Date(Date.now() - 86400000 * 4).toISOString(), status: "Needs Follow-up" },
  { id: "c3", name: "Ari Chen", phone: "(213) 555-0114", last_visit: new Date(Date.now() - 86400000 * 14).toISOString(), status: "Dormant" },
];

const fallbackAppointments: AppointmentRow[] = [
  { id: "a1", client_name: "Sophie Kim", service: "Signature Facial", appointment_time: new Date().toISOString(), status: "Confirmed" },
  { id: "a2", client_name: "Maya Patel", service: "Microneedling", appointment_time: new Date(Date.now() + 3600000).toISOString(), status: "In Progress" },
  { id: "a3", client_name: "Ari Chen", service: "Consultation", appointment_time: new Date(Date.now() + 7200000).toISOString(), status: "Pending" },
];

const fallbackActivity: ActivityRow[] = [
  { id: "l1", message: "AI sent reminder to Sophie Kim for today at 2:00 PM.", created_at: new Date().toISOString() },
  { id: "l2", message: "AI detected opening at 4:30 PM and notified waitlist.", created_at: new Date(Date.now() - 600000).toISOString() },
  { id: "l3", message: "AI drafted post-visit follow-up for Maya Patel.", created_at: new Date(Date.now() - 1200000).toISOString() },
];

const fallbackWaitlist: WaitlistRow[] = [
  { id: "w1", name: "Jenna Lee", phone: "(323) 555-0192", requested_service: "HydraFacial" },
  { id: "w2", name: "Rina Park", phone: "(747) 555-0166", requested_service: "LED Therapy" },
];

const fallbackCancellations: CancellationRow[] = [
  {
    id: "x1",
    client_name: "Naomi Brooks",
    client_phone: "+13105550111",
    service: "Signature Facial",
    appointment_time: new Date().toISOString(),
    reason: "Travel conflict",
  },
  {
    id: "x2",
    client_name: "Lena Wu",
    client_phone: "+18185550120",
    service: "Chemical Peel",
    appointment_time: new Date(Date.now() - 3600000).toISOString(),
    reason: "Feeling unwell",
  },
];

const fallbackMissedCalls: MissedCallRow[] = [
  {
    id: "m1",
    from_phone: "+13235550988",
    to_phone: "+14245550001",
    client_name: "Alex Rivera",
    created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
  },
  {
    id: "m2",
    from_phone: "+12135550444",
    to_phone: "+14245550001",
    client_name: null,
    created_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
  },
];

const fallbackFollowUps: FollowUpRow[] = [
  {
    id: "f1",
    client_name: "Sophie Kim",
    phone: "(310) 555-0179",
    service: "Signature Facial",
    appointment_time: new Date(Date.now() - 1000 * 60 * 60 * 30).toISOString(),
  },
  {
    id: "f2",
    client_name: "Maya Patel",
    phone: "(424) 555-0132",
    service: "Microneedling",
    appointment_time: new Date(Date.now() - 1000 * 60 * 60 * 42).toISOString(),
  },
];

const fallbackReactivation: ReactivationRow[] = [
  {
    id: "r1",
    name: "Naomi Brooks",
    phone: "(213) 555-9944",
    email: "naomi@example.com",
    last_visit: new Date(Date.now() - 1000 * 60 * 60 * 24 * 102).toISOString(),
  },
  {
    id: "r2",
    name: "Lena Wu",
    phone: "(818) 555-1120",
    email: "lena@example.com",
    last_visit: new Date(Date.now() - 1000 * 60 * 60 * 24 * 121).toISOString(),
  },
];

export async function getBusinessDashboardData() {
  const supabase = createSupabaseServerClient();

  const [{ data: clients }, { data: appointments }, { data: activity }] = await Promise.all([
    supabase.from("clients").select("id,name,phone,last_visit,status").order("last_visit", { ascending: false }).limit(6),
    supabase.from("appointments").select("id,client_name,service,appointment_time,status").gte("appointment_time", new Date().toISOString().split("T")[0]).order("appointment_time", { ascending: true }).limit(6),
    supabase.from("activity_logs").select("id,message,created_at").order("created_at", { ascending: false }).limit(8),
  ]);

  return {
    clients: (clients as ClientRow[] | null) ?? fallbackClients,
    appointments: (appointments as AppointmentRow[] | null) ?? fallbackAppointments,
    activity: (activity as ActivityRow[] | null) ?? fallbackActivity,
  };
}

export async function getCancellationsData() {
  const supabase = createSupabaseServerClient();
  const [{ data: cancellations }, { data: waitlist }] = await Promise.all([
    supabase
      .from("appointments")
      .select("id,client_name,client_phone,service,appointment_time,reason")
      .eq("status", "Cancelled")
      .order("appointment_time", { ascending: false })
      .limit(12),
    supabase.from("waitlist").select("id,name,phone,requested_service").order("created_at", { ascending: false }).limit(8),
  ]);

  const normalized =
    cancellations?.map((row) => ({
      id: String(row.id),
      client_name: String(row.client_name ?? "Client"),
      client_phone: row.client_phone != null ? String(row.client_phone) : null,
      service: String(row.service ?? ""),
      appointment_time: String(row.appointment_time),
      reason: row.reason != null ? String(row.reason) : null,
    })) ?? null;

  return {
    cancellations: normalized ?? fallbackCancellations,
    waitlist: (waitlist as WaitlistRow[] | null) ?? fallbackWaitlist,
  };
}

export async function getMissedCallsData() {
  const supabase = createSupabaseServerClient();
  const { data } = await supabase
    .from("missed_calls")
    .select("id,from_phone,to_phone,client_name,created_at")
    .order("created_at", { ascending: false })
    .limit(20);

  if (!data || data.length === 0) return fallbackMissedCalls;

  return data.map((row) => ({
    id: String(row.id),
    from_phone: String(row.from_phone),
    to_phone: row.to_phone != null ? String(row.to_phone) : null,
    client_name: row.client_name != null ? String(row.client_name) : null,
    created_at: String(row.created_at),
  })) as MissedCallRow[];
}

/** Appointments starting within the next 24 hours (non-cancelled). */
export async function getUpcomingReminderAppointments(): Promise<ReminderAppointmentRow[]> {
  const supabase = createSupabaseServerClient();
  const now = new Date();
  const until = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const { data } = await supabase
    .from("appointments")
    .select("id,client_name,client_phone,service,appointment_time,status")
    .gte("appointment_time", now.toISOString())
    .lte("appointment_time", until.toISOString())
    .neq("status", "Cancelled")
    .order("appointment_time", { ascending: true })
    .limit(15);

  if (data && data.length > 0) {
    return data.map((row) => ({
      id: String(row.id),
      client_name: String(row.client_name ?? "Client"),
      client_phone: row.client_phone != null ? String(row.client_phone) : null,
      service: String(row.service ?? "Service"),
      appointment_time: String(row.appointment_time),
      status: String(row.status ?? "Confirmed"),
    }));
  }

  return fallbackAppointments
    .filter((a) => {
      const t = new Date(a.appointment_time).getTime();
      return t >= now.getTime() && t <= until.getTime();
    })
    .map((a) => ({
      id: a.id,
      client_name: a.client_name,
      client_phone: "(310) 555-0179",
      service: a.service,
      appointment_time: a.appointment_time,
      status: a.status,
    }));
}

export async function getFollowUpData() {
  const supabase = createSupabaseServerClient();
  const now = Date.now();
  const lower = new Date(now - 1000 * 60 * 60 * 48).toISOString();
  const upper = new Date(now - 1000 * 60 * 60 * 24).toISOString();

  const { data } = await supabase
    .from("appointments")
    .select("id,client_name,service,appointment_time,client_phone,status")
    .gte("appointment_time", lower)
    .lte("appointment_time", upper)
    .in("status", ["Completed", "Confirmed", "Checked Out"])
    .order("appointment_time", { ascending: false })
    .limit(12);

  if (!data || data.length === 0) return fallbackFollowUps;

  return data.map((row) => ({
    id: String(row.id),
    client_name: String(row.client_name ?? "Client"),
    phone: String(row.client_phone ?? "No phone"),
    service: String(row.service ?? "Service"),
    appointment_time: String(row.appointment_time),
  })) as FollowUpRow[];
}

export async function getReactivationData() {
  const supabase = createSupabaseServerClient();
  const threshold = new Date(Date.now() - 1000 * 60 * 60 * 24 * 90).toISOString();

  const { data } = await supabase
    .from("clients")
    .select("id,name,phone,email,last_visit")
    .lte("last_visit", threshold)
    .order("last_visit", { ascending: true })
    .limit(20);

  if (!data || data.length === 0) return fallbackReactivation;

  return data.map((row) => ({
    id: String(row.id),
    name: String(row.name ?? "Client"),
    phone: String(row.phone ?? "No phone"),
    email: String(row.email ?? "No email"),
    last_visit: row.last_visit ? String(row.last_visit) : null,
  })) as ReactivationRow[];
}
