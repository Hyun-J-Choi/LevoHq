import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function getCronBaseUrl(): string | null {
  const explicit = process.env.CRON_INTERNAL_BASE_URL?.replace(/\/$/, "");
  if (explicit) return explicit;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  const site = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (site) return site;
  return null;
}

export async function postTwilioSend(to: string, body: string): Promise<void> {
  const base = getCronBaseUrl();
  if (!base) {
    throw new Error("Set CRON_INTERNAL_BASE_URL, VERCEL_URL, or NEXT_PUBLIC_SITE_URL for cron → Twilio");
  }

  const headers: Record<string, string> = { "content-type": "application/json" };
  const secret = process.env.TWILIO_SEND_SECRET;
  if (secret) headers["x-twilio-send-secret"] = secret;

  const res = await fetch(`${base}/api/twilio/send`, {
    method: "POST",
    headers,
    body: JSON.stringify({ to, body }),
  });

  if (!res.ok) {
    const j = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(j.error ?? `Twilio send HTTP ${res.status}`);
  }
}

export function firstName(full: string): string {
  return full.trim().split(/\s+/)[0] || "there";
}

/** Returns a 401 Response if CRON_SECRET is set and header is wrong; otherwise null. */
export function unauthorizedCron(request: NextRequest): NextResponse | null {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return null;
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}
