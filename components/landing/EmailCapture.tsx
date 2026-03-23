"use client";

import { FormEvent, useState } from "react";

export default function EmailCapture({
  source,
  placeholder = "Work email",
  buttonLabel = "Get early access",
  className = "",
}: {
  source: string;
  placeholder?: string;
  buttonLabel?: string;
  className?: string;
}) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setMessage("");
    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, source }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(j.error ?? "Something went wrong");
      }
      setStatus("done");
      setMessage("You're on the list. We'll reach out within one business day.");
      setEmail("");
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Try again in a moment.");
    }
  }

  return (
    <div className={className}>
      <form onSubmit={onSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
        <input
          type="email"
          required
          autoComplete="email"
          placeholder={placeholder}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={status === "loading" || status === "done"}
          className="min-h-[48px] flex-1 rounded-lg border border-white/[0.12] bg-white/[0.04] px-4 text-[15px] text-white placeholder:text-neutral-500 outline-none transition focus:border-[#D4A853]/50 focus:ring-1 focus:ring-[#D4A853]/30 disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={status === "loading" || status === "done"}
          className="min-h-[48px] shrink-0 rounded-lg bg-[#D4A853] px-6 text-[15px] font-semibold tracking-tight text-[#0A0A0A] transition hover:brightness-105 disabled:opacity-60"
        >
          {status === "loading" ? "Sending…" : status === "done" ? "Received" : buttonLabel}
        </button>
      </form>
      {message ? (
        <p
          className={`mt-3 text-sm ${status === "done" ? "text-[#D4A853]/90" : "text-red-400/90"}`}
        >
          {message}
        </p>
      ) : null}
    </div>
  );
}
