# LevoHQ — TCR Resubmission Playbook

Goal: get your A2P 10DLC campaign re-approved by TCR. The rejection was a CTA verification failure. This playbook fixes the root cause.

Estimated total time: 60–90 minutes of work, then a 3–10 day TCR review.

---

## STEP 1 — Add the SMS consent page to your repo (20 min)

1. Open your levohq.ai project in Cursor.
2. Confirm your structure. If you have an `app/` folder, you're on App Router. If you have a `pages/` folder, you're on Pages Router.
3. Create the new page:
   - **App Router:** create `app/sms-consent/page.tsx`
   - **Pages Router:** create `pages/sms-consent.tsx` and delete the `export const metadata` block from the file — use a `<Head>` tag inside the component instead.
4. Paste the contents of `sms-consent-page.tsx` (in this same folder) into the new file.
5. If your site uses a different style system than Tailwind, ask Claude Code in Cursor to "adapt this page to match the existing styling in app/privacy/page.tsx" (or wherever your privacy page lives) — it'll match for you.
6. Save. Commit. Push to main. Vercel deploys automatically.
7. Verify: open https://levohq.ai/sms-consent in an incognito browser. The checkbox must be visible. The disclosure text must be readable.

---

## STEP 2 — Add the SMS section to your Privacy Policy (10 min)

1. Open `privacy-sms-section-to-add.md` (in this same folder).
2. Copy the section content (everything under the `## 4. SMS Communications and Mobile Information` heading).
3. Paste it into your existing privacy page file as a new section.
4. Renumber subsequent sections accordingly.
5. Commit and push.
6. Verify: https://levohq.ai/privacy now shows the SMS Communications section.

---

## STEP 3 — Resubmit the campaign (15 min)

1. Go to: https://console.twilio.com/us1/develop/sms/regulatory-compliance/campaigns/BNeacb395e03046a723f0c7a6e32e8c9c7/CM14aa9d61bb0e624b17d38d967d637217
2. Click **"Fix Campaign"** at the top of the red banner.
3. Edit these fields:

   **Use case** — if asked, keep "Low Volume Mixed" for now (changing it may require re-paying). If you want to be safer, change to **"Mixed"** at the standard tier, or split into "Account Notifications" + "Customer Care." Twilio support may advise on this in their ticket response.

   **How do end-users consent to receive messages?** — Replace existing text with this exact paragraph:

   > Patients consent via a TCPA-compliant, non-pre-checked opt-in checkbox on the Medspa Client's online patient intake form. A complete sample of the patient-facing consent flow, including the exact disclosure language and checkbox, is publicly viewable at https://levohq.ai/sms-consent. Consent is logged with timestamp, source URL, IP address, and the exact disclosure shown. For existing patient lists imported by a Medspa Client, LevoHQ sends a double opt-in confirmation message requiring the patient to reply YES before any further messaging. Patients may opt out at any time by replying STOP. Brand and platform operator: LevoHQ, operated by LQ Capital Holdings LLC (Brand SID BNeacb395e03046a723f0c7a6e32e8c9c7).

   **Opt-in Message** — keep what you have if already correct:

   > Welcome! You're opted in to receive SMS from your medical spa via LevoHQ. Approx 4 msgs/mo. Reply STOP to opt out, HELP for help. Msg&data rates may apply.

   **Sample message #1** — Replace with:

   > Hi Jane, this is LevoHQ's automated assistant for Sunset Medspa. Reminder of your appointment tomorrow at 2:00 PM. Reply C to confirm, R to reschedule, STOP to opt out. Msg&data rates may apply.

   **Sample message #2** — Replace with:

   > Hi Jane, LevoHQ assistant here for Sunset Medspa. Yes, we offer laser hair removal — sessions start at $150. Want me to text booking options? Reply STOP to opt out.

   **Sample message #3** — Replace with:

   > Hi Jane, this is LevoHQ's automated assistant for Sunset Medspa. Your appointment is confirmed for Sat 6/1 at 2:00 PM. Reply STOP to opt out, HELP for help.

4. If there is an explicit field for "Opt-in URL" or "Message Flow URL" or "CTA URL," put: `https://levohq.ai/sms-consent`
5. Submit.

---

## STEP 4 — Update the Twilio support ticket (2 min)

1. Open ticket #27203264 in your Twilio Help Center.
2. Post a reply:

   > Update: I located the specific rejection reason in the Console — "issues verifying the Call to Action (CTA) provided for the campaign." I have published a public consent flow page at https://levohq.ai/sms-consent showing the exact patient-facing opt-in checkbox, disclosure language, and consent workflow, and have updated my Privacy Policy with a dedicated SMS Communications section. I am resubmitting the campaign now via "Fix Campaign." Please advise if there is anything additional TCR needs to see at the new CTA URL beyond what is currently published.

3. Submit.

---

## STEP 5 — Wait (3–10 days). Sell in parallel.

While TCR re-reviews:

- Build a list of 100 medspas in your metro.
- Record a 90-second Loom: introduce yourself, explain the problem (missed after-hours texts = lost bookings), describe LevoHQ, offer the founder-handled trial ($300/mo, you personally handle texts manually for the first 30 days while we wait on Twilio).
- Call 20 medspas tomorrow. 20 more the day after. Aim for 3 conversations per 20 dials.
- Track everything in a Google Sheet.

If TCR rejects again, the rejection will likely cite a different reason and we'll have a clearer fix. If TCR approves, you have a warm pipeline ready to onboard.

---

## Files in this folder

- `sms-consent-page.tsx` — paste into your repo at `app/sms-consent/page.tsx`
- `privacy-sms-section-to-add.md` — paste section content into your privacy page
- `INSTRUCTIONS.md` — this file
