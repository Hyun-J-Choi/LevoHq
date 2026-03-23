/**
 * Best-effort US-centric E.164 for Twilio (10 digits -> +1...).
 */
export function normalizeToE164(input: string | null | undefined): string | null {
  if (!input || !input.trim()) return null;
  const digits = input.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  if (input.trim().startsWith("+") && digits.length >= 10) return `+${digits}`;
  return null;
}
