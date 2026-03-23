"use client";

import { useState } from "react";
import { normalizeToE164 } from "@/lib/phone";

export default function SmsSendButton({ phone, body }: { phone: string | null | undefined; body: string }) {
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");

  async function send() {
    setErr("");
    const to = normalizeToE164(phone ?? "");
    if (!to) {
      setErr("Need E.164 phone on the appointment.");
      return;
    }
    setSending(true);
    try {
      const res = await fetch("/api/twilio/send", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ to, body }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(j.error ?? "Failed");
      }
      setDone(true);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Send failed");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={send}
        disabled={sending || done || !body}
        className="rounded-lg border border-[#D4A853]/50 bg-[#D4A853]/15 px-3 py-1.5 text-xs font-semibold text-[#D4A853] hover:bg-[#D4A853]/25 disabled:opacity-50"
      >
        {sending ? "Sending…" : done ? "Sent" : "Send via Twilio"}
      </button>
      {err ? <p className="mt-1 text-[11px] text-rose-300">{err}</p> : null}
    </div>
  );
}
