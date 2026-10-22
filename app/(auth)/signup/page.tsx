import { redirect } from "next/navigation";
import Link from "next/link";
import Logo from "@/app/components/Logo";
import NameStart from "@/app/components/NameStart";
import { currentUser } from "@/lib/auth";

export const metadata = { title: "Join free" };

export default async function Page() {
  if (await currentUser()) redirect("/app");
  return (
    <main className="mx-auto max-w-md px-4 py-6">
      <Logo />
      <div className="card mt-8 !p-6">
        <h1 className="text-3xl font-black tracking-tight">Join Spotter, free</h1>
        <p className="mb-5 mt-2 text-slate-600">Tell us your name and you're in. We'll build your plan in about two minutes.</p>
        <NameStart button="Let's go" />
      </div>
      <p className="mt-4 text-center text-sm text-slate-600">Already joined on another device? <Link href="/login" className="font-semibold text-emerald-700">Use your access code</Link></p>
    </main>
  );
}
