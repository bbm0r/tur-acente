import type { Metadata } from "next";
import { Phone, Mail, MapPin, MessageCircle, Clock } from "lucide-react";
import { ContactForm } from "@/components/public/ContactForm";

export const metadata: Metadata = {
  title: "İletişim",
  description: "Tur Acente ile iletişime geçin. Sorularınız için bize ulaşın.",
};

export default function ContactPage() {
  return (
    <div className="bg-slate-50">
      <div className="container-page grid gap-10 py-12 lg:grid-cols-2">
        <div>
          <h1 className="text-3xl font-extrabold text-ink">Bize Ulaşın</h1>
          <p className="mt-2 text-ink-muted">Tur ve rezervasyon sorularınız için ekibimiz hazır. Formu doldurun ya da doğrudan arayın.</p>

          <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            ⚠️ <strong>DEMO / ÖRNEK:</strong> Aşağıdaki iletişim bilgileri gerçek değildir, örnek
            amaçlıdır. Bu bir demo sitedir; gerçek satış veya rezervasyon yapılmaz.
          </p>

          <div className="mt-8 space-y-4">
            <Info icon={<Phone className="h-5 w-5" />} title="Telefon" value="+90 212 000 00 00 (örnek)" />
            <Info icon={<Mail className="h-5 w-5" />} title="E-posta" value="info@turacente.com (örnek)" />
            <Info icon={<MapPin className="h-5 w-5" />} title="Adres" value="Merkez Ofis, İstanbul, Türkiye (örnek)" />
            <Info icon={<Clock className="h-5 w-5" />} title="Çalışma Saatleri" value="Hafta içi 09:00–19:00 · Cumartesi 10:00–16:00" />
          </div>

          <a
            href={`https://wa.me/${(process.env.NEXT_PUBLIC_WHATSAPP || "+905555555555").replace(/[^0-9]/g, "")}`}
            target="_blank" rel="noopener noreferrer"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#25D366] px-5 py-3 font-semibold text-white"
          >
            <MessageCircle className="h-5 w-5" /> WhatsApp ile yaz
          </a>
        </div>

        <ContactForm />
      </div>
    </div>
  );
}

function Info({ icon, title, value }: { icon: React.ReactNode; title: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700">{icon}</span>
      <div>
        <div className="text-sm font-bold text-ink">{title}</div>
        <div className="text-sm text-ink-muted">{value}</div>
      </div>
    </div>
  );
}
