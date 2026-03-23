"use client";

import { useState } from "react";
import { normalizeToE164 } from "@/lib/phone";

export default function RecoveryMessageButton({
  clientName,
  clientPhone,
  service,
  appointmentTime,
  reason,
}: {
  clientName: string;
  clientPhone?: string | null;
  service: string;
  appointmentTime: string;
  reason?: string | null;
}) {
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [sendError, setSendError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sent, setSent] = useState(false);

  async function generateMessage() {
    setLoading(true);
    setError("");
    setSendError("");
    setSent(false);

    try {
      const response = await fetch("/api/ai/recovery-message", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ clientName, service, appointmentTime, reason }),
      });

      if (!response.ok) throw new Error("Generation failed");
      const data = (await response.json()) as { message: string };
      setMessage(data.message);
      setIsModalOpen(true);
    } catch (err) {
      console.error(err);
      setError("Could not generate a recovery message right now.");
    } finally {
      setLoading(false);
    }
  }

  async function confirmSend() {
    setSendError("");
    const to = normalizeToE164(clientPhone ?? "");
    if (!to) {
      setSendError("Add a valid phone on the appointment (E.164, e.g. +13105550100) to send via Twilio.");
      return;
    }

    setSending(true);
    try {
      const response = await fetch("/api/twilio/send", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ to, body: message }),
      });

      if (!response.ok) {
        const errJson = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(errJson.error ?? "Send failed");
      }

      setSent(true);
    } catch (err) {
      console.error(err);
      setSendError(err instanceof Error ? err.message : "Could not send SMS.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={generateMessage}
        disabled={loading}
        className="rounded-xl bg-[#D4A853] px-3 py-2 text-xs font-semibold text-[#0A0A0F] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Generating..." : "Send Recovery Message"}
      </button>

      {error ? <p className="text-xs text-rose-300">{error}</p> : null}

      {isModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-[#1E1E2A] bg-[#111118] p-5 shadow-2xl">
            <div className="mb-4">
              <p className="text-xs uppercase tracking-[0.14em] text-[#D4A853]">SMS Preview</p>
              <h3 className="font-premium-serif text-2xl text-[#F5F2E8]">Recovery Message</h3>
              {clientPhone ? (
                <p className="mt-1 text-xs text-zinc-500">To: {normalizeToE164(clientPhone) ?? clientPhone}</p>
              ) : (
                <p className="mt-1 text-xs text-amber-200/80">No phone on file — Confirm Send needs E.164 on the appointment.</p>
              )}
            </div>
            <p className="rounded-xl border border-[#D4A853]/30 bg-[#D4A853]/10 p-4 text-sm text-[#F5F2E8]">{message}</p>
            {sent ? <p className="mt-3 text-xs text-emerald-300">SMS sent via Twilio.</p> : null}
            {sendError ? <p className="mt-3 text-xs text-rose-300">{sendError}</p> : null}
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-xl border border-[#1E1E2A] bg-[#0E0E14] px-3 py-2 text-xs text-zinc-300"
              >
                Close
              </button>
              <button
                type="button"
                onClick={confirmSend}
                disabled={sending || sent || !message}
                className="rounded-xl bg-[#D4A853] px-3 py-2 text-xs font-semibold text-[#0A0A0F] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {sending ? "Sending..." : sent ? "Sent" : "Confirm Send"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
