import type { SupabaseClient } from "@supabase/supabase-js";

function formatLocalDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function localDateTimeFromIso(iso: string): { date: string; time: string } {
  const d = new Date(iso);
  return {
    date: formatLocalDate(d),
    time: `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`,
  };
}

function isCancelledStatus(status: unknown): boolean {
  return String(status ?? "").toLowerCase().includes("cancel");
}

type ApptRow = {
  id?: string;
  service?: string | null;
  scheduled_at?: string | null;
  appointment_time?: string | null;
  status?: string | null;
};

function slotConflictsWithAppt(
  appt: ApptRow,
  slot: { dateStr: string; timeStr: string; serviceName: string }
): boolean {
  if (isCancelledStatus(appt.status)) return false;

  const whenIso = appt.scheduled_at ?? appt.appointment_time;
  if (!whenIso) return false;

  const { date, time } = localDateTimeFromIso(whenIso);
  if (date !== slot.dateStr || time !== slot.timeStr) return false;

  const svc = (appt.service || "").trim().toLowerCase();
  const name = slot.serviceName.trim().toLowerCase();
  if (!svc || !name) return false;
  return svc === name || svc.includes(name) || name.includes(svc);
}

export type ComputedAvailabilitySlot = {
  date: string;
  day: string;
  time: string;
  display_time: string;
  provider_name: string;
  provider_title: string | null;
  service: string;
  duration: number;
  price_range: string;
};

export type ComputeAvailabilityOptions = {
  serviceName: string | null;
  dateParam?: string;
  providerName?: string | null;
  /** Max slots returned (default 10 for HTTP API). */
  slotLimit?: number;
};

export type ComputeAvailabilityResult =
  | {
      ok: true;
      service: {
        name: string;
        duration: number;
        price_range: string;
        prep_instructions: string | null;
      };
      slots: ComputedAvailabilitySlot[];
      total_available: number;
      summary: string;
    }
  | { ok: false; code: string; message: string };

/**
 * Loads services, providers, provider_services, and availability_slots and
 * computes open slots (same logic as GET /api/availability). Use with
 * createSupabaseAdmin() or createSupabaseServiceRoleOrAnon().
 */
export async function computeAvailabilitySlots(
  supabase: SupabaseClient,
  options: ComputeAvailabilityOptions
): Promise<ComputeAvailabilityResult> {
  const dateParam = options.dateParam ?? "this_week";
  const providerName = options.providerName ?? null;
  const slotLimit = options.slotLimit ?? 10;

  let serviceQuery = supabase
    .from("services")
    .select("*")
    .eq("is_active", true);

  if (options.serviceName) {
    serviceQuery = serviceQuery.ilike("name", `%${options.serviceName}%`);
  }

  const { data: services, error: serviceError } = await serviceQuery;

  if (serviceError) {
    return {
      ok: false,
      code: "db_error",
      message: serviceError.message,
    };
  }

  if (!services?.length) {
    return {
      ok: false,
      code: "no_service",
      message: options.serviceName
        ? `Service "${options.serviceName}" not found.`
        : "No matching service.",
    };
  }

  const service = services[0] as Record<string, unknown>;

  const { data: providerLinks, error: linkError } = await supabase
    .from("provider_services")
    .select("provider_id")
    .eq("service_id", service.id as string);

  if (linkError) {
    return { ok: false, code: "db_error", message: linkError.message };
  }

  const providerIds = [
    ...new Set(
      (providerLinks ?? [])
        .map((l) => l.provider_id)
        .filter((id): id is string => typeof id === "string" && id.length > 0)
    ),
  ];

  if (providerIds.length === 0) {
    return {
      ok: false,
      code: "no_providers",
      message: `No providers currently offer ${service.name}.`,
    };
  }

  const { data: providerRows, error: providersError } = await supabase
    .from("providers")
    .select("id, name, title")
    .in("id", providerIds);

  if (providersError) {
    return { ok: false, code: "db_error", message: providersError.message };
  }

  let providers = (providerRows ?? []).map((p) => ({
    id: p.id as string,
    name: p.name as string,
    title: (p.title as string | null) ?? null,
  }));

  if (providerName) {
    const q = providerName.toLowerCase();
    providers = providers.filter((p) => p.name.toLowerCase().includes(q));
  }

  const activeProviderIds = providers.map((p) => p.id);

  if (activeProviderIds.length === 0) {
    return {
      ok: false,
      code: "no_providers",
      message: `No providers match "${providerName}" for ${service.name}.`,
    };
  }

  const today = new Date();
  let startDate: Date;
  let endDate: Date;

  switch (dateParam) {
    case "today":
      startDate = new Date(today);
      endDate = new Date(today);
      break;
    case "tomorrow":
      startDate = new Date(today);
      startDate.setDate(startDate.getDate() + 1);
      endDate = new Date(startDate);
      break;
    case "this_week":
      startDate = new Date(today);
      endDate = new Date(today);
      endDate.setDate(endDate.getDate() + (6 - today.getDay()));
      break;
    case "next_week":
      startDate = new Date(today);
      startDate.setDate(startDate.getDate() + (7 - today.getDay() + 1));
      endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 5);
      break;
    default: {
      const parsed = new Date(dateParam);
      if (Number.isNaN(parsed.getTime())) {
        return {
          ok: false,
          code: "no_service",
          message: "Invalid date parameter.",
        };
      }
      startDate = parsed;
      endDate = parsed;
      break;
    }
  }

  const { data: schedules, error: schedError } = await supabase
    .from("availability_slots")
    .select("*")
    .in("provider_id", activeProviderIds)
    .eq("is_active", true);

  if (schedError) {
    return { ok: false, code: "db_error", message: schedError.message };
  }

  if (!schedules?.length) {
    return {
      ok: false,
      code: "no_schedules",
      message: `No availability found for ${service.name} in the requested timeframe.`,
    };
  }

  const rangeStart = new Date(startDate);
  rangeStart.setHours(0, 0, 0, 0);
  const rangeEnd = new Date(endDate);
  rangeEnd.setHours(23, 59, 59, 999);
  const rs = rangeStart.toISOString();
  const re = rangeEnd.toISOString();

  const { data: byScheduled, error: errScheduled } = await supabase
    .from("appointments")
    .select("id, service, scheduled_at, status")
    .gte("scheduled_at", rs)
    .lte("scheduled_at", re)
    .not("status", "ilike", "%cancel%");

  if (errScheduled) {
    return { ok: false, code: "db_error", message: errScheduled.message };
  }

  const { data: byAppointmentTime, error: errApptTime } = await supabase
    .from("appointments")
    .select("id, service, appointment_time, status")
    .gte("appointment_time", rs)
    .lte("appointment_time", re)
    .not("status", "ilike", "%cancel%");

  const useApptTime = !errApptTime;
  if (
    errApptTime &&
    !String(errApptTime.message ?? "").toLowerCase().includes("column")
  ) {
    console.error("appointments (appointment_time) query:", errApptTime);
  }

  const merged = new Map<string, ApptRow>();
  for (const row of byScheduled ?? []) {
    merged.set(String((row as ApptRow).id ?? ""), row as ApptRow);
  }
  if (useApptTime) {
    for (const row of byAppointmentTime ?? []) {
      const r = row as ApptRow;
      const id = String(r.id ?? "");
      if (!merged.has(id)) merged.set(id, r);
    }
  }
  const existingAppts = [...merged.values()];

  const slots: ComputedAvailabilitySlot[] = [];
  const serviceDuration = (service.duration_minutes as number) ?? 30;
  const slotInterval = 30;
  const serviceNameStr = String(service.name);
  const todayLocal = formatLocalDate(today);

  const currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    const dayOfWeek = currentDate.getDay();
    const dateStr = formatLocalDate(currentDate);
    const now = new Date();
    const isToday = dateStr === todayLocal;

    const daySchedules = schedules.filter((s) => s.day_of_week === dayOfWeek);

    for (const schedule of daySchedules) {
      const provider = providers.find((p) => p.id === schedule.provider_id);
      if (!provider) continue;

      const startRaw = String(schedule.start_time ?? "0:0");
      const endRaw = String(schedule.end_time ?? "0:0");
      const [startH, startM] = startRaw.split(":").map(Number);
      const [endH, endM] = endRaw.split(":").map(Number);
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

        if (isToday) {
          const slotTime = new Date(currentDate);
          slotTime.setHours(hour, min, 0, 0);
          if (slotTime <= now) continue;
        }

        const isBooked = existingAppts.some((appt) =>
          slotConflictsWithAppt(appt, {
            dateStr,
            timeStr,
            serviceName: serviceNameStr,
          })
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

          const displayHour =
            hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
          const ampm = hour >= 12 ? "PM" : "AM";
          const displayTime = `${displayHour}:${min
            .toString()
            .padStart(2, "0")} ${ampm}`;

          const pm = service.price_min as number | null | undefined;
          const px = service.price_max as number | null | undefined;
          const unit = (service.price_unit as string) ?? "per session";
          const priceRange =
            pm != null && px != null && pm === px
              ? `$${pm}`
              : pm != null && px != null
                ? `$${pm}-$${px} ${unit}`
                : "";

          slots.push({
            date: dateStr,
            day: dayName,
            time: timeStr,
            display_time: displayTime,
            provider_name: provider.name,
            provider_title: provider.title,
            service: serviceNameStr,
            duration: serviceDuration,
            price_range: priceRange,
          });
        }
      }
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }

  const limitedSlots = slots.slice(0, slotLimit);

  const summary =
    limitedSlots.length > 0
      ? `Found ${slots.length} available slots for ${serviceNameStr}. Next available: ` +
        limitedSlots
          .slice(0, 3)
          .map(
            (s) =>
              `${s.day} ${s.display_time} with ${s.provider_name}`
          )
          .join(", ") +
        (slots.length > 3
          ? `. Plus ${slots.length - 3} more options.`
          : ".")
      : `No availability found for ${serviceNameStr} in the requested timeframe.`;

  const pm = service.price_min as number | null | undefined;
  const px = service.price_max as number | null | undefined;
  const unit = (service.price_unit as string) ?? "per session";
  const servicePriceRange =
    pm != null && px != null && pm === px
      ? `$${pm}`
      : pm != null && px != null
        ? `$${pm}-$${px} ${unit}`
        : "";

  return {
    ok: true,
    service: {
      name: serviceNameStr,
      duration: serviceDuration,
      price_range: servicePriceRange,
      prep_instructions: (service.prep_instructions as string | null) ?? null,
    },
    slots: limitedSlots,
    total_available: slots.length,
    summary,
  };
}

/** Booking / scheduling intent or known service keywords (case-insensitive). */
const BOOKING_INTENT_RE =
  /\b(booking|book|appointments?|available|availability|schedule|scheduling|openings?|opening)\b/i;

/** Order: more specific patterns first. */
const SERVICE_PATTERNS: { pattern: RegExp; searchTerm: string }[] = [
  { pattern: /\b(hydrafacial)\b/i, searchTerm: "hydrafacial" },
  { pattern: /\b(botox)\b/i, searchTerm: "botox" },
  { pattern: /\b(chemical\s+peel)\b/i, searchTerm: "peel" },
  { pattern: /\b(lip\s+filler|dermal\s+fillers?)\b/i, searchTerm: "filler" },
  { pattern: /\b(filler)\b/i, searchTerm: "filler" },
  { pattern: /\b(laser)\b/i, searchTerm: "laser" },
  { pattern: /\b(consultation)\b/i, searchTerm: "consultation" },
  { pattern: /\b(peel)\b/i, searchTerm: "peel" },
];

export function messageSuggestsAvailabilityLookup(message: string): boolean {
  const t = message.trim();
  if (!t) return false;
  if (BOOKING_INTENT_RE.test(t)) return true;
  return SERVICE_PATTERNS.some((s) => s.pattern.test(t));
}

/** Returns an ilike-friendly search term for services.name, or null if none matched. */
export function extractServiceSearchTermFromMessage(message: string): string | null {
  const t = message.trim();
  if (!t) return null;
  for (const { pattern, searchTerm } of SERVICE_PATTERNS) {
    if (pattern.test(t)) return searchTerm;
  }
  return null;
}
