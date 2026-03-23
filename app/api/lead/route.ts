import { NextRequest, NextResponse } from "next/server";

/**
 * Hero / footer email capture. Extend with Supabase `leads` table or CRM webhook when ready.
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { email?: string; source?: string };
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Valid email required" }, { status: 400 });
    }
    // Hook: persist to DB, Loops, etc.
    console.info("[LevoHQ lead]", { email, source: body.source ?? "landing" });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
