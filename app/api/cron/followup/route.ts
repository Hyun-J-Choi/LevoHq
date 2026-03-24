import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { firstName, postTwilioSend, unauthorizedCron } from "@/lib/cron-send";
import { normalizeToE164 } from "@/lib/phone";
import type { SupabaseClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

function googleReviewUrl(): string {
  return (
    process.env.GOOGLE_BUSINESS_REVIEW_URL?.trim() ||
    "https://g.page/r/your-business-id/review"
  );
}

async function hasRebookedSince(
  supabase: SupabaseClient,
  appt: {
    client_id: string | null;
    client_phone: string | null;
    appointment_time: string;
  }
): Promise<boolean> {
  const apptTime = appt.appointment_time;

  if (appt.client_id) {
    const { data } = await supabase
      .from("appointments")
      .select("id, status")
      .eq("client_id", appt.client_id)
      .gt("appointment_time", apptTime);

    return (data ?? []).some((r) => !String(r.status ?? "").toLowerCase().includes("cancel"));
  }

  if (appt.client_phone) {
    const phone = appt.client_phone.trim();
    const { data } = await supabase
      .from("appointments")
      .select("id, status")
      .eq("client_phone", phone)
      .gt("appointment_time", apptTime);

    return (data ?? []).some((r) => !String(r.status ?? "").toLowerCase().includes("cancel"));
  }

  return false;
}

/**
 * GET /api/cron/followup
 * Hourly: (1) ~2h after completed visit → thank-you / experience SMS if follow_up_sent_at is null.
 *         (2) 24h+ after that SMS, if not rebooked → Google review SMS if review_request_sent_at is null.
 */
export async function GET(request: NextRequest) {
  const denied = unauthorizedCron(request);
  if (denied) return denied;

  const supabase = createSupabaseServerClient();
  const now = Date.now();

  // Window: appointment ended ~2h ago (catch once per hour: between 3h and 2h ago)
  const twoHoursAgo = new Date(now - 2 * 60 * 60 * 1000).toISOString();
  const threeHoursAgo = new Date(now - 3 * 60 * 60 * 1000).toISOString();

  const { data: phase1Rows, error: e1 } = await supabase
    .from("appointments")
    .select("id, client_id, client_name, client_phone, appointment_time, status")
    .gte("appointment_time", threeHoursAgo)
    .lte("appointment_time", twoHoursAgo)
    .is("follow_up_sent_at", null)
    .ilike("status", "completed");

  if (e1) {
    console.error("[cron/followup] phase1 query:", e1);
    return NextResponse.json({ error: e1.message }, { status: 500 });
  }

  const phase1Results: { id: string; phase: "thank_you"; ok: boolean; detail?: string }[] = [];

  for (const row of phase1Rows ?? []) {
    const id = String(row.id);
    const name = String(row.client_name ?? "Client");
    const rawPhone = row.client_phone != null ? String(row.client_phone) : "";
    const to = normalizeToE164(rawPhone) ?? rawPhone.trim();

    if (!to || !to.startsWith("+")) {
      phase1Results.push({ id, phase: "thank_you", ok: false, detail: "missing_or_invalid_phone" });
      continue;
    }

    const body = `Hi ${firstName(name)}, thanks for visiting today! How was your experience?`;

    try {
      await postTwilioSend(to, body);
      const { error: upErr } = await supabase
        .from("appointments")
        .update({ follow_up_sent_at: new Date().toISOString() })
        .eq("id", id);
      if (upErr) {
        console.error("[cron/followup] follow_up_sent_at:", upErr);
        phase1Results.push({ id, phase: "thank_you", ok: true, detail: "sent_but_flag_not_saved" });
      } else {
        phase1Results.push({ id, phase: "thank_you", ok: true });
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "send_failed";
      console.error("[cron/followup] phase1 send", id, msg);
      phase1Results.push({ id, phase: "thank_you", ok: false, detail: msg });
    }
  }

  // Phase 2: follow-up sent ≥24h ago, no review text yet, still completed, not rebooked
  const reviewEligibleBefore = new Date(now - 24 * 60 * 60 * 1000).toISOString();

  const { data: phase2Rows, error: e2 } = await supabase
    .from("appointments")
    .select("id, client_id, client_name, client_phone, appointment_time, status, follow_up_sent_at")
    .not("follow_up_sent_at", "is", null)
    .lte("follow_up_sent_at", reviewEligibleBefore)
    .is("review_request_sent_at", null)
    .is("review_suppression_reason", null)
    .ilike("status", "completed");

  if (e2) {
    console.error("[cron/followup] phase2 query:", e2);
    return NextResponse.json(
      { error: e2.message, phase1: { count: phase1Rows?.length ?? 0, results: phase1Results } },
      { status: 500 }
    );
  }

  const phase2Results: { id: string; phase: "review"; ok: boolean; detail?: string }[] = [];
  const reviewLink = googleReviewUrl();

  for (const row of phase2Rows ?? []) {
    const id = String(row.id);
    const rawPhone = row.client_phone != null ? String(row.client_phone) : "";
    const to = normalizeToE164(rawPhone) ?? rawPhone.trim();

    if (!to || !to.startsWith("+")) {
      phase2Results.push({ id, phase: "review", ok: false, detail: "missing_or_invalid_phone" });
      continue;
    }

    const rebooked = await hasRebookedSince(supabase, {
      client_id: row.client_id != null ? String(row.client_id) : null,
      client_phone: row.client_phone != null ? String(row.client_phone) : null,
      appointment_time: String(row.appointment_time),
    });

    if (rebooked) {
      await supabase
        .from("appointments")
        .update({ review_suppression_reason: "rebooked" })
        .eq("id", id);
      phase2Results.push({ id, phase: "review", ok: false, detail: "skipped_rebooked" });
      continue;
    }

    const body = `If you loved your visit, we'd appreciate a quick review: ${reviewLink}`;

    try {
      await postTwilioSend(to, body);
      const { error: upErr } = await supabase
        .from("appointments")
        .update({ review_request_sent_at: new Date().toISOString() })
        .eq("id", id);
      if (upErr) {
        console.error("[cron/followup] review_request_sent_at:", upErr);
        phase2Results.push({ id, phase: "review", ok: true, detail: "sent_but_flag_not_saved" });
      } else {
        phase2Results.push({ id, phase: "review", ok: true });
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "send_failed";
      console.error("[cron/followup] phase2 send", id, msg);
      phase2Results.push({ id, phase: "review", ok: false, detail: msg });
    }
  }

  return NextResponse.json({
    phase1: {
      window: { from: threeHoursAgo, to: twoHoursAgo },
      count: phase1Rows?.length ?? 0,
      results: phase1Results,
    },
    phase2: {
      follow_up_sent_at_on_or_before: reviewEligibleBefore,
      count: phase2Rows?.length ?? 0,
      results: phase2Results,
    },
  });
}
