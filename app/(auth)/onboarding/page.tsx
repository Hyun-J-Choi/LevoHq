"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

type Step = "info" | "services" | "hours" | "voice";

interface ServiceItem {
  name: string;
  price: string;
}

const dayNames = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const defaultHours = { open: "09:00", close: "18:00" };

export default function OnboardingPage() {
  const [step, setStep] = useState<Step>("info");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  // Step 1: Info
  const [phone, setPhone] = useState("");
  const [timezone, setTimezone] = useState("America/Los_Angeles");

  // Step 2: Services
  const [services, setServices] = useState<ServiceItem[]>([
    { name: "Botox", price: "350" },
    { name: "Dermal Filler", price: "600" },
    { name: "Chemical Peel", price: "200" },
  ]);

  // Step 3: Hours
  const [hours, setHours] = useState<
    Record<string, { open: string; close: string; closed: boolean }>
  >(
    Object.fromEntries(
      dayNames.map((d) => [
        d,
        {
          open: d === "Sunday" ? "" : defaultHours.open,
          close: d === "Sunday" ? "" : defaultHours.close,
          closed: d === "Sunday",
        },
      ])
    )
  );

  // Step 4: Voice
  const [brandVoice, setBrandVoice] = useState("professional and warm");
  const [googleReviewUrl, setGoogleReviewUrl] = useState("");

  function addService() {
    setServices([...services, { name: "", price: "" }]);
  }

  function removeService(i: number) {
    setServices(services.filter((_, idx) => idx !== i));
  }

  function updateService(i: number, field: keyof ServiceItem, value: string) {
    const next = [...services];
    next[i] = { ...next[i], [field]: value };
    setServices(next);
  }

  async function handleFinish() {
    setError("");
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError("Not authenticated");
      setLoading(false);
      return;
    }

    // Get business ID from business_users
    const { data: membership } = await supabase
      .from("business_users")
      .select("business_id")
      .eq("user_id", user.id)
      .single();

    if (!membership) {
      setError("No business found");
      setLoading(false);
      return;
    }

    const validServices = services
      .filter((s) => s.name.trim())
      .map((s) => ({
        name: s.name.trim(),
        price: s.price ? Number(s.price) : undefined,
      }));

    const validHours: Record<string, { open: string; close: string }> = {};
    for (const [day, h] of Object.entries(hours)) {
      if (!h.closed && h.open && h.close) {
        validHours[day] = { open: h.open, close: h.close };
      }
    }

    const { error: updateError } = await supabase
      .from("businesses")
      .update({
        phone: phone.trim() || null,
        timezone,
        services: validServices,
        hours: validHours,
        brand_voice: brandVoice.trim() || "professional and warm",
        google_review_url: googleReviewUrl.trim() || null,
        onboarding_completed: true,
      })
      .eq("id", membership.business_id);

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  const steps: Step[] = ["info", "services", "hours", "voice"];
  const stepIndex = steps.indexOf(step);

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-white">
          Set up your clinic
        </h1>
        <p className="mt-2 text-sm text-neutral-400">
          Step {stepIndex + 1} of {steps.length}
        </p>
        <div className="mx-auto mt-4 flex max-w-xs gap-2">
          {steps.map((s, i) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full transition ${
                i <= stepIndex ? "bg-[#D4A853]" : "bg-white/[0.08]"
              }`}
            />
          ))}
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* Step 1: Business Info */}
      {step === "info" && (
        <div className="space-y-4">
          <h2 className="text-lg font-medium text-white">Business details</h2>
          <div>
            <label className="block text-xs font-medium uppercase tracking-wide text-neutral-400">
              Business phone
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="mt-1.5 block w-full rounded-lg border border-white/[0.1] bg-white/[0.03] px-4 py-3 text-sm text-white placeholder-neutral-500 outline-none focus:border-[#D4A853]/50"
              placeholder="(310) 555-0100"
            />
          </div>
          <div>
            <label className="block text-xs font-medium uppercase tracking-wide text-neutral-400">
              Timezone
            </label>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="mt-1.5 block w-full rounded-lg border border-white/[0.1] bg-white/[0.03] px-4 py-3 text-sm text-white outline-none focus:border-[#D4A853]/50"
            >
              <option value="America/Los_Angeles">Pacific Time</option>
              <option value="America/Denver">Mountain Time</option>
              <option value="America/Chicago">Central Time</option>
              <option value="America/New_York">Eastern Time</option>
            </select>
          </div>
          <button
            onClick={() => setStep("services")}
            className="w-full rounded-lg bg-[#D4A853] py-3 text-sm font-semibold text-[#0A0A0A] transition hover:brightness-110"
          >
            Next: Services
          </button>
        </div>
      )}

      {/* Step 2: Services */}
      {step === "services" && (
        <div className="space-y-4">
          <h2 className="text-lg font-medium text-white">
            What services do you offer?
          </h2>
          <div className="space-y-3">
            {services.map((s, i) => (
              <div key={i} className="flex gap-3">
                <input
                  type="text"
                  value={s.name}
                  onChange={(e) => updateService(i, "name", e.target.value)}
                  className="flex-1 rounded-lg border border-white/[0.1] bg-white/[0.03] px-4 py-2.5 text-sm text-white placeholder-neutral-500 outline-none focus:border-[#D4A853]/50"
                  placeholder="Service name"
                />
                <input
                  type="number"
                  value={s.price}
                  onChange={(e) => updateService(i, "price", e.target.value)}
                  className="w-28 rounded-lg border border-white/[0.1] bg-white/[0.03] px-4 py-2.5 text-sm text-white placeholder-neutral-500 outline-none focus:border-[#D4A853]/50"
                  placeholder="Price"
                />
                <button
                  onClick={() => removeService(i)}
                  className="shrink-0 rounded-lg border border-white/[0.1] px-3 py-2 text-xs text-neutral-400 transition hover:border-red-500/30 hover:text-red-400"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={addService}
            className="text-sm text-[#D4A853] transition hover:text-[#e0bc6a]"
          >
            + Add service
          </button>
          <div className="flex gap-3">
            <button
              onClick={() => setStep("info")}
              className="flex-1 rounded-lg border border-white/[0.15] py-3 text-sm font-medium text-white transition hover:border-[#D4A853]/40"
            >
              Back
            </button>
            <button
              onClick={() => setStep("hours")}
              className="flex-1 rounded-lg bg-[#D4A853] py-3 text-sm font-semibold text-[#0A0A0A] transition hover:brightness-110"
            >
              Next: Hours
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Hours */}
      {step === "hours" && (
        <div className="space-y-4">
          <h2 className="text-lg font-medium text-white">Operating hours</h2>
          <div className="space-y-2">
            {dayNames.map((day) => (
              <div key={day} className="flex items-center gap-3">
                <span className="w-24 text-sm text-neutral-300">{day}</span>
                <label className="flex items-center gap-2 text-xs text-neutral-400">
                  <input
                    type="checkbox"
                    checked={hours[day].closed}
                    onChange={(e) =>
                      setHours({
                        ...hours,
                        [day]: { ...hours[day], closed: e.target.checked },
                      })
                    }
                    className="rounded border-neutral-600"
                  />
                  Closed
                </label>
                {!hours[day].closed && (
                  <>
                    <input
                      type="time"
                      value={hours[day].open}
                      onChange={(e) =>
                        setHours({
                          ...hours,
                          [day]: { ...hours[day], open: e.target.value },
                        })
                      }
                      className="rounded-lg border border-white/[0.1] bg-white/[0.03] px-3 py-1.5 text-sm text-white outline-none"
                    />
                    <span className="text-neutral-500">to</span>
                    <input
                      type="time"
                      value={hours[day].close}
                      onChange={(e) =>
                        setHours({
                          ...hours,
                          [day]: { ...hours[day], close: e.target.value },
                        })
                      }
                      className="rounded-lg border border-white/[0.1] bg-white/[0.03] px-3 py-1.5 text-sm text-white outline-none"
                    />
                  </>
                )}
              </div>
            ))}
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setStep("services")}
              className="flex-1 rounded-lg border border-white/[0.15] py-3 text-sm font-medium text-white transition hover:border-[#D4A853]/40"
            >
              Back
            </button>
            <button
              onClick={() => setStep("voice")}
              className="flex-1 rounded-lg bg-[#D4A853] py-3 text-sm font-semibold text-[#0A0A0A] transition hover:brightness-110"
            >
              Next: Brand Voice
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Brand Voice */}
      {step === "voice" && (
        <div className="space-y-4">
          <h2 className="text-lg font-medium text-white">Brand voice</h2>
          <p className="text-sm text-neutral-400">
            Describe how your business communicates. Our AI will match this tone
            in all automated messages.
          </p>
          <textarea
            value={brandVoice}
            onChange={(e) => setBrandVoice(e.target.value)}
            rows={3}
            className="block w-full rounded-lg border border-white/[0.1] bg-white/[0.03] px-4 py-3 text-sm text-white placeholder-neutral-500 outline-none focus:border-[#D4A853]/50"
            placeholder="e.g., Warm and luxurious but never stiff. Like texting a friend who happens to be a skincare expert."
          />
          <div>
            <label className="block text-xs font-medium uppercase tracking-wide text-neutral-400">
              Google Review URL (optional)
            </label>
            <input
              type="url"
              value={googleReviewUrl}
              onChange={(e) => setGoogleReviewUrl(e.target.value)}
              className="mt-1.5 block w-full rounded-lg border border-white/[0.1] bg-white/[0.03] px-4 py-3 text-sm text-white placeholder-neutral-500 outline-none focus:border-[#D4A853]/50"
              placeholder="https://g.page/r/your-business/review"
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setStep("hours")}
              className="flex-1 rounded-lg border border-white/[0.15] py-3 text-sm font-medium text-white transition hover:border-[#D4A853]/40"
            >
              Back
            </button>
            <button
              onClick={handleFinish}
              disabled={loading}
              className="flex-1 rounded-lg bg-[#D4A853] py-3 text-sm font-semibold text-[#0A0A0A] transition hover:brightness-110 disabled:opacity-50"
            >
              {loading ? "Saving..." : "Finish setup"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
