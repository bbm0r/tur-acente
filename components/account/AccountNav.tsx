"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Ticket, Heart, User } from "lucide-react";

const tabs = [
  { href: "/hesabim", label: "Rezervasyonlarım", icon: Ticket, exact: true },
  { href: "/hesabim/favoriler", label: "Favorilerim", icon: Heart },
  { href: "/hesabim/profil", label: "Profil", icon: User },
];

export function AccountNav() {
  const pathname = usePathname();
  return (
    <nav className="flex gap-1 overflow-x-auto border-b border-slate-200">
      {tabs.map((t) => {
        const active = t.exact ? pathname === t.href : pathname.startsWith(t.href);
        const Icon = t.icon;
        return (
          <Link
            key={t.href}
            href={t.href}
            className={`flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition ${
              active ? "border-brand-600 text-brand-700" : "border-transparent text-ink-muted hover:text-ink"
            }`}
          >
            <Icon className="h-4 w-4" /> {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
