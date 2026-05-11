import { createLogger } from "@/lib/logger";

/**
 * Thin wrapper around Anthropic's /v1/messages for SMS copywriting.
 *
 * Why this file is not just `fetch(...)` inline everywhere:
 *   - Timeouts: the API occasionally stalls. Without an AbortController,
 *     a dead fetch holds a Vercel cron's 60s budget open and starves the
 *     rest of the run.
 *   - Retries: 429s and transient 5xx recover after a short backoff.
 *     4xx (bad model, auth, payload too large) is deterministic and MUST
 *     NOT retry or we waste quota on a guaranteed failure.
 *   - Observability: we emit one structured log line per call with
 *     duration, token counts, and an estimated cost in cents so the
 *     operator can spot runaway prompts without scraping invoices.
 */
const DEFAULT_MODEL = "claude-sonnet-4-20250514";
const DEFAULT_MAX_TOKENS = 200;
const DEFAULT_TEMPERATURE = 0.3;
const DEFAULT_TIMEOUT_MS = 20_000;
const DEFAULT_MAX_ATTEMPTS = 3;

// Sonnet 4 public pricing as of May 2025. Drift-prone: this is for
// relative/p95 dashboards, not billing. Real cost lives in the Anthropic
// invoice. If a future model is used, revisit these rates.
const SONNET_4_INPUT_USD_PER_MTOK = 3;
const SONNET_4_OUTPUT_USD_PER_MTOK = 15;

interface AnthropicResponse {
  content?: Array<{ type: string; text?: string }>;
  usage?: { input_tokens?: number; output_tokens?: number };
  error?: { message?: string; type?: string };
}

export interface GenerateClaudeMessageOptions {
  /** Short string shown in logs so you can attribute cost to a recipe. */
  label?: string;
  /** Correlate this Claude call with a parent request log line. */
  requestId?: string;
  maxTokens?: number;
  temperature?: number;
  /** Per-attempt fetch timeout. Total wall time can reach ~3x this with retries. */
  timeoutMs?: number;
}

function estimateCents(
  model: string,
  inputTokens: number,
  outputTokens: number
): number | null {
  // Only Sonnet 4 is priced in this table. For other models, return null
  // rather than lie — the log line will still show token counts.
  if (!model.startsWith("claude-sonnet-4")) return null;
  const usd =
    (inputTokens * SONNET_4_INPUT_USD_PER_MTOK +
      outputTokens * SONNET_4_OUTPUT_USD_PER_MTOK) /
    1_000_000;
  return Math.round(usd * 100 * 10_000) / 10_000; // 4 decimals of a cent
}

function isRetryable(status: number): boolean {
  // Retry 429 (rate limit) and any 5xx (transient server error). Do NOT
  // retry 4xx: bad model name, missing key, payload too large, etc. are
  // deterministic and retrying just wastes quota.
  return status === 429 || status >= 500;
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function callOnce(params: {
  apiKey: string;
  body: string;
  timeoutMs: number;
}): Promise<Response> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), params.timeoutMs);
  try {
    return await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": params.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: params.body,
      signal: ctrl.signal,
    });
  } finally {
    clearTimeout(t);
  }
}

export async function generateClaudeMessage(
  prompt: string,
  systemPrompt?: string,
  options: GenerateClaudeMessageOptions = {}
): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not configured");

  const log = createLogger({ requestId: options.requestId });
  const model = DEFAULT_MODEL;
  const maxTokens = options.maxTokens ?? DEFAULT_MAX_TOKENS;
  const temperature = options.temperature ?? DEFAULT_TEMPERATURE;
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const label = options.label ?? "unlabeled";

  const body = JSON.stringify({
    model,
    max_tokens: maxTokens,
    temperature,
    ...(systemPrompt ? { system: systemPrompt } : {}),
    messages: [{ role: "user", content: prompt }],
  });

  let lastError: unknown = null;
  const startedAt = Date.now();

  for (let attempt = 1; attempt <= DEFAULT_MAX_ATTEMPTS; attempt++) {
    const attemptStart = Date.now();
    try {
      const response = await callOnce({ apiKey, body, timeoutMs });

      if (!response.ok) {
        const errText = await response.text();
        const retry = isRetryable(response.status);
        log.warn("claude_http_error", {
          label,
          model,
          attempt,
          status: response.status,
          retry,
          durationMs: Date.now() - attemptStart,
          errorSnippet: errText.slice(0, 300),
        });
        if (!retry || attempt === DEFAULT_MAX_ATTEMPTS) {
          throw new Error(
            `Claude request failed: ${response.status} ${errText}`
          );
        }
        lastError = new Error(`HTTP ${response.status}`);
        // Exponential backoff with small jitter. Keeps retries from
        // hammering in lockstep when multiple crons retry together.
        const backoff = 500 * Math.pow(3, attempt - 1);
        const jitter = Math.floor(Math.random() * 200);
        await sleep(backoff + jitter);
        continue;
      }

      const payload = (await response.json()) as AnthropicResponse;
      const text = payload.content
        ?.find((b) => b.type === "text")
        ?.text?.trim();

      if (!text) {
        log.error("claude_empty_response", {
          label,
          model,
          attempt,
          durationMs: Date.now() - attemptStart,
        });
        throw new Error("Claude returned an empty message");
      }

      const inputTokens = payload.usage?.input_tokens ?? 0;
      const outputTokens = payload.usage?.output_tokens ?? 0;
      log.info("claude_call", {
        label,
        model,
        attempt,
        durationMs: Date.now() - startedAt,
        inputTokens,
        outputTokens,
        estCents: estimateCents(model, inputTokens, outputTokens),
        outputChars: text.length,
      });

      return text;
    } catch (err) {
      lastError = err;
      const aborted =
        err instanceof Error &&
        (err.name === "AbortError" || err.message.includes("aborted"));

      if (aborted) {
        log.warn("claude_timeout", {
          label,
          model,
          attempt,
          timeoutMs,
          durationMs: Date.now() - attemptStart,
        });
        if (attempt === DEFAULT_MAX_ATTEMPTS) {
          throw new Error(`Claude request timed out after ${timeoutMs}ms`);
        }
        const backoff = 500 * Math.pow(3, attempt - 1);
        const jitter = Math.floor(Math.random() * 200);
        await sleep(backoff + jitter);
        continue;
      }

      // If we already wrapped and threw an HTTP error above, don't wrap
      // again. We already logged it in the !response.ok branch.
      if (err instanceof Error && err.message.startsWith("Claude request failed:")) {
        throw err;
      }

      // Non-abort non-HTTP error (DNS failure, TLS, etc.). Treat as
      // transient and retry.
      log.warn("claude_fetch_error", {
        label,
        model,
        attempt,
        error: err instanceof Error ? err.message : String(err),
        durationMs: Date.now() - attemptStart,
      });
      if (attempt === DEFAULT_MAX_ATTEMPTS) throw err;
      const backoff = 500 * Math.pow(3, attempt - 1);
      const jitter = Math.floor(Math.random() * 200);
      await sleep(backoff + jitter);
    }
  }

  // Unreachable under normal flow — every path above either returns or
  // throws — but TypeScript's CFA wants a final throw.
  throw lastError ?? new Error("Claude request failed after retries");
}
