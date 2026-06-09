import Link from "next/link";
import { Plane, Phone, Menu, Search, User } from "lucide-react";
import { getMenuItems } from "@/lib/menu";
import { getCustomerUser } from "@/lib/auth";

const DEFAULT_NAV: { label: string; url: string; newTab?: boolean }[] = [
  { label: "Ana Sayfa", url: "/" },
  { label: "Turlar", url: "/turlar" },
  { label: "Kampanyalar", url: "/turlar?kampanya=1" },
  { label: "Hakkımızda", url: "/hakkimizda" },
  { label: "İletişim", url: "/iletisim" },
];

export async function Header() {
  const [items, me] = await Promise.all([getMenuItems("HEADER"), getCustomerUser()]);
  const nav = items.length ? items : DEFAULT_NAV;

  return (
    <header className="sticky top-0 z-40 border-b border-slate-100 bg-white/90 backdrop-blur">
      <div className="bg-brand-700 text-white">
        <div className="container-page flex h-9 items-center justify-between text-xs">
          <span className="hidden sm:inline">Yurt dışı paket turlarda güvenilir adresiniz · Şeffaf fiyat garantisi</span>
          <a href="tel:+902120000000" className="inline-flex items-center gap-1.5 font-medium">
            <Phone className="h-3.5 w-3.5" /> +90 212 000 00 00
          </a>
        </div>
      </div>

      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-600 text-white">
            <Plane className="h-5 w-5 -rotate-45" />
          </span>
          <span className="text-lg font-extrabold tracking-tight text-ink">
            Tur<span className="text-brand-600">Acente</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {nav.map((n, i) => (
            <Link
              key={`${n.url}-${i}`}
              href={n.url}
              target={n.newTab ? "_blank" : undefined}
              className="rounded-lg px-3 py-2 text-sm font-medium text-ink-soft transition hover:bg-slate-100 hover:text-ink"
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link href={me ? "/hesabim" : "/hesap/giris"} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-ink-soft hover:bg-slate-100 hover:text-ink">
            <User className="h-4 w-4" /> <span className="hidden sm:inline">{me ? me.firstName : "Giriş"}</span>
          </Link>
          <Link href="/rezervasyon-sorgula" className="hidden sm:inline-flex btn-ghost px-4 py-2 text-sm">
            <Search className="h-4 w-4" /> Rezervasyon Sorgula
          </Link>
          {/* CSS-only mobile menu (no JS) */}
          <details className="relative md:hidden">
            <summary className="grid h-10 w-10 cursor-pointer list-none place-items-center rounded-lg ring-1 ring-slate-200">
              <Menu className="h-5 w-5" />
            </summary>
            <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-100 bg-white p-2 shadow-cardHover">
              {nav.map((n, i) => (
                <Link key={`${n.url}-${i}`} href={n.url} target={n.newTab ? "_blank" : undefined} className="block rounded-lg px-3 py-2 text-sm font-medium text-ink-soft hover:bg-slate-100">
                  {n.label}
                </Link>
              ))}
              <Link href="/rezervasyon-sorgula" className="block rounded-lg px-3 py-2 text-sm font-medium text-brand-700 hover:bg-slate-100">
                Rezervasyon Sorgula
              </Link>
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}
