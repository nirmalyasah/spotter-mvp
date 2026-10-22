import { redirect } from "next/navigation";
import Link from "next/link";
import CodeLogin from "@/app/components/CodeLogin";
import Logo from "@/app/components/Logo";
import { currentUser } from "@/lib/auth";

export const metadata = { title: "Log in" };

export default async function Page() {
  if (await currentUser()) redirect("/app");
  return (
    <main className="mx-auto max-w-md px-4 py-6">
      <Logo />
      <div className="mt-8"><CodeLogin /></div>
      <p className="mt-4 text-center text-sm text-slate-600">New here? <Link href="/signup" className="font-semibold text-emerald-700">Join free with just your name</Link></p>
    </main>
  );
}
