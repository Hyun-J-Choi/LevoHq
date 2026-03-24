import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { normalizeToE164 } from "@/lib/phone";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

function getCronBaseUrl(): string | null {
  const explicit = process.env.CRON_INTERNAL_BASE_URL?.replace(/\/$/, "");
  if (explicit) return explicit;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  const site = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (site) return site;
  return null;
}

async function postTwilioSend(to: string, body: string): Promise<void> {
  const base = getCronBaseUrl();
  if (!base) {
    throw new Error("Set CRON_INTERNAL_BASE_URL, VERCEL_URL, or NEXT_PUBLIC_SITE_URL for cron → Twilio");
  }

  const headers: Record<string, string> = { "content-type": "application/json" };
  const secret = process.env.TWILIO_SEND_SECRET;
  if (secret) headers["x-twilio-send-secret"] = secret;

  const res = await fetch(`${base}/api/twilio/send`, {
    method: "POST",
    headers,
    body: JSON.stringify({ to, body }),
  });

  if (!res.ok) {
    const j = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(j.error ?? `Twilio send HTTP ${res.status}`);
  }
}

function firstName(full: string): string {
  return full.trim().split(/\s+/)[0] || "there";
}

/**
 * GET /api/cron/reminders
 * Vercel Cron: hourly. Appointments 23–25h from now, confirmed, not yet reminded.
 */
export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

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
