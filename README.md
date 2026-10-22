# Spotter — your AI gym buddy

Spotter tells a nervous gym beginner exactly what to do next: which machine, how to set it up, how much weight, and how to come back after a missed week.

Built as a hackathon MVP (deadline: 22 Oct 2026, 12:30 PM). The full scope is in [docs/MVP_SCOPE.md](docs/MVP_SCOPE.md).

## Job to be done

**When** I walk into the gym as a nervous beginner and don't know the machines, **I want** to be told exactly which machine to use, how to set it up and how much to lift, **so I can** train with a plan instead of guessing, and get back on track after missing days.

**User:** a self-described beginner gym-goer in India who pays for a membership but barely uses it (for example, 2–3 visits on a 1-year plan, feeling "completely lost and overwhelmed").

## The 3 tests

| # | Test | How to check |
|---|---|---|
| 1 | I answer 5 questions, including "I'm scared and don't know the machines", and within **30 seconds** I see my first exercise: machine, setup steps, weight, sets × reps. | Run the chat. Last measured: **~9–12 seconds** with the AI. |
| 2 | I log my sets, then "3 days pass": a shorter, lighter **comeback session** appears (and the email text is shown). | Press **Done ✓**, then **Pretend 3 days passed**. |
| 3 | **Bad input** is handled: blank or nonsense answers are re-asked, and under-18 / over-55 / pain / drugs get a "a person needs to check this first" message instead of a plan. | Type a blank answer, `??`, age 16, or "my back hurts". |

## Current workflow → future workflow

| Today (without Spotter) | With Spotter |
|---|---|
| Buy a long membership, go 2–3 times | Same, but the first visit has a plan |
| Go off-peak to avoid people (**stays — the user chooses**) | Same |
| Do random exercises | A 3-day plan built from a fixed exercise library |
| Search TikTok/YouTube for how to use a machine | An "Next exercise" card: machine, setup steps, weight |
| Stop after a missed week and never restart | After 3 days with no log, a shorter comeback session |
| Ask strangers on Reddit when stuck | *(v2)* plateau check |
| Pay a trainer per question | *(v2)* trainer escalation |

## Architecture: Input → AI → Logic → Action → Output

**Flow A — first session**

| Stage | What happens |
|---|---|
| **Input** | 5 typed answers: goal, days per week, age, gym, what makes you nervous |
| **Logic (before AI)** | Blank/nonsense checks, then safety rules (age, health problems, drugs, diet plans). A flag stops the flow. |
| **AI** | One call: understands the answers, picks exercise **IDs** from the library, returns a strict JSON tool call |
| **Logic (after AI)** | Every ID is checked against `lib/exercises.json`; unknown IDs are rejected. Sets, reps, rest, setup steps and weights come from our library, not the AI. If anything fails, a standard starter plan is used. |
| **Action** | Save the plan |
| **Output** | "Here's what I understood" box (marked *written by AI*), then the exercise card |

**Flow B — logging:** tap **Done ✓** or **Couldn't finish** → plain-code rule *(all reps hit → +2.5 kg, never above the exercise's cap)* → next card.

**Flow C — comeback:** no log in 3 days (plain-code date check) → one AI call writes a short, guilt-free message and picks 2 easy exercises → IDs validated → comeback card at 80% of your weight, 2 × 8.

## Where AI is used

Only in 2 places, both because the input is free text that a form or keyword list would miss:

1. **Building the plan** (`lib/ai.ts` → `buildPlan`): understands "I'm scared and don't know the machines" and picks fitting machines.
2. **Writing the comeback** (`lib/ai.ts` → `writeComeback`): the right tone depends on *why* someone missed days ("exams", "stressed").

Everything else is plain code: answer checks, safety rules, sets/reps/rest, progression, the 3-day rule, and checking the AI's output.

## What stays human

- The user's own choices: their answers, when to go to the gym, tapping Done or Couldn't finish, and whether to start the comeback.
- Anyone under 18, over 55, or who mentions pain, a health condition, drugs or a diet plan gets **no plan**. They're told a trainer or professional must check first. *(The trainer review queue itself is v2; for now the app just stops.)*
- Gym staff should verify each gym's equipment list. Every card says **"Setup not yet verified by gym staff"** until they do.

## Why these tools

| Tool | Why |
|---|---|
| **Next.js** | One project for the screen and the API routes; deploys to Vercel with no extra setup |
| **Gemini** (via **OpenRouter**) | Fast model for a sub-30-second answer; one API key. Called through `fetch`, so there's no extra library. |
| **Plain TypeScript rules** | Safety checks and weight progression must behave identically every time and be easy to test |
| **A browser cookie for storage** | Simplest thing that works on Vercel (no database or disk needed) and keeps each visitor's plan separate |
| **GitHub** | Code, exercise library and tests in one place |

The original scope also names n8n (daily schedule + email) and Vercel Postgres; those are not built yet (see below).

## Failure cases

| What could go wrong | What the app does |
|---|---|
| Blank or nonsense answer | Asks again, kindly. Nothing is sent to the AI. |
| Under 18 / over 55 / pain / health condition / drugs / diet plan | Shows "A person needs to check this first" and builds no plan |
| Fear words like "I'm scared I'll get hurt" | **Not** blocked — fear is normal; only stated problems ("my back hurts", "I have asthma") are |
| AI is slow, down, or the key is missing | After 25 s, falls back to a standard starter plan with a yellow banner saying it isn't personalised |
| AI invents an exercise, or returns broken JSON | Unknown IDs are rejected; falls back to the standard plan |
| AI writes about diet, drugs or medicine | That text is dropped and a standard message is used |
| AI misreads the person | The "Here's what I understood" box shows its reading, with a **Start over** link |
| Gym setup details are wrong | Each card says they are not yet verified by gym staff |

### Known limits (honest list)

- The comeback **email is only a preview on screen** — nothing is sent, and there is **no daily schedule** yet (the "Pretend 3 days passed" button runs the same logic on demand).
- Storage is a **cookie in the visitor's own browser** (no login, no database). It's lost if they clear cookies or switch device, and only the last few logs are kept. A real launch needs a database such as Postgres.
- Only 7 exercises for a single gym, and only day 1 of the 3-day plan is shown.
- The health-keyword rules are a first version and will miss some phrasings.

## How to run it locally

You need **Node.js** (v20 or newer) and an **OpenRouter API key** (it starts with `sk-or-v1-`).

```bash
# 1. Install the libraries
npm install

# 2. Create your secrets file and paste your key after the = sign
echo "OPENROUTER_API_KEY=paste_your_key_here" > .env.local

# 3. Start the app
npm run dev
```

Then open http://localhost:3000.

**Click first:** type the 5 answers (for the last one try "I'm scared and don't know the machines"), press **Done ✓**, then **Pretend 3 days passed**.

Run the checks with `npm test`.

Without a key the app still works. It just shows the standard starter plan with a yellow banner.

**Your key stays private.** `.env.local` is listed in `.gitignore`, so git never uploads it. The key is only read on the server in `lib/ai.ts` and never reaches the browser.

## Project map

```
app/page.tsx                     the one main screen
app/components/                  OnboardingChat, ExerciseCard
app/api/{plan,log,comeback,state,reset}/route.ts
lib/ai.ts                        the ONLY file that calls the AI
lib/safety.ts                    answer checks + safety rules
lib/progression.ts               +2.5 kg rule, comeback weight
lib/validatePlan.ts              rejects exercises not in the library
lib/exercises.json               the exercise library (one gym)
lib/db.ts, lib/view.ts           cookie storage and what the screen shows
tests/basic.test.ts              automated checks
docs/MVP_SCOPE.md                the scope this was built from
```

## Deploy to Vercel

1. Go to https://vercel.com/new and import the `spotter-mvp` GitHub repo (framework: Next.js, detected automatically).
2. Before pressing **Deploy**, open **Environment Variables** and add `OPENROUTER_API_KEY` with your key.
3. Press **Deploy**. Vercel gives you a link like `https://spotter-mvp.vercel.app`.

## What's next (v2)

n8n daily schedule + real email, Postgres, plateau check at weeks 8–12, trainer review queue, video clips, Hindi and regional languages.
