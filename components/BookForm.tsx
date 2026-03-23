"use client";

import { FormEvent, useState } from "react";

const services = ["Signature Facial", "Microneedling", "HydraFacial", "LED Therapy", "Consultation"];

interface BookingPayload {
  name: string;
  phone: string;
  email: string;
  service: string;
  preferredDate: string;
  preferredTime: string;
}

export default function BookForm() {
  const [form, setForm] = useState<BookingPayload>({
    name: "",
    phone: "",
    email: "",
    service: services[0],
    preferredDate: "",
    preferredTime: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        throw new Error("Could not complete booking");
      }

      const data = (await response.json()) as { message: string };
      setMessage(data.message);
      setForm({
        name: "",
        phone: "",
        email: "",
        service: services[0],
        preferredDate: "",
        preferredTime: "",
      });
    } catch (err) {
      console.error(err);
      setError("Unable to submit booking right now. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-[#1E1E2A] bg-[#111118] p-6">
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Name" value={form.name} onChange={(value) => setForm({ ...form, name: value })} />
        <Field label="Phone" value={form.phone} onChange={(value) => setForm({ ...form, phone: value })} />
        <Field label="Email" type="email" value={form.email} onChange={(value) => setForm({ ...form, email: value })} />
        <label className="space-y-1">
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
        <Field label="Preferred Date" type="date" value={form.preferredDate} onChange={(value) => setForm({ ...form, preferredDate: value })} />
        <Field label="Preferred Time" type="time" value={form.preferredTime} onChange={(value) => setForm({ ...form, preferredTime: value })} />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-[#D4A853] px-4 py-2 text-sm font-semibold text-[#0A0A0F] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Generating Confirmation..." : "Book Appointment"}
      </button>

      {error ? <p className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">{error}</p> : null}
      {message ? (
        <div className="rounded-xl border border-[#D4A853]/35 bg-[#D4A853]/10 p-4">
          <p className="text-xs uppercase tracking-[0.14em] text-[#D4A853]">Personalized Confirmation</p>
          <p className="mt-2 text-sm text-[#F5F2E8]">{message}</p>
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
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <label className="space-y-1">
      <span className="text-xs uppercase tracking-[0.14em] text-zinc-400">{label}</span>
      <input
        required
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-[#1E1E2A] bg-[#0E0E14] px-3 py-2 text-sm text-[#F5F2E8] outline-none focus:border-[#D4A853]/70"
      />
    </label>
  );
}
