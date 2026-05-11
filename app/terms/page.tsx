import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service — LevoHQ",
  description:
    "The terms governing use of the LevoHQ AI receptionist platform.",
};

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-neutral-100">
      <header className="relative z-10 border-b border-white/[0.06]">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-5 md:px-8">
          <Link href="/" className="text-[15px] font-semibold tracking-tight text-white">
            LevoHQ
          </Link>
          <nav className="flex items-center gap-x-5 text-[13px] font-medium text-neutral-400">
            <Link href="/privacy" className="transition hover:text-white">Privacy</Link>
            <Link href="/" className="text-[#D4A853] transition hover:text-[#e0bc6a]">
              Home
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 py-12 md:px-8 md:py-16">
        <h1 className="mb-2 text-3xl font-semibold tracking-tight text-white md:text-4xl">
          Terms of Service
        </h1>
        <p className="mb-10 text-sm text-neutral-500">Last updated: May 11, 2026</p>

        <div className="space-y-8 text-[15px] leading-relaxed text-neutral-300">
          <section>
            <h2 className="mb-3 text-xl font-semibold text-white">1. Acceptance of Terms</h2>
            <p>
              These Terms of Service (&quot;Terms&quot;) govern your access to and use of
              the LevoHQ platform, website, and related services (collectively, the
              &quot;Service&quot;), operated by LQ Capital Holdings LLC (&quot;LevoHQ,&quot;
              &quot;we,&quot; &quot;our,&quot; or &quot;us&quot;). By creating an account
              or using the Service, you agree to these Terms.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold text-white">2. The Service</h2>
            <p>LevoHQ provides an AI-powered SMS receptionist platform for medical spas
              (&quot;Medspa Clients&quot;). The Service enables Medspa Clients to
              communicate with their patients via SMS, including appointment
              confirmations, reminders, and replies to patient inquiries. The Service is
              provided &quot;as is&quot; and we may modify, suspend, or discontinue features at any
              time.</p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold text-white">
              3. Eligibility and Account
            </h2>
            <p>You must be at least 18 years old and authorized to bind the business
              entity you represent. You are responsible for keeping account credentials
              secure and for all activity under your account.</p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold text-white">
              4. Medspa Client Responsibilities
            </h2>
            <p>As a Medspa Client, you represent and agree that:</p>
            <ul className="mt-3 list-disc space-y-2 pl-6">
              <li>You will obtain documented, TCPA-compliant prior express written
                consent from each patient before adding their phone number to the
                Service for SMS communication;
              </li>
              <li>You will not upload phone numbers obtained without consent or in
                violation of any applicable law;
              </li>
              <li>You are solely responsible for the content of any custom messages or
                instructions you configure;
              </li>
              <li>You will honor opt-out requests promptly and will not attempt to
                re-add an opted-out phone number without renewed consent;
              </li>
              <li>You will comply with all applicable laws, including the Telephone
                Consumer Protection Act (TCPA), CAN-SPAM, HIPAA (where applicable),
                state privacy laws, and CTIA Messaging Principles.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold text-white">
              5. SMS Consent and Opt-Out
            </h2>
            <p>End Users (patients) opt in to receive SMS by completing a consent
              checkbox on a Medspa Client&apos;s patient intake form, or by replying YES
              to a double opt-in confirmation. End Users may opt out at any time by
              replying STOP. Replying HELP returns the operator name and support
              information. Message frequency varies. Message and data rates may apply.
              Carriers are not liable for delayed or undelivered messages.</p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold text-white">6. Acceptable Use</h2>
            <p>You will not use the Service to: (a) send unsolicited or unconsented
              messages; (b) send content that is illegal, fraudulent, harassing,
              defamatory, or that violates third-party rights; (c) impersonate any
              person or entity; (d) interfere with or attempt to circumvent the Service
              or its security; or (e) use the Service for SHAFT content (sex, hate,
              alcohol, firearms, tobacco) without proper authorization.</p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold text-white">7. Fees and Payment</h2>
            <p>Fees for the Service are described on our pricing page or in your order
              form. Fees are non-refundable except where required by law. We may change
              pricing with at least 30 days&apos; notice before the change applies to
              your subscription.</p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold text-white">
              8. Intellectual Property
            </h2>
            <p>The Service, including all software, AI models, content, and trademarks,
              is owned by LevoHQ or its licensors and is protected by intellectual
              property laws. You receive only a limited, non-transferable license to use
              the Service in accordance with these Terms.</p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold text-white">
              9. Disclaimers and AI Limitations
            </h2>
            <p>The Service uses AI models to generate responses. We do not guarantee
              accuracy, completeness, or fitness for any particular purpose. Medspa
              Clients are responsible for reviewing AI-generated communications. The
              Service is provided &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; without
              warranties of any kind, express or implied, to the maximum extent
              permitted by law.</p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold text-white">
              10. Indemnification
            </h2>
            <p>You agree to defend, indemnify, and hold harmless LevoHQ and its
              affiliates from any claims, damages, liabilities, and expenses (including
              reasonable attorneys&apos; fees) arising out of your use of the Service,
              your violation of these Terms, or your violation of any law or third-party
              right, including any TCPA claim arising from phone numbers you provided
              without proper consent.</p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold text-white">
              11. Limitation of Liability
            </h2>
            <p>To the maximum extent permitted by law, LevoHQ shall not be liable for any
              indirect, incidental, consequential, special, or punitive damages, or for
              lost profits or data, arising out of or related to the Service. Our total
              aggregate liability for any claim shall not exceed the fees you paid to us
              in the 12 months preceding the claim.</p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold text-white">12. Termination</h2>
            <p>You may cancel your account at any time. We may suspend or terminate your
              account for breach of these Terms, non-payment, or to protect the
              Service. Sections that by their nature should survive termination shall
              survive.</p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold text-white">
              13. Governing Law
            </h2>
            <p>These Terms are governed by the laws of the State of Washington, without
              regard to its conflict-of-laws principles. Any dispute shall be resolved
              in the state or federal courts located in King County, Washington, and
              you consent to their jurisdiction.</p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold text-white">14. Changes</h2>
            <p>We may update these Terms from time to time. When we do, we will update
              the &quot;Last updated&quot; date above. Continued use of the Service after
              changes take effect constitutes acceptance.</p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold text-white">15. Contact</h2>
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
