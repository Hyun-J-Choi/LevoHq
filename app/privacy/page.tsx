import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy — LevoHQ",
  description:
    "How LevoHQ collects, uses, and protects information for medical spa clients and their patients.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-neutral-100">
      <header className="relative z-10 border-b border-white/[0.06]">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-5 md:px-8">
          <Link href="/" className="text-[15px] font-semibold tracking-tight text-white">
            LevoHQ
          </Link>
          <nav className="flex items-center gap-x-5 text-[13px] font-medium text-neutral-400">
            <Link href="/terms" className="transition hover:text-white">Terms</Link>
            <Link href="/" className="text-[#D4A853] transition hover:text-[#e0bc6a]">
              Home
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 py-12 md:px-8 md:py-16">
        <h1 className="mb-2 text-3xl font-semibold tracking-tight text-white md:text-4xl">
          Privacy Policy
        </h1>
        <p className="mb-10 text-sm text-neutral-500">Last updated: May 11, 2026</p>

        <div className="space-y-8 text-[15px] leading-relaxed text-neutral-300">
          <section>
            <h2 className="mb-3 text-xl font-semibold text-white">1. Who We Are</h2>
            <p>
              LevoHQ is a product of LQ Capital Holdings LLC (&quot;LevoHQ,&quot; &quot;we,&quot;
              &quot;our,&quot; or &quot;us&quot;), a Washington limited liability company. LevoHQ
              provides an AI-powered SMS receptionist platform used by medical spas
              (&quot;Medspa Clients&quot;) to communicate with their patients (&quot;End
              Users&quot;).
            </p>
            <p className="mt-3">
              This Privacy Policy explains how we collect, use, share, and protect
              information when you use our website, dashboard, and SMS services.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold text-white">2. Information We Collect</h2>
            <p>From Medspa Clients (account holders), we collect: business name, contact
              name, email address, phone number, billing information, and account
              credentials.
            </p>
            <p className="mt-3">From End Users (medspa patients), we collect, on behalf of the
              Medspa Client: first name, mobile phone number, appointment details, and
              the content of SMS messages exchanged with the LevoHQ AI receptionist.
            </p>
            <p className="mt-3">We also automatically collect technical information such as IP
              address, browser type, device identifiers, and usage logs when you visit
              our website or dashboard.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold text-white">
              3. How We Use Information
            </h2>
            <p>We use the information we collect to:</p>
            <ul className="mt-3 list-disc space-y-2 pl-6">
              <li>Provide the LevoHQ service to Medspa Clients;</li>
              <li>Send SMS appointment confirmations, reminders, and replies to End
                Users who have consented to receive them;
              </li>
              <li>Operate, maintain, and improve our platform and AI models;</li>
              <li>Communicate with Medspa Clients about their account, billing, and
                product updates;
              </li>
              <li>Comply with legal obligations, prevent fraud, and enforce our terms.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold text-white">
              4. SMS Consent and Mobile Information
            </h2>
            <p className="rounded-md border border-[#D4A853]/30 bg-[#D4A853]/[0.06] p-4 text-neutral-200">
              <strong className="text-white">We do not sell or share mobile phone numbers,
              SMS opt-in data, or any mobile information with third parties or affiliates
              for marketing or promotional purposes.</strong> Mobile information is shared
              only with subprocessors that operate the SMS service on our behalf (e.g.,
              Twilio for message delivery).
            </p>
            <p className="mt-3">End Users opt in to receive SMS by completing a consent
              checkbox on a Medspa Client&apos;s patient intake form, or by replying YES
              to a double opt-in confirmation message. End Users may opt out at any time
              by replying STOP to any SMS message. Replying HELP returns instructions and
              the operator name. Message frequency varies. Message and data rates may
              apply.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold text-white">
              5. Who We Share Information With
            </h2>
            <p>We share information only with the following categories of recipients:</p>
            <ul className="mt-3 list-disc space-y-2 pl-6">
              <li><strong className="text-white">Medspa Clients:</strong> patient
                information is shared with the specific Medspa Client who collected it.
              </li>
              <li><strong className="text-white">Subprocessors:</strong> service
                providers who operate parts of our platform under data protection
                agreements, including Twilio (SMS), Anthropic (AI model inference),
                Supabase (database), and Vercel (hosting).
              </li>
              <li><strong className="text-white">Legal compliance:</strong> when required
                by valid legal process or to protect rights, property, or safety.
              </li>
            </ul>
            <p className="mt-3">We do not sell personal information. We do not share
              personal information for cross-context behavioral advertising.</p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold text-white">6. Data Retention</h2>
            <p>We retain Medspa Client account information for the duration of the account
              plus a reasonable period thereafter for legal and operational purposes. We
              retain End User SMS conversation history for as long as it is needed to
              provide the service to the Medspa Client, or until deletion is requested.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold text-white">7. Security</h2>
            <p>We use commercially reasonable administrative, technical, and physical
              safeguards to protect information, including encryption in transit,
              role-based access controls, and audit logging. No system is perfectly
              secure, and we cannot guarantee absolute security.</p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold text-white">
              8. Your Rights and Choices
            </h2>
            <p>Depending on your jurisdiction (including under the CCPA, CPRA, and other
              U.S. state privacy laws), you may have the right to access, correct,
              delete, or port your personal information, and to opt out of certain
              processing. To exercise these rights, contact us at the address below. We
              will verify your request and respond within the time required by law.</p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold text-white">9. Children</h2>
            <p>Our services are not directed to children under 16. We do not knowingly
              collect personal information from children under 16.</p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold text-white">
              10. Changes to This Policy
            </h2>
            <p>We may update this Privacy Policy from time to time. When we do, we will
              update the &quot;Last updated&quot; date above and, where appropriate,
              notify Medspa Clients by email.</p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold text-white">11. Contact Us</h2>
            <p>
              LQ Capital Holdings LLC
              <br />
              Email:{" "}
              <a
                href="mailto:levohq.ai@gmail.com"
                className="text-[#D4A853] underline-offset-4 hover:underline"
              >
                levohq.ai@gmail.com
              </a>
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
