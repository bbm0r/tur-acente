"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Plane, ClipboardList, Users2, Settings, LogOut, ExternalLink, Building2, ListChecks, LayoutTemplate, Image as ImageIcon, Navigation, FormInput, UserSquare2, CalendarCheck, Megaphone, BarChart3,
} from "lucide-react";
import { logoutAction } from "@/app/admin/(panel)/actions";

const nav = [
  { href: "/admin", label: "Gösterge Paneli", icon: LayoutDashboard, exact: true },
  { href: "/admin/rezervasyonlar", label: "Rezervasyonlar", icon: ClipboardList },
  { href: "/admin/operasyon", label: "Operasyon", icon: ListChecks },
  { href: "/admin/turlar", label: "Turlar", icon: Plane },
  { href: "/admin/sayfalar", label: "Sayfalar", icon: LayoutTemplate },
  { href: "/admin/medya", label: "Medya", icon: ImageIcon },
  { href: "/admin/menuler", label: "Menüler", icon: Navigation },
  { href: "/admin/formlar", label: "Formlar", icon: FormInput },
  { href: "/admin/crm", label: "CRM", icon: Users2 },
  { href: "/admin/musteriler", label: "Müşteriler", icon: UserSquare2 },
  { href: "/admin/gorevler", label: "Görevler", icon: CalendarCheck },
  { href: "/admin/pazarlama", label: "Pazarlama", icon: Megaphone },
  { href: "/admin/raporlar", label: "Raporlar", icon: BarChart3 },
];

export function AdminShell({
  user,
  children,
}: {
  user: { firstName: string; lastName: string; email: string; role: string };
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-slate-100 lg:grid lg:grid-cols-[260px_1fr]">
      {/* Sidebar */}
      <aside className="hidden flex-col border-r border-slate-200 bg-white lg:flex">
        <div className="flex h-16 items-center gap-2 border-b border-slate-100 px-6">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-600 text-white">
            <Plane className="h-5 w-5 -rotate-45" />
          </span>
          <div>
            <div className="text-sm font-extrabold leading-none text-ink">TurAcente</div>
            <div className="text-[11px] text-ink-muted">Yönetim Paneli</div>
          </div>
        </div>

        <nav className="flex-1 space-y-1 p-4">
          {nav.map((n) => {
            const active = n.exact ? pathname === n.href : pathname.startsWith(n.href);
            const Icon = n.icon;
            return (
              <Link
                key={n.href}
                href={n.href}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  active ? "bg-brand-600 text-white" : "text-ink-soft hover:bg-slate-100"
                }`}
              >
                <Icon className="h-[18px] w-[18px]" />
                {n.label}
              </Link>
            );
          })}
          <div className="px-3 pb-1 pt-4 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Sistem</div>
          <Link href="/admin/ayarlar" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-ink-soft hover:bg-slate-100">
            <Settings className="h-[18px] w-[18px]" /> Ayarlar
          </Link>
          <a href="/" target="_blank" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-ink-soft hover:bg-slate-100">
            <ExternalLink className="h-[18px] w-[18px]" /> Siteyi Görüntüle
          </a>
        </nav>

        <div className="border-t border-slate-100 p-4">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-brand-100 text-sm font-bold text-brand-700">
              {user.firstName[0]}{user.lastName[0]}
            </span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold text-ink">{user.firstName} {user.lastName}</div>
              <div className="truncate text-[11px] text-ink-muted">{user.role}</div>
            </div>
            <form action={logoutAction}>
              <button className="grid h-8 w-8 place-items-center rounded-lg text-ink-muted hover:bg-slate-100 hover:text-rose-600" title="Çıkış">
                <LogOut className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 lg:hidden">
        <span className="flex items-center gap-2 font-extrabold text-ink"><Building2 className="h-5 w-5 text-brand-600" /> TurAcente Admin</span>
        <form action={logoutAction}>
          <button className="text-sm text-ink-muted">Çıkış</button>
        </form>
      </div>

      <main className="min-w-0 p-4 sm:p-6 lg:p-8">{children}</main>
    </div>
  );
}
