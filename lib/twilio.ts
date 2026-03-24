import twilio from "twilio";
import type { NextRequest } from "next/server";
import { hasConsent, isQuietHours } from "@/lib/sms-compliance";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { checkRateLimit } from "@/lib/rate-limit";

export function getTwilioEnv() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    throw new Error("Twilio env vars are missing: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER");
  }

  return { accountSid, authToken, fromNumber };
}

export function getTwilioClient() {
  const { accountSid, authToken } = getTwilioEnv();
  return twilio(accountSid, authToken);
}

/**
 * Send an SMS with TCPA compliance checks.
 * Returns { sent: true } or { sent: false, reason: string }.
 */
export async function sendCompliantSMS(
  to: string,
  body: string,
  businessId: string,
  options?: { timezone?: string; skipConsent?: boolean }
): Promise<{ sent: boolean; reason?: string; sid?: string }> {
  // Rate limit: 30 sends per minute per business
  if (!checkRateLimit(`sms:${businessId}`, 30)) {
    return { sent: false, reason: "rate_limited" };
  }

  // Check consent (unless explicitly skipped for keyword responses)
  if (!options?.skipConsent) {
    const consent = await hasConsent(to, businessId);
    if (!consent) {
      return { sent: false, reason: "no_consent" };
    }
  }

  // Check quiet hours
  const tz = options?.timezone ?? "America/Los_Angeles";
  if (isQuietHours(tz)) {
    return { sent: false, reason: "quiet_hours" };
  }

  // Send via Twilio
  const { fromNumber } = getTwilioEnv();
  const client = getTwilioClient();
  const sent = await client.messages.create({ from: fromNumber, to, body });

  // Log to conversations
  const admin = createSupabaseAdmin();
  await admin.from("conversations").insert({
    business_id: businessId,
    twilio_message_sid: sent.sid,
    direction: "outbound",
    from_phone: fromNumber,
    to_phone: to,
    message: body,
  });

  return { sent: true, sid: sent.sid };
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
