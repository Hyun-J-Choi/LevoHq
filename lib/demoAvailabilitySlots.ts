import type {
  ComputedAvailabilitySlot,
  ComputeAvailabilityResult,
} from "./availabilitySlots";

/**
 * Self-contained, in-memory availability generator for the Glow Med Spa
 * demo. Emits slots shaped identically to computeAvailabilitySlots() so the
 * same downstream code (prompt injection, slot listing) works unchanged.
 *
 * Why not use the real DB-backed function?
 *   - The demo clinic isn't a real row in the customers table and shouldn't
 *     be — it would pollute dashboards, metrics, and RLS reasoning.
 *   - Hardcoding specific dates (the old "Wednesday 1:30 PM" block) means the
 *     demo feels identical 3 weeks after launch, which is clearly fake. This
 *     rolls the window forward automatically every day.
 *
 * Everything here is deterministic: the same {date, provider, time} triple
 * always produces the same booked/free state, so if a prospect asks the
 * same question twice they get the same answer.
 */

type DemoService = {
  name: string;
  durationMin: number;
  priceMin: number | null;
  priceMax: number | null;
  priceUnit: string;
  prep: string | null;
  /** ilike-style search terms a user might type (lowercase). */
  aliases: string[];
};

type DemoProvider = {
  name: string;
  title: string | null;
  /** 0=Sunday … 6=Saturday. Glow is closed Sundays; Sarah off Sat; Jess off Mon. */
  daysOfWeek: number[];
  /** Minutes-since-midnight, local time. */
  startMin: number;
  endMin: number;
  /** Services this provider offers (by demo service name). */
  services: string[];
};

const DEMO_SERVICES: DemoService[] = [
  {
    name: "Botox",
    durationMin: 30,
    priceMin: 260,
    priceMax: 520,
    priceUnit: "per session",
    prep: "no blood thinners, aspirin, or alcohol 24hrs before",
    aliases: ["botox"],
  },
  {
    name: "Lip Filler",
    durationMin: 45,
    priceMin: 650,
    priceMax: 850,
    priceUnit: "per syringe",
    prep: "no blood thinners 24hrs; bruising possible",
    aliases: ["lip filler", "filler"],
  },
  {
    name: "Dermal Fillers",
    durationMin: 60,
    priceMin: 650,
    priceMax: 1200,
    priceUnit: "per syringe",
    prep: "no blood thinners 24hrs; bruising possible",
    aliases: ["dermal filler", "dermal fillers", "filler"],
  },
  {
    name: "HydraFacial",
    durationMin: 45,
    priceMin: 189,
    priceMax: 189,
    priceUnit: "per session",
    prep: null,
    aliases: ["hydrafacial", "facial"],
  },
  {
    name: "Chemical Peel",
    durationMin: 30,
    priceMin: 150,
    priceMax: 250,
    priceUnit: "per session",
    prep: "no retinol or exfoliants 5-7 days before",
    aliases: ["chemical peel", "peel"],
  },
  {
    name: "Laser Hair Removal",
    durationMin: 30,
    priceMin: 150,
    priceMax: 500,
    priceUnit: "per session",
    prep: "no sun 2 weeks before; shave treatment area day before",
    aliases: ["laser hair removal", "laser"],
  },
  {
    name: "Consultation",
    durationMin: 30,
    priceMin: 0,
    priceMax: 0,
    priceUnit: "Free",
    prep: null,
    aliases: ["consultation", "consult"],
  },
];

const DEMO_PROVIDERS: DemoProvider[] = [
  {
    name: "Dr. Sarah Kim",
    title: "MD",
    daysOfWeek: [1, 2, 3, 4, 5], // Mon-Fri
    startMin: 9 * 60,
    endMin: 18 * 60,
    services: [
      "Botox",
      "Lip Filler",
      "Dermal Fillers",
      "HydraFacial",
      "Chemical Peel",
      "Laser Hair Removal",
      "Consultation",
    ],
  },
  {
    name: "Jessica Chen",
    title: "NP",
    daysOfWeek: [2, 3, 4, 5, 6], // Tue-Sat
    startMin: 10 * 60,
    endMin: 16 * 60,
    services: [
      "Botox",
      "HydraFacial",
      "Chemical Peel",
      "Laser Hair Removal",
      "Consultation",
    ],
  },
];

const SLOT_INTERVAL_MIN = 30;

function formatLocalDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function dayName(dayOfWeek: number): string {
  return [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ][dayOfWeek];
}

function formatDisplayTime(hour: number, min: number): string {
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  const ampm = hour >= 12 ? "PM" : "AM";
  return `${displayHour}:${min.toString().padStart(2, "0")} ${ampm}`;
}

function priceRangeFor(svc: DemoService): string {
  if (svc.priceMin === 0 && svc.priceMax === 0) return "Free";
  if (svc.priceMin == null || svc.priceMax == null) return "";
  if (svc.priceMin === svc.priceMax) return `$${svc.priceMin}`;
  return `$${svc.priceMin}-$${svc.priceMax} ${svc.priceUnit}`;
}

/**
 * Tiny deterministic 32-bit hash. Used to pseudo-book slots so the demo
 * calendar feels lived-in (some slots taken) but the same question always
 * returns the same answer within the same day.
 */
function hash32(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function isPseudoBooked(
  dateStr: string,
  timeStr: string,
  providerName: string,
  serviceName: string
): boolean {
  // ~35% of valid slots are "booked" to make the demo feel real. Stable
  // across requests within the same day (dateStr is part of the seed).
  const seed = `${dateStr}|${timeStr}|${providerName}|${serviceName}`;
  return hash32(seed) % 100 < 35;
}

function resolveService(serviceNameInput: string | null): DemoService | null {
  if (!serviceNameInput) return null;
  const q = serviceNameInput.trim().toLowerCase();
  if (!q) return null;
  // Exact alias match first, then substring fallback.
  for (const svc of DEMO_SERVICES) {
    if (svc.aliases.includes(q)) return svc;
  }
  for (const svc of DEMO_SERVICES) {
    if (svc.aliases.some((a) => a.includes(q) || q.includes(a))) return svc;
  }
  for (const svc of DEMO_SERVICES) {
    if (svc.name.toLowerCase().includes(q)) return svc;
  }
  return null;
}

export type ComputeDemoAvailabilityOptions = {
  serviceName: string | null;
  /** How many days forward to consider (default 7). */
  daysAhead?: number;
  /** Max slots returned (default 5). */
  slotLimit?: number;
};

/**
 * Emits a ComputeAvailabilityResult-shaped response for Glow Med Spa.
 * Rolling window from today forward so the demo never goes stale.
 */
export function computeDemoAvailabilitySlots(
  options: ComputeDemoAvailabilityOptions
): ComputeAvailabilityResult {
  const svc = resolveService(options.serviceName);
  if (!svc) {
    return {
      ok: false,
      code: "no_service",
      message: options.serviceName
        ? `Service "${options.serviceName}" not found in demo catalog.`
        : "No matching service.",
    };
  }

  const daysAhead = options.daysAhead ?? 7;
  const slotLimit = options.slotLimit ?? 5;

  const eligibleProviders = DEMO_PROVIDERS.filter((p) =>
    p.services.includes(svc.name)
  );

  if (eligibleProviders.length === 0) {
    return {
      ok: false,
      code: "no_providers",
      message: `No providers currently offer ${svc.name}.`,
    };
  }

  const now = new Date();
  const todayLocal = formatLocalDate(now);

  const slots: ComputedAvailabilitySlot[] = [];
  const priceRange = priceRangeFor(svc);

  for (let offset = 0; offset < daysAhead; offset++) {
    const day = new Date(now);
    day.setDate(day.getDate() + offset);
    day.setHours(0, 0, 0, 0);
    const dow = day.getDay();
    const dateStr = formatLocalDate(day);
    const isToday = dateStr === todayLocal;

    for (const provider of eligibleProviders) {
      if (!provider.daysOfWeek.includes(dow)) continue;

      for (
        let minutes = provider.startMin;
        minutes + svc.durationMin <= provider.endMin;
        minutes += SLOT_INTERVAL_MIN
      ) {
        const hour = Math.floor(minutes / 60);
        const min = minutes % 60;
        const timeStr = `${hour.toString().padStart(2, "0")}:${min
          .toString()
          .padStart(2, "0")}`;

        if (isToday) {
          const slotAt = new Date(day);
          slotAt.setHours(hour, min, 0, 0);
          if (slotAt <= now) continue;
        }

        if (isPseudoBooked(dateStr, timeStr, provider.name, svc.name)) continue;

        slots.push({
          date: dateStr,
          day: dayName(dow),
          time: timeStr,
          display_time: formatDisplayTime(hour, min),
          provider_name: provider.name,
          provider_title: provider.title,
          service: svc.name,
          duration: svc.durationMin,
          price_range: priceRange,
        });
      }
    }
  }

  // Interleave providers so the first 3 slots don't all come from the same
  // person on the same morning — looks unrealistic otherwise.
  slots.sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    if (a.time !== b.time) return a.time.localeCompare(b.time);
    return a.provider_name.localeCompare(b.provider_name);
  });

  const limitedSlots = slots.slice(0, slotLimit);

  const summary =
    limitedSlots.length > 0
      ? `Found ${slots.length} available slots for ${svc.name}. Next available: ` +
        limitedSlots
          .slice(0, 3)
          .map(
            (s) =>
              `${s.day} ${s.display_time} with ${s.provider_name}`
          )
          .join(", ") +
        (slots.length > 3 ? `. Plus ${slots.length - 3} more options.` : ".")
      : `No availability found for ${svc.name} in the requested timeframe.`;

  return {
    ok: true,
    service: {
      name: svc.name,
      duration: svc.durationMin,
      price_range: priceRange,
      prep_instructions: svc.prep,
    },
    slots: limitedSlots,
    total_available: slots.length,
    summary,
  };
}
