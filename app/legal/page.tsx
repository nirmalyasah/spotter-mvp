import Link from "next/link";
import Logo from "../components/Logo";

export const metadata = { title: "Terms, privacy and disclaimer" };

export default function Legal() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-6">
      <Logo />
      <h1 className="mt-8 text-4xl font-black tracking-tight">Terms, privacy and disclaimer</h1>
      <p className="mt-2 text-sm text-slate-500">Plain-language summary. Have this reviewed by a lawyer before a large public launch.</p>
      <div className="mt-8 space-y-8 text-slate-700 [&_h2]:mb-2 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-slate-900">
        <section><h2>Not medical advice</h2><p>Spotter gives general beginner fitness guidance. It is not a doctor, physiotherapist or certified trainer. Exercise has risks. If you feel pain, dizziness or anything unusual, stop and speak to a qualified professional. If you have a health condition, are pregnant, are under 18 or over 55, check with a professional before using any plan. Spotter will pause and ask you to do so when you tell it about these things.</p></section>
        <section><h2>Machine set-up details</h2><p>Set-up steps are general. Gym equipment differs. Until a gym's own staff have verified them, treat the steps as a guide and ask staff if anything feels wrong. You can report a problem on any exercise card.</p></section>
        <section><h2>What we collect</h2><p>Your name, the answers you give during setup, the machines you choose, and your workout logs. We use them only to run your plan, write your comeback sessions and coach chat. Text you type to the AI features is sent to our AI provider to produce a reply. We never sell your data.</p></section>
        <section><h2>Cookies and your access code</h2><p>We use one essential cookie to keep you logged in. There are no passwords: your access code is the only way to log back in on another device, so keep it safe. Anyone who has it can open your account. You can create a new code any time in Settings. No advertising or tracking cookies.</p></section>
        <section><h2>Deleting your data</h2><p>You can delete your account and all of your data at any time from Settings. It is removed immediately.</p></section>
        <section><h2>Free trial and payments</h2><p>New users can try Spotter free: a small one-time allowance of workouts, plan builds and coach questions. A paid version, Spotter Plus, is coming soon and is not on sale yet, so we don't take any payments or card details today. To prevent abuse of the AI features, every person also has a daily fair-use limit.</p></section>
        <section><h2>Using Spotter</h2><p>Use Spotter for your own personal training. Don't misuse the service or try to break it. We may change or stop features, and we provide the service "as is".</p></section>
      </div>
      <p className="mt-10"><Link href="/" className="font-semibold text-emerald-700 hover:underline">← Back to Spotter</Link></p>
    </main>
  );
}
