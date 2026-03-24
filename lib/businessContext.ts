import { createSupabaseAdmin } from "@/lib/supabase/admin";

interface BusinessProfile {
  id: string;
  name: string;
  phone: string | null;
  twilio_number: string | null;
  industry: string | null;
  services: { name: string; price?: number }[];
  hours: Record<string, { open: string; close: string }>;
  brand_voice: string;
  timezone: string;
  google_review_url: string | null;
}

/**
 * Fetches the full business profile for AI context injection.
 */
export async function getBusinessProfile(
  businessId: string
): Promise<BusinessProfile | null> {
  const admin = createSupabaseAdmin();
  const { data } = await admin
    .from("businesses")
    .select("*")
    .eq("id", businessId)
    .single();

  if (!data) return null;

  return {
    id: data.id,
    name: data.name ?? "Studio",
    phone: data.phone ?? null,
    twilio_number: data.twilio_number ?? null,
    industry: data.industry ?? "med_spa",
    services: Array.isArray(data.services) ? data.services : [],
    hours:
      typeof data.hours === "object" && data.hours !== null ? data.hours : {},
    brand_voice: data.brand_voice ?? "professional and warm",
    timezone: data.timezone ?? "America/Los_Angeles",
    google_review_url: data.google_review_url ?? null,
  };
}

/**
 * Generates a Claude system prompt prefix with full business context.
 * Use this before every AI call so Claude knows the business identity.
 */
export async function getBusinessSystemPrompt(
  businessId: string
): Promise<string> {
  const profile = await getBusinessProfile(businessId);
  if (!profile) {
    return "You are an SMS assistant for a premium beauty and wellness studio.";
  }

  const serviceList =
    profile.services.length > 0
      ? profile.services
          .map(
            (s) => `- ${s.name}${s.price ? ` ($${s.price})` : ""}`
          )
          .join("\n")
      : "Various beauty and wellness services";

  const hoursList =
    Object.keys(profile.hours).length > 0
      ? Object.entries(profile.hours)
          .map(([day, h]) => `${day}: ${h.open} - ${h.close}`)
          .join(", ")
      : "Standard business hours";

  return `You are the SMS assistant for ${profile.name}, a ${profile.industry === "med_spa" ? "medical spa" : profile.industry ?? "beauty clinic"}.

Business details:
- Name: ${profile.name}
- Services offered:
${serviceList}
- Hours: ${hoursList}
- Timezone: ${profile.timezone}

Brand voice: ${profile.brand_voice}

Guidelines:
- Keep SMS replies concise: aim under 280 characters, never over 500.
- Sound like a real person from ${profile.name}, not a bot.
- Be warm, professional, and helpful.
- When clients ask about services or pricing, reference the actual services listed above.
- Never make up services or prices that aren't listed.
- For booking requests, confirm the service and suggest available times.`;
}
