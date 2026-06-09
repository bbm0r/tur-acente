import Link from "next/link";
import { ShieldCheck, BadgePercent, Headset, Wallet, Quote, ArrowRight } from "lucide-react";
import { getDestinationsWithCounts, getFeaturedTours, getCampaignTours, getTestimonials } from "@/lib/catalog";
import { getCustomerUser } from "@/lib/auth";
import { getFavoriteTourIds } from "@/lib/account";
import { HeroSearch } from "@/components/public/HeroSearch";
import { TourCard } from "@/components/public/TourCard";
import { DestinationCard } from "@/components/public/DestinationCard";
import { Stars } from "@/components/public/Stars";

export default async function HomePage() {
  const [destinations, featured, campaigns, testimonials] = await Promise.all([
    getDestinationsWithCounts(),
    getFeaturedTours(6),
    getCampaignTours(3),
    getTestimonials(3),
  ]);
  const me = await getCustomerUser();
  const favIds = me?.customerId ? await getFavoriteTourIds(me.customerId) : new Set<string>();

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-700 via-brand-600 to-brand-800 text-white">
        <div className="absolute -left-20 top-10 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -right-10 bottom-0 h-80 w-80 rounded-full bg-accent-400/20 blur-3xl" />
        <div className="container-page relative py-16 sm:py-24">
          <span className="chip bg-white/15 text-white ring-1 ring-white/20">✈️ 2026 Erken Rezervasyon Fırsatları</span>
          <h1 className="mt-4 max-w-3xl text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
            Hayalindeki yurt dışı tatili,{" "}
            <span className="text-accent-400">net fiyatlarla</span> birkaç dakikada planla.
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-white/85">
            Mısır, Moskova, İtalya, Benelüks ve Yunanistan paket turları. Şeffaf fiyat, müsait tarihler, kolay rezervasyon.
          </p>
          <div className="mt-8">
            <HeroSearch destinations={destinations.map((d) => ({ slug: d.slug, nameTr: d.nameTr }))} />
          </div>
          <div className="mt-8 flex flex-wrap gap-x-8 gap-y-3 text-sm text-white/85">
            <Stat value="5" label="Destinasyon" />
            <Stat value="13+" label="Kalkış Tarihi" />
            <Stat value="%100" label="Şeffaf Fiyat" />
            <Stat value="7/24" label="Destek" />
          </div>
        </div>
      </section>

      {/* Trust badges */}
      <section className="border-b border-slate-100 bg-white">
        <div className="container-page grid grid-cols-2 gap-6 py-8 md:grid-cols-4">
          <Badge icon={<ShieldCheck className="h-6 w-6" />} title="Güvenli Ödeme" desc="3D Secure korumalı" />
          <Badge icon={<BadgePercent className="h-6 w-6" />} title="Erken Rezervasyon" desc="En iyi fiyat garantisi" />
          <Badge icon={<Headset className="h-6 w-6" />} title="7/24 Destek" desc="Tur boyunca yanınızda" />
          <Badge icon={<Wallet className="h-6 w-6" />} title="Esnek Ödeme" desc="Kart, havale, taksit" />
        </div>
      </section>

      {/* Destinations */}
      <Section title="Popüler Destinasyonlar" subtitle="En çok tercih edilen rotalarımızı keşfedin">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {destinations.map((d) => (
            <DestinationCard key={d.slug} destination={d} />
          ))}
        </div>
      </Section>

      {/* Featured tours */}
      <Section title="Öne Çıkan Turlar" subtitle="Editörün seçtiği popüler paketler" action={{ href: "/turlar", label: "Tüm turlar" }}>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((t) => (
            <TourCard key={t.id} tour={t as any} favorited={favIds.has(t.id)} />
          ))}
        </div>
      </Section>

      {/* Campaigns */}
      {campaigns.length > 0 && (
        <section className="bg-gradient-to-br from-accent-500 to-accent-600">
          <div className="container-page py-14">
            <div className="flex items-end justify-between">
              <div>
                <h2 className="text-2xl font-extrabold text-ink sm:text-3xl">🔥 Kampanyalı Turlar</h2>
                <p className="mt-1 text-ink/80">Sınırlı kontenjan, erken rezervasyon avantajı</p>
              </div>
              <Link href="/turlar?kampanya=1" className="hidden btn bg-ink text-white hover:bg-ink-soft sm:inline-flex">
                Tümünü gör <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {campaigns.map((t) => (
                <TourCard key={t.id} tour={t as any} favorited={favIds.has(t.id)} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Why us */}
      <Section title="Neden Tur Acente?" subtitle="Tatil planlamanın en kolay ve güvenilir yolu">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { t: "Net Fiyat Politikası", d: "Fiyatı asla gizlemiyoruz. Gördüğünüz fiyat, ödediğiniz fiyattır." },
            { t: "Müsait Tarihler Açık", d: "Her turun kalkış tarihleri ve kontenjanı net şekilde gösterilir." },
            { t: "2 Dakikada Rezervasyon", d: "Mobil uyumlu, hızlı ve kolay rezervasyon akışı." },
            { t: "Uzman Operasyon", d: "Vize, transfer, otel ve rehberlik tek elden yönetilir." },
          ].map((f, i) => (
            <div key={i} className="card p-6">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 font-bold text-brand-700">{i + 1}</div>
              <h3 className="mt-4 font-bold text-ink">{f.t}</h3>
              <p className="mt-1.5 text-sm text-ink-muted">{f.d}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Testimonials */}
      {testimonials.length > 0 && (
        <Section title="Misafirlerimiz Ne Diyor?" subtitle="Binlerce mutlu tatilci">
          <div className="grid gap-5 sm:grid-cols-3">
            {testimonials.map((t) => (
              <div key={t.id} className="card p-6">
                <Quote className="h-7 w-7 text-brand-200" />
                <p className="mt-3 text-sm text-ink-soft">{t.bodyTr}</p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="font-semibold text-ink">{t.customerName}</span>
                  <Stars value={t.rating} />
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* CTA */}
      <section className="container-page pb-4">
        <div className="overflow-hidden rounded-xl2 bg-brand-700 px-8 py-12 text-center text-white">
          <h2 className="text-2xl font-extrabold sm:text-3xl">Tatiliniz bir tık uzakta</h2>
          <p className="mx-auto mt-2 max-w-xl text-white/85">
            Müsait tarihleri inceleyin, fiyatı görün, dakikalar içinde rezervasyon yapın.
          </p>
          <Link href="/turlar" className="btn-accent mt-6">Turları Keşfet <ArrowRight className="h-5 w-5" /></Link>
        </div>
      </section>
    </>
  );
}

function Section({
  title,
  subtitle,
  action,
  children,
}: {
  title: string;
  subtitle?: string;
  action?: { href: string; label: string };
  children: React.ReactNode;
}) {
  return (
    <section className="container-page py-14">
      <div className="mb-7 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-ink sm:text-3xl">{title}</h2>
          {subtitle && <p className="mt-1 text-ink-muted">{subtitle}</p>}
        </div>
        {action && (
          <Link href={action.href} className="hidden shrink-0 items-center gap-1 text-sm font-semibold text-brand-700 hover:underline sm:inline-flex">
            {action.label} <ArrowRight className="h-4 w-4" />
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="text-2xl font-extrabold text-white">{value}</div>
      <div className="text-xs text-white/75">{label}</div>
    </div>
  );
}

function Badge({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700">{icon}</span>
      <div>
        <div className="text-sm font-bold text-ink">{title}</div>
        <div className="text-xs text-ink-muted">{desc}</div>
      </div>
    </div>
  );
}
