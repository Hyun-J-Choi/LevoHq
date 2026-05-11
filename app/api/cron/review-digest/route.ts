import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email";
import { listRecentUnresolvedForBusiness, type ReviewRow } from "@/lib/needsReviewQueries";
import { createLogger, genRequestId } from "@/lib/logger";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Daily digest of needs_human_review rows.
 *
 * For each business that has at least one unresolved escalation in the
 * last 24 hours, send the business's owner a single email listing them.
 * Crons schedule (Vercel): once per morning, business-local time-ish.
 *
 * Authentication: requires the same Bearer token used by every other cron.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const requestId = genRequestId();
  const log = createLogger({ requestId });
  const admin = createSupabaseAdmin();

  let businessesProcessed = 0;
  let emailsSent = 0;
  let skippedNoEmail = 0;
  let skippedNoRows = 0;
  let errors = 0;

  // Pull every business that has at least one unresolved row in window.
  // We do the per-business filter at the row layer to keep the query simple.
  const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
  const { data: distinctRows, error: distinctErr } = await admin
    .from("needs_human_review")
    .select("business_id")
    .eq("resolved", false)
    .gte("created_at", since);

  if (distinctErr) {
    log.error("review-digest: distinct businesses query failed", {
      error: String(distinctErr.message),
    });
    return NextResponse.json({ error: "query_failed" }, { status: 500 });
  }

  const businessIds = Array.from(
    new Set((distinctRows ?? []).map((r) => r.business_id))
  );

  for (const businessId of businessIds) {
    businessesProcessed++;
    try {
      const rows = await listRecentUnresolvedForBusiness(admin, businessId, 24, 50);
      if (rows.length === 0) {
        skippedNoRows++;
        continue;
      }

      const { data: business } = await admin
        .from("businesses")
        .select("name, email")
        .eq("id", businessId)
        .single();

      if (!business?.email) {
        skippedNoEmail++;
        log.warn("review-digest: no email on business", { businessId });
        continue;
      }

      const html = renderDigestHtml(business.name ?? "your studio", rows);
      const text = renderDigestText(business.name ?? "your studio", rows);

      const result = await sendEmail({
        to: business.email,
        subject: `[Levohq] ${rows.length} ${
          rows.length === 1 ? "message needs" : "messages need"
        } your review`,
        html,
        text,
        label: "review_digest",
      });

      if (result.sent) {
        emailsSent++;
      } else {
        errors++;
        log.error("review-digest: send failed", {
          businessId,
          reason: result.reason,
        });
      }
    } catch (err) {
      errors++;
      log.error("review-digest: per-business loop failed", {
        businessId,
        error: String(err),
      });
    }
  }

  log.info("review-digest complete", {
    businessesProcessed,
    emailsSent,
    skippedNoEmail,
    skippedNoRows,
    errors,
  });

  return NextResponse.json({
    ok: true,
    businessesProcessed,
    emailsSent,
    skippedNoEmail,
    skippedNoRows,
    errors,
  });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderDigestHtml(businessName: string, rows: ReviewRow[]): string {
  const items = rows
    .map((row) => {
      const triggers = row.trigger_types.map(escapeHtml).join(", ");
      const phone = escapeHtml(row.recipient_phone);
      const created = escapeHtml(
        new Date(row.created_at).toLocaleString()
      );
      const original = escapeHtml(row.original_message);
      const source = row.source_label
        ? `<span style="color:#888;font-size:11px;">(${escapeHtml(row.source_label)})</span>`
        : "";
      return `
        <li style="margin-bottom:18px;padding:14px;border:1px solid #e5e5e5;border-radius:8px;background:#fafafa;">
          <div style="font-size:12px;color:#666;margin-bottom:4px;">
            <strong>${phone}</strong> · ${created} ${source}
          </div>
          <div style="font-size:11px;color:#b91c1c;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:6px;">
            Triggers: ${triggers}
          </div>
          <div style="font-size:14px;color:#111;white-space:pre-wrap;">${original}</div>
        </li>`;
    })
    .join("");

  return `
    <div style="font-family:-apple-system,system-ui,sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#111;">
      <h2 style="margin:0 0 4px 0;">Messages to review for ${escapeHtml(businessName)}</h2>
      <p style="color:#666;margin:0 0 20px 0;font-size:14px;">
        Our safety guard caught ${rows.length} outbound ${rows.length === 1 ? "message" : "messages"} in the last 24 hours.
        The client received a neutral "a team member will follow up" reply. Review and reach out personally if appropriate.
      </p>
      <ul style="list-style:none;padding:0;margin:0;">${items}</ul>
      <p style="margin-top:24px;font-size:13px;">
        <a href="https://levohq.ai/review" style="color:#D4A853;">Open the review queue →</a>
      </p>
    </div>`;
}

function renderDigestText(businessName: string, rows: ReviewRow[]): string {
  const lines = rows.map((row) => {
    const triggers = row.trigger_types.join(", ");
    return `- [${row.recipient_phone}] (${triggers}) — ${row.original_message}`;
  });
  return [
    `Messages to review for ${businessName}`,
    `Our safety guard caught ${rows.length} outbound ${rows.length === 1 ? "message" : "messages"} in the last 24 hours.`,
    "",
    ...lines,
    "",
    "Open the review queue: https://levohq.ai/review",
  ].join("\n");
}
