import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

/**
 * POST /api/lead
 * Public endpoint for landing page email capture.
 * Persists to the leads table.
 */
export async function POST(request: NextRequest) {
  try {
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

    const admin = createSupabaseAdmin();

    const { error } = await admin.from("leads").insert({
      email,
      source: body.source ?? "website",
      business_id: body.businessId ?? null,
      status: "new",
    });

    if (error) {
      console.error("[lead] insert error:", error);
      // Don't expose DB errors to the client
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
