import Link from "next/link";
import { requireUser } from "@/lib/auth";
import Logo from "../components/Logo";
import NavLinks from "../components/NavLinks";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  return (
    <div className="min-h-screen pb-24 md:pb-8">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <Logo href="/app" />
          <div className="hidden md:block"><NavLinks /></div>
          <Link href="/app/settings" className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <span className={`chip ${user.plan === "pro" ? "!bg-amber-100 !text-amber-800 !ring-amber-200" : ""}`}>{user.plan === "pro" ? "PRO" : "FREE"}</span>
            <span className="hidden sm:inline">{user.name.split(" ")[0]}</span>
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-6">{children}</main>
      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white md:hidden"><NavLinks mobile /></nav>
    </div>
  );
}
