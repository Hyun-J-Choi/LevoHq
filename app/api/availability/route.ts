import { NextResponse } from "next/server";
import { createSupabaseServiceRoleOrAnon } from "@/lib/supabase/admin";
import { computeAvailabilitySlots } from "@/lib/availabilitySlots";

/**
 * GET /api/availability
 *
 * Returns real available appointment slots from the database.
 *
 * Query params:
 *   service - service name (e.g., "botox", "hydrafacial")
 *   date    - "today", "tomorrow", "this_week", "next_week", or YYYY-MM-DD
 *   provider - provider name filter (optional)
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const serviceName = searchParams.get("service");
  const dateParam = searchParams.get("date") || "this_week";
  const providerName = searchParams.get("provider");

  try {
    const supabase = createSupabaseServiceRoleOrAnon();

    const result = await computeAvailabilitySlots(supabase, {
      serviceName,
      dateParam,
      providerName,
      slotLimit: 10,
    });

    if (!result.ok) {
      if (result.code === "db_error") {
        console.error("Availability compute error:", result.message);
        return NextResponse.json(
          { error: "Failed to check availability" },
          { status: 500 }
        );
      }
      return NextResponse.json({
        available: false,
        message: result.message,
        slots: [],
      });
    }

    const limitedSlots = result.slots;

    const summary = result.summary;

    return NextResponse.json({
      available: limitedSlots.length > 0,
      service: {
        name: result.service.name,
        duration: result.service.duration,
        price_range: result.service.price_range,
        prep_instructions: result.service.prep_instructions,
      },
      slots: limitedSlots,
      total_available: result.total_available,
      summary,
    });
  } catch (error) {
    console.error("Availability check error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to check availability";
    const configMissing =
      message.includes("Missing NEXT_PUBLIC_SUPABASE_URL") ||
      message.includes("SUPABASE_SERVICE_ROLE_KEY") ||
      message.includes("NEXT_PUBLIC_SUPABASE_ANON_KEY");
    if (configMissing) {
      return NextResponse.json(
        {
          error:
            "Server configuration error: set NEXT_PUBLIC_SUPABASE_URL and either SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY.",
        },
        { status: 503 }
      );
    }
    return NextResponse.json(
      { error: "Failed to check availability" },
      { status: 500 }
    );
  }
}
