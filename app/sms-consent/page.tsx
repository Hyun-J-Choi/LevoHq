// File path in your repo: app/sms-consent/page.tsx
// (If you're on Next.js Pages Router instead of App Router, put it at: pages/sms-consent.tsx
//  and remove the `export const metadata` block — use a <Head> tag inside the component instead.)

import Link from "next/link";

export const metadata = {
  title: "SMS Patient Consent — LevoHQ",
  description:
    "How LevoHQ collects TCPA-compliant patient consent before sending appointment confirmations, reminders, and replies on behalf of medical spa clients.",
};

export default function SmsConsentPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      {/* Top nav — matches your existing privacy/terms pages */}
      <header className="flex items-center justify-between px-8 py-6 max-w-5xl mx-auto">
        <Link href="/" className="text-xl font-medium">
          LevoHQ
        </Link>
        <nav className="flex gap-6 text-sm">
          <Link href="/privacy" className="text-gray-300 hover:text-white">
            Privacy
          </Link>
          <Link href="/terms" className="text-gray-300 hover:text-white">
            Terms
          </Link>
          <Link href="/" className="text-yellow-500 hover:text-yellow-400">
            Home
          </Link>
        </nav>
      </header>

      <article className="max-w-3xl mx-auto px-8 py-16 space-y-12">
        <div>
          <h1 className="text-5xl font-bold mb-3">SMS Patient Consent</h1>
          <p className="text-gray-400">Last updated: May 26, 2026</p>
        </div>

        {/* Section 1 — Who LevoHQ is */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold">1. About LevoHQ</h2>
          <p className="text-gray-200 leading-relaxed">
            LevoHQ is an AI-powered SMS receptionist platform operated by{" "}
            <strong>LQ Capital Holdings LLC</strong>, a Washington limited
            liability company. LevoHQ provides messaging services to
            independent medical spas (&ldquo;Medspa Clients&rdquo;) so they can
            communicate with their patients (&ldquo;End Users&rdquo;) about
            appointments and patient inquiries via SMS.
          </p>
          <p className="text-gray-200 leading-relaxed">
            This page explains how a patient consents to receive SMS messages
            and what the patient-facing consent flow looks like in practice.
          </p>
        </section>

        {/* Section 2 — Consent flow overview */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold">2. How Patient Consent Works</h2>
          <ol className="list-decimal pl-6 space-y-3 text-gray-200 leading-relaxed">
            <li>
              A patient books an appointment or fills out the new-patient
              intake form on the medical spa&rsquo;s website.
            </li>
            <li>
              The intake form includes a TCPA-compliant SMS opt-in checkbox.
              The checkbox is <strong>not pre-checked</strong>. The patient
              must affirmatively check the box to consent.
            </li>
            <li>
              When the patient submits the form, LevoHQ logs the consent
              (timestamp, IP address, the URL of the page where consent was
              given, and the exact disclosure language shown to the patient).
            </li>
            <li>
              For existing patient lists imported by a Medspa Client, LevoHQ
              sends a one-time double opt-in confirmation message. The patient
              must reply <strong>YES</strong> before any further messages are
              sent.
            </li>
            <li>
              The patient may opt out at any time by replying{" "}
              <strong>STOP</strong>. They may request help at any time by
              replying <strong>HELP</strong>.
            </li>
          </ol>
        </section>

        {/* Section 3 — Sample consent form (the CTA TCR is verifying) */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold">
            3. Sample Patient Intake Consent Form
          </h2>
          <p className="text-gray-200 leading-relaxed">
            Below is the exact SMS consent checkbox and disclosure language
            that a patient sees on the medical spa&rsquo;s intake form before
            any SMS messages are sent. The checkbox is not pre-checked.
          </p>

          {/* The visible CTA — this is what TCR will look at */}
          <div className="border border-gray-700 rounded-lg p-6 bg-gray-900/40 space-y-4">
            <div className="text-sm text-gray-400 uppercase tracking-wide">
              Sample — Medical Spa Patient Intake Form
            </div>

            <div className="space-y-3">
              <label className="block text-sm text-gray-300">First Name</label>
              <input
                type="text"
                disabled
                placeholder="Jane"
                className="w-full bg-black border border-gray-700 rounded px-3 py-2 text-gray-500"
              />
            </div>

            <div className="space-y-3">
              <label className="block text-sm text-gray-300">
                Mobile Phone Number
              </label>
              <input
                type="text"
                disabled
                placeholder="(555) 555-5555"
                className="w-full bg-black border border-gray-700 rounded px-3 py-2 text-gray-500"
              />
            </div>

            <div className="flex items-start gap-3 pt-4 border-t border-gray-800">
              <input
                type="checkbox"
                id="sms-consent-sample"
                className="mt-1 h-5 w-5 flex-shrink-0"
              />
              <label
                htmlFor="sms-consent-sample"
                className="text-sm text-gray-200 leading-relaxed"
              >
                By checking this box, I agree to receive automated SMS messages
                from <strong>[Medical Spa Name]</strong>, delivered via LevoHQ
                (operated by LQ Capital Holdings LLC), regarding appointment
                confirmations, reminders, and replies to my patient inquiries.
                Message frequency varies (approximately 2&ndash;6 messages per
                month). Msg &amp; data rates may apply. Reply{" "}
                <strong>STOP</strong> to opt out at any time. Reply{" "}
                <strong>HELP</strong> for help. Consent is not a condition of
                purchase. See our{" "}
                <Link
                  href="/privacy"
                  className="underline text-yellow-500 hover:text-yellow-400"
                >
                  Privacy Policy
                </Link>{" "}
                and{" "}
                <Link
                  href="/terms"
                  className="underline text-yellow-500 hover:text-yellow-400"
                >
                  Terms of Service
                </Link>
                .
              </label>
            </div>

            <button
              disabled
              className="w-full bg-yellow-500 text-black font-medium py-2 rounded opacity-60 cursor-not-allowed"
            >
              Submit Intake Form
            </button>

            <p className="text-xs text-gray-500 pt-2">
              This is a non-functional sample for demonstration purposes. The
              live form is hosted on each Medspa Client&rsquo;s own website.
            </p>
          </div>
        </section>

        {/* Section 4 — Sample messages */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold">4. Sample SMS Messages</h2>
          <p className="text-gray-200 leading-relaxed">
            After a patient consents, the following are representative examples
            of SMS messages they may receive:
          </p>
          <div className="space-y-3">
            <div className="border border-gray-700 rounded-lg p-4 bg-gray-900/40">
              <p className="text-xs text-gray-500 mb-2">
                Appointment reminder
              </p>
              <p className="text-gray-200 text-sm">
                &ldquo;Hi Jane, this is LevoHQ&rsquo;s automated assistant for
                Sunset Medspa. Reminder of your appointment tomorrow at 2:00
                PM. Reply C to confirm, R to reschedule, STOP to opt out.
                Msg&amp;data rates may apply.&rdquo;
              </p>
            </div>
            <div className="border border-gray-700 rounded-lg p-4 bg-gray-900/40">
              <p className="text-xs text-gray-500 mb-2">
                Patient inquiry reply
              </p>
              <p className="text-gray-200 text-sm">
                &ldquo;Hi Jane, LevoHQ assistant here for Sunset Medspa. Yes,
                we offer laser hair removal &mdash; sessions start at $150.
                Want me to text booking options? Reply STOP to opt out.&rdquo;
              </p>
            </div>
            <div className="border border-gray-700 rounded-lg p-4 bg-gray-900/40">
              <p className="text-xs text-gray-500 mb-2">
                Appointment confirmation
              </p>
              <p className="text-gray-200 text-sm">
                &ldquo;Hi Jane, this is LevoHQ&rsquo;s automated assistant for
                Sunset Medspa. Your appointment is confirmed for Sat 6/1 at
                2:00 PM. Reply STOP to opt out, HELP for help.&rdquo;
              </p>
            </div>
          </div>
        </section>

        {/* Section 5 — Patient rights / opt-out */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold">5. Patient Rights and Opt-Out</h2>
          <ul className="list-disc pl-6 space-y-2 text-gray-200 leading-relaxed">
            <li>
              Patients may opt out at any time by replying <strong>STOP</strong>
              , <strong>UNSUBSCRIBE</strong>, <strong>CANCEL</strong>,{" "}
              <strong>END</strong>, <strong>QUIT</strong>,{" "}
              <strong>OPTOUT</strong>, <strong>REVOKE</strong>, or{" "}
              <strong>STOPALL</strong>.
            </li>
            <li>
              Patients may request help at any time by replying{" "}
              <strong>HELP</strong> or <strong>INFO</strong>.
            </li>
            <li>
              Consent to receive SMS is not a condition of receiving services
              from any Medspa Client.
            </li>
            <li>
              Opted-out phone numbers are not re-added without renewed
              affirmative consent from the patient.
            </li>
          </ul>
        </section>

        {/* Section 6 — Medspa Client responsibilities */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold">
            6. Medspa Client Responsibilities
          </h2>
          <p className="text-gray-200 leading-relaxed">
            Each Medspa Client using LevoHQ is contractually required, under
            our{" "}
            <Link
              href="/terms"
              className="underline text-yellow-500 hover:text-yellow-400"
            >
              Terms of Service
            </Link>
            , to obtain documented, TCPA-compliant prior express written
            consent from each patient before adding the patient&rsquo;s phone
            number to the Service. Medspa Clients must honor opt-out requests
            promptly and may not re-add an opted-out phone number without
            renewed consent.
          </p>
        </section>

        {/* Section 7 — Contact */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold">7. Contact</h2>
          <p className="text-gray-200 leading-relaxed">
            Questions about this consent flow, or to report a concern, contact:
            <br />
            <strong>LQ Capital Holdings LLC</strong>
            <br />
            doing business as LevoHQ
            <br />
            Email:{" "}
            <a
              href="mailto:support@levohq.ai"
              className="underline text-yellow-500 hover:text-yellow-400"
            >
              support@levohq.ai
            </a>
          </p>
        </section>
      </article>
    </main>
  );
}
