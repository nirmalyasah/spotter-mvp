import Link from "next/link";
import { requireUser } from "@/lib/auth";
import Logo from "../components/Logo";
import NavLinks from "../components/NavLinks";
import { isPaid } from "@/lib/access";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  return (
    <div className="min-h-screen pb-24 md:pb-8">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <Logo href="/app" />
          <div className="hidden md:block"><NavLinks /></div>
          <Link href="/app/settings" className="flex items-center gap-2 rounded-full bg-slate-100 py-1 pl-1 pr-3 text-sm font-semibold text-slate-700 hover:bg-slate-200">
            <span className="grid h-7 w-7 place-items-center rounded-full bg-emerald-600 text-xs font-bold text-white">{user.name.trim().charAt(0).toUpperCase()}</span>
            <span className="max-w-24 truncate">{user.name.split(" ")[0]}</span>
            {isPaid(user.plan) && <span className="chip !bg-amber-100 !text-amber-800 !ring-amber-200">PLUS</span>}
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-6">{children}</main>
      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white md:hidden" aria-label="Main"><NavLinks mobile /></nav>
    </div>
  );
}
