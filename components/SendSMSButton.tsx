"use client";

import { useState } from "react";

export default function SendSMSButton({
  phone,
  message,
  label = "Send SMS",
}: {
  phone: string;
  message: string;
  label?: string;
}) {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSend() {
    setStatus("sending");
    setErrorMsg("");

    try {
      const res = await fetch("/api/conversations/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: phone, body: message }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to send");
      }

      setStatus("sent");
      setTimeout(() => setStatus("idle"), 3000);
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Send failed");
      setTimeout(() => setStatus("idle"), 4000);
    }
  }

  return (
    <div className="mt-3 flex items-center gap-3">
      <button
        onClick={handleSend}
        disabled={status === "sending" || status === "sent"}
        className="rounded-lg border border-[#D4A853]/40 px-4 py-2 text-xs font-medium text-[#D4A853] hover:bg-[#D4A853]/10 transition disabled:opacity-50"
      >
        {status === "sending" && "Sending..."}
        {status === "sent" && "Sent!"}
        {status === "idle" && label}
        {status === "error" && "Retry"}
      </button>
      {status === "sent" && (
        <span className="text-xs text-emerald-400">Message delivered</span>
      )}
      {status === "error" && (
        <span className="text-xs text-red-400">{errorMsg}</span>
      )}
    </div>
  );
}
