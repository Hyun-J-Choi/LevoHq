import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { sendCompliantSMS } from "@/lib/twilio";
import { generateClaudeMessage } from "@/lib/claude";
import {
  getBusinessSystemPrompt,
  getBusinessTimezone,
} from "@/lib/businessContext";
import { preflightCanSend } from "@/lib/sms-compliance";
import { nurturePrompt } from "@/lib/messageRecipes";
import { createLogger, genRequestId } from "@/lib/logger";

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

  const { data: sequences } = await admin
    .from("nurture_sequences")
    .select("id, business_id, lead_id, step, leads(name, phone, email, source)")
    .is("sent_at", null)
    .lte("scheduled_for", new Date().toISOString())
    .limit(50);

  for (const seq of sequences ?? []) {
    const lead = Array.isArray(seq.leads) ? seq.leads[0] : seq.leads;
    if (!lead?.phone) continue;

    try {
      let tz = tzCache.get(seq.business_id);
      if (!tz) {
        tz = await getBusinessTimezone(seq.business_id);
        tzCache.set(seq.business_id, tz);
      }
      const preflight = await preflightCanSend({
        phone: lead.phone,
        businessId: seq.business_id,
        timezone: tz,
      });
      if (!preflight.ok) {
        if (preflight.reason === "quiet_hours") skippedQuiet++;
        else skippedNoConsent++;
        continue;
      }

      const systemPrompt = await getBusinessSystemPrompt(seq.business_id);
      const message = await generateClaudeMessage(
        nurturePrompt({
          leadName: lead.name,
          source: lead.source,
          step: seq.step,
        }),
        systemPrompt,
        { label: `nurture_step_${seq.step}`, requestId }
      );

      const result = await sendCompliantSMS(lead.phone, message, seq.business_id, {
        timezone: tz,
      });

      if (result.sent) {
        await admin.from("nurture_sequences").update({ sent_at: new Date().toISOString() }).eq("id", seq.id);
        sent++;
      }
    } catch (err) {
      log.error("Nurture send failed", { sequenceId: seq.id, error: String(err) });
    }
  }

  log.info("Nurture cron complete", { sent, skippedQuiet, skippedNoConsent });
  return NextResponse.json({ sent, skippedQuiet, skippedNoConsent });
}
