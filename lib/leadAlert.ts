/**
 * Founder alert on new lead capture.
 *
 * Fires an SMS and/or email the moment a lead lands so follow-up can happen
 * in minutes (speed-to-lead) instead of whenever someone checks the table.
 *
 * Design rules:
 *   - NEVER throws. A notification failure must never affect the lead being
 *     saved or the HTTP response to the visitor.
 *   - Best-effort + independent channels: if only one destination is
 *     configured, only that one fires; if a channel errors, the other still
 *     runs.
 *   - Destinations come from env (not hardcoded) so no personal contact info
 *     lives in the repo.
 *
 * Env:
 *   LEAD_ALERT_PHONE  — E.164 number to text (uses the existing Twilio sender)
 *   LEAD_ALERT_EMAIL  — address to email (requires RESEND_API_KEY + EMAIL_FROM)
 */

import { getTwilioClient, getTwilioEnv } from "@/lib/twilio";
import { sendEmail } from "@/lib/email";

export interface NewLeadInfo {
  email: string;
  /** Normalized channel stored in leads.source (e.g. "website"). */
  source: string;
  /** Original form/CTA label if different (e.g. "hero", "demo-interactive"). */
  rawSource?: string;
}

function escapeHtml(s: string): string {
  return s.replace(
    /[&<>"']/g,
    (c) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[c] as string
  );
}

export async function notifyNewLead(info: NewLeadInfo): Promise<void> {
  const where =
    info.rawSource && info.rawSource !== info.source
      ? `${info.source} / ${info.rawSource}`
      : info.source;
  const when = new Date().toLocaleString("en-US", {
    timeZone: "America/Los_Angeles",
  });

  // Independent channels; allSettled so one failing never affects the other.
  await Promise.allSettled([
    sendAlertSms(info.email, where),
    sendAlertEmail(info.email, where, when),
  ]);
}

async function sendAlertSms(email: string, where: string): Promise<void> {
  const to = process.env.LEAD_ALERT_PHONE;
  if (!to) return;
  try {
    const { fromNumber } = getTwilioEnv();
    const client = getTwilioClient();
    await client.messages.create({
      to,
      from: fromNumber,
      body: `New LevoHQ lead: ${email} (via ${where}). Follow up fast.`,
    });
    console.log(JSON.stringify({ event: "lead_alert_sms_sent" }));
  } catch (e) {
    console.error(
      JSON.stringify({
        event: "lead_alert_sms_error",
        reason: (e as Error).message,
      })
    );
  }
}

async function sendAlertEmail(
  email: string,
  where: string,
  when: string
): Promise<void> {
  const to = process.env.LEAD_ALERT_EMAIL;
  if (!to) return;
  // sendEmail() already swallows its own errors, but guard anyway so a config
  // problem (e.g. missing RESEND_API_KEY) can never bubble up.
  try {
    await sendEmail({
      to,
      subject: `New LevoHQ lead: ${email}`,
      html: `<p>New lead captured on the site.</p>
<ul>
  <li><strong>Email:</strong> ${escapeHtml(email)}</li>
  <li><strong>Source:</strong> ${escapeHtml(where)}</li>
  <li><strong>When:</strong> ${escapeHtml(when)} PT</li>
</ul>
<p>Reach out while they're warm.</p>`,
      text: `New LevoHQ lead: ${email} (via ${where}) at ${when} PT.`,
      label: "lead_alert",
    });
  } catch (e) {
    console.error(
      JSON.stringify({
        event: "lead_alert_email_error",
        reason: (e as Error).message,
      })
    );
  }
}
