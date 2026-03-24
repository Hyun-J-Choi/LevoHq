"use client";

import { FormEvent, useState } from "react";
import { normalizeToE164 } from "@/lib/phone";

const services = ["Botox", "Filler", "Microneedling", "Facial", "Consultation"] as const;

interface BookingPayload {
  name: string;
  phone: string;
  service: string;
  preferredDate: string;
  preferredTime: string;
}

export default function BookForm() {
  const [form, setForm] = useState<BookingPayload>({
    name: "",
    phone: "",
    service: services[0],
    preferredDate: "",
    preferredTime: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [smsNote, setSmsNote] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    setSmsNote("");

    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(form),
      });

      const json = (await response.json()) as { ok?: boolean; message?: string; error?: string };

      if (!response.ok) {
        throw new Error(json.error ?? "Could not complete booking");
      }

      const confirmationText = json.message ?? "Your appointment request has been received.";
      setMessage(confirmationText);

      const to = normalizeToE164(form.phone);
      if (to) {
        const smsRes = await fetch("/api/twilio/send", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ to, body: confirmationText }),
        });
        if (!smsRes.ok) {
          const smsJson = (await smsRes.json().catch(() => ({}))) as { error?: string };
          setSmsNote(
            smsJson.error
              ? `Booking saved, but SMS failed: ${smsJson.error}`
              : "Booking saved, but we couldn't send the confirmation text. We'll follow up shortly."
          );
        } else {
          setSmsNote("Confirmation text sent.");
        }
      } else {
        setSmsNote("Add a valid US phone number (10 digits) to receive a confirmation text.");
      }

      setForm({
        name: "",
        phone: "",
        service: services[0],
        preferredDate: "",
        preferredTime: "",
      });
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Unable to submit booking right now. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-[#1E1E2A] bg-[#111118] p-6">
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Name" value={form.name} onChange={(value) => setForm({ ...form, name: value })} />
        <Field
          label="Phone number"
          value={form.phone}
          onChange={(value) => setForm({ ...form, phone: value })}
          type="tel"
          autoComplete="tel"
          placeholder="(555) 123-4567"
        />
        <label className="space-y-1 md:col-span-2">
          <span className="text-xs uppercase tracking-[0.14em] text-zinc-400">Service</span>
          <select
            value={form.service}
            onChange={(event) => setForm({ ...form, service: event.target.value })}
            className="w-full rounded-xl border border-[#1E1E2A] bg-[#0E0E14] px-3 py-2 text-sm text-[#F5F2E8] outline-none focus:border-[#D4A853]/70"
          >
            {services.map((service) => (
              <option key={service} value={service}>
                {service}
              </option>
            ))}
          </select>
        </label>
        <Field label="Preferred date" type="date" value={form.preferredDate} onChange={(value) => setForm({ ...form, preferredDate: value })} />
        <Field label="Preferred time" type="time" value={form.preferredTime} onChange={(value) => setForm({ ...form, preferredTime: value })} />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-[#D4A853] px-4 py-2 text-sm font-semibold text-[#0A0A0F] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Booking…" : "Book appointment"}
      </button>

      {error ? <p className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">{error}</p> : null}
      {message ? (
        <div className="rounded-xl border border-[#D4A853]/35 bg-[#D4A853]/10 p-4">
          <p className="text-xs uppercase tracking-[0.14em] text-[#D4A853]">Confirmation</p>
          <p className="mt-2 text-sm text-[#F5F2E8]">{message}</p>
          {smsNote ? (
            <p
              className={`mt-3 text-xs ${smsNote.includes("failed") || smsNote.includes("couldn't") ? "text-amber-200/90" : "text-emerald-300/90"}`}
            >
              {smsNote}
            </p>
          ) : null}
        </div>
      ) : null}
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
}) {
  return (
    <label className="space-y-1">
      <span className="text-xs uppercase tracking-[0.14em] text-zinc-400">{label}</span>
      <input
        required
        type={type}
        value={value}
        placeholder={placeholder}
        autoComplete={autoComplete}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-[#1E1E2A] bg-[#0E0E14] px-3 py-2 text-sm text-[#F5F2E8] outline-none placeholder:text-zinc-600 focus:border-[#D4A853]/70"
      />
    </label>
  );
}
