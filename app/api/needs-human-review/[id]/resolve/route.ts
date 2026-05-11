import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentBusinessId } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * POST /api/needs-human-review/:id/resolve
 * Marks a single escalation row as resolved by the current user.
 * RLS is enforced two ways: (1) the RLS policy on needs_human_review
 * only allows update if the user belongs to the row's business,
 * (2) we also re-check business_id here for defense in depth.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createSupabaseServerClient();
    const businessId = await getCurrentBusinessId(supabase);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const { data: row, error: fetchErr } = await supabase
      .from("needs_human_review")
      .select("id, business_id, resolved")
      .eq("id", params.id)
      .maybeSingle();

    if (fetchErr) {
      console.error("[needs-human-review/resolve] fetch:", fetchErr);
      return NextResponse.json({ error: "unavailable" }, { status: 500 });
    }
    if (!row) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    if (row.business_id !== businessId) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
    if (row.resolved) {
      return NextResponse.json({ ok: true, alreadyResolved: true });
    }

    const { error: updateErr } = await supabase
      .from("needs_human_review")
      .update({
        resolved: true,
        resolved_at: new Date().toISOString(),
        resolved_by: user.id,
      })
      .eq("id", params.id);

    if (updateErr) {
      console.error("[needs-human-review/resolve] update:", updateErr);
      return NextResponse.json({ error: "update_failed" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[needs-human-review/resolve] error:", err);
    return NextResponse.json({ error: "unavailable" }, { status: 500 });
  }
}
