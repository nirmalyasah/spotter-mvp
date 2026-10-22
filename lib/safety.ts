// Plain-code safety rules. These run BEFORE any AI is called.

// Safety rules look for someone STATING a problem about themselves (e.g. "my back hurts",
// "I have asthma"), not just a scary-sounding word. Being afraid of getting hurt is normal for a
// beginner and must not be blocked.
const FEAR = "scared|afraid|worried|fear|nervous|anxious|terrified|avoid|prevent|without";
const BODY = "back|knee|shoulder|neck|hip|joint|wrist|ankle|elbow|chest";
const CONDITIONS = "injur\\w*|pain\\w*|surgery|asthma|diabet\\w*|arthritis|sciatica|hernia|epilep\\w*";

const HEALTH_PATTERNS: RegExp[] = [
  // "my back hurts", "my lower back is sore"
  new RegExp(`\\bmy\\s+(\\w+\\s+){0,2}(hurts?|aches?|is\\s+(sore|injured|painful)|are\\s+(sore|injured|painful))\\b`, "i"),
  // "I have asthma", "I'm injured", "I had surgery" (but not "I'm scared of injury")
  new RegExp(`\\bi\\s*(?:am|'m|\u2019m|have|had|got|was|ve got|\u2019ve got)\\s+((?!${FEAR})\\w+\\W+){0,3}(${CONDITIONS})\\b`, "i"),
  // "back pain", "knee injury"
  new RegExp(`\\b(${BODY})\\s+(pain|injury)\\b`, "i"),
  /\bhurts?\s+when\b/i,
  /\b(recovering from|doctor (said|told)|diagnosed|medical condition|health condition|heart (condition|disease|problem|attack)|high blood pressure|cerebral palsy|pregnan\w*|disabilit\w*)\b/i,
];

// Topics Spotter must never advise on (drugs, diet plans, serious mental health).
const OFF_LIMITS_INPUT =
  /\b(steroids?|sarms?|drugs?|depress\w*|suicid\w*|self[- ]?harm|ocd|panic attacks?|eating disorder|diet plan|meal plan|what (should|do) i eat|calorie (deficit|count\w*)|intermittent fasting)\b/i;

// For text the AI WRITES: it must not slip into diet, drug, medical or mental-health advice.
const OFF_LIMITS_AI =
  /\b(steroids?|sarms?|drugs?|diet|calorie\w*|supplements?|medication|diagnos\w*|depress\w*|suicid\w*|self[- ]?harm|eating disorder)\b/i;

const mentionsHealth = (t: string) => HEALTH_PATTERNS.some((r) => r.test(t));

export type SafetyResult = { ok: boolean; message?: string };

export function checkSafety(age: number, texts: string[]): SafetyResult {
  const all = texts.join(" ");
  if (age < 18 || age > 55) {
    return {
      ok: false,
      message:
        "Because of your age, a certified trainer needs to look at your plan before we give it to you. Please check with a trainer at your gym first.",
    };
  }
  if (mentionsHealth(all)) {
    return {
      ok: false,
      message:
        "You mentioned pain or a health condition. A trainer or doctor needs to look at this first, so we're not giving you a plan yet. Please talk to a qualified professional.",
    };
  }
  if (OFF_LIMITS_INPUT.test(all)) {
    return {
      ok: false,
      message:
        "Spotter can't give advice on diet, drugs or mental health. Please talk to a qualified professional about that. We're held back from making a plan until a person has checked.",
    };
  }
  return { ok: true };
}

// True if something the USER typed mentions a risky topic.
export function mentionsRiskyTopic(text: string): boolean {
  return mentionsHealth(text) || OFF_LIMITS_INPUT.test(text);
}

// True if AI-written text strays into off-limits topics.
export function hasOffLimitsTopic(text: string): boolean {
  return OFF_LIMITS_AI.test(text);
}

export type AnswerKey = "goal" | "days" | "age" | "gym" | "nervous";

// Returns an error message if the answer is bad, or null if it's fine.
export function validateAnswer(key: AnswerKey, value: string): string | null {
  const v = (value || "").trim();
  if (!v) return "I didn't catch that. Could you type an answer?";
  if (key === "age") {
    const n = Number(v);
    if (!Number.isInteger(n) || n < 10 || n > 100) return "Please type your age as a number, like 24.";
    return null;
  }
  if (key === "days") {
    const n = Number(v.replace(/\D/g, ""));
    if (!Number.isInteger(n) || n < 1 || n > 7) return "Please type a number from 1 to 7.";
    return null;
  }
  if (v.length < 3 || !/[a-zA-Z]{2,}/.test(v)) return "Could you say that in a few words? I want to understand you properly.";
  return null;
}
