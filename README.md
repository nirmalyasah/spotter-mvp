# Spotter — your AI gym buddy

Spotter tells a nervous gym beginner exactly what to do next: which machine, how to set it up, how much weight, and how to come back after a missed week. It's a full-stack web app with accounts, a real database, an AI coach, subscriptions and a daily comeback job. It is built to launch and to earn.

The original problem statement and scope are in [docs/MVP_SCOPE.md](docs/MVP_SCOPE.md).

## The problem

Beginner and intermediate gym-goers spend their first 3–4 months guessing at machines, weights and routines. They're too embarrassed to ask, they have no plan for coming back after missed days, and they can't tell why their progress stalled.

**Job to be done:** *When* I walk into the gym as a nervous beginner and don't know the machines, *I want* to be told exactly which machine to use, how to set it up and how much to lift, *so I can* train with a plan instead of guessing, and get back on track after missing days.

## What's in the product

| Area | What it does |
|---|---|
| **Landing page** | Pitch, how it works, pricing (Free / Pro), FAQ, legal |
| **Accounts** | Sign up, log in, log out, delete account and all data. Passwords hashed, login in a secure `httpOnly` cookie. |
| **Onboarding** | 5 questions in the user's own words, then tick the machines the gym has. Safety rules run first. |
| **AI plan** | A 3-day beginner plan from a fixed 15-exercise library, using only the machines the user ticked |
| **Workout runner** | One exercise at a time: machine, setup steps, tip, weight, sets × reps, a set tracker and a rest timer |
| **Auto progression** | Every set done → the weight goes up a safe, capped step. A missed set → it stays. Plain code. |
| **Comeback** | No workout in 3 days → a shorter, lighter session written by the AI, shown in-app and emailed. A daily cron finds the people. |
| **Progress** | Streak, workouts per week, a chart per lift, recent sessions |
| **Pro: plateau check** | A rule flags lifts stuck 3+ weeks; the AI explains why and what to try |
| **Pro: Ask Spotter** | AI coach chat about machines, form, weights and motivation. Health, diet, drugs and mental-health questions are refused with a referral. |
| **Safety** | Under 18 / over 55 / pain / health condition / drugs / diet plans → no plan, "a person needs to check this first" |
| **"This looks wrong"** | Every exercise card has a report button that saves a report for a human to check |
| **PWA** | Installable on a phone's home screen |

## How it makes money

- **Free:** AI plan (3 builds a month), exercise cards, auto progression, comeback sessions, progress charts.
- **Spotter Pro, ₹199/month:** unlimited plan rebuilds, the plateau check, Ask Spotter. The price lives in [lib/config.ts](lib/config.ts).
- **Stripe Checkout** for subscriptions, a signed webhook to switch Pro on and off, and a billing portal for cancelling. All of it is built; it switches on when you add Stripe keys.
- **Next:** gym partnerships and a retention dashboard for owners (the metric gyms pay for is retention past month 3).

## The 3 tests

| # | Test | Result |
|---|---|---|
| 1 | I answer the questions, including "I'm scared and don't know the machines", and **within 30 seconds** see my first exercise: machine, setup, weight, sets × reps. | Plan built in about 4–14 s; card shown instantly |
| 2 | I log my sets, "3 days pass", and a shorter, lighter **comeback session** appears (and is emailed). | Works; email sends once Resend is set up |
| 3 | **Bad input** is handled: blank or nonsense answers, under-18 / over-55 / pain / drugs. | Re-asked or "a person needs to check this first" |

`npm run e2e` runs 39 checks against a running app, covering all three.

## Current workflow → future workflow

| Today (without Spotter) | With Spotter |
|---|---|
| Buy a long membership, go 2–3 times | Same, but the first visit has a plan |
| Go off-peak to avoid people (**the user's choice, so it stays**) | Same |
| Do random exercises | A 3-day plan built from a fixed library, from the machines the gym has |
| Search TikTok/YouTube for how to use a machine | An exercise card: machine, setup steps, weight |
| Stop after a missed week and never restart | After 3 days with no workout, a shorter comeback session by email |
| Ask strangers on Reddit why progress stalled | Plateau check: a rule flags it, AI explains why (Pro) |
| Pay a trainer per question | Ask Spotter (Pro). Trainer review for under-18 / over-55 / pain is a v2 queue. |

## Architecture: Input → AI → Logic → Action → Output

| Flow | Input | AI | Logic | Action | Output |
|---|---|---|---|---|---|
| **Plan** | 5 answers + machines ticked | Understands the answers, picks exercise **IDs** | Safety rules *before* the AI. Every ID checked against the library and the ticked machines. Sets, reps, weights and setup come from our library, never from the AI. Any problem → standard plan. | Save profile, plan and weights | "Here's what Spotter understood" (marked *written by AI*) and the first card |
| **Workout** | Tap each set | None | Progression rule: all sets → +step (capped). Missed → hold. | Save the sets, update the weight | Result per exercise and a summary |
| **Comeback** | Daily cron (or the demo button), plus optional "why I missed" | Writes a short guilt-free message and picks 2 easy exercises | 3-days-no-workout rule. Risky text never reaches the AI. IDs validated. Weight = 80%. | Save, email via Resend | Comeback card in-app and an email |
| **Plateau (Pro)** | Click "Check now" | Explains why and what to try | Rule: weight unchanged 3+ weeks over 3+ sessions | Save to chat history | The flagged lifts and an explanation |
| **Coach (Pro)** | A question | Answers | Risky topics refused *before* the AI. Reply scanned for off-limits topics. | Save the conversation | Reply |

**Stack:** Next.js 16 (App Router) · Tailwind CSS · Postgres (Neon on Vercel, an embedded Postgres locally) · Gemini via OpenRouter · Stripe · Resend · Vercel (hosting + Cron).

## Where AI is used

Four places, each because the input is free text that a form or keyword list would miss: building the plan, writing the comeback, the plateau explanation, and the coach chat. Everything else is plain code, so it behaves identically every time and is easy to test: answer checks, safety rules, sets/reps/rest, progression, the 3-day rule, the plateau rule, streaks and checking the AI's output.

## What stays human

- The user's choices: their answers, which machines the gym has, when to go, tapping each set, whether to start a comeback.
- Anyone under 18, over 55, or who mentions pain, a health condition, drugs or a diet plan gets **no plan**, only a referral to a trainer or doctor.
- Gym staff should verify each gym's equipment list. Cards carry a "set-up not yet verified" notice, and the report button sends feedback to a person.

## Why these tools

| Tool | Why |
|---|---|
| **Next.js on Vercel** | One project for pages and the API; deploys on every `git push`; Cron included |
| **Postgres** | A real relational database for users, plans, logs. Neon plugs into Vercel in a few clicks. |
| **Embedded Postgres locally** | `npm run dev` works with no database to install |
| **Gemini via OpenRouter** | Fast and cheap enough for sub-30-second answers; one API key; swappable via `AI_MODEL` |
| **Stripe** | Subscriptions, tax and cards handled by a trusted provider; we never see card details |
| **Resend** | Simple transactional email for the comeback nudges |
| **Plain TypeScript rules** | Safety and progression must be predictable and testable |

## Failure cases

| What could go wrong | What the app does |
|---|---|
| Blank or nonsense answer | Asks again, kindly. Nothing is sent to the AI. |
| Under 18 / over 55 / pain / health condition / drugs / diet plan | "A person needs to check this first", no plan, workouts paused |
| "I'm scared I'll get hurt" | **Not** blocked. Fear is normal; only stated problems ("my back hurts") are. |
| AI slow, down, or returns an unusable answer | Retries once, then a standard starter plan with a visible banner |
| AI invents an exercise | Unknown IDs rejected; falls back to the standard plan |
| AI writes about diet, drugs or medicine | That text is dropped and a standard message is used |
| AI misreads the person | "Here's what Spotter understood" is shown; they can re-answer in Settings |
| Wrong or unavailable machine | The user ticks the machines; unticked ones are never used. A "this looks wrong" button reports it. |
| Free plan limit reached | A clear message with the Pro option |
| Payments not set up | The upgrade button says so instead of failing |
| Double tap or replay | Logging the same exercise twice is rejected; a half-finished workout resumes |
| Someone else's data | Every query is scoped to the logged-in user; forged Stripe webhooks are rejected |

### Known limits (an honest list)

- The exercise library is 15 exercises. Set-up steps are general and **not yet verified by gym staff**.
- One plan type (3-day full body), English only, no video clips yet.
- Trainer-review queue is not built: flagged users are told to see a professional.
- Stripe, email and the daily cron need your keys (below). Until then Pro can't be bought and nothing is emailed.
- The legal page is a plain-language draft. Have a lawyer review it before a large public launch.
- No rate limiting on login yet, and no password-reset email.

## Run it locally

You need **Node.js 20+** and an **OpenRouter key** (it starts with `sk-or-v1-`).

```bash
npm install
cp .env.example .env.local      # then paste your key into .env.local
npm run dev
```

Open http://localhost:3000. No database setup is needed: an embedded Postgres is created in `./data`.

**Try the whole product in 2 minutes:** sign up → answer the questions → **Start workout** → tap the sets. Then in **Settings → Demo tools**: *Add 6 weeks of history* (Progress + plateau check), *Switch to Pro (demo)* (Coach), *Pretend 3 days passed* (comeback session).

```bash
npm test          # unit tests for the safety, progression, plan, plateau and streak logic
npm run e2e       # 39 end-to-end checks against the running app
npm run build     # production build
```

Your keys stay private: `.env.local` is in `.gitignore`, and keys are only ever read on the server.

## Deploy to Vercel (about 10 minutes)

1. **Import the repo** at https://vercel.com/new (pick `spotter-mvp`). Vercel detects Next.js.
2. **Add a database:** Project → *Storage* → *Create Database* → **Neon** (free). This adds `DATABASE_URL` for you. Tables are created automatically on the first request.
3. **Add environment variables** (Project → Settings → Environment Variables). See [.env.example](.env.example):
   - `OPENROUTER_API_KEY`: your AI key
   - `SESSION_SECRET`: a long random string (run `openssl rand -base64 32`)
   - `CRON_SECRET`: another long random string. The daily comeback job in [vercel.json](vercel.json) uses it.
   - Optional: `ALLOW_DEMO_TOOLS=1` to keep the demo tools visible on the live site for showing it off.
4. **Redeploy** (Deployments → ⋯ → Redeploy). Visit `/api/health`: it should show `"db": true` and `"ai": true`.
5. **Turn on payments** (when ready): create a Stripe account, set `STRIPE_SECRET_KEY`, add a webhook to `https://YOUR-SITE/api/billing/webhook` for `checkout.session.completed`, `customer.subscription.updated` and `customer.subscription.deleted`, and set `STRIPE_WEBHOOK_SECRET`. Use Stripe's test mode first.
6. **Turn on comeback emails:** create a [Resend](https://resend.com) account, set `RESEND_API_KEY` and `EMAIL_FROM` (a verified sender).

## Project map

```
app/page.tsx                  landing page + pricing
app/(auth)/                   login, signup
app/onboarding/               the setup chat + machine checklist
app/app/                      the signed-in product: Today, Progress, Coach, Settings
app/api/                      auth, onboarding, workout, coach, billing, cron, demo, health
app/components/               WorkoutRunner, OnboardingWizard, CoachClient, charts ...
lib/ai.ts                     the ONLY file that calls the AI
lib/safety.ts                 safety rules and answer checks
lib/progression.ts            weight progression
lib/plan.ts, plateau.ts, stats.ts   plan building, plateau rule, streaks (pure, tested)
lib/exercises.ts              the exercise library
lib/workout.ts, comeback.ts   the workout and comeback engines
lib/billing.ts, email.ts      Stripe and Resend
lib/db.ts, queries.ts         Postgres access and the schema
tests/logic.test.ts           unit tests
scripts/e2e.mjs               end-to-end tests
vercel.json                   the daily comeback cron
```

## Roadmap

Trainer review queue · more exercises, gyms and verified equipment lists · video clips · WhatsApp/push nudges · gym partnerships and an owner retention dashboard · Hindi and regional languages · a survey of 20 beginners and a one-gym pilot to measure retention past month 3.
