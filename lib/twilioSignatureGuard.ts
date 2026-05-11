/**
 * Fix #11: Refuse production boot (and refuse to handle any production
 * request) if TWILIO_SKIP_SIGNATURE_VALIDATION is enabled.
 *
 * The skip flag is intentional for local development — it lets developers
 * POST fake Twilio payloads without computing an HMAC. In production it is
 * a complete bypass of webhook authentication: anyone who knows the URL
 * can forge inbound SMS, trigger arbitrary AI replies, run STOP/START
 * flows on real client numbers, and burn through Claude credits.
 *
 * One small bug — a stale .env in CI, a copy-pasted Vercel variable, a
 * misconfigured preview deployment promoted to prod — and the entire
 * security model collapses silently. This module makes that failure mode
 * loud and immediate.
 *
 * Three layers of defense:
 *   1. assertSignatureValidationConfigOk() runs at app boot via
 *      instrumentation.ts. If the config is bad, the server refuses to
 *      start.
 *   2. The same assertion is called at the top of every Twilio webhook
 *      route as a per-request safety net. Serverless cold starts on
 *      Vercel/Lambda don't always run instrumentation reliably, so the
 *      per-request check guarantees the bypass cannot fire in prod
 *      regardless of how the runtime decided to boot.
 *   3. isSignatureValidationSkipped() is the only place that reads the
 *      env flag, so behavior cannot drift across call sites.
 */

export class TwilioSignatureConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TwilioSignatureConfigError";
  }
}

/** Returns true only when the env explicitly opts out and it is safe to do so. */
export function isSignatureValidationSkipped(
  env: NodeJS.ProcessEnv = process.env
): boolean {
  return env.TWILIO_SKIP_SIGNATURE_VALIDATION === "true";
}

/** True when NODE_ENV is "production". Anything else (dev, test, undefined) is non-prod. */
export function isProductionEnv(env: NodeJS.ProcessEnv = process.env): boolean {
  return env.NODE_ENV === "production";
}

/**
 * Throws TwilioSignatureConfigError if the runtime is production AND the
 * skip flag is set. Safe to call as many times as you want — no side effects.
 *
 * Exposed with an injectable `env` so the test harness can probe every
 * combination without mutating real process.env.
 */
export function assertSignatureValidationConfigOk(
  env: NodeJS.ProcessEnv = process.env
): void {
  if (isProductionEnv(env) && isSignatureValidationSkipped(env)) {
    throw new TwilioSignatureConfigError(
      "REFUSING TO BOOT: TWILIO_SKIP_SIGNATURE_VALIDATION=true in production. " +
        "This disables Twilio webhook authentication and allows anyone with the " +
        "webhook URL to forge inbound SMS. Unset the variable (or set it to anything " +
        "other than 'true') before deploying."
    );
  }
}
