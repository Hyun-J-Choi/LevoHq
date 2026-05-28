# LevoHQ Waiting Period Playbook
**The complete list of things to do until vetting clears (and beyond)**
Target window: 2026-05-17 through vetting clearance + 30 days

---

## Rule Zero: What you will NOT do

Before the list of what to do, the list of what you absolutely will not touch. These are the activities that feel productive but kill founders during waits:

- No new features. None. Even if you "have a great idea." Write it on a sticky note and ignore it.
- No UI redesigns. Your UI is good enough until 10 paying customers tell you otherwise.
- No refactoring. You are a vibe coder. Don't pretend to be a software architect.
- No reading startup books, podcasts, or Twitter threads during work hours. Consume that on the toilet only.
- No "I'll just quickly add X." Every "quick add" is 4 hours minimum.
- No checking the Twilio vetting status more than once a day. It will not clear faster because you refresh.
- No posting "founder building in public" content. It's masturbation. Post AFTER you have revenue, not before.

If you catch yourself doing any of these, stop and pick something off the list below.

---

## Phase 1: Day 1-3 (Right Now, Through 2026-05-20)

### Day 1 (Today): Pick your niche and lock it in

You currently sell "SMS to anyone." That is a death sentence. Today you become "SMS for [ONE specific vertical]." Pick from this shortlist based on accessibility:

1. **Medspas** — high LTV ($300-1500 per customer for them), owners are reachable, they buy software actively, lots of no-show / rebooking pain that SMS solves directly
2. **Tattoo shops** — underserved, tight community, word-of-mouth spreads fast, real appointment / deposit / no-show pain
3. **Solo home service (electricians, plumbers, HVAC)** — massive market, missed-call-to-text is gold for them, owners answer their phones
4. **Local cannabis dispensaries** — heavily underserved due to regulatory issues, willing to pay premium for compliant tools
5. **Independent gyms / personal training studios** — class reminders, lead nurturing, rebooking — all SMS-shaped problems

Pick ONE. Today. By end of day, you should be able to finish this sentence: "LevoHQ is the SMS platform for [vertical] that helps them [specific outcome]."

If you can't pick because "they all seem good" — pick medspas. It's the most likely to print money for someone in your position.

### Day 2: Build your prospect list (50 names)

For your chosen vertical, build a Google Sheet with these columns:
- Business name
- Owner name (find it — Instagram, LinkedIn, website "about")
- Phone number
- Email
- Instagram handle
- City
- Estimated revenue (small / medium / large)
- Pain signal (recent bad review mentioning no-shows, missed calls, etc.)
- Outreach attempt 1 date
- Response

Sources to build this from:
- Google Maps search "[vertical] near [city]" — scrape top 50
- Instagram hashtag search — find local accounts
- Yelp listings
- For medspas specifically: RealSelf provider directory
- Apollo.io (free tier gives you enough to start)

By end of Day 2: 50 names in the sheet. Real names, real numbers, real contact info. No "info@" emails — find the owner.

### Day 3: Write your outreach assets

You need three short pieces of copy. Not long. Short.

1. **Cold DM (Instagram)** — under 4 sentences. Open with something specific about their business (not "great account!"). Mention one specific pain. Offer to show something useful in 15 minutes. Do NOT pitch the product.

2. **Cold email** — 50 words max. Subject line specific. Body: who you are, what you noticed about their biz, what you do for similar businesses, soft ask for 15 min.

3. **Cold call script** — 30-second opener. "Hey, this is [name] from LevoHQ. We help [vertical] in [city] cut no-shows by texting clients automatically. Got 30 seconds for me to ask one question?" Then ASK their pain. Don't pitch.

Get all three written by end of Day 3. Tomorrow you start sending at volume.

---

## Phase 2: Day 4-14 (Cold Outreach Sprint)

### Daily targets, every single weekday:

- **30 cold DMs** sent (Instagram primarily for medspas/tattoo/gyms; LinkedIn for home services)
- **20 cold emails** sent
- **10 cold calls** made (yes, calls. Most founders skip these. That's why they work.)
- **1 hour** doing follow-ups with anyone who replied
- **Track every touch** in the sheet. Date, channel, response, next action.

Total outbound per day: 60 touches. Per week: 300 touches. By end of Phase 2 (Day 14): 3,000 touches.

Realistic response rate at this volume and quality: 5-10%. Realistic call-booked rate: 1-2%. So expect 30-60 conversations across the 10 days. That's enough to validate the niche and pricing.

### Weekly milestones:

**End of Week 1 (Day 7):**
- 50 prospects in sheet ✓
- 200+ touches sent
- 10+ replies received
- 2+ discovery calls booked
- First Loom walkthrough recorded (see Phase 3)

**End of Week 2 (Day 14):**
- 100+ prospects in sheet
- 600+ touches sent
- 30+ replies received
- 5+ discovery calls held
- 2+ concierge customers signed at $500-800/mo (see Phase 4)
- 3+ charter pre-signups via Stripe auth (see Phase 5)

If you hit these numbers, vetting clearing or not, you have a real business forming. If you DON'T hit these numbers, something is broken with your message, your list, or your discipline. We diagnose at Day 14.

---

## Phase 3: Demo Assets (Build Once, Use 100 Times)

You need these recorded by end of Week 1. Each is 5-10 minutes max:

### Loom 1: "What LevoHQ Does in 3 Minutes"
- Screen record the UI top to bottom
- Show: create campaign → import contacts → segment → send
- Use a test number you own
- Show the reporting/analytics view
- For the actual send, route through your personal Twilio number (it's not A2P, it'll work) OR use a screen recording of a successful test send from before vetting submission

### Loom 2: Niche-specific use case
- "How [Medspa Name] uses LevoHQ to recover $X/month in no-shows"
- Walk through the specific workflow for your niche
- If you don't have a real customer yet, make a hypothetical one with realistic numbers

### Loom 3: AI features demo (if you have any; if not, build the simplest possible AI auto-reply feature in 1 day max)
- "Watch LevoHQ text back a lead in 30 seconds, 24/7"
- This is your differentiation vs SimpleTexting and EZ Texts
- Even a basic "auto-reply with appointment booking link" using GPT-4 is enough

Host these on Loom or unlisted YouTube. Send the link in follow-ups. People who watch a Loom for >50% are 5-10x more likely to take a call.

---

## Phase 4: The Concierge Play (Revenue This Week)

This is the most important section. Read it twice.

### Why it works:
- Doesn't require working A2P 10DLC
- You can send from your personal phone or a non-A2P toll-free number
- Generates revenue NOW
- Validates pricing and ICP with real money
- Becomes case studies for the SaaS once it launches
- Creates customers who will migrate to the platform when vetting clears

### The pitch:
"We're launching our SMS platform for [vertical] in 2-3 weeks once compliance review clears. In the meantime, I personally manage your SMS campaigns for [$500-800]/mo. You get me running your texts manually — appointment reminders, lead nurture, win-back campaigns. When the platform goes live, you migrate over with no setup fee. Only taking 5 customers at this price."

### The mechanics:
- You handle 1-3 customers max at this stage
- Each gets a Google Sheet for their contact list
- You use your personal phone or a non-A2P number to send (10-50 texts/day max per customer to stay under spam radar)
- You bill monthly via Stripe Invoice (1 click, no card required from them — they just pay the invoice link)
- You set up: 1 appointment reminder workflow, 1 lead capture, 1 win-back campaign per customer

### Target:
- 1 concierge customer by Day 10
- 2 by Day 14
- 3 by Day 21
- $1.5-2.4k MRR live before vetting even clears

### Honest scope:
- This is real work. 30-60 minutes per customer per day.
- You may hate it. Do it anyway. This is the bridge.

---

## Phase 5: Pre-Sells (Pipeline for Launch Day)

For prospects who aren't ready for concierge but are interested in the platform:

### Charter Member Offer:
"Be one of our first 10 customers. Lock in 50% off forever ($X/mo instead of $Y). $1 holds your spot today, your card gets charged $X/mo when the platform goes live (estimated 14 days). Cancel anytime."

### The mechanics:
- Stripe Payment Link with $1 setup fee
- Email confirmation with launch date
- Weekly check-in email until launch
- Activate subscription on launch day

### Target:
- 5 charter pre-signups by Day 14
- 10 by Day 21
- 15 by vetting clearance

This means $1.5-3k of recurring revenue committed before you flip the switch.

---

## Phase 6: Product Work (Strict Limits)

You're not building features. You're doing only these specific things to the product:

### Must-do:
1. **Workaround for demo** — set up a non-A2P fallback path so you can demo end-to-end to a number you own. 2 hour max.
2. **Onboarding flow polish** — first-time user can create a campaign in under 5 minutes without your help. 1 day max.
3. **Stripe billing integration** — if not already done. 1 day max.
4. **Vertical landing page** — single page that says "LevoHQ for [Medspas]" with 3 use cases, 1 Loom, and a "join the charter list" CTA. 1 day max.
5. **Basic AI auto-reply** — GPT-4 reads inbound text, replies appropriately, books appointment via Cal.com link. 2 days max.

### Total product time during waiting period: 5-7 working days, spread across the wait.
That means you should be doing PRODUCT WORK no more than 2-3 hours per day, max. The other 8-9 hours of your 12 are sales, prospecting, calls, and concierge delivery.

If you're spending more than 3 hours/day on product, you're hiding from sales. Full stop.

---

## Phase 7: The Daily Schedule (Every Weekday)

This is what 12 hours looks like, in detail. Wake up early, get this done, go to bed:

**6:00-7:00 — Morning routine**
- Workout (lifting 4x/week, cardio 2x/week, rest 1x — yes this is on the list, your physicality affects your sales energy)
- Cold shower (optional but recommended)
- Black coffee + protein

**7:00-7:30 — Plan the day**
- Review yesterday's metrics (touches sent, replies, calls, MRR)
- Open your prospect sheet, pick today's 60 targets
- Write 3 priorities for the day

**7:30-11:30 — Outbound block (4 hours)**
- 30 Instagram DMs
- 20 cold emails
- 10 cold calls (do these LAST in the block, between 10:30-11:30 when small biz owners are at their desks)
- Track every touch in the sheet

**11:30-12:30 — Lunch + walk**
- Real food, not a granola bar
- Get outside for 15 minutes
- No phone during this hour

**12:30-2:30 — Calls + demos (2 hours)**
- Discovery calls with anyone who replied
- If no calls booked: use this time for follow-ups (DM "hey, did you see my message?" to non-responders from yesterday)

**2:30-4:30 — Concierge work (2 hours)**
- Run today's SMS sends for concierge customers
- Update their reports
- Handle inbound replies

**4:30-5:30 — Product / content (1 hour)**
- One of: a single product task from Phase 6
- OR: write a niche-specific blog post for SEO
- OR: record a Loom

**5:30-6:30 — Dinner**

**6:30-8:30 — Follow-up + admin (2 hours)**
- Reply to every email/DM that came in during the day
- Update prospect sheet
- Send tomorrow's calendar invites for booked calls
- Process Stripe / billing / onboarding for any new customers

**8:30-9:00 — Tomorrow's plan**
- Write tomorrow's 3 priorities
- Set out clothes / coffee / phone away from bed

**9:00-10:00 — Decompress**
- Read fiction or paper book (NOT business books, NOT phone)
- No screens

**10:00 — Sleep**
- 8 hours minimum. Non-negotiable. Sleep is sales performance.

This is hard. It's also the schedule. Run it for 30 days and tell me you're not closing customers.

---

## Phase 8: Weekly Metrics Review (Every Sunday Evening)

Track these in a Google Sheet, one row per week:

- Touches sent (DM + email + call) — target 300/week
- Replies received — target 30/week
- Discovery calls held — target 5/week
- Concierge customers — target +1/week through Day 21
- Charter pre-signups — target +2/week through Day 21
- MRR committed (concierge + charter) — target $500/week increase
- Loom views — track engagement
- Hours spent on product — target <15/week

If three weeks pass and you're below 60% of targets across the board, something is structurally wrong. Diagnose: bad list, bad message, bad ICP, or bad discipline.

---

## Phase 9: Decision Points

### If vetting clears in 5-10 days (best case):
- Migrate concierge customers to platform with bonus pricing
- Activate charter member subscriptions
- Continue cold outreach at full volume
- First real MRR target: $5k by Day 30 post-clearance

### If vetting clears at Day 14-21 (likely case):
- Same as above, just compressed
- Your runway is fine

### If vetting fails:
- Open Twilio support ticket same day
- Read failure reason carefully — usually fixable (business description, sample messages, opt-in flow)
- Resubmit within 48 hours with fixes
- Continue concierge play indefinitely; it's actually your real business while you sort this out

### If vetting drags past Day 30:
- Open Twilio support ticket
- Escalate via Twilio account exec if you have one
- Triple down on concierge — it's no longer a bridge, it's the business
- Re-evaluate the SaaS vehicle entirely by Day 60

---

## Phase 10: Mindset Rules

Read these every morning until you don't need to:

1. **Selling is the job.** Building is hiding. If you're building, ask: "have I done 60 touches today?" If no, stop building.

2. **The product doesn't have to be perfect.** It has to solve one specific pain for one specific person well enough that they pay.

3. **Rejection means data, not failure.** A "no" tells you something about your ICP or message. A "no response" tells you something about your channel or volume. Track and adjust.

4. **Your runway is 60 days, every day.** Even with 4 months in the bank, operate like 60 days. Comfort kills founders.

5. **Health is leverage.** Sleep deprivation cuts your closing rate in half. Skipping the gym makes you sound flat on calls. This is not optional.

6. **Boredom is the enemy.** Most founders fail not at the hard moments but at the boring middle. The 30-touch days when nothing replies. Push through.

7. **You don't need to make millions today.** You need to make the next customer today. Stacked customers become millions.

---

## The Forcing Function

If by Day 21 of executing this playbook you have:
- 0 concierge customers
- 0 charter pre-signups
- Less than 600 outbound touches sent total

Then you have a discipline problem, not a market problem. Owning that is the first step.

If you have:
- 1+ concierge customer
- 3+ charter pre-signups
- 1500+ outbound touches sent

Then the market is responding to you and we tune the funnel.

Execute the list. Then we talk.
