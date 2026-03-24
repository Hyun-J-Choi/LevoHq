import { createSupabaseAdmin } from "@/lib/supabase/admin";

/** TCPA keywords that must be handled before any AI processing. */
const STOP_KEYWORDS = ["stop", "unsubscribe", "cancel", "end", "quit"];
const START_KEYWORDS = ["start", "unstop", "subscribe", "yes"];
const HELP_KEYWORDS = ["help", "info"];

export type KeywordAction =
  | { type: "stop"; response: string }
  | { type: "start"; response: string }
  | { type: "help"; response: string }
  | null;

/**
 * Detects TCPA compliance keywords in an inbound SMS body.
 * Returns the action to take, or null if it's a normal message.
 */
export function detectKeyword(body: string): KeywordAction {
  const normalized = body.trim().toLowerCase();

  if (STOP_KEYWORDS.includes(normalized)) {
    return {
      type: "stop",
      response:
        "You have been unsubscribed and will no longer receive messages from us. Reply START to re-subscribe.",
    };
  }

  if (START_KEYWORDS.includes(normalized)) {
    return {
      type: "start",
      response:
        "You have been re-subscribed. You will now receive messages from us. Reply STOP to unsubscribe at any time.",
    };
  }

  if (HELP_KEYWORDS.includes(normalized)) {
    return {
      type: "help",
      response:
        "Reply STOP to unsubscribe from messages. Reply START to re-subscribe. For support, contact us directly.",
    };
  }

  return null;
}

/**
 * Records opt-in consent for a phone number.
 */
export async function recordConsent(
  phone: string,
  businessId: string,
  source: "opt_in_sms" | "web_form" | "booking" | "manual" | "import"
) {
  const admin = createSupabaseAdmin();
  await admin.from("sms_consent").upsert(
    {
      phone,
      business_id: businessId,
      consented_at: new Date().toISOString(),
      revoked_at: null,
      consent_source: source,
    },
    { onConflict: "phone,business_id" }
  );
}

/**
 * Records opt-out (STOP) for a phone number.
 */
export async function recordOptOut(phone: string, businessId: string) {
  const admin = createSupabaseAdmin();
  await admin
    .from("sms_consent")
    .upsert(
      {
        phone,
        business_id: businessId,
        revoked_at: new Date().toISOString(),
        consent_source: "opt_in_sms",
      },
      { onConflict: "phone,business_id" }
    );
}

/**
 * Records opt-in (START/re-subscribe) for a phone number.
 */
export async function recordOptIn(phone: string, businessId: string) {
  const admin = createSupabaseAdmin();
  await admin.from("sms_consent").upsert(
    {
      phone,
      business_id: businessId,
      consented_at: new Date().toISOString(),
      revoked_at: null,
      consent_source: "opt_in_sms",
    },
    { onConflict: "phone,business_id" }
  );
}

/**
 * Checks if a phone number has active consent (not revoked) for a business.
 * Returns true if consent exists and has NOT been revoked.
 */
export async function hasConsent(
  phone: string,
  businessId: string
): Promise<boolean> {
  const admin = createSupabaseAdmin();
  const { data } = await admin
    .from("sms_consent")
    .select("consented_at, revoked_at")
    .eq("phone", phone)
    .eq("business_id", businessId)
    .single();

  if (!data) return false;
  if (!data.consented_at) return false;
  if (data.revoked_at && data.revoked_at > data.consented_at) return false;
  return true;
}

/**
 * Checks if the current time is within quiet hours for a timezone.
 * No SMS before 8:00 AM or after 9:00 PM local time.
 */
export function isQuietHours(timezone: string = "America/Los_Angeles"): boolean {
  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      hour: "numeric",
      hour12: false,
    });
    const hour = parseInt(formatter.format(new Date()), 10);
    return hour < 8 || hour >= 21;
  } catch {
    // If timezone is invalid, assume not quiet hours to avoid blocking messages
    return false;
  }
}
