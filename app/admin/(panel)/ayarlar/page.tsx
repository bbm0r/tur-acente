import { Building2, CreditCard, Mail, MessageSquare, ShieldCheck, KeyRound } from "lucide-react";

export default function AdminSettings() {
  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-extrabold text-ink">Ayarlar</h1>
        <p className="text-sm text-ink-muted">Şirket bilgileri, entegrasyonlar ve erişim</p>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card icon={<Building2 className="h-5 w-5" />} title="Şirket Bilgileri">
          <Field label="Acente Adı" value="Tur Acente Turizm A.Ş. (örnek/demo)" />
          <Field label="E-posta" value="info@turacente.com (örnek)" />
          <Field label="Telefon" value="+90 212 000 00 00 (örnek)" />
          <Field label="Para Birimi" value="Baz: EUR · Görünüm: TRY" />
        </Card>

        <Card icon={<CreditCard className="h-5 w-5" />} title="Entegrasyonlar">
          <Integration icon={<CreditCard className="h-4 w-4" />} name="iyzico / Stripe (Ödeme)" status="Planlandı" />
          <Integration icon={<Mail className="h-4 w-4" />} name="Resend (E-posta)" status="Planlandı" />
          <Integration icon={<MessageSquare className="h-4 w-4" />} name="WhatsApp Business API" status="Şablonlar hazır" />
        </Card>

        <Card icon={<ShieldCheck className="h-5 w-5" />} title="Güvenlik & KVKK">
          <Field label="Oturum" value="İmzalı JWT · HttpOnly · 8 saat" />
          <Field label="Pasaport Verisi" value="Toplanmıyor (güvenlik gereği)" />
          <Field label="Rol Tabanlı Erişim" value="7 rol tanımlı" />
        </Card>

        <Card icon={<KeyRound className="h-5 w-5" />} title="Demo Hesaplar">
          <Field label="Yönetici" value="admin@turacente.com / admin1234" />
          <Field label="B2B Acente" value="deniz@gezgintur.com / acente1234" />
        </Card>
      </div>
    </div>
  );
}

function Card({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <section className="card p-6">
      <h2 className="mb-4 flex items-center gap-2 font-bold text-ink">{icon} {title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-50 pb-2 text-sm">
      <span className="text-ink-muted">{label}</span>
      <span className="font-medium text-ink">{value}</span>
    </div>
  );
}

function Integration({ icon, name, status }: { icon: React.ReactNode; name: string; status: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="flex items-center gap-2 text-ink-soft">{icon} {name}</span>
      <span className="chip bg-slate-100 text-ink-muted">{status}</span>
    </div>
  );
}
