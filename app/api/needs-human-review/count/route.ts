import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentBusinessId } from "@/lib/auth";
import { countUnresolvedForBusiness } from "@/lib/needsReviewQueries";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET /api/needs-human-review/count
 * Returns { count } of unresolved escalations for the authenticated
 * user's business. Used by the sidebar badge.
 */
export async function GET() {
  try {
    const supabase = createSupabaseServerClient();
    const businessId = await getCurrentBusinessId(supabase);
    const count = await countUnresolvedForBusiness(supabase, businessId);
    return NextResponse.json({ count });
  } catch (err) {
    console.error("[needs-human-review/count] error:", err);
    return NextResponse.json({ count: 0, error: "unavailable" }, { status: 200 });
  }
}
