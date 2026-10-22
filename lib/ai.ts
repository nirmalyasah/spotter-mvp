import { EXERCISES, EXERCISE_IDS } from "./exercises.ts";

// The ONLY file that talks to the AI. The key is read from the server environment.
// It calls Gemini through OpenRouter (one key, OpenAI-style API).
const MODEL = process.env.AI_MODEL || "google/gemini-3.8-flash";

export const aiConfigured = () => !!process.env.OPENROUTER_API_KEY && !process.env.OPENROUTER_API_KEY.includes("paste_your");

async function call(payload: Record<string, any>) {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key || key.includes("paste_your")) throw new Error("OPENROUTER_API_KEY is not set");
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    signal: AbortSignal.timeout(25000),
    body: JSON.stringify({ model: MODEL, max_tokens: 3000, reasoning: { effort: "low" }, ...payload }),
  });
  if (!res.ok) throw new Error(`AI request failed (${res.status}): ${(await res.text()).slice(0, 200)}`);
  return res.json();
}

async function askJson(system: string, user: string, name: string, schema: any) {
  const body = {
    messages: [{ role: "system", content: system }, { role: "user", content: user }],
    tools: [{ type: "function", function: { name, description: "Return the answer in this exact format.", parameters: schema } }],
    tool_choice: { type: "function", function: { name } },
  };
  // The model occasionally replies without the structured answer. Try once more before giving up.
  for (let attempt = 0; attempt < 2; attempt++) {
    const data = await call(body);
    const args = data.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    if (args) { try { return typeof args === "string" ? JSON.parse(args) : args; } catch {} }
  }
  throw new Error("AI returned no structured answer");
}

async function askText(system: string, messages: { role: string; content: string }[]) {
  const data = await call({ messages: [{ role: "system", content: system }, ...messages] });
  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error("AI returned no answer");
  return String(text).trim();
}

const SAFE = "Never give medical, diet, supplement, drug or mental-health advice. If asked, tell them to talk to a qualified professional. Be warm, plain-spoken and brief.";
const listFor = (ids: string[]) => EXERCISES.filter((e) => ids.includes(e.id)).map((e) => `${e.id}: ${e.name} (${e.equipment})`).join("\n");
const idsEnum = (ids: string[]) => ({ type: "string", enum: ids.length ? ids : EXERCISE_IDS });

export type ProfileText = { goal: string; days_per_week: number; age: number; gym: string; nervous: string; summary?: string };

export function buildPlan(p: ProfileText, available: string[]) {
  return askJson(
    `You are Spotter, a kind gym buddy for nervous beginners. Pick exercises ONLY from the list, by id. ${SAFE}`,
    `The person:\n- Goal: ${p.goal}\n- Days per week: ${p.days_per_week}\n- Age: ${p.age}\n- Gym: ${p.gym}\n- What makes them nervous: ${p.nervous}\n\n` +
      `Exercises their gym has (use only these ids):\n${listFor(available)}\n\n` +
      "Make a 3-day beginner full-body plan: 3 or 4 exercises per day, mixing legs, push and pull. Put easy, low-intimidation machines first if they are nervous. " +
      "Also write (1) a one-sentence summary of what you understood about this person, starting with 'You', and (2) one short encouraging sentence.",
    "make_plan",
    {
      type: "object",
      properties: {
        summary: { type: "string" }, welcome: { type: "string" },
        days: { type: "array", items: { type: "object", properties: { exerciseIds: { type: "array", items: idsEnum(available) } }, required: ["exerciseIds"] } },
      },
      required: ["summary", "welcome", "days"],
    },
  ) as Promise<{ summary: string; welcome: string; days: { exerciseIds: string[] }[] }>;
}

export function writeComeback(p: ProfileText, usual: string[], available: string[], daysMissed: number, reason: string) {
  return askJson(
    `You are Spotter, a kind gym buddy. Write short, gentle, guilt-free messages. Pick exercises ONLY from the list, by id. ${SAFE}`,
    `About the person: ${p.summary || p.goal}\nThey usually do: ${usual.join(", ")}\nThey missed ${daysMissed} days.\nWhy (their words, may be empty): ${reason || "not said"}\n\n` +
      `Exercises available (use only these ids):\n${listFor(available)}\n\n` +
      "Pick 2 of the easiest exercises for a short comeback session. Write a 1-2 sentence on-screen message and a short friendly email body (3-4 sentences). No guilt.",
    "make_comeback",
    { type: "object", properties: { exerciseIds: { type: "array", items: idsEnum(available) }, message: { type: "string" }, email: { type: "string" } }, required: ["exerciseIds", "message", "email"] },
  ) as Promise<{ exerciseIds: string[]; message: string; email: string }>;
}

export function diagnosePlateau(p: ProfileText, facts: string) {
  return askText(
    `You are Spotter, a supportive gym coach for beginners. Explain WHY progress stalled using only the data given, then give 3 concrete, simple things to try (e.g. smaller weight jumps, rest, form, consistency). ${SAFE} Keep it under 170 words, no headings.`,
    [{ role: "user", content: `About me: ${p.summary || p.goal}. Age ${p.age}.\nMy stalled lifts:\n${facts}` }],
  );
}

export function coachReply(p: ProfileText, history: { role: string; content: string }[]) {
  return askText(
    `You are Spotter, a friendly AI gym buddy for a beginner. About them: ${p.summary || p.goal}. Answer questions about gym machines, form, how much weight, routines and motivation, in under 120 words. ${SAFE}`,
    history,
  );
}
