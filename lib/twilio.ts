import twilio from "twilio";
import type { NextRequest } from "next/server";

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
