// End-to-end check against a running app:  BASE_URL=http://localhost:3000 node scripts/e2e.mjs
// (Start the app with SIGNUP_LIMIT_PER_HOUR=1000 so repeated runs aren't rate-limited.)
const BASE = process.env.BASE_URL || "http://localhost:3000";
let cookie = "", pass = 0, fail = 0;
const ok = (name, cond, extra = "") => { cond ? pass++ : fail++; console.log(`${cond ? "PASS" : "FAIL"}  ${name}${extra ? "  → " + extra : ""}`); };
async function api(path, method = "GET", body, jar = true, headers = {}) {
  const res = await fetch(BASE + path, { method, redirect: "manual", headers: { "Content-Type": "application/json", ...(jar && cookie ? { cookie } : {}), ...headers }, body: body ? JSON.stringify(body) : undefined });
  const sc = res.headers.get("set-cookie"); if (sc && jar) cookie = sc.split(",").map((c) => c.split(";")[0]).filter((c) => c.includes("=") && !c.endsWith("=")).join("; ") || cookie;
  let data = {}; try { data = await res.json(); } catch {}
  return { status: res.status, data };
}
const answers = { goal: "get stronger", days: 3, age: 24, gym: "Anytime Fitness", nervous: "I'm scared I'll get hurt and don't know the machines" };
const doWorkout = async (s) => { for (const c of s.cards) await api("/api/workout/exercise", "POST", { sessionId: s.id, exerciseId: c.id, setsCompleted: c.sets }); return api("/api/workout/finish", "POST", { sessionId: s.id }); };

console.log("== name-only accounts");
let r = await api("/api/health"); ok("health: database up", r.data.db === true, JSON.stringify(r.data));
r = await api("/api/onboarding", "POST", answers); ok("logged-out request is rejected (401)", r.status === 401);
r = await api("/app", "GET", undefined, false); ok("logged-out visitor is sent away from /app", r.status >= 300 && r.status < 400);
r = await api("/api/auth/signup", "POST", { name: "   " }); ok("blank name rejected", r.status === 400, r.data.error);
r = await api("/api/auth/signup", "POST", { name: "E2E Tester" }); const code = r.data.code;
ok("sign-up needs only a name", r.status === 200 && /^[A-Z2-9]{5}-[A-Z2-9]{5}$/.test(code || ""));
r = await api("/api/auth/login", "POST", { code: "ZZZZZ-ZZZZZ" }, false); ok("unknown access code rejected (401)", r.status === 401);
r = await api("/api/auth/login", "POST", { code: "abc" }, false); ok("malformed access code rejected (400)", r.status === 400);
r = await api("/api/auth/login", "POST", { code: code.toLowerCase().replace("-", " ") }, false); ok("access code works from another device (case/space tolerant)", r.status === 200);
r = await api("/api/me"); ok("new users start on the free try-out with 3 workouts, 5 questions, 2 builds", r.data.plan === "free" && r.data.access.workoutsLeft === 3 && r.data.access.coachLeft === 5 && r.data.access.buildsLeft === 2, JSON.stringify(r.data.access));

console.log("== bad input and safety (test 3)");
r = await api("/api/onboarding", "POST", { ...answers, goal: "  " }); ok("blank answer rejected", r.status === 400, r.data.error);
r = await api("/api/onboarding", "POST", { ...answers, goal: "??" }); ok("nonsense answer rejected", r.status === 400, r.data.error);
r = await api("/api/onboarding", "POST", { ...answers, age: 16 }); ok("age 16 → blocked, no plan", r.data.status === "blocked");
r = await api("/api/onboarding", "POST", { ...answers, nervous: "my back hurts" }); ok("'my back hurts' → blocked", r.data.status === "blocked");
r = await api("/api/workout/start", "POST"); ok("flagged user cannot start a workout (403)", r.status === 403, r.data.error);
r = await api("/api/onboarding", "POST", { ...answers, availableIds: ["leg-press"] }); ok("fewer than 6 machines rejected", r.status === 400, r.data.error);
r = await api("/api/me"); ok("blocked or rejected attempts don't use up free plan builds", r.data.access.buildsLeft === 2);

console.log("== plan (test 1) and free plan-build limit");
const t0 = Date.now();
r = await api("/api/onboarding", "POST", answers); const secs = ((Date.now() - t0) / 1000).toFixed(1);
ok("fear words are NOT blocked; plan built", r.data.status === "ok", `fallback=${r.data.fallback}`);
ok("plan built in under 30 seconds", Date.now() - t0 < 30000, `${secs}s`);
console.log(`INFO  AI personalised plan: ${r.data.fallback === false}`);
r = await api("/api/onboarding", "POST", { ...answers, forceStandard: true }); ok("free try-out allows a second build", r.data.status === "ok");
r = await api("/api/onboarding", "POST", { ...answers, forceStandard: true }); ok("a third build needs Spotter Plus (402 upgrade)", r.status === 402 && r.data.code === "upgrade", r.data.error);

console.log("== every page loads for a signed-in user");
for (const p of ["/app", "/app/plan", "/app/library", "/app/progress", "/app/coach", "/app/settings", "/welcome", "/legal"]) {
  const res = await fetch(BASE + p, { headers: { cookie }, redirect: "manual" }); ok(`GET ${p}`, res.status === 200, String(res.status));
}

console.log("== workout + progression");
r = await api("/api/workout/start", "POST"); const s = r.data;
ok("workout starts with exercise cards", r.status === 200 && s.cards?.length >= 3, `${s.cards?.length} cards`);
ok("cards carry machine, setup steps, weight", s.cards?.every((c) => c.equipment && c.setup?.length && c.kg > 0));
r = await api("/api/workout/start", "POST"); ok("starting again resumes the same session", r.data.id === s.id);
const first = s.cards[0];
r = await api("/api/workout/exercise", "POST", { sessionId: s.id, exerciseId: first.id, setsCompleted: first.sets }); ok("all sets done → weight goes up", r.data.increased === true && r.data.newKg > first.kg, `${first.kg} → ${r.data.newKg} kg`);
r = await api("/api/workout/exercise", "POST", { sessionId: s.id, exerciseId: first.id, setsCompleted: first.sets }); ok("logging the same exercise twice is rejected (409)", r.status === 409);
const second = s.cards[1];
r = await api("/api/workout/exercise", "POST", { sessionId: s.id, exerciseId: second.id, setsCompleted: 1 }); ok("couldn't finish → weight stays", r.data.increased === false && r.data.newKg === second.kg);
r = await api("/api/workout/exercise", "POST", { sessionId: s.id, exerciseId: "not-real", setsCompleted: 1 }); ok("unknown exercise rejected", r.status === 400);
for (const c of s.cards.slice(2)) await api("/api/workout/exercise", "POST", { sessionId: s.id, exerciseId: c.id, setsCompleted: c.sets });
r = await api("/api/workout/finish", "POST", { sessionId: s.id }); ok("workout 1 finishes with a summary", r.status === 200 && r.data.exercises === s.cards.length, JSON.stringify(r.data));
r = await api("/api/workout/start", "POST"); const w2 = r.data; ok("next workout is day 2", r.status === 200 && w2.id !== s.id && w2.cards[0].id !== first.id);
r = await doWorkout(w2); ok("workout 2 finishes", r.status === 200);
r = await api("/api/comeback", "POST", {}); ok("'comeback' button says you're on track when you've just trained (400)", r.status === 400, r.data.error);

console.log("== comeback (test 2)");
r = await api("/api/demo", "POST", { action: "simulate", reason: "I had exams" }); ok("simulate 3 days → comeback written", r.status === 200, JSON.stringify(r.data));
r = await api("/api/workout/start", "POST"); const cb = r.data;
ok("comeback session: 2 lighter exercises, 2 × 8", cb.kind === "comeback" && cb.cards.length <= 2 && cb.cards.every((c) => c.sets === 2 && c.reps === 8), `message: ${(cb.message || "").slice(0, 70)}`);
r = await doWorkout(cb); ok("comeback session finishes (that's workout 3 of 3 free)", r.status === 200);

console.log("== the free try-out ends, Plus is 'coming soon'");
r = await api("/api/me"); ok("all 3 free workouts used", r.data.access.workoutsLeft === 0, JSON.stringify(r.data.access));
r = await api("/api/workout/start", "POST"); ok("a 4th workout is blocked with an upgrade message (402)", r.status === 402 && r.data.code === "upgrade", r.data.error);
r = await api("/api/comeback", "POST", {}); ok("comeback is blocked too once the free workouts are used (402)", r.status === 402);
r = await api("/api/coach/plateau", "POST"); ok("plateau check is a Plus feature (402)", r.status === 402 && r.data.code === "upgrade");
let answered = 0, blockedAt = 0;
for (let i = 1; i <= 7; i++) { r = await api("/api/coach/chat", "POST", { message: `Question ${i}: how do I use a lat pulldown properly?` }); if (r.status === 200) answered++; else { blockedAt = r.status; break; } }
ok("free coach answers 5 questions, then asks for Plus (402)", answered === 5 && blockedAt === 402, `answered ${answered}`);
r = await api("/api/waitlist", "POST"); ok("join the Plus waitlist", r.status === 200);
r = await api("/api/waitlist"); ok("waitlist remembers you", r.data.joined === true);
r = await api("/api/billing/checkout", "POST"); ok("there is no payment endpoint (404)", r.status === 404);

console.log("== preview Plus (demo switch) unlocks everything");
r = await api("/api/demo", "POST", { action: "toggle-plus" }); ok("demo: switch to Plus", r.data.plan === "plus");
r = await api("/api/workout/start", "POST"); ok("workouts work again on Plus", r.status === 200 && r.data.cards?.length >= 2);
r = await api("/api/coach/chat", "POST", { message: "my knee hurts when I squat, what should I do?" }); ok("coach refuses health questions and refers to a professional", /professional/i.test(r.data.reply || ""));
r = await api("/api/coach/chat", "POST", { message: "How do I set the seat on a leg press?" }); ok("coach answers beyond the free limit on Plus", r.status === 200 && r.data.reply?.length > 20, (r.data.reply || r.data.error || "").slice(0, 60));
r = await api("/api/onboarding", "POST", { ...answers, forceStandard: true }); ok("unlimited plan rebuilds on Plus", r.data.status === "ok");
r = await api("/api/demo", "POST", { action: "seed" }); ok("demo: 6 weeks of history added", r.status === 200, `${r.data.sessions} sessions`);
r = await api("/api/coach/plateau", "POST"); ok("plateau check finds stalled lifts and explains (Plus)", r.status === 200 && r.data.flagged?.length > 0, `${r.data.flagged?.length} flagged`);
r = await api("/api/comeback", "POST", {}); ok("on-demand comeback works after 5 days away", r.status === 200, JSON.stringify(r.data));
r = await api("/api/demo", "POST", { action: "toggle-plus" }); ok("demo: back to the free try-out", r.data.plan === "free");

console.log("== codes, reports, other");
const newCode = (await api("/api/auth/code", "POST")).data.code;
ok("a new access code can be made", /^[A-Z2-9]{5}-[A-Z2-9]{5}$/.test(newCode || "") && newCode !== code);
r = await api("/api/auth/login", "POST", { code }, false); ok("the old access code stops working (401)", r.status === 401);
r = await api("/api/auth/login", "POST", { code: newCode }, false); ok("the new access code works", r.status === 200);
r = await api("/api/report", "POST", { exerciseId: "chest-press", note: "seat height step looks off" }); ok("'this looks wrong' report saved", r.status === 200);
r = await api("/api/equipment", "PATCH", { availableIds: ["chest-press", "leg-press"] }); ok("equipment list needs 6+ items", r.status === 400);
r = await api("/api/cron/comeback", "GET", undefined, false); ok("cron endpoint rejects strangers (401)", r.status === 401);
r = await api("/api/account", "DELETE"); ok("delete account works", r.status === 200);
r = await api("/api/auth/login", "POST", { code: newCode }, false); ok("deleted account can no longer log in", r.status === 401);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
