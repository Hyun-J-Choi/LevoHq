/**
 * Single source of truth for every Claude prompt in the app.
 *
 * Before this file existed, prompts were scattered across ~10 route handlers
 * and evolving one (e.g. changing the Botox reminder tone) meant grepping
 * for string literals and hoping you found them all. Now each recipe has:
 *   - a typed, structured input
 *   - a single place to tune the prompt
 *   - an identity that eval suites can pin against
 *
 * These are USER-role prompts only. The system prompt is still built by
 * getBusinessSystemPrompt() so business identity/voice/services can flow
 * in. Long, specialized prompts that encode branching logic (like the
 * full inbound-SMS reply pipeline and the demo system prompt) intentionally
 * stay in their own modules; those aren't one-line templates.
 */

function formatDateUS(input: string | Date): string {
  const d = typeof input === "string" ? new Date(input) : input;
  if (Number.isNaN(d.getTime())) return String(input);
  return d.toLocaleDateString("en-US");
}

function formatDateTimeUS(input: string | Date): string {
  const d = typeof input === "string" ? new Date(input) : input;
  if (Number.isNaN(d.getTime())) return String(input);
  return d.toLocaleString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

// ── Reactivation (90-day inactive win-back) ───────────────────────────────
export function reactivationPrompt(p: {
  clientName: string;
  lastVisit: string | Date;
}): string {
  return `Write a win-back SMS for an inactive client.
Client: ${p.clientName}
Last visit: ${formatDateUS(p.lastVisit)}

Keep under 250 characters. Warm, exclusive, non-pushy. Include a rebooking incentive and CTA.`;
}

// ── Post-visit check-in (24-48h after completed appt) ─────────────────────
export function followupCheckInPrompt(p: {
  clientName: string | null | undefined;
  service: string;
}): string {
  return `Write a post-visit check-in SMS.
Client: ${p.clientName ?? "there"}
Service: ${p.service}

Ask how they're feeling. Keep under 200 characters. Warm and personal.`;
}

// ── 24-hour appointment reminder ──────────────────────────────────────────
export function appointmentReminderPrompt(p: {
  clientName: string | null | undefined;
  service: string;
  scheduledAt: string | Date;
}): string {
  return `Write a friendly appointment reminder SMS.
Client: ${p.clientName ?? "there"}
Service: ${p.service}
Time: ${formatDateTimeUS(p.scheduledAt)}

Keep under 250 characters. Include CTA to reply if they need to reschedule.`;
}

// ── Birthday SMS ──────────────────────────────────────────────────────────
export function birthdayPrompt(p: { clientName: string }): string {
  return `Write a birthday SMS for a valued client.
Client: ${p.clientName}

Keep under 200 characters. Include a birthday treat or discount offer. Make it feel special and personal.`;
}

// ── Lead nurture sequence (3 steps) ───────────────────────────────────────
export function nurturePrompt(p: {
  leadName: string | null | undefined;
  source: string | null | undefined;
  step: number;
}): string {
  return `Write a lead nurture SMS (step ${p.step} of 3).
Lead name: ${p.leadName ?? "there"}
Source: ${p.source ?? "website"}

Step 1: Welcome + value prop. Step 2: Social proof + urgency. Step 3: Direct offer + CTA.
Keep under 250 characters. SMS-friendly.`;
}

// ── Treatment-cycle overdue reminder ──────────────────────────────────────
export function treatmentOverduePrompt(p: {
  clientName: string | null | undefined;
  service: string;
  intervalDays: number;
  templateHint?: string | null;
}): string {
  return `Write a treatment follow-up reminder SMS.
Client: ${p.clientName ?? "there"}
Service: ${p.service}
Days since last treatment: ${p.intervalDays}
${p.templateHint ? `Template hint: ${p.templateHint}` : ""}

Keep under 250 characters. Suggest rebooking for their next session.`;
}

// ── Missed-call auto-reply (Twilio voice-status webhook) ──────────────────
export function missedCallAutoReplyPrompt(p: { callerNumber: string }): string {
  return `Write a short SMS auto-reply for a missed call at a clinic.
Caller number: ${p.callerNumber}

Requirements:
- Under 55 words, SMS tone, warm and professional.
- Apologize for missing them, invite them to text back or book.
- Single message only, no quotes or markdown.`;
}

// ── Cancellation recovery (send after a client cancels) ───────────────────
export function cancellationRecoveryPrompt(p: {
  clientName: string;
  service: string;
  appointmentTime: string;
  reason?: string | null;
}): string {
  return `Write a concise personalized SMS to recover a cancelled appointment.
Client: ${p.clientName}
Service: ${p.service}
Original appointment: ${p.appointmentTime}
Cancellation reason: ${p.reason ?? "Not specified"}

Requirements:
- Use first name if possible from the client name.
- Mention the missed service naturally.
- Caring, non-pushy tone matching the brand voice.
- Include one concrete rebooking incentive.
- Keep it under 70 words and SMS-friendly.
- End with a direct rebooking CTA.`;
}

// ── Booking request acknowledgment (short form) ───────────────────────────
export function bookingRequestAckPrompt(p: {
  clientName: string;
  service: string;
  preferredDate: string;
  preferredTime: string;
}): string {
  return `Write a confirmation message for a client booking request.
Client name: ${p.clientName}
Service: ${p.service}
Preferred date: ${p.preferredDate}
Preferred time: ${p.preferredTime}

Keep it to 3-4 sentences, personal, concise, and warm. Include next steps and appreciation. Stay under 280 characters for SMS.`;
}

// ── Premium booking confirmation (after booking is actually saved) ────────
export function premiumBookingConfirmationPrompt(p: {
  clientName: string;
  service: string;
  time: string;
}): string {
  return `Write a personalized premium appointment confirmation SMS.
Client: ${p.clientName}
Service: ${p.service}
Time: ${p.time}

Requirements:
- Keep it under 60 words.
- Warm, luxe, and concise.
- Confirm the exact service/time and include one preparation tip.
- End with a clear way to reschedule if needed.`;
}
