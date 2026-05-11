import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { sendCompliantSMS } from "@/lib/twilio";
import { generateClaudeMessage } from "@/lib/claude";
import {
  getBusinessSystemPrompt,
  getBusinessTimezone,
} from "@/lib/businessContext";
import { preflightCanSend } from "@/lib/sms-compliance";
import { reactivationPrompt } from "@/lib/messageRecipes";
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
  let sent = 0;
  let skippedQuiet = 0;
  let skippedNoConsent = 0;
  const tzCache = new Map<string, string>();

  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();

  const { data: clients, error } = await admin
    .from("clients")
    .select("id, business_id, name, phone, last_visit, reactivation_sent_at")
    .not("phone", "is", null)
    .not("last_visit", "is", null)
    .lt("last_visit", ninetyDaysAgo);

  if (error) {
    log.error("Reactivation query failed", { error: error.message });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  for (const client of clients ?? []) {
    if (!client.phone) continue;

    // Skip if already sent reactivation within last 90 days
    if (client.reactivation_sent_at) {
      const lastSent = new Date(client.reactivation_sent_at).getTime();
      if (Date.now() - lastSent < 90 * 24 * 60 * 60 * 1000) continue;
    }

    try {
      // Pre-flight gate BEFORE Claude. Spend zero tokens on quiet-hours
      // or unconsented recipients.
      let tz = tzCache.get(client.business_id);
      if (!tz) {
        tz = await getBusinessTimezone(client.business_id);
        tzCache.set(client.business_id, tz);
      }
      const preflight = await preflightCanSend({
        phone: client.phone,
        businessId: client.business_id,
        timezone: tz,
      });
      if (!preflight.ok) {
        if (preflight.reason === "quiet_hours") skippedQuiet++;
        else skippedNoConsent++;
        continue;
      }

      const systemPrompt = await getBusinessSystemPrompt(client.business_id);
      const message = await generateClaudeMessage(
        reactivationPrompt({
          clientName: client.name,
          lastVisit: client.last_visit,
        }),
        systemPrompt,
        { label: "reactivation", requestId }
      );

      // Persist the suggestion so the Reactivation dashboard can show it
      // without calling Claude during page render.
      await admin
        .from("clients")
        .update({
          suggested_reactivation_message: message,
          suggested_reactivation_message_at: new Date().toISOString(),
        })
        .eq("id", client.id);

      const result = await sendCompliantSMS(client.phone, message, client.business_id, {
        timezone: tz,
      });

      if (result.sent) {
        await admin.from("clients").update({ reactivation_sent_at: new Date().toISOString() }).eq("id", client.id);
        sent++;
      }
    } catch (err) {
      log.error("Reactivation send failed", { clientId: client.id, error: String(err) });
    }
  }

  log.info("Reactivation cron complete", {
    scanned: clients?.length ?? 0,
    sent,
    skippedQuiet,
    skippedNoConsent,
  });
  return NextResponse.json({
    scanned: clients?.length ?? 0,
    sent,
    skippedQuiet,
    skippedNoConsent,
  });
}
