"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [["/app", "Today", "🏋️"], ["/app/progress", "Progress", "📈"], ["/app/coach", "Coach", "💬"], ["/app/settings", "Settings", "⚙️"]];

export default function NavLinks({ mobile = false }: { mobile?: boolean }) {
  const path = usePathname();
  return (
    <div className={mobile ? "grid grid-cols-4" : "flex gap-1"}>
      {LINKS.map(([href, label, icon]) => {
        const active = href === "/app" ? path === "/app" : path.startsWith(href);
        return (
          <Link key={href} href={href} aria-current={active ? "page" : undefined}
            className={mobile ? `flex flex-col items-center gap-0.5 py-2.5 text-xs font-semibold ${active ? "text-emerald-700" : "text-slate-500"}`
              : `rounded-lg px-3 py-2 text-sm font-semibold ${active ? "bg-emerald-50 text-emerald-700" : "text-slate-600 hover:bg-slate-100"}`}>
            {mobile && <span className="text-lg" aria-hidden>{icon}</span>}{label}
          </Link>);
      })}
    </div>
  );
}
