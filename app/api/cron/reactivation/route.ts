import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { firstName, postTwilioSend, unauthorizedCron } from "@/lib/cron-send";
import { normalizeToE164 } from "@/lib/phone";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

function isCancelledStatus(status: string | null | undefined): boolean {
  return String(status ?? "").toLowerCase().includes("cancel");
}

function businessName(): string {
  return (
    process.env.BUSINESS_DISPLAY_NAME?.trim() ||
    process.env.NEXT_PUBLIC_BUSINESS_DISPLAY_NAME?.trim() ||
    "our studio"
  );
}

/**
 * Last completed (non-cancelled) appointment time for a client, or null.
 */
async function getLastVisitAt(
  supabase: ReturnType<typeof createSupabaseServerClient>,
  clientId: string
): Promise<Date | null> {
  const { data } = await supabase
    .from("appointments")
    .select("appointment_time, status")
    .eq("client_id", clientId)
    .order("appointment_time", { ascending: false })
    .limit(50);

  const row = (data ?? []).find((r) => !isCancelledStatus(r.status));
  if (!row?.appointment_time) return null;
  return new Date(String(row.appointment_time));
}

async function hasFutureNonCancelledAppointment(
  supabase: ReturnType<typeof createSupabaseServerClient>,
  clientId: string
): Promise<boolean> {
  const now = new Date().toISOString();
  const { data } = await supabase
    .from("appointments")
    .select("id, status")
    .eq("client_id", clientId)
    .gt("appointment_time", now)
    .limit(20);

  return (data ?? []).some((r) => !isCancelledStatus(r.status));
}

/**
 * GET /api/cron/reactivation
 * Daily: clients whose last visit was ~60 days ago, no upcoming appointments, reactivation not sent yet.
 */
export async function GET(request: NextRequest) {
  const denied = unauthorizedCron(request);
  if (denied) return denied;

  const supabase = createSupabaseServerClient();
  const now = Date.now();
  const MS_DAY = 24 * 60 * 60 * 1000;
  const windowEnd = new Date(now - 60 * MS_DAY);
  const windowStart = new Date(now - 61 * MS_DAY);

  const { data: clients, error } = await supabase
    .from("clients")
    .select("id, name, phone")
    .is("reactivation_sent_at", null);

  if (error) {
    console.error("[cron/reactivation] clients query:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const biz = businessName();
  const results: { id: string; ok: boolean; detail?: string }[] = [];

  for (const row of clients ?? []) {
    const id = String(row.id);
    const name = String(row.name ?? "there");
    const rawPhone = row.phone != null ? String(row.phone) : "";
    const to = normalizeToE164(rawPhone) ?? rawPhone.trim();

    if (!to || !to.startsWith("+")) {
      results.push({ id, ok: false, detail: "missing_or_invalid_phone" });
      continue;
    }

    const lastVisit = await getLastVisitAt(supabase, id);
    if (!lastVisit) {
      results.push({ id, ok: false, detail: "no_past_appointments" });
      continue;
    }

    if (lastVisit.getTime() < windowStart.getTime() || lastVisit.getTime() > windowEnd.getTime()) {
      results.push({ id, ok: false, detail: "last_visit_not_in_60d_window" });
      continue;
    }

    const hasFuture = await hasFutureNonCancelledAppointment(supabase, id);
    if (hasFuture) {
      results.push({ id, ok: false, detail: "has_future_appointment" });
      continue;
    }

    const body = `Hi ${firstName(name)}, it's been a while since your last visit at ${biz}. We'd love to see you again — reply YES to get priority booking.`;

    try {
      await postTwilioSend(to, body);
      const { error: upErr } = await supabase
        .from("clients")
        .update({ reactivation_sent_at: new Date().toISOString() })
        .eq("id", id);
      if (upErr) {
        console.error("[cron/reactivation] reactivation_sent_at:", upErr);
        results.push({ id, ok: true, detail: "sent_but_flag_not_saved" });
      } else {
        results.push({ id, ok: true });
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "send_failed";
      console.error("[cron/reactivation] send", id, msg);
      results.push({ id, ok: false, detail: msg });
    }
  }

  return NextResponse.json({
    window: {
      last_visit_utc_from: windowStart.toISOString(),
      last_visit_utc_to: windowEnd.toISOString(),
    },
    business: biz,
    scanned: clients?.length ?? 0,
    results,
  });
}
