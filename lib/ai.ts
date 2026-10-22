import { library, libraryIds } from "./view";

// The ONLY file that talks to the AI. The key is read from .env.local on the server.
// It calls Gemini through OpenRouter (one key, OpenAI-style API).
const MODEL = "google/gemini-3.8-flash"; // fast model, so the plan arrives well inside 30 seconds

const exerciseList = () => library.map((e) => `${e.id}: ${e.name} (${e.machine})`).join("\n");

async function askForJson(system: string, user: string, toolName: string, schema: any) {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key || key.includes("paste_your_key_here")) throw new Error("OPENROUTER_API_KEY is not set in .env.local");

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    signal: AbortSignal.timeout(25000),
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 900,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      tools: [{ type: "function", function: { name: toolName, description: "Return the answer in this exact format.", parameters: schema } }],
      tool_choice: { type: "function", function: { name: toolName } },
    }),
  });
  if (!res.ok) throw new Error(`AI request failed (${res.status}): ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  const args = data.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
  if (!args) throw new Error("AI returned no structured answer");
  return typeof args === "string" ? JSON.parse(args) : args;
}

export function buildPlan(answers: Record<string, string>) {
  const system =
    "You are Spotter, a kind gym buddy for nervous beginners. Pick exercises ONLY from the list provided, by id. " +
    "Never give medical, diet or mental-health advice. Be warm and plain-spoken.";
  const user =
    `The person's answers:\n- Goal: ${answers.goal}\n- Days per week: ${answers.days}\n- Age: ${answers.age}\n` +
    `- Their gym: ${answers.gym}\n- What makes them nervous: ${answers.nervous}\n\n` +
    `Exercise library (use only these ids):\n${exerciseList()}\n\n` +
    "Make a 3-day beginner plan: 3 exercises per day, easy low-intimidation machines first if they are nervous. " +
    "Also write (1) a one-sentence summary of what you understood about this person, starting with 'You' , " +
    "and (2) one short encouraging sentence.";
  return askForJson(system, user, "make_plan", {
    type: "object",
    properties: {
      summary: { type: "string" },
      welcome: { type: "string" },
      days: {
        type: "array",
        items: {
          type: "object",
          properties: { exerciseIds: { type: "array", items: { type: "string", enum: libraryIds } } },
          required: ["exerciseIds"],
        },
      },
    },
    required: ["summary", "welcome", "days"],
  });
}

export function writeComeback(
  summary: string,
  plannedIds: string[],
  daysMissed: number,
  reason: string
) {
  const system =
    "You are Spotter, a kind gym buddy. Write short, gentle, guilt-free messages. " +
    "Pick exercises ONLY from the list, by id. Never give medical, diet or mental-health advice.";
  const user =
    `About the person: ${summary}\nThey usually do: ${plannedIds.join(", ")}\nThey missed ${daysMissed} days.\n` +
    `Why they missed (their words, may be empty): ${reason || "not said"}\n\n` +
    `Exercise library (use only these ids):\n${exerciseList()}\n\n` +
    "Pick 2 of the easiest exercises for a short comeback session. Write a 1-2 sentence on-screen message " +
    "and a short friendly email body (3-4 sentences). No guilt.";
  return askForJson(system, user, "make_comeback", {
    type: "object",
    properties: {
      exerciseIds: { type: "array", items: { type: "string", enum: libraryIds } },
      message: { type: "string" },
      email: { type: "string" },
    },
    required: ["exerciseIds", "message", "email"],
  });
}
