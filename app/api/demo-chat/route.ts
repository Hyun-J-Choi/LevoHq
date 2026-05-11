import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { DEMO_CHAT_SYSTEM_PROMPT } from "@/lib/demoChatSystemPrompt";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { checkRateLimit } from "@/lib/rate-limit";
import {
  extractServiceSearchTermFromMessage,
  messageSuggestsAvailabilityLookup,
} from "@/lib/availabilitySlots";
import { computeDemoAvailabilitySlots } from "@/lib/demoAvailabilitySlots";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Public, unauthenticated demo chat.
 *
 * Threat model: anyone on the internet can hit this — it's wired up to the
 * marketing page. Without limits, a single actor can burn the ANTHROPIC_API_KEY
 * or rack up thousands of junk sessions. We enforce:
 *
 *   1. Per-IP rate limit (20 messages/minute)
 *   2. Per-session hard cap on length (30 messages)
 *   3. Input length cap (1,500 chars per message — a real SMS is <500)
 *   4. Session + transcript persistence so sales sees every prospect
 *      conversation in one place instead of throwing them away.
 *
 * IPs are hashed before storage (HMAC with an app-scoped salt) so we can
 * rate-limit without hoarding raw PII.
 */

type DemoChatMessage = { role: "user" | "assistant"; content: string };

const MAX_MESSAGES_PER_SESSION = 30;
const MAX_MESSAGE_CHARS = 1500;
const PER_IP_REQUESTS_PER_MINUTE = 20;

function isDemoChatMessage(m: unknown): m is DemoChatMessage {
  if (!m || typeof m !== "object") return false;
  const o = m as Record<string, unknown>;
  const role = o.role;
  const content = o.content;
  if (role !== "user" && role !== "assistant") return false;
  return typeof content === "string" && content.trim().length > 0;
}

function isUuid(v: unknown): v is string {
  return (
    typeof v === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v)
  );
}

function extractIp(request: NextRequest): string {
  // Vercel / most proxies forward the originating client IP as the first
  // entry in X-Forwarded-For. X-Real-IP is a secondary fallback.
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  const real = request.headers.get("x-real-ip");
  if (real) return real.trim();
  return "unknown";
}

function hashIp(ip: string): string {
  // Salt prevents rainbow-table recovery of the IP. Fall back to a constant
  // salt only in dev — in prod you should set DEMO_IP_SALT.
  const salt = process.env.DEMO_IP_SALT ?? "levohq-demo-salt-dev-only";
  return crypto.createHmac("sha256", salt).update(ip).digest("hex");
}

function trimOrNull(v: unknown, max = 256): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  if (!t) return null;
  return t.slice(0, max);
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Anthropic API is not configured." },
      { status: 503 }
    );
  }

  // ── Rate limit (applied before any Claude call, before any DB work) ─────
  const ip = extractIp(request);
  const ipHash = hashIp(ip);
  if (!checkRateLimit(`demo-chat:${ipHash}`, PER_IP_REQUESTS_PER_MINUTE)) {
    return NextResponse.json(
      { error: "You're sending messages too quickly. Try again in a minute." },
      { status: 429 }
    );
  }

  // ── Parse body ──────────────────────────────────────────────────────────
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!body || typeof body !== "object" || !("messages" in body)) {
    return NextResponse.json(
      { error: "Expected JSON object with a messages array." },
      { status: 400 }
    );
  }

  const rawBody = body as {
    messages: unknown;
    sessionId?: unknown;
    lead?: unknown;
  };

  const raw = rawBody.messages;
  if (!Array.isArray(raw) || raw.length === 0) {
    return NextResponse.json(
      { error: "messages must be a non-empty array." },
      { status: 400 }
    );
  }

  const messages: DemoChatMessage[] = [];
  for (const item of raw) {
    if (!isDemoChatMessage(item)) {
      return NextResponse.json(
        {
          error:
            "Each message must be { role: 'user' | 'assistant', content: string } with non-empty content.",
        },
        { status: 400 }
      );
    }
    const trimmed = item.content.trim();
    if (trimmed.length > MAX_MESSAGE_CHARS) {
      return NextResponse.json(
        {
          error: `Each message must be under ${MAX_MESSAGE_CHARS} characters.`,
        },
        { status: 400 }
      );
    }
    messages.push({ role: item.role, content: trimmed });
  }

  const lastUserMessage = messages[messages.length - 1];
  if (lastUserMessage?.role !== "user") {
    return NextResponse.json(
      { error: "The last message must have role user." },
      { status: 400 }
    );
  }

  // ── Session management ─────────────────────────────────────────────────
  const admin = createSupabaseAdmin();
  const providedSessionId = isUuid(rawBody.sessionId) ? rawBody.sessionId : null;

  // Optional lead capture. The client can send any of these at any point
  // (e.g. after the user types "my email is foo@bar.com" and we parse it
  // on the client, or when a "book a demo" form completes).
  const leadInput = (rawBody.lead ?? {}) as Record<string, unknown>;
  const leadPatch: Record<string, string> = {};
  const leadName = trimOrNull(leadInput.name, 120);
  const leadEmail = trimOrNull(leadInput.email, 254);
  const leadPhone = trimOrNull(leadInput.phone, 32);
  const leadBusiness = trimOrNull(leadInput.businessName, 120);
  if (leadName) leadPatch.contact_name = leadName;
  if (leadEmail) leadPatch.contact_email = leadEmail;
  if (leadPhone) leadPatch.contact_phone = leadPhone;
  if (leadBusiness) leadPatch.business_name = leadBusiness;

  let sessionId: string | null = providedSessionId;
  let sessionMessageCount = 0;

  if (sessionId) {
    const { data: existing } = await admin
      .from("demo_sessions")
      .select("id, message_count")
      .eq("id", sessionId)
      .single();

    if (!existing) {
      // Client sent a UUID we don't recognize — treat it like a brand-new
      // session but keep the ID they gave us so their client state stays in
      // sync across refreshes.
      await admin.from("demo_sessions").insert({
        id: sessionId,
        ip_hash: ipHash,
        user_agent: trimOrNull(request.headers.get("user-agent"), 512),
        referrer: trimOrNull(request.headers.get("referer"), 512),
        ...leadPatch,
      });
      sessionMessageCount = 0;
    } else {
      sessionMessageCount = existing.message_count ?? 0;
    }
  } else {
    const { data: created, error: createErr } = await admin
      .from("demo_sessions")
      .insert({
        ip_hash: ipHash,
        user_agent: trimOrNull(request.headers.get("user-agent"), 512),
        referrer: trimOrNull(request.headers.get("referer"), 512),
        ...leadPatch,
      })
      .select("id")
      .single();

    if (createErr || !created) {
      console.error("[demo-chat] session insert failed:", createErr);
      return NextResponse.json(
        { error: "Could not start a demo session." },
        { status: 500 }
      );
    }
    sessionId = created.id;
  }

  // Hard cap to prevent one session from running up a huge bill.
  if (sessionMessageCount >= MAX_MESSAGES_PER_SESSION) {
    return NextResponse.json(
      {
        error:
          "This demo session has reached its message limit. Refresh the page to start a new one.",
      },
      { status: 429 }
    );
  }

  // ── Log the user's message before calling Claude ───────────────────────
  // If Claude fails, we still want the transcript of what they asked.
  await admin.from("demo_messages").insert({
    session_id: sessionId,
    role: "user",
    content: lastUserMessage.content.slice(0, MAX_MESSAGE_CHARS),
  });

  // If the client sent lead info this turn, persist it now too.
  if (Object.keys(leadPatch).length > 0) {
    await admin.from("demo_sessions").update(leadPatch).eq("id", sessionId);
  }

  // ── Dynamic availability injection ────────────────────────────────────
  // Same pattern as app/api/twilio/incoming/route.ts: only inject an
  // availability block if the message looks like a booking/scheduling
  // intent AND we can map it to a known service. Otherwise hand Claude a
  // strict "do not invent times" rule. This keeps the demo from drifting
  // stale (rolling window) and from hallucinating impossible slots.
  const lastUserText = lastUserMessage.content;
  const serviceSearch = extractServiceSearchTermFromMessage(lastUserText);
  let availabilityBlock = "";
  if (messageSuggestsAvailabilityLookup(lastUserText) && serviceSearch) {
    const avail = computeDemoAvailabilitySlots({
      serviceName: serviceSearch,
      slotLimit: 5,
    });
    if (avail.ok && avail.slots.length > 0) {
      const list = avail.slots
        .map((s) => `${s.day} ${s.display_time} with ${s.provider_name}`)
        .join("; ");
      availabilityBlock = `\n\nCURRENT AVAILABILITY for ${avail.service.name}: ${list}. Use this real data when responding — do not make up appointment times.`;
    } else if (avail.ok) {
      availabilityBlock = `\n\nCURRENT AVAILABILITY for ${avail.service.name}: (no open slots in the system for this week). Do not invent times; offer to have a team member help book.`;
    }
  }

  const schedulingRule = availabilityBlock
    ? "Scheduling: When CURRENT AVAILABILITY appears below, use ONLY those day, time, and provider options. Never invent slots. If none listed, say a team member will confirm shortly."
    : "Scheduling: NEVER invent or guess specific availability, times, or dates. If asked about scheduling without real slots, say a team member will confirm shortly.";

  const systemPrompt = `${DEMO_CHAT_SYSTEM_PROMPT}\n\n${schedulingRule}${availabilityBlock}`;

  // ── Claude call ────────────────────────────────────────────────────────
  const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      // Demo replies should feel like real SMS — short. 1000 was ~3x the
      // real outbound cap and produced essays instead of texts. 200 tokens
      // (~700 chars) matches the production wrapper in lib/claude.ts.
      max_tokens: 200,
      // Low temperature keeps the demo on-script: a prospective customer
      // demoing the same flow twice should see consistent behavior.
      temperature: 0.3,
      system: systemPrompt,
      messages,
    }),
  });

  const payload = (await anthropicRes.json()) as {
    content?: Array<{ type: string; text?: string }>;
    error?: { message?: string };
  };

  if (!anthropicRes.ok) {
    const msg =
      payload.error?.message ??
      `Claude request failed with status ${anthropicRes.status}.`;
    return NextResponse.json(
      { error: msg },
      { status: anthropicRes.status >= 500 ? 502 : 400 }
    );
  }

  const text = payload.content
    ?.find((b) => b.type === "text")
    ?.text?.trim();

  if (!text) {
    return NextResponse.json(
      { error: "The model returned an empty reply." },
      { status: 502 }
    );
  }

  // ── Persist assistant reply + session metadata ─────────────────────────
  await admin.from("demo_messages").insert({
    session_id: sessionId,
    role: "assistant",
    content: text.slice(0, MAX_MESSAGE_CHARS),
  });

  await admin
    .from("demo_sessions")
    .update({
      last_message_at: new Date().toISOString(),
      message_count: sessionMessageCount + 2, // user + assistant this turn
    })
    .eq("id", sessionId);

  return NextResponse.json({ text, sessionId });
}
