import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { checkRateLimit } from "@/lib/rate-limit";
import { notifyNewLead } from "@/lib/leadAlert";

/**
 * POST /api/lead
 * Public endpoint for landing page email capture.
 * Persists to the leads table.
 */

// Must match the leads_source_check constraint in the database. The frontend
// forms pass a position/campaign label (e.g. "hero", "demo-footer") which is
// NOT a valid channel value — so we map any unknown label to "website" and
// preserve the original label as attribution in notes. This guarantees a real
// lead can never again be silently rejected by the check constraint.
const ALLOWED_SOURCES = new Set([
  "website",
  "sms",
  "referral",
  "manual",
  "import",
  "ad",
]);

const PER_IP_REQUESTS_PER_MINUTE = 5;

function extractIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  const real = request.headers.get("x-real-ip");
  if (real) return real.trim();
  return "unknown";
}

export async function POST(request: NextRequest) {
  try {
    // Basic abuse protection. NOTE: this limiter is in-memory and therefore
    // per-serverless-instance on Vercel — it slows casual spam but is not a
    // hard guarantee. Move to a shared store (e.g. Upstash) for real limits.
    const ip = extractIp(request);
    if (!checkRateLimit(`lead:${ip}`, PER_IP_REQUESTS_PER_MINUTE)) {
      return NextResponse.json(
        { error: "Too many requests. Please try again in a minute." },
        { status: 429 }
      );
    }

    const body = (await request.json()) as {
      email?: string;
      source?: string;
      businessId?: string;
    };
    const email =
      typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "Valid email required" },
        { status: 400 }
      );
    }

    // Normalize source to a constraint-valid channel; keep the raw label for
    // attribution so we still know which form/CTA converted.
    const rawSource =
      typeof body.source === "string" && body.source.trim()
        ? body.source.trim()
        : "website";
    const source = ALLOWED_SOURCES.has(rawSource) ? rawSource : "website";
    const notes = source === rawSource ? null : `form:${rawSource}`;

    const admin = createSupabaseAdmin();

    const { error } = await admin.from("leads").insert({
      email,
      source,
      notes,
      business_id: body.businessId ?? null,
      status: "new",
    });

    if (error) {
      // Surface the failure instead of pretending it succeeded. The client
      // shows an error state so a real prospect is never lost silently.
      console.error("[lead] insert error:", error);
      return NextResponse.json(
        { error: "Could not save your email. Please try again." },
        { status: 500 }
      );
    }

    // Fire founder alert (SMS/email). Best-effort: the lead is already saved,
    // so a notification problem must never turn this into an error response.
    try {
      await notifyNewLead({ email, source, rawSource });
    } catch (notifyErr) {
      console.error("[lead] notify error:", notifyErr);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[lead] request error:", err);
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
