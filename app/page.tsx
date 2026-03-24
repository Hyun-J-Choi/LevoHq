import type { Metadata } from "next";
import Link from "next/link";
import EmailCapture from "@/components/landing/EmailCapture";

export const metadata: Metadata = {
  title: "LevoHQ — Fill Every Slot. Recover Every Cancel. Reactivate Every Ghost.",
  description:
    "LevoHQ automates your med spa's entire SMS layer — confirmations, reminders, cancellation recovery, follow-ups, and win-backs. Most clinics recover $5K–$15K/month in the first 60 days.",
};

const pipeline = [
  {
    step: "01",
    title: "Capture every lead",
    detail:
      "Inbound texts, missed calls, and booking requests route into one place automatically. Nothing slips through while your front desk is with a client.",
    value: "Avg. missed inbound = $300–$600 lost",
  },
  {
    step: "02",
    title: "Confirm in your voice",
    detail:
      "AI writes booking confirmations aligned to your brand — warm, specific, professional. Sent instantly. No copy-paste, no delays.",
    value: "Confirmed clients show up 2× more",
  },
  {
    step: "03",
    title: "Kill the no-show",
    detail:
      "24-hour SMS reminders go out automatically. Clients who don't confirm get a second nudge. You stop losing $150–$500 slots to silence.",
    value: "Industry no-show rate drops from 30% to under 10%",
  },
  {
    step: "04",
    title: "Recover the cancel",
    detail:
      "The moment someone cancels, a personalized recovery sequence launches — a specific offer, the right timing, a reason to rebook. Not a form letter.",
    value: "20–35% of cancels rebook with a structured sequence",
  },
  {
    step: "05",
    title: "Turn one visit into many",
    detail:
      "24–48h post-visit texts check in, collect feedback, and ask for a Google review when sentiment is positive. The right message at the right moment.",
    value: "1 review ask per day = 30 new reviews/month",
  },
  {
    step: "06",
    title: "Win back the ghosts",
    detail:
      "Clients who haven't visited in 90 days get a tight, premium reactivation message. Not a mass blast — a personalized pull based on their last service.",
    value: "Reactivating 2 clients/month = $3,600+/year recaptured",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-neutral-100">
      {/* ambient gradient */}
      <div
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(212,168,83,0.07),transparent)]"
        aria-hidden
      />

      {/* Nav */}
      <header className="relative z-10 border-b border-white/[0.06]">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-5 md:px-8">
          <span className="text-[15px] font-semibold tracking-tight text-white">LevoHQ</span>
          <nav className="flex flex-wrap items-center justify-end gap-x-5 gap-y-1 text-[12px] font-medium text-neutral-400 sm:text-[13px] sm:gap-x-6">
            <a href="#roi" className="transition hover:text-white">The math</a>
            <a href="#pipeline" className="transition hover:text-white">How it works</a>
            <a href="#pricing" className="transition hover:text-white">Pricing</a>
            <Link href="/dashboard" className="text-[#D4A853] transition hover:text-[#e0bc6a]">
              Sign in
            </Link>
          </nav>
        </div>
      </header>

      <main className="relative z-10">

        {/* ── HERO ── */}
        <section className="border-b border-white/[0.06] px-5 py-20 md:px-8 md:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#D4A853]">
              For med spas · aesthetic clinics · dermatology practices
            </p>
            <h1 className="mt-5 text-balance text-[2.35rem] font-semibold leading-[1.08] tracking-tight text-white md:text-[3.25rem]">
              Your calendar should be full.{" "}
              <span className="text-neutral-400">
                LevoHQ fills the gaps your front desk can&apos;t.
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-pretty text-[17px] leading-relaxed text-neutral-400">
              Automated SMS for every stage of the client journey — confirmations, reminders,
              cancellation recovery, follow-ups, and win-backs. Most clinics recover{" "}
              <span className="text-white font-medium">$5,000–$15,000/month</span> in the first
              60 days.
            </p>
            <div className="mx-auto mt-10 max-w-md">
              <EmailCapture
                source="hero"
                placeholder="Work email"
                buttonLabel="Get early access →"
              />
              <p className="mt-3 text-center text-[12px] text-neutral-600">
                No setup fees. No long-term contract. Cancel anytime.
              </p>
            </div>
          </div>
        </section>

        {/* ── ROI / THE MATH ── */}
        <section id="roi" className="scroll-mt-20 border-b border-white/[0.06] px-5 py-20 md:px-8 md:py-24">
          <div className="mx-auto max-w-6xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#D4A853]">
              The math is embarrassingly simple
            </p>
            <h2 className="mt-3 max-w-2xl text-2xl font-semibold tracking-tight text-white md:text-3xl">
              You&apos;re not running a slow business. You&apos;re running a leaky one.
            </h2>
            <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-neutral-500">
              The average med spa has 20–40 appointments per week. At a 30% no-show rate, that&apos;s
              6–12 empty slots every week — $900 to $6,000 gone before lunch on Monday. Most clinics
              never run a structured recovery system. They just re-open the slot and hope.
            </p>

            <div className="mt-14 grid gap-px bg-white/[0.08] md:grid-cols-3">
              {[
                {
                  stat: "$4,500",
                  label: "Lost per week to no-shows",
                  body: "Based on 10 missed slots at $150 avg per service. That's $234K/year walking out the door.",
                },
                {
                  stat: "68%",
                  label: "Cancels that never rebook",
                  body: "No structured recovery = no second chance. One rebook per day adds $3,000–$5,000/month.",
                },
                {
                  stat: "14×",
                  label: "ROI in the first 90 days",
                  body: "Recovering 3 appointments/week on a $997 plan pays for LevoHQ 14× over in a single quarter.",
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

            {/* Simple ROI callout */}
            <div className="mt-8 rounded-xl border border-[#D4A853]/20 bg-[#D4A853]/[0.04] p-6 md:p-8">
              <p className="text-[13px] font-semibold uppercase tracking-[0.15em] text-[#D4A853]">
                The pitch in one sentence
              </p>
              <p className="mt-3 text-[17px] leading-relaxed text-white md:text-[18px]">
                If LevoHQ recovers one cancelled appointment per day — realistic for any active clinic —
                that&apos;s{" "}
                <span className="text-[#D4A853]">$4,500/month in revenue</span> that was already
                lost. The software costs $997.
              </p>
            </div>
          </div>
        </section>

        {/* ── PIPELINE ── */}
        <section id="pipeline" className="scroll-mt-20 border-b border-white/[0.06] px-5 py-20 md:px-8 md:py-24">
          <div className="mx-auto max-w-6xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#D4A853]">
              The full client journey, automated
            </p>
            <h2 className="mt-3 max-w-2xl text-2xl font-semibold tracking-tight text-white md:text-3xl">
              Six stages. One system. Zero manual follow-up.
            </h2>
            <div className="mt-14">
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
                    <p className="mt-3 text-[13px] font-medium text-[#D4A853]/80">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── WHY SMS ── */}
        <section className="border-b border-white/[0.06] px-5 py-16 md:px-8 md:py-20">
          <div className="mx-auto max-w-6xl">
            <div className="grid gap-10 md:grid-cols-2 md:gap-16">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#D4A853]">
                  Why SMS, not email
                </p>
                <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white md:text-3xl">
                  98% open rate. 90-second response time.
                </h2>
                <p className="mt-4 text-[15px] leading-relaxed text-neutral-500">
                  Email newsletters get 20% open rates on a good day. SMS gets 98%. When someone
                  cancels, you have a 2-hour window to recover them before they book elsewhere.
                  LevoHQ fires the recovery message within seconds — in your voice, not a template.
                </p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#D4A853]">
                  Why AI, not scripts
                </p>
                <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white md:text-3xl">
                  Messages that read like you wrote them.
                </h2>
                <p className="mt-4 text-[15px] leading-relaxed text-neutral-500">
                  Clients can tell when a text is a blast. LevoHQ uses Claude to generate messages
                  that reference the specific service, the specific provider, the specific situation.
                  That personal touch is what converts a cancel into a rebook.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── PRICING ── */}
        <section id="pricing" className="scroll-mt-20 border-b border-white/[0.06] px-5 py-20 md:px-8 md:py-24">
          <div className="mx-auto max-w-6xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#D4A853]">
              Pricing
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white md:text-3xl">
              Pays for itself the first week.
            </h2>
            <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-neutral-500">
              No per-seat fees. No usage caps on SMS. Flat monthly rate so you know exactly what
              you&apos;re paying as you scale.
            </p>
            <div className="mt-14 grid gap-6 md:grid-cols-3">
              {[
                {
                  name: "Starter",
                  price: "$997",
                  period: "/mo",
                  desc: "Single location. Up to 2 providers. Everything you need to stop losing appointments.",
                  bullets: [
                    "AI inbound SMS + reply drafts",
                    "Booking confirmations",
                    "24h automated reminders",
                    "Cancellation recovery flows",
                    "Missed-call SMS follow-up",
                    "Email support",
                  ],
                  cta: "Book a demo",
                  featured: false,
                },
                {
                  name: "Growth",
                  price: "$1,997",
                  period: "/mo",
                  desc: "Multi-provider clinics running the full revenue recovery layer.",
                  bullets: [
                    "Everything in Starter",
                    "Post-visit follow-up automation",
                    "Google review request sequences",
                    "90-day reactivation campaigns",
                    "Dashboard analytics",
                    "Priority Slack + email support",
                  ],
                  cta: "Book a demo",
                  featured: true,
                },
                {
                  name: "Enterprise",
                  price: "Custom",
                  period: "",
                  desc: "Multi-location groups, franchise networks, and HIPAA-sensitive deployments.",
                  bullets: [
                    "Multi-location rollouts",
                    "EMR / booking software integration",
                    "Dedicated success manager + SLA",
                    "BAA available where applicable",
                    "Volume SMS pricing",
                    "Custom workflows",
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
                      Most popular
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

        {/* ── DEMO CTA ── */}
        <section id="demo" className="scroll-mt-20 px-5 py-20 md:px-8 md:py-28">
          <div className="mx-auto max-w-2xl rounded-2xl border border-[#D4A853]/20 bg-[#D4A853]/[0.03] p-10 md:p-14">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#D4A853]">
              Book a 20-minute demo
            </p>
            <h2 className="mt-4 text-2xl font-semibold tracking-tight text-white md:text-3xl">
              See exactly how much revenue you&apos;re leaving on the table.
            </h2>
            <p className="mt-4 text-[15px] leading-relaxed text-neutral-500">
              We&apos;ll walk through live SMS flows, show you the dashboard on real clinic data,
              and give you a rough recovery estimate for your specific volume. No pitch deck.
              No obligation.
            </p>
            <ul className="mt-6 space-y-2 text-[14px] text-neutral-400">
              {[
                "20 minutes, fully recorded so you can share with your team",
                "We map your current no-show + cancel rate to a dollar figure",
                "You leave with a live SMS demo number you can text right now",
              ].map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[#D4A853]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <div className="mt-8">
              <EmailCapture
                source="demo-footer"
                placeholder="Work email"
                buttonLabel="Book a demo →"
              />
            </div>
            <p className="mt-6 text-center text-[13px] text-neutral-600">
              Or email{" "}
              <a href="mailto:hello@levohq.com" className="text-[#D4A853] hover:underline">
                hello@levohq.com
              </a>{" "}
              directly.
            </p>
          </div>

          <footer className="mx-auto mt-20 max-w-6xl border-t border-white/[0.06] pt-10 text-center text-[12px] text-neutral-600">
            <p>© {new Date().getFullYear()} LevoHQ · Built for clinics that treat clients like clients — not tickets.</p>
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
