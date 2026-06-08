import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { getTwilioClient, getTwilioEnv } from "@/lib/twilio";
import { sendEmail } from "@/lib/email";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Automated end-to-end healthcheck.
 *
 * Why this exists: the lead form once failed silently in production for an
 * unknown stretch — the UI said "success" while the DB rejected every row, and
 * nothing surfaced it. This cron exercises the critical paths on a schedule and
 * alerts the founder the moment one breaks, so a silent failure can't sit
 * undetected while attention is elsewhere.
 *
 * Checks (all non-destructive — the lead test self-cleans its sentinel row):
 *   1. db_read         — Supabase reachable + core table queryable
 *   2. lead_insert_path — the exact path that broke: insert a sentinel lead
 *                         (source normalized to a constraint-valid value) and
 *                         delete it. Catches check-constraint / schema drift.
 *   3. anthropic       — the demo/SMS AI key is valid and the API is reachable
 *   4. twilio          — Twilio credentials are valid (no SMS sent)
 *
 * On any failure it texts + emails the founder (same destinations as lead
 * alerts: LEAD_ALERT_PHONE / LEAD_ALERT_EMAIL). Dual-channel so that if one
 * provider is the thing that's down, the other still gets through.
 *
 * Auth: protected by CRON_SECRET like every other cron.
 */

const SENTINEL_EMAIL = "healthcheck@levohq.internal";
const ANTHROPIC_MODEL = "claude-sonnet-4-20250514";

type Check = { name: string; ok: boolean; detail?: string };

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

async function checkDbAndLeadPath(): Promise<Check[]> {
  const results: Check[] = [];
  let admin;
  try {
    admin = createSupabaseAdmin();
  } catch (e) {
    return [
      { name: "db_read", ok: false, detail: (e as Error).message },
      { name: "lead_insert_path", ok: false, detail: "no db client" },
    ];
  }

  // 1. Connectivity + core table reachable.
  const { error: readErr } = await admin
    .from("businesses")
    .select("id")
    .limit(1);
  results.push({
    name: "db_read",
    ok: !readErr,
    detail: readErr?.message,
  });

  // 2. Lead-insert round-trip — the exact path that silently broke before.
  try {
    // Clear any sentinel left behind by a previous interrupted run.
    await admin.from("leads").delete().eq("email", SENTINEL_EMAIL);

    const { data: inserted, error: insErr } = await admin
      .from("leads")
      .insert({
        email: SENTINEL_EMAIL,
        source: "website",
        status: "new",
        notes: "__healthcheck__",
      })
      .select("id")
      .single();

    if (insErr || !inserted) {
      results.push({
        name: "lead_insert_path",
        ok: false,
        detail: insErr?.message ?? "insert returned no row",
      });
    } else {
      results.push({ name: "lead_insert_path", ok: true });
      // Self-clean: remove the sentinel so it never pollutes real leads.
      await admin.from("leads").delete().eq("id", inserted.id);
    }
  } catch (e) {
    results.push({
      name: "lead_insert_path",
      ok: false,
      detail: (e as Error).message,
    });
  }

  return results;
}

async function checkAnthropic(): Promise<Check> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    return { name: "anthropic", ok: false, detail: "ANTHROPIC_API_KEY not set" };
  }
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: ANTHROPIC_MODEL,
        max_tokens: 1,
        messages: [{ role: "user", content: "ping" }],
      }),
    });
    return {
      name: "anthropic",
      ok: res.ok,
      detail: res.ok ? undefined : `status ${res.status}`,
    };
  } catch (e) {
    return { name: "anthropic", ok: false, detail: (e as Error).message };
  }
}

async function checkTwilio(): Promise<Check> {
  try {
    const { accountSid } = getTwilioEnv();
    const client = getTwilioClient();
    // Fetching the account validates credentials without sending anything.
    await client.api.v2010.accounts(accountSid).fetch();
    return { name: "twilio", ok: true };
  } catch (e) {
    return { name: "twilio", ok: false, detail: (e as Error).message };
  }
}

async function alertFounder(failed: Check[]): Promise<void> {
  const summary = failed
    .map((c) => `${c.name}: ${c.detail ?? "failed"}`)
    .join("; ");
  const body = `[LevoHQ] Healthcheck FAILED — ${summary}`;

  // SMS (best-effort)
  const phone = process.env.LEAD_ALERT_PHONE;
  if (phone) {
    try {
      const { fromNumber } = getTwilioEnv();
      const client = getTwilioClient();
      await client.messages.create({ to: phone, from: fromNumber, body });
    } catch (e) {
      console.error(
        JSON.stringify({
          event: "healthcheck_sms_alert_error",
          reason: (e as Error).message,
        })
      );
    }
  }

  // Email (best-effort; sendEmail already swallows its own errors)
  const email = process.env.LEAD_ALERT_EMAIL;
  if (email) {
    await sendEmail({
      to: email,
      subject: "[LevoHQ] Healthcheck failed",
      html: `<p>One or more LevoHQ healthchecks failed:</p><pre>${escapeHtml(
        summary
      )}</pre><p>Check Vercel logs for the <code>/api/cron/healthcheck</code> run.</p>`,
      text: body,
      label: "healthcheck",
    });
  }
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const checks: Check[] = [];
  checks.push(...(await checkDbAndLeadPath()));
  checks.push(await checkAnthropic());
  checks.push(await checkTwilio());

  const failed = checks.filter((c) => !c.ok);

  if (failed.length > 0) {
    console.error(
      JSON.stringify({ event: "healthcheck_failed", failed })
    );
    await alertFounder(failed);
  }

  return NextResponse.json(
    {
      ok: failed.length === 0,
      checked_at: new Date().toISOString(),
      checks,
    },
    { status: failed.length === 0 ? 200 : 500 }
  );
}
