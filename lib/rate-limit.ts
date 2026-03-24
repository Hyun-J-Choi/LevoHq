/**
 * Simple in-memory sliding window rate limiter.
 * For production, replace with Redis or a distributed store.
 */

const windows = new Map<string, number[]>();

const CLEANUP_INTERVAL = 60_000; // 1 minute
let lastCleanup = Date.now();

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;

  for (const [key, timestamps] of Array.from(windows.entries())) {
    const cutoff = now - 60_000;
    const filtered = timestamps.filter((t) => t > cutoff);
    if (filtered.length === 0) {
      windows.delete(key);
    } else {
      windows.set(key, filtered);
    }
  }
}

/**
 * Check if a request is within rate limits.
 * @param key - Unique identifier (e.g., phone number or business ID)
 * @param maxPerMinute - Maximum requests allowed per 60-second window
 * @returns true if allowed, false if rate limited
 */
export function checkRateLimit(key: string, maxPerMinute: number): boolean {
  cleanup();

  const now = Date.now();
  const cutoff = now - 60_000;
  const existing = windows.get(key) ?? [];
  const recent = existing.filter((t) => t > cutoff);

  if (recent.length >= maxPerMinute) {
    return false;
  }

  recent.push(now);
  windows.set(key, recent);
  return true;
}
