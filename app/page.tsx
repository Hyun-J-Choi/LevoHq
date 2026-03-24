import type { Metadata } from "next";
import Link from "next/link";
import EmailCapture from "@/components/landing/EmailCapture";

export const metadata: Metadata = {
  title: "LevoHQ — Your Clients Aren't Coming Back. Here's Why.",
  description:
    "80% of new med spa clients never return after their first visit. Not because they had a bad experience — because nobody followed up. LevoHQ fixes that automatically.",
};

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-neutral-100">
      <div
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(212,168,83,0.07),transparent)]"
        aria-hidden
      />

      {/* Nav */}
      <header className="relative z-10 border-b border-white/[0.06]">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-5 md:px-8">
          <span className="text-[15px] font-semibold tracking-tight text-white">LevoHQ</span>
          <nav className="flex flex-wrap items-center justify-end gap-x-5 gap-y-1 text-[12px] font-medium text-neutral-400 sm:text-[13px] sm:gap-x-6">
            <a href="#problem" className="transition hover:text-white">The problem</a>
            <a href="#solution" className="transition hover:text-white">How it works</a>
            <a href="#pricing" className="transition hover:text-white">Pricing</a>
            <Link href="/login" className="text-[#D4A853] transition hover:text-[#e0bc6a]">
              Sign in
            </Link>
          </nav>
        </div>
      </header>

      <main className="relative z-10">

        {/* ── HERO ── */}
        <section className="border-b border-white/[0.06] px-5 py-20 md:px-8 md:py-32">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#D4A853]">
              For med spas · aesthetic clinics · dermatology practices
            </p>
            <h1 className="mt-5 text-balance text-[2.5rem] font-semibold leading-[1.08] tracking-tight text-white md:text-[3.5rem]">
              80% of your new clients{" "}
              <span className="text-neutral-400">never come back.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-pretty text-[18px] leading-relaxed text-neutral-400">
              Not because they had a bad experience. Because nobody followed up.{" "}
              <span className="text-white">LevoHQ automatically reaches every client</span>{" "}
              at exactly the right moment — so nothing falls through the cracks.
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

        {/* ── THE PROBLEM ── */}
        <section id="problem" className="scroll-mt-20 border-b border-white/[0.06] px-5 py-20 md:px-8 md:py-28">
          <div className="mx-auto max-w-6xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#D4A853]">
              The problem
            </p>
            <h2 className="mt-3 max-w-2xl text-2xl font-semibold tracking-tight text-white md:text-3xl">
              You&apos;re paying to get clients in the door. Then letting them walk out forever.
            </h2>
            <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-neutral-500">
              The average med spa spends $200–$400 to acquire a new client through ads, referrals, and promotions.
              Industry data shows 80% of them never return after their first visit.
              Not because they were unhappy — because the window to bring them back closes fast, and most clinics never reach out in time.
            </p>

            {/* Three scenarios */}
            <div className="mt-14 grid gap-6 md:grid-cols-3">
              {[
                {
                  number: "01",
                  headline: "The first-time visitor who disappears",
                  story:
                    "She came in, loved her treatment, meant to rebook. Life got busy. Three months later she's a regular at the new place that opened down the street — because they texted her first.",
                },
                {
                  number: "02",
                  headline: "The cancellation nobody chased",
                  story:
                    "He cancelled Monday morning. Your front desk was with a client. By the time someone noticed, two hours had passed. He found another clinic online. That slot stayed empty all day.",
                },
                {
                  number: "03",
                  headline: "The Botox client who was due 6 weeks ago",
                  story:
                    "Her treatment was 18 weeks ago. Her results have worn off. Nobody noticed, nobody reached out. She assumed you didn't care. She booked somewhere else and didn't look back.",
                },
              ].map((item) => (
                <div key={item.number} className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-7">
                  <span className="font-mono text-[11px] font-medium text-[#D4A853]">{item.number}</span>
                  <h3 className="mt-3 text-[15px] font-semibold text-white">{item.headline}</h3>
                  <p className="mt-3 text-[14px] leading-relaxed text-neutral-500">{item.story}</p>
                </div>
              ))}
            </div>

            {/* The stat */}
            <div className="mt-10 rounded-xl border border-[#D4A853]/20 bg-[#D4A853]/[0.04] p-6 md:p-8">
              <p className="text-[15px] leading-relaxed text-white md:text-[17px]">
                Acquiring a new client costs{" "}
                <span className="text-[#D4A853] font-semibold">5–25× more</span>{" "}
                than keeping an existing one. Every client who doesn&apos;t come back is money you already spent — gone twice.
              </p>
            </div>
          </div>
        </section>

        {/* ── THE SOLUTION ── */}
        <section id="solution" className="scroll-mt-20 border-b border-white/[0.06] px-5 py-20 md:px-8 md:py-28">
          <div className="mx-auto max-w-6xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#D4A853]">
              The solution
            </p>
            <h2 className="mt-3 max-w-2xl text-2xl font-semibold tracking-tight text-white md:text-3xl">
              Every client. Every touchpoint. Handled automatically.
            </h2>
            <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-neutral-500">
              LevoHQ runs in the background 24/7. The moment something happens — a booking, a visit, a cancellation, a client going quiet — the right message goes out automatically. Your staff doesn&apos;t have to remember. Nothing slips through.
            </p>

            <div className="mt-14 space-y-0">
              {[
                {
                  moment: "Client books an appointment",
                  without: "Booking confirmation sent. That's it.",
                  with: "Instant confirmation + a warm welcome message for new clients that starts building the relationship before they walk in.",
                  impact: "New clients who feel welcomed before their first visit show up and rebook at higher rates.",
                },
                {
                  moment: "Appointment is 24 hours away",
                  without: "Manual reminder call — if the front desk has time.",
                  with: "Automated SMS reminder goes out the night before. If no confirmation, a second nudge goes out the morning of.",
                  impact: "30% no-show rate drops to under 10% with a consistent two-touch reminder system.",
                },
                {
                  moment: "Client cancels",
                  without: "Slot goes empty. Nobody follows up. Client is gone.",
                  with: "Recovery message fires within 60 seconds. Specific to their service, specific to them. A reason to rebook today.",
                  impact: "Industry data: a structured recovery sequence converts 20–35% of cancellations into rebookings.",
                },
                {
                  moment: "Visit is completed",
                  without: "Checkout. Silence. Hope they come back.",
                  with: "24–48 hour follow-up checking in on their experience. When sentiment is positive, a Google review ask goes out at exactly the right moment.",
                  impact: "97% of clients are more likely to rebook when they receive a personalized follow-up. Most clinics send none.",
                },
                {
                  moment: "Client is due for their next treatment",
                  without: "Nobody knows. Nobody notices. Client books elsewhere.",
                  with: "LevoHQ tracks every client's treatment history and knows when they're due — before they do. \"It's been about 12 weeks since your Botox, want to get ahead of the schedule?\"",
                  impact: "Treatment interval reminders are the single highest-converting message in aesthetics. Pure retained revenue.",
                },
                {
                  moment: "Client hasn't been in 90+ days",
                  without: "They're gone. You don't know why.",
                  with: "A personalized win-back message goes out — referencing their last service, offering something relevant, making it easy to come back.",
                  impact: "Reactivating dormant clients costs zero in acquisition. Every one who returns is pure profit.",
                },
              ].map((item, i) => (
                <div key={item.moment} className="border-t border-white/[0.08] py-10 grid md:grid-cols-[1fr_1fr_1fr] gap-6 md:gap-10">
                  <div>
                    <p className="font-mono text-[11px] font-medium text-[#D4A853]">0{i + 1}</p>
                    <h3 className="mt-2 text-[16px] font-semibold text-white">{item.moment}</h3>
                    <p className="mt-3 text-[13px] font-medium uppercase tracking-[0.1em] text-neutral-600">Without LevoHQ</p>
                    <p className="mt-1 text-[14px] leading-relaxed text-neutral-500">{item.without}</p>
                  </div>
                  <div>
                    <p className="mt-6 text-[13px] font-medium uppercase tracking-[0.1em] text-[#D4A853]/70 md:mt-[1.6rem]">With LevoHQ</p>
                    <p className="mt-1 text-[14px] leading-relaxed text-neutral-300">{item.with}</p>
                  </div>
                  <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 self-start">
                    <p className="text-[13px] leading-relaxed text-neutral-400">{item.impact}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── TREATMENT INTELLIGENCE ── */}
        <section className="border-b border-white/[0.06] px-5 py-20 md:px-8 md:py-24">
          <div className="mx-auto max-w-6xl">
            <div className="grid gap-10 md:grid-cols-2 md:gap-20 md:items-center">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#D4A853]">
                  Treatment interval intelligence
                </p>
                <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white md:text-3xl">
                  We know when your clients are due before they do.
                </h2>
                <p className="mt-4 text-[15px] leading-relaxed text-neutral-500">
                  Botox lasts 3–4 months. Filler lasts 6–12. Chemical peels every 4–6 weeks.
                  LevoHQ tracks every client&apos;s treatment history and sends a personalized
                  message at exactly the right interval — before they start looking elsewhere.
                </p>
                <p className="mt-4 text-[15px] leading-relaxed text-neutral-500">
                  No other tool does this automatically for every client, every treatment, every time.
                  It&apos;s not a blast. It&apos;s a personal message that reads like your best staff member wrote it.
                </p>
              </div>
              <div className="rounded-2xl border border-[#D4A853]/20 bg-[#D4A853]/[0.03] p-7">
                <p className="text-[12px] font-semibold uppercase tracking-[0.15em] text-[#D4A853]">
                  Example — automated, personalized
                </p>
                <div className="mt-5 space-y-3">
                  {[
                    { label: "Botox client · Week 12", msg: "Hi Sarah — it's been about 12 weeks since your Botox with Dr. Kim. Most clients start noticing movement around now. Want to get ahead of it before our schedule fills up?" },
                    { label: "HydraFacial client · Week 5", msg: "Hey Mia, your skin is probably craving another HydraFacial right about now. We have a few openings next week — want me to hold one for you?" },
                    { label: "Filler client · Month 9", msg: "Hi Jen — your lip filler was 9 months ago. This is usually when clients come in for a touch-up. Want to book before the holidays get busy?" },
                  ].map((ex) => (
                    <div key={ex.label} className="rounded-lg border border-white/[0.08] bg-[#0A0A0A] p-4">
                      <p className="text-[11px] font-medium text-[#D4A853]/70">{ex.label}</p>
                      <p className="mt-2 text-[13px] leading-relaxed text-neutral-300">&ldquo;{ex.msg}&rdquo;</p>
                    </div>
                  ))}
                </div>
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
              Two goals. Two plans.
            </h2>
            <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-neutral-500">
              Start by stopping the bleeding. Then upgrade to growing what you have.
            </p>
            <div className="mt-14 grid gap-6 md:grid-cols-2 max-w-3xl">
              {[
                {
                  name: "Starter",
                  goal: "Stop losing the clients you already have.",
                  price: "$997",
                  period: "/mo",
                  desc: "Single location. Up to 2 providers. Everything you need to plug the holes in your client retention.",
                  bullets: [
                    "Booking confirmations + reminders",
                    "Cancellation recovery messages",
                    "Missed-call SMS follow-up",
                    "Post-visit follow-up sequence",
                    "AI messaging in your brand voice",
                    "Client communication dashboard",
                  ],
                  cta: "Book a demo",
                  featured: false,
                },
                {
                  name: "Growth",
                  goal: "Turn one-time visitors into loyal regulars.",
                  price: "$1,997",
                  period: "/mo",
                  desc: "Multi-provider clinics ready to maximize the lifetime value of every client they bring in.",
                  bullets: [
                    "Everything in Starter",
                    "Treatment interval intelligence",
                    "90-day reactivation campaigns",
                    "Google review request sequences",
                    "Client lifetime value tracking",
                    "Revenue attribution dashboard",
                    "Priority support",
                  ],
                  cta: "Book a demo",
                  featured: true,
                },
              ].map((tier) => (
                <div
                  key={tier.name}
                  className={`flex flex-col rounded-xl border p-8 ${
                    tier.featured
                      ? "border-[#D4A853]/45 bg-[#D4A853]/[0.04]"
                      : "border-white/[0.1] bg-white/[0.02]"
                  }`}
                >
                  {tier.featured && (
                    <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#D4A853]">
                      Most popular
                    </p>
                  )}
                  <p className="text-[15px] font-semibold text-white">{tier.name}</p>
                  <p className="mt-1 text-[13px] text-[#D4A853]/80 font-medium">{tier.goal}</p>
                  <p className="mt-4 flex items-baseline gap-1">
                    <span className="font-mono text-4xl font-medium tabular-nums text-white">{tier.price}</span>
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
              See exactly how many clients you&apos;re losing — and how we get them back.
            </h2>
            <p className="mt-4 text-[15px] leading-relaxed text-neutral-500">
              We&apos;ll walk through the full flow live, show you the dashboard, and give you a
              real estimate of what LevoHQ recovers for a clinic your size. No pitch deck. No pressure.
            </p>
            <ul className="mt-6 space-y-2 text-[14px] text-neutral-400">
              {[
                "20 minutes, fully recorded so you can share with your team",
                "We map your current retention gap to an actual dollar figure",
                "You leave with a live demo number you can text right now",
              ].map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[#D4A853]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <div className="mt-8">
              <EmailCapture source="demo-footer" placeholder="Work email" buttonLabel="Book a demo →" />
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
              <Link href="/book" className="hover:text-neutral-400">Client booking</Link>
              <Link href="/dashboard" className="hover:text-neutral-400">App</Link>
            </div>
          </footer>
        </section>

      </main>
    </div>
  );
}
