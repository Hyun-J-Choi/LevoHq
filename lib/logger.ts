type LogLevel = "info" | "warn" | "error";

interface LogEntry {
  level: LogLevel;
  message: string;
  requestId?: string;
  businessId?: string;
  [key: string]: unknown;
}

function emit(entry: LogEntry) {
  const payload = {
    ts: new Date().toISOString(),
    ...entry,
  };

  switch (entry.level) {
    case "error":
      console.error(JSON.stringify(payload));
      break;
    case "warn":
      console.warn(JSON.stringify(payload));
      break;
    default:
      console.log(JSON.stringify(payload));
  }
}

/**
 * Create a request-scoped logger. Pass a requestId to correlate all
 * log lines within a single API call.
 */
export function createLogger(context?: { requestId?: string; businessId?: string }) {
  return {
    info(message: string, extra?: Record<string, unknown>) {
      emit({ level: "info", message, ...context, ...extra });
    },
    warn(message: string, extra?: Record<string, unknown>) {
      emit({ level: "warn", message, ...context, ...extra });
    },
    error(message: string, extra?: Record<string, unknown>) {
      emit({ level: "error", message, ...context, ...extra });
    },
  };
}

/** Generate a short request ID for log correlation. */
export function genRequestId(): string {
  return Math.random().toString(36).slice(2, 10);
}
