# Spotter — your AI gym buddy

Spotter tells a nervous gym beginner exactly what to do next: which machine, how to set it up, how much weight, and how to come back after a missed week. It's a full-stack web app with a real database and an AI coach, and **it's completely free to use, with every feature, for everyone**.

**Sign-up is just a name.** No email, no password, no card.

The original problem statement and scope are in [docs/MVP_SCOPE.md](docs/MVP_SCOPE.md).

## The problem

Beginner and intermediate gym-goers spend their first 3–4 months guessing at machines, weights and routines. They're too embarrassed to ask, they have no plan for coming back after missed days, and they can't tell why their progress stalled.

**Job to be done:** *When* I walk into the gym as a nervous beginner and don't know the machines, *I want* to be told exactly which machine to use, how to set it up and how much to lift, *so I can* train with a plan instead of guessing, and get back on track after missing days.

## How the website is laid out

| Page | What it's for |
|---|---|
| **Landing** (`/`) | Pitch, how it works, "free for everyone", FAQ. The name box is right in the hero. |
| **Welcome** (`/welcome`) | Shown once after joining: your access code, then on to setup |
| **Setup** (`/onboarding`) | 5 questions in your own words, then tick the machines your gym has |
| **Today** (`/app`) | Your next workout, stats, and the comeback card when you've been away |
| **Plan** (`/app/plan`) | Your whole 3-day plan, with current weights and what's next |
| **Library** (`/app/library`) | All 15 exercises with set-up steps and tips, so you can learn a machine before touching it |
| **Progress** (`/app/progress`) | Streak, workouts per week, a chart for every lift |
| **Coach** (`/app/coach`) | Ask Spotter anything, and run the plateau check |
| **Settings** (`/app/settings`) | Access code, machines, rebuild plan, log out, delete everything |
| **Log in** (`/login`) | For getting back in from another device with your access code |

## Name-only accounts: how they work

- You type a name and you're in. A signed, `httpOnly` cookie (valid for a year) keeps you logged in on that device.
- There is no password to forget, so you're given a **10-character access code** (like `K7M2Q-9XAB4`). It's the only way back in from another phone or browser. It's stored only as a hash, so we can't show it again, but **Settings → Make a new access code** replaces it.
- **Trade-off, stated plainly:** anyone who has your code, or your unlocked device, can open your account, and if you lose both you can't recover it. That's the price of "just a name". Email recovery could be added later.
- To stop abuse of the free AI: a limit on sign-ups per network per hour, and generous daily limits per person on plan builds, coach messages, plateau checks and comebacks ([lib/config.ts](lib/config.ts)).

## What's in the product (all free)

| Area | What it does |
|---|---|
| **AI plan** | A 3-day beginner plan from a fixed 15-exercise library, using only the machines you ticked |
| **Workout runner** | One exercise at a time: machine, set-up steps, tip, weight, sets × reps, a set tracker and a rest timer |
| **Auto progression** | Every set done → the weight goes up a safe, capped step. A missed set → it stays. Plain code. |
| **Comeback** | After 3 days with no workout, a shorter, lighter session written by the AI. A daily job prepares it, or tap "Get my comeback session". |
| **Progress** | Streak, workouts per week, a chart per lift, recent sessions |
| **Plateau check** | A rule flags lifts stuck 3+ weeks; the AI explains why and what to try |
| **Ask Spotter** | AI coach chat about machines, form, weights and motivation. Health, diet, drugs and mental-health questions are refused with a referral. |
| **Safety** | Under 18 / over 55 / pain / health condition / drugs / diet plans → no plan, "a person needs to check this first" |
| **"This looks wrong"** | Every exercise card has a report button |
| **PWA** | Installable on a phone's home screen |

## The 3 tests

| # | Test | Result |
|---|---|---|
| 1 | I answer the questions, including "I'm scared and don't know the machines", and **within 30 seconds** see my first exercise: machine, setup, weight, sets × reps. | Plan built in about 3–14 s; the card shows instantly |
| 2 | I log my sets, "3 days pass", and a shorter, lighter **comeback session** appears. | Works, in the app |
| 3 | **Bad input** is handled: blank or nonsense answers, under-18 / over-55 / pain / drugs. | Re-asked, or "a person needs to check this first" |

`npm run e2e` runs 51 checks against a running app, covering all three.

## Current workflow → future workflow

| Today (without Spotter) | With Spotter |
|---|---|
| Buy a long membership, go 2–3 times | Same, but the first visit has a plan |
| Go off-peak to avoid people (**the user's choice, so it stays**) | Same |
| Do random exercises | A 3-day plan built from the machines the gym has |
| Search TikTok/YouTube for how to use a machine | An exercise card, plus a library of every machine |
| Stop after a missed week and never restart | After 3 days away, a shorter comeback session waiting in the app |
| Ask strangers on Reddit why progress stalled | Plateau check: a rule flags it, the AI explains why |
| Pay a trainer per question | Ask Spotter. A trainer-review queue for under-18 / over-55 / pain is a v2 item. |

## Architecture: Input → AI → Logic → Action → Output

| Flow | Input | AI | Logic | Action | Output |
|---|---|---|---|---|---|
| **Plan** | 5 answers + machines ticked | Understands the answers, picks exercise **IDs** | Safety rules *before* the AI. Every ID checked against the library and the ticked machines. Sets, reps, weights and setup come from our library, never the AI. Any problem → standard plan. | Save profile, plan and weights | "Here's what Spotter understood" (marked *written by AI*) and the first card |
| **Workout** | Tap each set | None | Progression rule: all sets → +step (capped). Missed → hold. | Save the sets, update the weight | Result per exercise and a summary |
| **Comeback** | Daily job, or the "comeback" button | Writes a short guilt-free message and picks 2 easy exercises | 3-days-no-workout rule. IDs validated. Weight = 80%. | Save it | Comeback card on Today |
| **Plateau** | "Check now" | Explains why and what to try | Rule: weight unchanged 3+ weeks over 3+ sessions | Save to chat history | The flagged lifts and an explanation |
| **Coach** | A question | Answers | Risky topics refused *before* the AI. Reply scanned for off-limits topics. | Save the conversation | Reply |

**Stack:** Next.js 16 (App Router) · Tailwind CSS · Postgres (Neon on Vercel, an embedded Postgres locally) · Gemini via OpenRouter · Vercel (hosting + daily Cron).

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
| **Postgres** | A real relational database for users, plans and logs. Neon plugs into Vercel in a few clicks. |
| **Embedded Postgres locally** | `npm run dev` works with no database to install |
| **Gemini via OpenRouter** | Fast and cheap enough for sub-30-second answers; one key; swappable via `AI_MODEL` |
| **Access codes, not passwords** | Removes the biggest sign-up barrier. Nothing sensitive is stored, so there's nothing to leak. |
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
| AI misreads the person | "Here's what Spotter understood" is shown; they can re-answer any time |
| Wrong or unavailable machine | The user ticks the machines; unticked ones are never used. A "this looks wrong" button reports it. |
| Lost phone / cleared cookies | Log in with the access code. Without it the account can't be recovered. |
| Someone makes thousands of accounts or spams the AI | Per-network sign-up limit and per-person daily AI limits |
| Double tap or replay | Logging the same exercise twice is rejected; a half-finished workout resumes |
| Someone else's data | Every query is scoped to the logged-in user |

### Known limits (an honest list)

- The exercise library is 15 exercises. Set-up steps are general and **not yet verified by gym staff**.
- One plan type (3-day full body), English only, no video clips yet.
- Trainer-review queue is not built: flagged users are told to see a professional.
- **No email, so no reminders**: a comeback waits for you inside the app. Push/WhatsApp nudges are a v2 item.
- The legal page is a plain-language draft. Have a lawyer review it before a large public launch.
- Anyone with your access code can open your account, and lost codes can't be recovered.

## Run it locally

You need **Node.js 20+** and an **OpenRouter key** (it starts with `sk-or-v1-`).

```bash
npm install
cp .env.example .env.local      # then paste your key into .env.local
npm run dev
```

Open http://localhost:3000. No database setup is needed: an embedded Postgres is created in `./data`.

**Try the whole product in 2 minutes:** type a name → answer the questions → **Start workout** → tap the sets. Then in **Settings → Demo tools**: *Add 6 weeks of history* (Progress and the plateau check), *Pretend 3 days passed* (comeback session).

```bash
npm test          # unit tests: safety, progression, plan, plateau and streak logic
npm run e2e       # 51 end-to-end checks against the running app
npm run build     # production build
```

(Start the app with `SIGNUP_LIMIT_PER_HOUR=1000` before running `npm run e2e` repeatedly.) Your key stays private: `.env.local` is in `.gitignore`, and keys are only ever read on the server.

## Deploy to Vercel (about 10 minutes)

1. **Import the repo** at https://vercel.com/new (pick `spotter-mvp`). Vercel detects Next.js. Every `git push` to `main` then redeploys automatically.
2. **Add a database:** Project → *Storage* → *Create Database* → **Neon** (free). This adds `DATABASE_URL` for you. Tables are created automatically on the first request. If you deployed the earlier email/password version, the existing tables are upgraded automatically.
3. **Add environment variables** (Project → Settings → Environment Variables; see [.env.example](.env.example)):
   - `OPENROUTER_API_KEY`: your AI key
   - `SESSION_SECRET`: a long random string (run `openssl rand -base64 32`)
   - `CRON_SECRET`: another long random string, used by the daily comeback job in [vercel.json](vercel.json)
   - Optional: `ALLOW_DEMO_TOOLS=1` to keep the demo tools visible on the live site while you show it off
   - Optional: `SIGNUP_LIMIT_PER_HOUR` (default 8 per network). Raise it if many people join from one venue's Wi-Fi.
4. **Redeploy** (Deployments → ⋯ → Redeploy). Visit `/api/health`: it should show `"db": true` and `"ai": true`.

## Project map

```
app/page.tsx                  landing page
app/(auth)/                   login (access code), signup (name)
app/welcome/, app/onboarding/ welcome + access code, then the setup chat and machine checklist
app/app/                      Today, Plan, Library, Progress, Coach, Settings
app/api/                      auth, onboarding, workout, comeback, coach, cron, demo, health
app/components/               WorkoutRunner, OnboardingWizard, NameStart, CoachClient, charts ...
lib/ai.ts                     the ONLY file that calls the AI
lib/safety.ts                 safety rules and answer checks
lib/progression.ts            weight progression
lib/plan.ts, plateau.ts, stats.ts   plan building, plateau rule, streaks (pure, tested)
lib/exercises.ts              the exercise library
lib/workout.ts, comeback.ts   the workout and comeback engines
lib/auth.ts                   name-only accounts, access codes, cookies
lib/db.ts, queries.ts         Postgres access and the schema
tests/logic.test.ts           unit tests
scripts/e2e.mjs               end-to-end tests
vercel.json                   the daily comeback job
```

## Roadmap

Trainer review queue · more exercises, gyms and verified equipment lists · optional email or push reminders · video clips · gym partnerships and an owner retention dashboard · Hindi and regional languages · a survey of 20 beginners and a one-gym pilot to measure retention past month 3.
