import Link from "next/link";
import { MapPin, CalendarDays, Users, CreditCard, Banknote, PhoneCall, FileText } from "lucide-react";
import { formatMoney } from "@/lib/money";
import { formatDateRangeTr } from "@/lib/utils";
import { reservationStatusLabel, reservationStatusColor, paxTypeLabel } from "@/lib/labels";

export function ReservationView({ reservation: r }: { reservation: any }) {
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-6">
        <div className="card p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-xs uppercase tracking-wide text-ink-muted">Referans No</div>
              <div className="text-2xl font-extrabold tracking-wide text-ink">{r.reference}</div>
            </div>
            <span className={`chip ${reservationStatusColor[r.status]}`}>{reservationStatusLabel[r.status]}</span>
          </div>

          <div className="mt-5 border-t border-slate-100 pt-5">
            <h3 className="font-bold text-ink">{r.tour.titleTr}</h3>
            <div className="mt-2 flex flex-wrap gap-4 text-sm text-ink-soft">
              <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4 text-brand-600" /> {r.tour.destination.nameTr}</span>
              <span className="flex items-center gap-1.5"><CalendarDays className="h-4 w-4 text-brand-600" /> {formatDateRangeTr(r.tourDate.startDate, r.tourDate.endDate)}</span>
              <span className="flex items-center gap-1.5"><Users className="h-4 w-4 text-brand-600" /> {r.adults} yetişkin{r.children ? `, ${r.children} çocuk` : ""}{r.infants ? `, ${r.infants} bebek` : ""}</span>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <h3 className="mb-3 font-bold text-ink">Yolcular</h3>
          <ul className="divide-y divide-slate-100">
            {r.passengers.map((p: any) => (
              <li key={p.id} className="flex items-center justify-between py-2.5 text-sm">
                <span className="font-medium text-ink">{p.firstName} {p.lastName}{p.isLead && <span className="ml-2 chip bg-brand-50 text-brand-700">İletişim</span>}</span>
                <span className="text-ink-muted">{paxTypeLabel[p.paxType]}</span>
              </li>
            ))}
          </ul>
          {r.extras.length > 0 && (
            <div className="mt-4 border-t border-slate-100 pt-4">
              <h4 className="mb-2 text-sm font-semibold text-ink">Ek Hizmetler</h4>
              <ul className="space-y-1 text-sm text-ink-soft">
                {r.extras.map((e: any) => (
                  <li key={e.id} className="flex items-center gap-2"><FileText className="h-4 w-4 text-brand-500" /> {e.optionalExtra.nameTr} × {e.quantity}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <NextSteps reservation={r} />
      </div>

      {/* Payment sidebar */}
      <aside className="lg:h-fit">
        <div className="card p-6">
          <h3 className="font-bold text-ink">Ödeme Özeti</h3>
          <div className="mt-3 space-y-2 text-sm">
            <Row label="Toplam Tutar" value={formatMoney(r.totalMinor)} strong />
            <Row label="Ödenen" value={formatMoney(r.paidMinor)} />
            <Row label="Kalan Bakiye" value={formatMoney(r.balanceMinor)} highlight={r.balanceMinor > 0} />
          </div>
          {r.payments.length > 0 && (
            <div className="mt-4 border-t border-slate-100 pt-4 text-xs text-ink-muted">
              {r.payments.length} ödeme kaydı · son durum: {r.payments[r.payments.length - 1].status}
            </div>
          )}
        </div>
        <Link href="/turlar" className="btn-ghost mt-3 w-full">Diğer turlara göz at</Link>
      </aside>
    </div>
  );
}

function NextSteps({ reservation: r }: { reservation: any }) {
  if (r.status === "WAITING_PAYMENT" && r.paymentMethod === "BANK_TRANSFER") {
    return (
      <div className="card border-l-4 border-l-amber-400 p-6">
        <h3 className="flex items-center gap-2 font-bold text-ink"><Banknote className="h-5 w-5 text-amber-500" /> Ödeme Talimatı</h3>
        <p className="mt-2 text-sm text-ink-soft">Rezervasyonunuzu kesinleştirmek için aşağıdaki hesaba <strong>{formatMoney(r.balanceMinor)}</strong> tutarında havale/EFT yapın ve açıklamaya <strong>{r.reference}</strong> yazın.</p>
        <div className="mt-3 rounded-xl bg-slate-50 p-4 text-sm">
          <div><span className="text-ink-muted">Alıcı:</span> Tur Acente Turizm A.Ş.</div>
          <div><span className="text-ink-muted">IBAN:</span> TR00 0000 0000 0000 0000 0000 00</div>
          <div><span className="text-ink-muted">Açıklama:</span> {r.reference}</div>
        </div>
      </div>
    );
  }
  if (r.status === "NEW_REQUEST") {
    return (
      <div className="card border-l-4 border-l-brand-400 p-6">
        <h3 className="flex items-center gap-2 font-bold text-ink"><PhoneCall className="h-5 w-5 text-brand-500" /> Acentemiz sizi arayacak</h3>
        <p className="mt-2 text-sm text-ink-soft">Talebiniz alındı. Satış ekibimiz en kısa sürede sizinle iletişime geçerek rezervasyonu tamamlayacak.</p>
      </div>
    );
  }
  if (r.status === "CONFIRMED" || r.status === "PAYMENT_RECEIVED") {
    return (
      <div className="card border-l-4 border-l-emerald-400 p-6">
        <h3 className="flex items-center gap-2 font-bold text-ink"><CreditCard className="h-5 w-5 text-emerald-500" /> Rezervasyonunuz onaylandı</h3>
        <p className="mt-2 text-sm text-ink-soft">Voucher ve seyahat belgeleriniz e-posta ile iletilecektir. İyi tatiller!</p>
      </div>
    );
  }
  return null;
}

function Row({ label, value, strong, highlight }: { label: string; value: string; strong?: boolean; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-ink-muted">{label}</span>
      <span className={`${strong ? "text-lg font-extrabold" : "font-medium"} ${highlight ? "text-amber-600" : "text-ink"}`}>{value}</span>
    </div>
  );
}
