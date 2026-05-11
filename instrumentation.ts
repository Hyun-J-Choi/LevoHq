/**
 * Next.js boot hook. Runs once when the server starts (per worker).
 *
 * Today this only enforces Fix #11 — refuse prod boot when the Twilio
 * signature-skip flag is on. Add additional boot-time invariants here as
 * the platform matures (e.g. required env vars, schema version checks).
 *
 * Note: requires `experimental.instrumentationHook: true` in next.config
 * on Next.js 14.x. Next.js 15 enables it by default.
 */
export async function register(): Promise<void> {
  // Only the Node.js runtime should run these checks. Edge runtime workers
  // have a different env surface and don't host Twilio webhooks.
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { assertSignatureValidationConfigOk } = await import(
    "./lib/twilioSignatureGuard"
  );

  try {
    assertSignatureValidationConfigOk();
  } catch (err) {
    // Log a hard, structured failure so it lands in the platform's
    // boot logs no matter how the host is configured, then re-throw so
    // the server actually refuses to start.
    console.error(
      JSON.stringify({
        event: "boot_refused",
        reason: (err as Error).message,
      })
    );
    throw err;
  }
}
