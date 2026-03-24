import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { sendCompliantSMS } from "@/lib/twilio";
import { generateClaudeMessage } from "@/lib/claude";
import { getBusinessSystemPrompt } from "@/lib/businessContext";
import { createLogger, genRequestId } from "@/lib/logger";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const log = createLogger({ requestId: genRequestId() });
  const admin = createSupabaseAdmin();
  let sent = 0;

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
      const systemPrompt = await getBusinessSystemPrompt(seq.business_id);
      const message = await generateClaudeMessage(
        `Write a lead nurture SMS (step ${seq.step} of 3).
Lead name: ${lead.name ?? "there"}
Source: ${lead.source ?? "website"}

Step 1: Welcome + value prop. Step 2: Social proof + urgency. Step 3: Direct offer + CTA.
Keep under 250 characters. SMS-friendly.`,
        systemPrompt
      );

      const result = await sendCompliantSMS(lead.phone, message, seq.business_id);

      if (result.sent) {
        await admin.from("nurture_sequences").update({ sent_at: new Date().toISOString() }).eq("id", seq.id);
        sent++;
      }
    } catch (err) {
      log.error("Nurture send failed", { sequenceId: seq.id, error: String(err) });
    }
  }

  log.info("Nurture cron complete", { sent });
  return NextResponse.json({ sent });
}
