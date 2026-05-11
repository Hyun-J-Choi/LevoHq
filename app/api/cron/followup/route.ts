import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { sendCompliantSMS } from "@/lib/twilio";
import { generateClaudeMessage } from "@/lib/claude";
import {
  getBusinessSystemPrompt,
  getBusinessProfile,
  getBusinessTimezone,
} from "@/lib/businessContext";
import { preflightCanSend } from "@/lib/sms-compliance";
import { followupCheckInPrompt } from "@/lib/messageRecipes";
import { createLogger, genRequestId } from "@/lib/logger";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const requestId = genRequestId();
  const log = createLogger({ requestId });
  const admin = createSupabaseAdmin();
  let followUpSent = 0;
  let reviewSent = 0;
  let skippedQuiet = 0;
  let skippedNoConsent = 0;
  const tzCache = new Map<string, string>();

  const resolveTz = async (businessId: string): Promise<string> => {
    let tz = tzCache.get(businessId);
    if (!tz) {
      tz = await getBusinessTimezone(businessId);
      tzCache.set(businessId, tz);
    }
    return tz;
  };

  const now = Date.now();

  // Phase 1: Follow-up for appointments completed 24-48h ago
  const h24ago = new Date(now - 24 * 60 * 60 * 1000).toISOString();
  const h48ago = new Date(now - 48 * 60 * 60 * 1000).toISOString();

  const { data: followUps } = await admin
    .from("appointments")
    .select("id, business_id, client_name, client_phone, service, scheduled_at")
    .eq("status", "completed")
    .gte("scheduled_at", h48ago)
    .lte("scheduled_at", h24ago)
    .is("follow_up_sent_at", null)
    .limit(50);

  for (const appt of followUps ?? []) {
    if (!appt.client_phone) continue;

    try {
      const tz = await resolveTz(appt.business_id);
      const preflight = await preflightCanSend({
        phone: appt.client_phone,
        businessId: appt.business_id,
        timezone: tz,
      });
      if (!preflight.ok) {
        if (preflight.reason === "quiet_hours") skippedQuiet++;
        else skippedNoConsent++;
        continue;
      }

      const systemPrompt = await getBusinessSystemPrompt(appt.business_id);
      const message = await generateClaudeMessage(
        followupCheckInPrompt({
          clientName: appt.client_name,
          service: appt.service,
        }),
        systemPrompt,
        { label: "followup_checkin", requestId }
      );

      // Persist so the dashboard can show without calling Claude on render.
      await admin
        .from("appointments")
        .update({
          suggested_followup_message: message,
          suggested_followup_message_at: new Date().toISOString(),
        })
        .eq("id", appt.id);

      const result = await sendCompliantSMS(appt.client_phone, message, appt.business_id, {
        timezone: tz,
      });

      if (result.sent) {
        await admin.from("appointments").update({ follow_up_sent_at: new Date().toISOString() }).eq("id", appt.id);
        followUpSent++;
      }
    } catch (err) {
      log.error("Follow-up send failed", { appointmentId: appt.id, error: String(err) });
    }
  }

  // Phase 2: Review request for appointments with follow_up_sent_at > 24h ago
  const reviewCutoff = new Date(now - 48 * 60 * 60 * 1000).toISOString();

  const { data: reviewCandidates } = await admin
    .from("appointments")
    .select("id, business_id, client_name, client_phone")
    .eq("status", "completed")
    .not("follow_up_sent_at", "is", null)
    .lte("follow_up_sent_at", reviewCutoff)
    .is("review_sent_at", null)
    .limit(50);

  for (const appt of reviewCandidates ?? []) {
    if (!appt.client_phone) continue;

    try {
      const tz = await resolveTz(appt.business_id);
      const preflight = await preflightCanSend({
        phone: appt.client_phone,
        businessId: appt.business_id,
        timezone: tz,
      });
      if (!preflight.ok) {
        if (preflight.reason === "quiet_hours") skippedQuiet++;
        else skippedNoConsent++;
        continue;
      }

      const profile = await getBusinessProfile(appt.business_id);
      const reviewUrl = profile?.google_review_url;
      if (!reviewUrl) continue;

      const firstName = appt.client_name?.split(" ")[0] ?? "there";
      const body = `Hi ${firstName}, if you loved your visit at ${profile.name}, we'd really appreciate a quick review: ${reviewUrl}`;

      const result = await sendCompliantSMS(appt.client_phone, body, appt.business_id, {
        timezone: tz,
      });

      if (result.sent) {
        await admin.from("appointments").update({ review_sent_at: new Date().toISOString() }).eq("id", appt.id);
        reviewSent++;
      }
    } catch (err) {
      log.error("Review send failed", { appointmentId: appt.id, error: String(err) });
    }
  }

  log.info("Follow-up cron complete", {
    followUpSent,
    reviewSent,
    skippedQuiet,
    skippedNoConsent,
  });
  return NextResponse.json({
    followUpSent,
    reviewSent,
    skippedQuiet,
    skippedNoConsent,
  });
}
