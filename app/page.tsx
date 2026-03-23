import type { Metadata } from "next";
import Link from "next/link";
import EmailCapture from "@/components/landing/EmailCapture";

export const metadata: Metadata = {
  title: "LevoHQ — AI Front Desk for Med Spas",
  description:
    "Automated SMS, reminders, recovery, and reactivation. Built for clinics that can't afford another no-show.",
};

const pipeline = [
  {
    step: "01",
    title: "Capture",
    detail: "Inbound SMS, missed calls, and booking requests land in one thread — no tab switching.",
  },
  {
    step: "02",
    title: "Draft in your voice",
    detail: "Claude generates replies, confirmations, and recovery copy aligned to your brand tone.",
  },
  {
    step: "03",
    title: "Confirm & remind",
    detail: "Automated appointment confirmations and 24-hour reminders cut silent no-shows.",
  },
  {
    step: "04",
    title: "Save the cancel",
    detail: "Cancellation triggers a personalized SMS sequence — incentive, not desperation.",
  },
  {
    step: "05",
    title: "Post-visit follow-up",
    detail: "24–48h check-ins and sentiment-aware Google review asks when the visit went well.",
  },
  {
    step: "06",
    title: "Win back lapses",
    detail: "90+ day dormant clients get a tight, premium reactivation message — not a blast.",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-neutral-100">
      {/* subtle top gradient */}
      <div
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(212,168,83,0.08),transparent)]"
        aria-hidden
      />

      <header className="relative z-10 border-b border-white/[0.06]">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-5 md:px-8">
          <span className="text-[15px] font-semibold tracking-tight text-white">LevoHQ</span>
          <nav className="flex flex-wrap items-center justify-end gap-x-5 gap-y-1 text-[12px] font-medium text-neutral-400 sm:text-[13px] sm:gap-x-6">
            <a href="#pain" className="transition hover:text-white">
              Problem
            </a>
            <a href="#pipeline" className="transition hover:text-white">
              Pipeline
            </a>
            <a href="#pricing" className="transition hover:text-white">
              Pricing
            </a>
            <Link href="/dashboard" className="text-[#D4A853] transition hover:text-[#e0bc6a]">
              Sign in
            </Link>
          </nav>
        </div>
      </header>

      <main className="relative z-10">
        {/* Hero */}
        <section className="border-b border-white/[0.06] px-5 py-20 md:px-8 md:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#D4A853]">
              Med spa · dermatology · aesthetic clinics
            </p>
            <h1 className="mt-5 text-balance text-[2.25rem] font-semibold leading-[1.1] tracking-tight text-white md:text-5xl md:leading-[1.08]">
              Your Med Spa&apos;s AI Front Desk.
              <span className="text-neutral-400"> Never Lose a Client Again.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-pretty text-[17px] leading-relaxed text-neutral-400">
              LevoHQ runs your SMS layer: confirmations, reminders, cancellation recovery, and
              win-backs — so your front desk stops firefighting and your calendar stays full.
            </p>
            <div className="mx-auto mt-10 max-w-md">
              <EmailCapture
                source="hero"
                placeholder="you@clinic.com"
                buttonLabel="Get early access"
              />
              <p className="mt-3 text-center text-[12px] text-neutral-600">
                No spam. Product updates and a personal onboarding call.
              </p>
            </div>
          </div>
        </section>

        {/* Pain / stats */}
        <section id="pain" className="scroll-mt-20 border-b border-white/[0.06] px-5 py-20 md:px-8 md:py-24">
          <div className="mx-auto max-w-6xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#D4A853]">
              The cost of doing nothing
            </p>
            <h2 className="mt-3 max-w-2xl text-2xl font-semibold tracking-tight text-white md:text-3xl">
              Revenue leaks through the inbox — not your treatment rooms.
            </h2>
            <div className="mt-14 grid gap-px bg-white/[0.08] md:grid-cols-3">
              {[
                {
                  stat: "30%",
                  label: "No-show rate",
                  body: "Industry average for aesthetic appointments when reminders are manual or inconsistent.",
                },
                {
                  stat: "68%",
                  label: "Cancellations never rebook",
                  body: "Most clinics never run a structured recovery touch — that slot and LTV vanish the same day.",
                },
                {
                  stat: "$2,400",
                  label: "Lost per ghost / year",
                  body: "Rough annual value of one high-intent client who stops responding — before retail and referrals.",
                },
              ].map((item) => (
                <div key={item.label} className="bg-[#0A0A0A] p-8 md:p-10">
                  <p className="font-mono text-4xl font-medium tabular-nums text-[#D4A853] md:text-5xl">
                    {item.stat}
                  </p>
                  <p className="mt-2 text-[15px] font-semibold text-white">{item.label}</p>
                  <p className="mt-3 text-[14px] leading-relaxed text-neutral-500">{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Solution — pipeline */}
        <section id="pipeline" className="scroll-mt-20 border-b border-white/[0.06] px-5 py-20 md:px-8 md:py-24">
          <div className="mx-auto max-w-6xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#D4A853]">
              One automated pipeline
            </p>
            <h2 className="mt-3 max-w-2xl text-2xl font-semibold tracking-tight text-white md:text-3xl">
              Six steps. Full funnel. Zero spreadsheet choreography.
            </h2>
            <div className="mt-14 space-y-0">
              {pipeline.map((item, i) => (
                <div
                  key={item.step}
                  className="group flex gap-6 border-t border-white/[0.08] py-8 md:gap-10 md:py-10"
                >
                  <div className="flex w-12 shrink-0 flex-col items-center md:w-16">
                    <span className="font-mono text-[11px] font-medium tabular-nums text-[#D4A853]">
                      {item.step}
                    </span>
                    {i < pipeline.length - 1 ? (
                      <span
                        className="mt-2 h-full min-h-[2rem] w-px bg-gradient-to-b from-[#D4A853]/40 to-transparent md:min-h-[2.5rem]"
                        aria-hidden
                      />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1 pt-0.5">
                    <h3 className="text-lg font-semibold text-white md:text-xl">{item.title}</h3>
                    <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-neutral-500">
                      {item.detail}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="scroll-mt-20 border-b border-white/[0.06] px-5 py-20 md:px-8 md:py-24">
          <div className="mx-auto max-w-6xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#D4A853]">
              Pricing
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white md:text-3xl">
              Clear tiers. No hidden per-seat fees on SMS.
            </h2>
            <div className="mt-14 grid gap-6 md:grid-cols-3">
              {[
                {
                  name: "Starter",
                  price: "$997",
                  period: "/mo",
                  desc: "Single location, up to 2 providers on the calendar.",
                  bullets: [
                    "Inbound SMS + Claude replies",
                    "Booking confirmations",
                    "24h reminders",
                    "Cancellation recovery flows",
                    "Email support",
                  ],
                  cta: "Talk to sales",
                  featured: false,
                },
                {
                  name: "Growth",
                  price: "$1,997",
                  period: "/mo",
                  desc: "Multi-provider clinics ready to automate the full layer.",
                  bullets: [
                    "Everything in Starter",
                    "Post-visit follow-up + review asks",
                    "90-day reactivation campaigns",
                    "Missed-call SMS drafts",
                    "Priority Slack / email",
                  ],
                  cta: "Talk to sales",
                  featured: true,
                },
                {
                  name: "Enterprise",
                  price: "Custom",
                  period: "",
                  desc: "Groups, franchises, and HIPAA-aware deployments.",
                  bullets: [
                    "Multi-location rollouts",
                    "Custom integrations (EMR, CRM)",
                    "Dedicated success + SLA",
                    "BAA path where applicable",
                    "Volume SMS pricing",
                  ],
                  cta: "Contact us",
                  featured: false,
                },
              ].map((tier) => (
                <div
                  key={tier.name}
                  className={`flex flex-col rounded-xl border p-8 ${
                    tier.featured
                      ? "border-[#D4A853]/45 bg-[#D4A853]/[0.04] shadow-[0_0_0_1px_rgba(212,168,83,0.12)]"
                      : "border-white/[0.1] bg-white/[0.02]"
                  }`}
                >
                  {tier.featured ? (
                    <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#D4A853]">
                      Most clinics start here
                    </p>
                  ) : (
                    <div className="mb-4 h-4" />
                  )}
                  <p className="text-[15px] font-semibold text-white">{tier.name}</p>
                  <p className="mt-4 flex items-baseline gap-1">
                    <span className="font-mono text-4xl font-medium tabular-nums text-white">
                      {tier.price}
                    </span>
                    <span className="text-neutral-500">{tier.period}</span>
                  </p>
                  <p className="mt-3 text-[14px] leading-relaxed text-neutral-500">{tier.desc}</p>
                  <ul className="mt-8 flex-1 space-y-3 text-[14px] text-neutral-300">
                    {tier.bullets.map((b) => (
                      <li key={b} className="flex gap-2">
                        <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[#D4A853]" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                  <a
                    href="#demo"
                    className={`mt-10 block rounded-lg py-3 text-center text-[14px] font-semibold transition ${
                      tier.featured
                        ? "bg-[#D4A853] text-[#0A0A0A] hover:brightness-105"
                        : "border border-white/[0.15] text-white hover:border-[#D4A853]/40 hover:text-[#D4A853]"
                    }`}
                  >
                    {tier.cta}
                  </a>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Demo CTA */}
        <section id="demo" className="scroll-mt-20 px-5 py-20 md:px-8 md:py-28">
          <div className="mx-auto max-w-2xl rounded-2xl border border-white/[0.1] bg-white/[0.03] p-10 md:p-14">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#D4A853]">
              Demo
            </p>
            <h2 className="mt-4 text-2xl font-semibold tracking-tight text-white md:text-3xl">
              See the pipeline on your actual no-show and cancel data.
            </h2>
            <p className="mt-4 text-[15px] leading-relaxed text-neutral-500">
              20 minutes. We&apos;ll walk live SMS flows, your dashboard, and what changes in week one.
            </p>
            <div className="mt-8">
              <EmailCapture
                source="demo-footer"
                placeholder="Work email"
                buttonLabel="Book a demo"
              />
            </div>
            <p className="mt-6 text-center text-[13px] text-neutral-600">
              Or email{" "}
              <a href="mailto:hello@levohq.com" className="text-[#D4A853] hover:underline">
                hello@levohq.com
              </a>
            </p>
          </div>

          <footer className="mx-auto mt-20 max-w-6xl border-t border-white/[0.06] pt-10 text-center text-[12px] text-neutral-600">
            <p>© {new Date().getFullYear()} LevoHQ. Built for clinics that treat clients like clients — not tickets.</p>
            <div className="mt-4 flex justify-center gap-6">
              <Link href="/book" className="hover:text-neutral-400">
                Client booking (demo)
              </Link>
              <Link href="/dashboard" className="hover:text-neutral-400">
                App
              </Link>
            </div>
          </footer>
        </section>
      </main>
    </div>
  );
}
