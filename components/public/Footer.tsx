import Link from "next/link";
import { Plane, Mail, Phone, MapPin } from "lucide-react";
import { getMenuItems } from "@/lib/menu";

const destinations = [
  { label: "Mısır Turları", href: "/turlar/misir-turlari" },
  { label: "Moskova Turları", href: "/turlar/moskova-turlari" },
  { label: "İtalya Turları", href: "/turlar/italya-turlari" },
  { label: "Benelüks Turları", href: "/turlar/beneluks-turlari" },
  { label: "Yunanistan Turları", href: "/turlar/yunanistan-turlari" },
];

const corporate = [
  { label: "Hakkımızda", href: "/hakkimizda" },
  { label: "İletişim", href: "/iletisim" },
  { label: "Rezervasyon Sorgula", href: "/rezervasyon-sorgula" },
];

const legal = [
  { label: "Kullanım Koşulları", href: "/kosullar" },
  { label: "Gizlilik & KVKK", href: "/gizlilik" },
  { label: "İptal ve İade", href: "/iptal-iade" },
];

export async function Footer() {
  const footerMenu = await getMenuItems("FOOTER");
  const corporateLinks = footerMenu.length ? footerMenu.map((i) => ({ label: i.label, href: i.url })) : corporate;
  return (
    <footer className="mt-20 border-t border-slate-200 bg-white">
      <div className="container-page grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-600 text-white">
              <Plane className="h-5 w-5 -rotate-45" />
            </span>
            <span className="text-lg font-extrabold text-ink">
              Tur<span className="text-brand-600">Acente</span>
            </span>
          </div>
          <p className="mt-4 text-sm text-ink-muted">
            Yurt dışı paket turlarında uzman seyahat acenteniz. Şeffaf fiyat, kolay rezervasyon, güvenli tatil.
          </p>
        </div>

        <FooterCol title="Popüler Destinasyonlar" links={destinations} />
        <FooterCol title="Kurumsal" links={corporateLinks} />

        <div>
          <h4 className="text-sm font-bold uppercase tracking-wide text-ink-muted">İletişim</h4>
          <ul className="mt-4 space-y-3 text-sm text-ink-soft">
            <li className="flex items-center gap-2"><Phone className="h-4 w-4 text-brand-600" /> +90 212 000 00 00</li>
            <li className="flex items-center gap-2"><Mail className="h-4 w-4 text-brand-600" /> info@turacente.com</li>
            <li className="flex items-start gap-2"><MapPin className="mt-0.5 h-4 w-4 text-brand-600" /> İstanbul, Türkiye</li>
          </ul>
          <div className="mt-5 flex flex-wrap gap-2">
            {legal.map((l) => (
              <Link key={l.href} href={l.href} className="text-xs text-ink-muted underline-offset-2 hover:underline">
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
      <div className="border-t border-slate-100">
        <div className="container-page flex flex-col items-center justify-between gap-2 py-5 text-xs text-ink-muted sm:flex-row">
          <span>© {new Date().getFullYear()} Tur Acente. Tüm hakları saklıdır.</span>
          <span>TÜRSAB üyesi · Belge No: 0000 (demo)</span>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: { label: string; href: string }[] }) {
  return (
    <div>
      <h4 className="text-sm font-bold uppercase tracking-wide text-ink-muted">{title}</h4>
      <ul className="mt-4 space-y-2.5 text-sm">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="text-ink-soft transition hover:text-brand-700">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
