/**
 * Thin Resend wrapper.
 *
 * Centralized so:
 *   - The API key only gets read in one place (env validation lives here).
 *   - From-address policy is one constant, not duplicated per call site.
 *   - Failures are logged structurally and never throw past the boundary —
 *     a failed email must never crash a cron job or a request handler.
 *
 * Requires RESEND_API_KEY and EMAIL_FROM in the environment. EMAIL_FROM
 * must use a domain you've verified in the Resend dashboard.
 */

import { Resend } from "resend";

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  /** Optional plain-text fallback. Resend can derive one from html if omitted. */
  text?: string;
  /** Optional structured log label for tracing (e.g. "review_digest"). */
  label?: string;
}

export interface SendEmailResult {
  sent: boolean;
  id?: string;
  reason?: string;
}

let _client: Resend | null = null;

function getClient(): Resend {
  if (_client) return _client;
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    throw new Error("RESEND_API_KEY not set");
  }
  _client = new Resend(key);
  return _client;
}

function getFromAddress(): string {
  const from = process.env.EMAIL_FROM;
  if (!from) {
    throw new Error("EMAIL_FROM not set");
  }
  return from;
}

/**
 * Sends a transactional email. Never throws — returns `{ sent: false, reason }`
 * for any failure so callers can log and continue. Crons in particular must
 * not abort because Resend had a hiccup on one row.
 */
export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  if (!input.to || !input.subject) {
    return { sent: false, reason: "missing to/subject" };
  }

  let from: string;
  try {
    from = getFromAddress();
  } catch (e) {
    return { sent: false, reason: (e as Error).message };
  }

  try {
    const client = getClient();
    const { data, error } = await client.emails.send({
      from,
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
    });

    if (error) {
      console.error(
        JSON.stringify({
          event: "email_send_error",
          label: input.label,
          to: input.to,
          reason: error.message ?? "unknown",
        })
      );
      return { sent: false, reason: error.message ?? "unknown" };
    }

    console.log(
      JSON.stringify({
        event: "email_sent",
        label: input.label,
        to: input.to,
        id: data?.id,
      })
    );

    return { sent: true, id: data?.id };
  } catch (e) {
    console.error(
      JSON.stringify({
        event: "email_send_exception",
        label: input.label,
        to: input.to,
        reason: (e as Error).message,
      })
    );
    return { sent: false, reason: (e as Error).message };
  }
}
