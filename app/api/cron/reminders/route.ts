import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { firstName, postTwilioSend, unauthorizedCron } from "@/lib/cron-send";
import { normalizeToE164 } from "@/lib/phone";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * GET /api/cron/reminders
 * Vercel Cron: hourly. Appointments 23–25h from now, confirmed, not yet reminded.
 */
export async function GET(request: NextRequest) {
  const denied = unauthorizedCron(request);
  if (denied) return denied;

  const now = Date.now();
  const lower = new Date(now + 23 * 60 * 60 * 1000).toISOString();
  const upper = new Date(now + 25 * 60 * 60 * 1000).toISOString();

  const supabase = createSupabaseServerClient();

  const { data: rows, error } = await supabase
    .from("appointments")
    .select("id, client_name, client_phone, service, appointment_time, status")
    .gte("appointment_time", lower)
    .lte("appointment_time", upper)
    .is("reminder_sent_at", null)
    .ilike("status", "confirmed");

  if (error) {
    console.error("[cron/reminders] query error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const appointments = rows ?? [];
  const results: { id: string; ok: boolean; detail?: string }[] = [];

  for (const row of appointments) {
    const id = String(row.id);
    const name = String(row.client_name ?? "Client");
    const rawPhone = row.client_phone != null ? String(row.client_phone) : "";
    const to = normalizeToE164(rawPhone) ?? rawPhone.trim();
    const service = String(row.service ?? "your appointment");
    const apptTime = new Date(String(row.appointment_time));

    if (!to || !to.startsWith("+")) {
      results.push({ id, ok: false, detail: "missing_or_invalid_phone" });
      continue;
    }

    const timeLabel = apptTime.toLocaleString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });

    const body = `Hi ${firstName(name)}, this is a reminder from the studio: your ${service} appointment is tomorrow (${timeLabel}). Reply if you need to reschedule.`;

    try {
      await postTwilioSend(to, body);
      const { error: upErr } = await supabase.from("appointments").update({ reminder_sent_at: new Date().toISOString() }).eq("id", id);
      if (upErr) {
        console.error("[cron/reminders] reminder_sent_at update:", upErr);
        results.push({ id, ok: true, detail: "sent_but_flag_not_saved" });
      } else {
        results.push({ id, ok: true });
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "send_failed";
      console.error("[cron/reminders] send failed", id, msg);
      results.push({ id, ok: false, detail: msg });
    }
  }

  return NextResponse.json({
    window: { lower, upper },
    count: appointments.length,
    results,
  });
}
