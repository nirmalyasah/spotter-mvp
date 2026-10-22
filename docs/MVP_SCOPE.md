# Spotter – MVP Scope (reference)

Source: `Spotter_MVP_Scope_1.pdf` by Nirmalya Sah, Oct 21, 2026. This file is a condensed copy for building; the PDF is the original.

## What Spotter is
An AI gym buddy for beginner and intermediate gym-goers. It tells them exactly what to do next: which machine, how to set it up, how much weight, and how to come back after a missed week.

**Problem:** beginners spend their first 3–4 months guessing at machines, weights and routines. They're too embarrassed to ask, have no plan for coming back after missed days, and can't tell why progress stalled.

## MVP: one journey, 3 features
**Demo journey:** a nervous beginner gets today's session, does it, then gets a comeback session after skipping 3 days.

**Build deadline:** Oct 22, 2026, 12:30 PM.

### IN (build these)
1. **Onboarding chat → today's plan.** 5 questions (goal, days per week, the user's gym, what makes them nervous, …). Claude returns a **3-day beginner plan as JSON**, built **only from the exercise library**.
2. **"Next exercise" card + one-tap log.** Shows machine, setup steps, starting weight, sets × reps. A **progression rule** (plain code, not AI) sets the next session's weight, e.g. "hit all reps → add 2.5 kg", with a hard cap on how fast weight goes up.
3. **Comeback nudge.** An **n8n daily cron** finds users with no log in 3 days. Claude writes a shorter comeback session, sent **by email**.

### OUT (mention, don't build)
Video clips, plateau diagnosis, the trainer escalation queue, WhatsApp/push, payments, equipment lists for more than one gym.

### LATER (v2)
Plateau check at weeks 8–12; pay-per-question trainer escalation; gym partnerships plus a retention dashboard for owners; app store review mining; Hindi and regional languages.

### Magic moment
User types *"I'm scared and don't know the machines"* and **within 30 seconds** sees their first exercise: which machine, where to set the seat, 20 kg, 3 × 10.

## Who does what (AI vs rules)
| Step | Who | Why |
|---|---|---|
| Onboarding | AI | Free-text, often emotional input; a form misses anxiety and hidden constraints |
| Plan | AI + rules | AI picks exercises for the gym, anxiety level and age; rules set sets/reps/rest from proven templates |
| Next-exercise card | AI | Explains machines plainly, handles "this one's taken" |
| Logging + progression | Script | Arithmetic; AI adds cost and risk for nothing |
| Missed-day restart | Rule triggers, AI writes | 3-days-no-log is a rule; the comeback plan depends on *why* they missed (free text) |
| Plateau check (v2) | Rule flags, AI diagnoses | Flag: no weight increase in 3 weeks |
| Escalation (v2) | Human | Pain, medical conditions, mental health |

Principle: **Claude only does the work that needs judgement.** Weight changes and missed-day detection are plain rules in n8n.

## Tech stack
| Tool | Role in MVP |
|---|---|
| Claude | Onboarding answers → profile; builds plan from library (tool call, JSON output); writes comeback session |
| n8n | Daily missed-day cron, progression rule, safety keyword router, sending emails |
| GitHub | Repo for app, exercise library JSON, prompts and rules; Actions run tests on every push |
| Vercel | Hosts the Next.js app + API routes; Postgres (Vercel Marketplace) stores users and logs |

## Safety guardrails (from Limitations)
1. **Unsafe plan:** a certified trainer approves plans for users **under 18, over 55, or who mention pain or a condition** before the plan goes live. Hard cap on weight increases.
2. **Wrong equipment:** gym staff verify each gym's equipment list once. A **"this is wrong" button** sends a report to a person.
3. **Out of scope (diet, drugs, mental health):** messages mentioning these are held for review, and the user is pointed to a professional.

## Key numbers
- India: 12.3M gym members (2024) → 23.3M by 2030 (Deloitte); market $2,232M (2025), 14.89% CAGR (Ken Research)
- Estimated time saved: ~60 min/user/week (two inputs are still assumptions, marked GAP)
- Metric gyms pay for: retention past month 3 (baseline is a GAP)
