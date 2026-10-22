import Link from "next/link";
import Logo from "./components/Logo";
import { APP } from "@/lib/config";
import { currentUser } from "@/lib/auth";

const FEATURES = [
  ["🏋️", "Your next exercise, explained", "Which machine, where to set the seat, how much weight, how many reps. No more wandering around the gym."],
  ["🧠", "A plan built for you", "Tell Spotter you're nervous in your own words. The AI builds a 3-day plan from the machines your gym really has."],
  ["📈", "Weights that update themselves", "Hit every rep and next session's weight goes up by a safe, small step. Miss them and it holds. No spreadsheets."],
  ["🔁", "A comeback after missed days", "Away for 3 days? Spotter writes a shorter, gentler session and emails it. No guilt, just a way back in."],
  ["🔍", "Know why you stalled (Pro)", "When your weight hasn't moved in 3 weeks, Spotter spots it, explains why, and gives you 3 things to try."],
  ["🛡️", "Safety first, always", "Under 18, over 55, or any pain or health condition? Spotter won't guess. It asks you to check with a trainer or doctor."],
];
const FAQ = [
  ["Is Spotter a replacement for a trainer or doctor?", "No. Spotter gives general beginner guidance. If you have pain, an injury or a health condition, or you're under 18 or over 55, it stops and asks you to talk to a qualified professional first."],
  ["Does it work for my gym?", "You tick the machines and weights your gym has during setup, and Spotter only plans with those. You can change the list any time."],
  ["What does the AI actually do?", "It understands your goals and worries and picks fitting exercises from our fixed library. Sets, reps, weights and safety rules are plain code, so they behave the same way every time."],
  ["What happens to my data?", "Your answers and workout logs are used only to run your plan. You can delete your account and all of your data from Settings at any time."],
];

export default async function Home() {
  const user = await currentUser();
  return (
    <main>
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Logo />
        <nav className="flex items-center gap-2 text-sm font-semibold">
          <a href="#pricing" className="hidden px-3 py-2 text-slate-600 hover:text-slate-900 sm:block">Pricing</a>
          <a href="#faq" className="hidden px-3 py-2 text-slate-600 hover:text-slate-900 sm:block">FAQ</a>
          {user ? <Link href="/app" className="btn btn-primary !py-2">Open app</Link> : (<>
            <Link href="/login" className="px-3 py-2 text-slate-700 hover:text-slate-900">Log in</Link>
            <Link href="/signup" className="btn btn-primary !py-2">Start free</Link></>)}
        </nav>
      </header>

      <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 pb-16 pt-8 md:grid-cols-2 md:pt-16">
        <div>
          <span className="chip">AI gym buddy for beginners</span>
          <h1 className="mt-4 text-4xl font-black leading-[1.05] tracking-tight sm:text-6xl">Never wonder what to do at the gym again.</h1>
          <p className="mt-5 max-w-xl text-lg text-slate-600">Spotter tells you exactly what to do next: which machine, how to set it up, how much weight. And it gets you back on track after a missed week. No embarrassment, no guessing.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href={user ? "/app" : "/signup"} className="btn btn-primary text-lg">{user ? "Open your plan" : "Get my free plan"}</Link>
            <a href="#how" className="btn btn-ghost text-lg">See how it works</a>
          </div>
          <p className="mt-4 text-sm text-slate-500">Free to start · No card needed · Takes 2 minutes</p>
        </div>
        <div className="relative mx-auto w-full max-w-sm">
          <div className="absolute -inset-4 -z-10 rounded-[2rem] bg-gradient-to-br from-emerald-200 via-emerald-100 to-lime-100 blur-xl" />
          <div className="card !p-6 shadow-xl">
            <div className="flex items-center justify-between"><span className="chip">Exercise 1 of 4</span><span className="text-xs text-slate-400">Day 1</span></div>
            <p className="mt-3 text-2xl font-extrabold">Chest Press</p>
            <p className="text-sm text-slate-500">Seated chest press machine</p>
            <p className="mt-3 text-3xl font-black text-emerald-600">20 kg <span className="text-slate-900">· 3 × 10</span></p>
            <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-slate-700">
              <li>Adjust the seat so the handles are level with your chest.</li>
              <li>Keep your back flat and your feet on the floor.</li>
              <li>Push forward until your arms are almost straight.</li>
            </ol>
            <div className="mt-4 grid grid-cols-3 gap-2">{[1, 2, 3].map((n) => <div key={n} className={`rounded-lg py-2 text-center text-sm font-bold ${n === 1 ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-400"}`}>Set {n}</div>)}</div>
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-14">
          <h2 className="text-3xl font-black tracking-tight sm:text-4xl">The first 3–4 months are the hardest.</h2>
          <p className="mt-3 max-w-3xl text-lg text-slate-600">Beginners pay for a gym and then barely use it. They're too embarrassed to ask, they don't know the machines, and after a missed week they never restart. In the beginner forum posts we studied, the top struggles were <b>not knowing what to do</b>, <b>gym anxiety</b>, <b>stopping and not being able to restart</b>, and <b>stalled progress</b>.</p>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {[["Not knowing what to do", "“I feel completely lost and overwhelmed.”"], ["Gym anxiety", "“Too embarrassed to ask anyone.”"], ["Can't restart", "One missed week turns into months."]].map(([t, d]) => (
              <div key={t} className="rounded-2xl bg-slate-50 p-5 ring-1 ring-slate-200"><p className="font-bold">{t}</p><p className="mt-1 text-slate-600">{d}</p></div>))}
          </div>
        </div>
      </section>

      <section id="how" className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-3xl font-black tracking-tight sm:text-4xl">How it works</h2>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {[["1", "Tell Spotter about you", "Answer 5 quick questions in your own words, including what makes you nervous. Tick the machines your gym has."], ["2", "Get your plan and your next exercise", "A 3-day beginner plan, shown one exercise at a time with setup steps and the right starting weight."], ["3", "Tap, lift, repeat", "Tap each set as you finish. Weights go up on their own, and if you disappear for 3 days Spotter brings you back gently."]].map(([n, t, d]) => (
            <div key={n} className="card"><div className="grid h-10 w-10 place-items-center rounded-full bg-emerald-600 text-lg font-black text-white">{n}</div><p className="mt-4 text-lg font-bold">{t}</p><p className="mt-1 text-slate-600">{d}</p></div>))}
        </div>
      </section>

      <section className="bg-slate-900 text-white">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="text-3xl font-black tracking-tight sm:text-4xl">Everything a nervous beginner needs</h2>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(([i, t, d]) => (<div key={t} className="rounded-2xl bg-white/5 p-5 ring-1 ring-white/10"><p className="text-3xl">{i}</p><p className="mt-3 text-lg font-bold">{t}</p><p className="mt-1 text-slate-300">{d}</p></div>))}
          </div>
        </div>
      </section>

      <section id="pricing" className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-center text-3xl font-black tracking-tight sm:text-4xl">Simple pricing</h2>
        <p className="mt-2 text-center text-slate-600">Start free. Upgrade when you want the coach.</p>
        <div className="mx-auto mt-10 grid max-w-4xl gap-6 md:grid-cols-2">
          <div className="card !p-7">
            <p className="text-lg font-bold">Free</p><p className="mt-2 text-5xl font-black">₹0</p><p className="text-sm text-slate-500">forever</p>
            <ul className="mt-6 space-y-2.5 text-slate-700">{["AI-built 3-day beginner plan", `${APP.freePlanBuildsPerMonth} plan builds per month`, "Exercise cards with setup steps", "Automatic weight progression", "Comeback sessions by email", "Progress charts and streaks"].map((x) => <li key={x}>✓ {x}</li>)}</ul>
            <Link href="/signup" className="btn btn-ghost mt-7 w-full">Start free</Link>
          </div>
          <div className="card relative !p-7 ring-2 ring-emerald-500">
            <span className="chip absolute right-5 top-5">Most popular</span>
            <p className="text-lg font-bold">Pro</p><p className="mt-2 text-5xl font-black">₹{APP.proPriceInr}<span className="text-lg font-semibold text-slate-500">/month</span></p><p className="text-sm text-slate-500">cancel any time</p>
            <ul className="mt-6 space-y-2.5 text-slate-700">{["Everything in Free", "Unlimited plan rebuilds", "Plateau check: why you stalled and what to try", "Ask Spotter: your AI coach chat", "Priority for new features"].map((x) => <li key={x}>✓ {x}</li>)}</ul>
            <Link href="/signup" className="btn btn-primary mt-7 w-full">Get started</Link>
          </div>
        </div>
      </section>

      <section id="faq" className="mx-auto max-w-3xl px-4 pb-16">
        <h2 className="text-3xl font-black tracking-tight sm:text-4xl">Questions</h2>
        <div className="mt-6 space-y-3">{FAQ.map(([q, a]) => (<details key={q} className="card group"><summary className="cursor-pointer list-none font-bold">{q}</summary><p className="mt-2 text-slate-600">{a}</p></details>))}</div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16">
        <div className="rounded-3xl bg-emerald-600 px-6 py-12 text-center text-white">
          <h2 className="text-3xl font-black sm:text-4xl">Walk in knowing exactly what to do.</h2>
          <Link href="/signup" className="btn mt-6 bg-white text-emerald-700 hover:bg-emerald-50">Get my free plan</Link>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Spotter. General fitness guidance, not medical advice.</p>
          <div className="flex gap-4"><Link href="/legal" className="hover:text-slate-900">Terms, privacy and disclaimer</Link></div>
        </div>
      </footer>
    </main>
  );
}
