import twilio from "twilio";
import type { NextRequest } from "next/server";
import { hasConsent, isQuietHours } from "@/lib/sms-compliance";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { checkRateLimit } from "@/lib/rate-limit";
import { screenOutboundMessage, SAFE_REPLACEMENT } from "@/lib/medicalGuard";

export function getTwilioEnv() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    throw new Error("Twilio env vars are missing: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER");
  }

  return { accountSid, authToken, fromNumber };
}

/**
 * Resolve the public origin of this app (used for Twilio StatusCallback URLs).
 *
 * Priority:
 *   1. PUBLIC_APP_URL — explicit override, recommended for prod
 *   2. NEXT_PUBLIC_SITE_URL — common Next.js convention
 *   3. VERCEL_PROJECT_PRODUCTION_URL — set automatically on Vercel prod
 *   4. VERCEL_URL — set automatically on preview/prod (host only, prefix https://)
 *
 * Returns null if none are set; the caller should then omit statusCallback
 * rather than send a broken URL.
 */
export function getPublicAppOrigin(): string | null {
  const explicit = process.env.PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/+$/, "");
  const prod = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (prod) return `https://${prod.replace(/\/+$/, "")}`;
  const vercel = process.env.VERCEL_URL;
  if (vercel) return `https://${vercel.replace(/\/+$/, "")}`;
  return null;
}

export function getTwilioClient() {
  const { accountSid, authToken } = getTwilioEnv();
  return twilio(accountSid, authToken);
}

/**
 * Send an SMS with TCPA + medical-advice compliance checks.
 * Returns { sent: true } or { sent: false, reason: string }.
 *
 * When the medical guard trips, we:
 *   - keep sent: true (the client DOES get an SMS — a safe canned reply)
 *   - set redacted: true and list the rules that fired
 *   - insert a row into needs_human_review so an operator can review and
 *     follow up with the real answer if needed
 */
export async function sendCompliantSMS(
  to: string,
  body: string,
  businessId: string,
  options?: { timezone?: string; skipConsent?: boolean; sourceLabel?: string }
): Promise<{
  sent: boolean;
  reason?: string;
  sid?: string;
  redacted?: boolean;
  redactionRules?: string[];
}> {
  // Rate limit: 30 sends per minute per business
  if (!checkRateLimit(`sms:${businessId}`, 30)) {
    console.log(
      JSON.stringify({
        tag: "sms_blocked",
        reason: "rate_limited",
        businessId,
        to,
        sourceLabel: options?.sourceLabel,
        ts: new Date().toISOString(),
      })
    );
    return { sent: false, reason: "rate_limited" };
  }

  // Per-recipient pacing: never send the same recipient more than once every
  // 30 seconds. Carriers treat back-to-back sends to the same handset as
  // spam-burst patterns and will downgrade the sender's reputation.
  if (!checkRateLimit(`sms-recipient:${businessId}:${to}`, 2)) {
    console.log(
      JSON.stringify({
        tag: "sms_blocked",
        reason: "recipient_pacing",
        businessId,
        to,
        sourceLabel: options?.sourceLabel,
        ts: new Date().toISOString(),
      })
    );
    return { sent: false, reason: "recipient_pacing" };
  }

  // Check consent (unless explicitly skipped for keyword responses)
  if (!options?.skipConsent) {
    const consent = await hasConsent(to, businessId);
    if (!consent) {
      console.log(
        JSON.stringify({
          tag: "sms_blocked",
          reason: "no_consent",
          businessId,
          to,
          sourceLabel: options?.sourceLabel,
          ts: new Date().toISOString(),
        })
      );
      return { sent: false, reason: "no_consent" };
    }
  }

  // Check quiet hours (TCPA 8am–9pm local time)
  const tz = options?.timezone ?? "America/Los_Angeles";
  if (isQuietHours(tz)) {
    console.log(
      JSON.stringify({
        tag: "sms_blocked",
        reason: "quiet_hours",
        businessId,
        to,
        timezone: tz,
        sourceLabel: options?.sourceLabel,
        ts: new Date().toISOString(),
      })
    );
    return { sent: false, reason: "quiet_hours" };
  }

  // Medical-advice guard. Runs AFTER cheaper gates so we don't waste the
  // regex cycles on messages that won't ship anyway.
  const guard = screenOutboundMessage(body);
  let outboundBody = body;
  let redacted = false;
  let redactionRules: string[] | undefined;
  if (!guard.ok) {
    redacted = true;
    redactionRules = guard.rules.map((r) => r.type);
    outboundBody = SAFE_REPLACEMENT;

    // Persist the escalation FIRST so we have an audit trail even if the
    // Twilio send below fails for any reason. Insert errors do not block
    // the send — a missing audit row is bad, but sending the dangerous
    // message would be worse, and we've already swapped to the safe body.
    try {
      const auditAdmin = createSupabaseAdmin();
      await auditAdmin.from("needs_human_review").insert({
        business_id: businessId,
        recipient_phone: to,
        original_message: body,
        sent_replacement: SAFE_REPLACEMENT,
        trigger_types: guard.rules.map((r) => r.type),
        matched_substrings: guard.rules.flatMap((r) => r.matches),
        source_label: options?.sourceLabel ?? null,
      });
    } catch (auditErr) {
      console.error(
        "[sendCompliantSMS] needs_human_review insert failed:",
        auditErr
      );
    }
  }

  // Send via Twilio
  const { fromNumber } = getTwilioEnv();
  const client = getTwilioClient();

  // If the app has a public URL we know about, ask Twilio to POST status
  // updates to our delivery-status webhook. Without this, we have no
  // visibility into whether messages actually reach handsets.
  const origin = getPublicAppOrigin();
  const statusCallback = origin
    ? `${origin}/api/twilio/delivery-status`
    : undefined;

  let sent: { sid: string };
  try {
    sent = await client.messages.create({
      from: fromNumber,
      to,
      body: outboundBody,
      ...(statusCallback ? { statusCallback } : {}),
    });
  } catch (sendErr) {
    console.error(
      JSON.stringify({
        tag: "sms_send_failed",
        businessId,
        to,
        sourceLabel: options?.sourceLabel,
        error: sendErr instanceof Error ? sendErr.message : String(sendErr),
        ts: new Date().toISOString(),
      })
    );
    throw sendErr;
  }

  // Structured success log
  console.log(
    JSON.stringify({
      tag: "sms_sent",
      businessId,
      to,
      messageSid: sent.sid,
      bodyLen: outboundBody.length,
      sourceLabel: options?.sourceLabel,
      ts: new Date().toISOString(),
    })
  );

  // Log to conversations
  const admin = createSupabaseAdmin();
  await admin.from("conversations").insert({
    business_id: businessId,
    twilio_message_sid: sent.sid,
    direction: "outbound",
    from_phone: fromNumber,
    to_phone: to,
    message: outboundBody,
    // Initial status — will be updated by /api/twilio/delivery-status as
    // Twilio reports each lifecycle event for this SID.
    delivery_status: "queued",
    delivery_updated_at: new Date().toISOString(),
  });

  return {
    sent: true,
    sid: sent.sid,
    ...(redacted ? { redacted, redactionRules } : {}),
  };
}

/**
 * Reconstruct the public webhook URL Twilio used (must match console config for signature validation).
 */
export function getTwilioWebhookUrl(request: NextRequest): string {
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? "";
  const proto = request.headers.get("x-forwarded-proto") ?? "https";
  const path = request.nextUrl.pathname;
  return `${proto}://${host}${path}`;
}

/**
 * Parse Twilio application/x-www-form-urlencoded POST into a plain object for signature validation.
 */
export async function twilioFormToParams(request: NextRequest): Promise<Record<string, string>> {
  const formData = await request.formData();
  const params: Record<string, string> = {};
  formData.forEach((value, key) => {
    if (typeof value === "string") {
      params[key] = value;
    }
  });
  return params;
}

export function validateTwilioSignature(
  authToken: string,
  signature: string | null,
  url: string,
  params: Record<string, string>
): boolean {
  if (!signature) return false;
  return twilio.validateRequest(authToken, signature, url, params);
}
