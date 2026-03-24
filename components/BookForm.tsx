"use client";

import { FormEvent, useState } from "react";
import { normalizeToE164 } from "@/lib/phone";

const services = ["Botox", "Filler", "Microneedling", "Facial", "Consultation"] as const;

function getNextDays(count: number): { value: string; label: string }[] {
  const days = [];
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  for (let i = 1; i <= count; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const label = `${dayNames[d.getDay()]}, ${monthNames[d.getMonth()]} ${d.getDate()}`;
    days.push({ value: `${y}-${m}-${day}`, label });
  }
  return days;
}

function getTimeSlots(): { value: string; label: string }[] {
  const slots = [];
  for (let h = 9; h <= 19; h++) {
    for (const min of [0, 30]) {
      if (h === 19 && min === 30) continue;
      const hh = String(h).padStart(2, "0");
      const mm = String(min).padStart(2, "0");
      const period = h < 12 ? "AM" : "PM";
      const displayH = h > 12 ? h - 12 : h === 0 ? 12 : h;
      slots.push({ value: `${hh}:${mm}`, label: `${displayH}:${mm} ${period}` });
    }
  }
  return slots;
}

const DATE_OPTIONS = getNextDays(14);
const TIME_OPTIONS = getTimeSlots();

export default function BookForm() {
  const [form, setForm] = useState({
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
      if (!form.preferredDate || !form.preferredTime) {
        throw new Error("Please select a date and time.");
      }
      const localPreferred = new Date(`${form.preferredDate}T${form.preferredTime}:00`);
      if (Number.isNaN(localPreferred.getTime())) {
        throw new Error("Invalid date or time.");
      }
      const clientTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          phone: form.phone,
          service: form.service,
          preferredDateTime: localPreferred.toISOString(),
          clientTimeZone,
        }),
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
        <label className="space-y-1">
          <span className="text-xs uppercase tracking-[0.14em] text-zinc-400">Preferred Date</span>
          <select
            value={form.preferredDate}
            onChange={(e) => setForm({ ...form, preferredDate: e.target.value })}
            className="w-full rounded-xl border border-[#1E1E2A] bg-[#0E0E14] px-3 py-2 text-sm text-[#F5F2E8] outline-none focus:border-[#D4A853]/70"
          >
            <option value="">Select a date</option>
            {DATE_OPTIONS.map((d) => (
              <option key={d.value} value={d.value}>{d.label}</option>
            ))}
          </select>
        </label>
        <label className="space-y-1">
          <span className="text-xs uppercase tracking-[0.14em] text-zinc-400">Preferred Time</span>
          <select
            value={form.preferredTime}
            onChange={(e) => setForm({ ...form, preferredTime: e.target.value })}
            className="w-full rounded-xl border border-[#1E1E2A] bg-[#0E0E14] px-3 py-2 text-sm text-[#F5F2E8] outline-none focus:border-[#D4A853]/70"
          >
            <option value="">Select a time</option>
            {TIME_OPTIONS.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </label>
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
  required = true,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
  required?: boolean;
}) {
  return (
    <label className="space-y-1">
      <span className="text-xs uppercase tracking-[0.14em] text-zinc-400">{label}</span>
      <input
        required={required}
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
