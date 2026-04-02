import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/availability
 * 
 * Query params:
 *   service - service name (e.g., "botox", "hydrafacial")
 *   date - specific date (YYYY-MM-DD) or "today", "this_week", "next_week"
 *   provider - provider name (optional)
 * 
 * Returns available time slots based on:
 *   1. Provider schedule (availability_slots table)
 *   2. Service-provider mapping (who can do this service)
 *   3. Existing bookings (what's already taken)
 *   4. Service duration (enough time for the appointment)
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const serviceName = searchParams.get("service");
  const dateParam = searchParams.get("date") || "this_week";
  const providerName = searchParams.get("provider");

  try {
    // 1. Find the service
    let serviceQuery = supabase
      .from("services")
      .select("*")
      .eq("is_active", true);

    if (serviceName) {
      serviceQuery = serviceQuery.ilike("name", `%${serviceName}%`);
    }

    const { data: services, error: serviceError } = await serviceQuery;

    if (serviceError || !services?.length) {
      return NextResponse.json({
        available: false,
        message: `Service "${serviceName}" not found. Available services: Botox, Lip Filler, Dermal Fillers, HydraFacial, Chemical Peel, Laser Hair Removal, Consultation.`,
        slots: [],
      });
    }

    const service = services[0];

    // 2. Find providers who offer this service
    let providerQuery = supabase
      .from("provider_services")
      .select(`
        provider_id,
        providers (id, name, title)
      `)
      .eq("service_id", service.id);

    const { data: providerLinks } = await providerQuery;

    if (!providerLinks?.length) {
      return NextResponse.json({
        available: false,
        message: `No providers currently offer ${service.name}.`,
        slots: [],
      });
    }

    // Filter by provider name if specified
    let providers = providerLinks.map((pl: any) => pl.providers);
    if (providerName) {
      providers = providers.filter((p: any) =>
        p.name.toLowerCase().includes(providerName.toLowerCase())
      );
    }

    const providerIds = providers.map((p: any) => p.id);

    // 3. Determine date range
    const today = new Date();
    let startDate: Date;
    let endDate: Date;

    switch (dateParam) {
      case "today":
        startDate = today;
        endDate = today;
        break;
      case "tomorrow":
        startDate = new Date(today);
        startDate.setDate(startDate.getDate() + 1);
        endDate = startDate;
        break;
      case "this_week":
        startDate = today;
        endDate = new Date(today);
        endDate.setDate(endDate.getDate() + (6 - today.getDay())); // through Saturday
        break;
      case "next_week":
        startDate = new Date(today);
        startDate.setDate(startDate.getDate() + (7 - today.getDay() + 1)); // next Monday
        endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 5); // through Saturday
        break;
      default:
        // Assume YYYY-MM-DD format
        startDate = new Date(dateParam);
        endDate = startDate;
        break;
    }

    // 4. Get provider availability schedules
    const { data: schedules } = await supabase
      .from("availability_slots")
      .select("*")
      .in("provider_id", providerIds)
      .eq("is_active", true);

    if (!schedules?.length) {
      return NextResponse.json({
        available: false,
        message: `No availability found for ${service.name} in the requested timeframe.`,
        slots: [],
      });
    }

    // 5. Get existing appointments in the date range
    const startStr = startDate.toISOString().split("T")[0];
    const endStr = endDate.toISOString().split("T")[0];

    const { data: existingAppts } = await supabase
      .from("appointments")
      .select("provider_id, date, time, service_id")
      .in("provider_id", providerIds)
      .gte("date", startStr)
      .lte("date", endStr)
      .in("status", ["confirmed", "pending"]);

    // 6. Build available slots
    const slots: any[] = [];
    const serviceDuration = service.duration_minutes;
    const slotInterval = 30; // generate slots every 30 min

    // For each day in the range
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dayOfWeek = currentDate.getDay();
      const dateStr = currentDate.toISOString().split("T")[0];

      // Skip past times if it's today
      const now = new Date();
      const isToday = dateStr === today.toISOString().split("T")[0];

      // Find which providers are available this day
      const daySchedules = schedules.filter(
        (s: any) => s.day_of_week === dayOfWeek
      );

      for (const schedule of daySchedules) {
        const provider = providers.find(
          (p: any) => p.id === schedule.provider_id
        );
        if (!provider) continue;

        // Generate time slots
        const [startH, startM] = schedule.start_time.split(":").map(Number);
        const [endH, endM] = schedule.end_time.split(":").map(Number);
        const scheduleStart = startH * 60 + startM;
        const scheduleEnd = endH * 60 + endM;

        for (
          let minutes = scheduleStart;
          minutes + serviceDuration <= scheduleEnd;
          minutes += slotInterval
        ) {
          const hour = Math.floor(minutes / 60);
          const min = minutes % 60;
          const timeStr = `${hour.toString().padStart(2, "0")}:${min
            .toString()
            .padStart(2, "0")}`;

          // Skip if it's today and the slot is in the past
          if (isToday) {
            const slotTime = new Date(currentDate);
            slotTime.setHours(hour, min, 0);
            if (slotTime <= now) continue;
          }

          // Check if this slot conflicts with an existing appointment
          const isBooked = existingAppts?.some(
            (appt: any) =>
              appt.provider_id === schedule.provider_id &&
              appt.date === dateStr &&
              appt.time === timeStr
          );

          if (!isBooked) {
            const dayName = [
              "Sunday",
              "Monday",
              "Tuesday",
              "Wednesday",
              "Thursday",
              "Friday",
              "Saturday",
            ][dayOfWeek];

            // Format time for display
            const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
            const ampm = hour >= 12 ? "PM" : "AM";
            const displayTime = `${displayHour}:${min
              .toString()
              .padStart(2, "0")} ${ampm}`;

            slots.push({
              date: dateStr,
              day: dayName,
              time: timeStr,
              display_time: displayTime,
              provider_name: provider.name,
              provider_title: provider.title,
              service: service.name,
              duration: serviceDuration,
              price_range:
                service.price_min === service.price_max
                  ? `$${service.price_min}`
                  : `$${service.price_min}-$${service.price_max} ${service.price_unit}`,
            });
          }
        }
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    // 7. Return results (limit to first 10 for SMS readability)
    const limitedSlots = slots.slice(0, 10);

    // Build a human-readable summary for the AI
    const summary = limitedSlots.length > 0
      ? `Found ${slots.length} available slots for ${service.name}. Here are the next ${limitedSlots.length}: ` +
        limitedSlots
          .slice(0, 3)
          .map(
            (s: any) =>
              `${s.day} ${s.display_time} with ${s.provider_name}`
          )
          .join(", ") +
        (slots.length > 3 ? `. Plus ${slots.length - 3} more options.` : ".")
      : `No availability found for ${service.name} in the requested timeframe.`;

    return NextResponse.json({
      available: limitedSlots.length > 0,
      service: {
        name: service.name,
        duration: serviceDuration,
        price_range:
          service.price_min === service.price_max
            ? `$${service.price_min}`
            : `$${service.price_min}-$${service.price_max} ${service.price_unit}`,
        prep_instructions: service.prep_instructions,
      },
      slots: limitedSlots,
      total_available: slots.length,
      summary,
    });
  } catch (error) {
    console.error("Availability check error:", error);
    return NextResponse.json(
      { error: "Failed to check availability" },
      { status: 500 }
    );
  }
}
