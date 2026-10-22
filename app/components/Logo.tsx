import Link from "next/link";

export default function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-2 text-xl font-extrabold tracking-tight text-slate-900">
      <svg viewBox="0 0 64 64" className="h-8 w-8" aria-hidden><rect width="64" height="64" rx="14" fill="#059669" /><g fill="#fff"><rect x="9" y="25" width="6" height="14" rx="2" /><rect x="16" y="20" width="6" height="24" rx="2" /><rect x="24" y="29" width="16" height="6" rx="2" /><rect x="42" y="20" width="6" height="24" rx="2" /><rect x="49" y="25" width="6" height="14" rx="2" /></g></svg>
      Spotter
    </Link>
  );
}
