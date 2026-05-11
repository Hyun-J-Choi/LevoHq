/**
 * Fix #8A: Outbound SMS safety guard.
 *
 * Purpose: stop the AI (or a careless operator) from sending an SMS that
 * recommends a drug, prescribes a dose, or gives clinical advice. Runs on
 * every outbound message inside sendCompliantSMS. When a rule fires:
 *   1. original_message is logged to needs_human_review
 *   2. a safe canned replacement is sent to the client instead
 *
 * Design choices for Phase A (regex only, no Claude):
 *   - Cheap (< 1ms), deterministic, no external dependency.
 *   - Over-firing is acceptable; the escalation table captures the original
 *     so an operator can re-send verbatim if the flag was wrong.
 *   - Aesthetic-service drug names (Botox, Juvederm, etc.) are explicitly
 *     NOT in the drug list because they're normal product names in this
 *     vertical. Phase B (Claude classifier) is where subtler cases go.
 */

export interface MedicalGuardRule {
  /** Rule identifier (e.g. "dosage_pattern"). */
  type: string;
  /** Exact substrings from the original text that matched the rule. */
  matches: string[];
}

export interface MedicalGuardResult {
  ok: boolean;
  /** Populated only when ok === false. */
  rules: MedicalGuardRule[];
}

/**
 * Canned replacement sent to the client when the guard trips. Safe,
 * non-specific, and invites a human follow-up. Kept intentionally short
 * so it fits any carrier's 160-char SMS segment.
 */
export const SAFE_REPLACEMENT =
  "Thanks for your message — a team member will follow up with you shortly with the specifics.";

// Non-service drugs (OTC + common Rx). Deliberately excludes aesthetic
// medications (Botox, Juvederm, Dysport, Restylane, Radiesse, Sculptra,
// Kybella, Belotero, Versa, Voluma) because those are *service names*
// in a med-spa context. Matching is word-boundary, case-insensitive.
const DRUG_NAMES: readonly string[] = [
  // OTC pain/fever
  "ibuprofen",
  "advil",
  "motrin",
  "aleve",
  "naproxen",
  "tylenol",
  "acetaminophen",
  "paracetamol",
  "aspirin",
  // OTC allergy
  "benadryl",
  "diphenhydramine",
  "claritin",
  "zyrtec",
  // Rx steroids
  "prednisone",
  "prednisolone",
  "methylprednisolone",
  // Rx opioids + benzos (should never be in a med-spa SMS)
  "hydrocodone",
  "oxycodone",
  "vicodin",
  "percocet",
  "xanax",
  "alprazolam",
  "valium",
  "diazepam",
  // Rx antibiotics
  "amoxicillin",
  "azithromycin",
  "cephalexin",
  "doxycycline",
  "antibiotics",
  // Common topicals (legit in spa context but dose-sensitive)
  "tretinoin",
  "retin-a",
  "retinoid",
  "hydroquinone",
];

const DRUG_NAME_REGEX = new RegExp(
  `\\b(${DRUG_NAMES.map(escapeRegex).join("|")})\\b`,
  "gi"
);

// Any quantity-unit pairing, e.g. "20mg", "10 units", "2 tablets".
// Units we care about: mg, mcg, ml, iu, units, tablets, capsules, cc.
// Allows decimal dosages ("2.5 mg") and optional whitespace.
const DOSAGE_REGEX =
  /\b\d+(?:\.\d+)?\s?(?:mg|mcg|ug|ml|iu|units?|tablets?|capsules?|caps?|cc)\b/gi;

// Imperative dosing verbs + a number. Catches "take 2" even without a unit.
const DOSING_IMPERATIVE_REGEX = /\b(take|swallow|ingest|apply)\s+\d+/gi;

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function unique<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}

/**
 * Screen an outbound SMS body. Returns `{ ok: true, rules: [] }` for safe
 * messages, or `{ ok: false, rules: [...] }` with details when blocked.
 *
 * This is intentionally cheap and synchronous so it can sit on every
 * outbound path without measurable latency.
 */
export function screenOutboundMessage(text: string): MedicalGuardResult {
  if (!text || typeof text !== "string") return { ok: true, rules: [] };

  const rules: MedicalGuardRule[] = [];

  const drugMatches = text.match(DRUG_NAME_REGEX);
  if (drugMatches && drugMatches.length > 0) {
    rules.push({
      type: "drug_name",
      matches: unique(drugMatches.map((m) => m.toLowerCase())),
    });
  }

  const dosageMatches = text.match(DOSAGE_REGEX);
  if (dosageMatches && dosageMatches.length > 0) {
    rules.push({
      type: "dosage_pattern",
      matches: unique(dosageMatches.map((m) => m.toLowerCase())),
    });
  }

  const imperativeMatches = text.match(DOSING_IMPERATIVE_REGEX);
  if (imperativeMatches && imperativeMatches.length > 0) {
    rules.push({
      type: "dosing_imperative",
      matches: unique(imperativeMatches.map((m) => m.toLowerCase())),
    });
  }

  return rules.length === 0
    ? { ok: true, rules: [] }
    : { ok: false, rules };
}
