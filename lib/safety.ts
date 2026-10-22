// Plain-code safety rules. These run BEFORE any AI is called.
// They look for someone STATING a problem about themselves ("my back hurts", "I have asthma"),
// not just a scary word. Being afraid of getting hurt is normal for a beginner and is not blocked.
const FEAR = "scared|afraid|worried|fear|nervous|anxious|terrified|avoid|prevent|without";
const BODY = "back|knee|shoulder|neck|hip|joint|wrist|ankle|elbow|chest";
const CONDITIONS = "injur\\w*|pain\\w*|surgery|asthma|diabet\\w*|arthritis|sciatica|hernia|epilep\\w*";

const HEALTH_PATTERNS: RegExp[] = [
  new RegExp(`\\bmy\\s+(\\w+\\s+){0,2}(hurts?|aches?|is\\s+(sore|injured|painful)|are\\s+(sore|injured|painful))\\b`, "i"),
  new RegExp(`\\bi\\s*(?:am|'m|’m|have|had|got|was|ve got|’ve got)\\s+((?!${FEAR})\\w+\\W+){0,3}(${CONDITIONS})\\b`, "i"),
  new RegExp(`\\b(${BODY})\\s+(pain|injury)\\b`, "i"),
  /\bhurts?\s+when\b/i,
  /\b(recovering from|doctor (said|told)|diagnosed|medical condition|health condition|heart (condition|disease|problem|attack)|high blood pressure|cerebral palsy|pregnan\w*|disabilit\w*)\b/i,
];

const OFF_LIMITS_INPUT =
  /\b(steroids?|sarms?|drugs?|depress\w*|suicid\w*|self[- ]?harm|ocd|panic attacks?|eating disorder|diet plan|meal plan|what (should|do) i eat|calorie (deficit|count\w*)|intermittent fasting)\b/i;

// Text the AI WRITES must not slip into diet, drug, medical or mental-health advice.
const OFF_LIMITS_AI =
  /\b(steroids?|sarms?|drugs?|diet|calorie\w*|supplements?|medication|diagnos\w*|depress\w*|suicid\w*|self[- ]?harm|eating disorder)\b/i;

const mentionsHealth = (t: string) => HEALTH_PATTERNS.some((r) => r.test(t));

export type SafetyResult = { ok: boolean; message?: string };

export function checkSafety(age: number, texts: string[]): SafetyResult {
  const all = texts.join(" ");
  if (age < 18 || age > 55) {
    return { ok: false, message: "Because of your age, a certified trainer needs to look at your plan before we give it to you. Please check with a trainer at your gym first." };
  }
  if (mentionsHealth(all)) {
    return { ok: false, message: "You mentioned pain or a health condition. A trainer or doctor needs to look at this first, so we're not giving you a plan yet. Please talk to a qualified professional." };
  }
  if (OFF_LIMITS_INPUT.test(all)) {
    return { ok: false, message: "Spotter can't give advice on diet, drugs or mental health. Please talk to a qualified professional about that." };
  }
  return { ok: true };
}

export const mentionsRiskyTopic = (text: string) => mentionsHealth(text) || OFF_LIMITS_INPUT.test(text);
export const hasOffLimitsTopic = (text: string) => OFF_LIMITS_AI.test(text);

export function validateText(value: string): string | null {
  const v = (value || "").trim();
  if (!v) return "I didn't catch that. Could you type an answer?";
  if (v.length < 3 || !/[a-zA-Z]{2,}/.test(v)) return "Could you say that in a few words? I want to understand you properly.";
  return null;
}
