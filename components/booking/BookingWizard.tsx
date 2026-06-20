"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarDays, Users, BedDouble, UserRound, PlusCircle, ClipboardCheck,
  Check, Minus, Plus, Loader2, ShieldCheck, CreditCard, Banknote, PhoneCall, AlertCircle,
} from "lucide-react";
import { formatMoney, eurToTryMinor } from "@/lib/money";
import { getQuoteAction, submitReservationAction } from "@/app/(public)/rezervasyon/[slug]/actions";

type DateOpt = { id: string; range: string; nights: number; remaining: number };
type RoomOpt = { code: string; nameTr: string };
type ExtraOpt = { id: string; nameTr: string; priceMinor: number; perPax: boolean };
type Quote = Awaited<ReturnType<typeof getQuoteAction>>;

type Props = {
  tour: { id: string; slug: string; titleTr: string; durationNights: number; destinationName: string };
  dates: DateOpt[];
  rooms: RoomOpt[];
  extras: ExtraOpt[];
  initialDateId: string;
};

const STEPS = [
  { label: "Tarih", icon: CalendarDays },
  { label: "Kişiler", icon: Users },
  { label: "Oda", icon: BedDouble },
  { label: "Yolcu", icon: UserRound },
  { label: "Ekstralar", icon: PlusCircle },
  { label: "Özet & Ödeme", icon: ClipboardCheck },
];

export function BookingWizard({ tour, dates, rooms, extras, initialDateId }: Props) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [dateId, setDateId] = useState(initialDateId);
  const [roomCode, setRoomCode] = useState(rooms[0]?.code ?? "DBL");
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);
  const [extraIds, setExtraIds] = useState<string[]>([]);
  const [lead, setLead] = useState({ firstName: "", lastName: "", email: "", phone: "", birthDate: "", nationality: "TR" });
  const [payment, setPayment] = useState<"BANK_TRANSFER" | "AGENCY" | "">("");
  const [kvkk, setKvkk] = useState(false);

  const [quote, setQuote] = useState<Quote | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Live, server-computed price as inputs change.
  useEffect(() => {
    let active = true;
    setQuoteLoading(true);
    getQuoteAction({ tourDateId: dateId, roomTypeCode: roomCode, adults, children, infants, extraIds })
      .then((q) => { if (active) setQuote(q); })
      .catch(() => { if (active) setQuote(null); })
      .finally(() => { if (active) setQuoteLoading(false); });
    return () => { active = false; };
  }, [dateId, roomCode, adults, children, infants, extraIds]);

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.email);
  const canNext = [
    !!dateId,
    adults >= 1,
    !!roomCode,
    lead.firstName.length >= 2 && lead.lastName.length >= 2 && emailValid && lead.phone.length >= 7,
    true,
    !!payment && kvkk,
  ][step];

  function toggleExtra(id: string) {
    setExtraIds((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  }

  async function submit() {
    setSubmitting(true);
    setError("");
    const res = await submitReservationAction({
      tourId: tour.id,
      tourDateId: dateId,
      roomTypeCode: roomCode,
      adults, children, infants, extraIds,
      lead: { ...lead, nationality: lead.nationality || undefined, birthDate: lead.birthDate || undefined },
      paymentMethod: payment === "AGENCY" ? null : "BANK_TRANSFER",
      kvkkConsent: kvkk,
    });
    if (res.ok) {
      router.push(`/rezervasyon/sonuc/${res.reference}`);
    } else {
      setError(res.error);
      setSubmitting(false);
    }
  }

  const tl = (eurMinor: number) => (quote ? formatMoney(eurToTryMinor(eurMinor, quote.rate)) : "—");

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-ink sm:text-3xl">{tour.titleTr}</h1>
      <p className="mt-1 text-ink-muted">{tour.destinationName} · {tour.durationNights} gece · Rezervasyon</p>

      {/* Stepper */}
      <div className="mt-6 flex items-center gap-1 overflow-x-auto pb-2">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const done = i < step;
          const active = i === step;
          return (
            <div key={i} className="flex items-center">
              <button
                onClick={() => i < step && setStep(i)}
                className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition ${
                  active ? "bg-brand-600 text-white" : done ? "bg-brand-50 text-brand-700" : "bg-slate-100 text-slate-400"
                }`}
              >
                <span className="grid h-5 w-5 place-items-center">{done ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}</span>
                <span className="hidden sm:inline">{i + 1}. {s.label}</span>
              </button>
              {i < STEPS.length - 1 && <div className={`h-0.5 w-3 ${done ? "bg-brand-300" : "bg-slate-200"}`} />}
            </div>
          );
        })}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
        {/* Form */}
        <div className="card p-6">
          {step === 0 && (
            <Step title="Kalkış tarihinizi seçin">
              <div className="space-y-3">
                {dates.map((d) => (
                  <label key={d.id} className={radioCard(dateId === d.id)}>
                    <input type="radio" name="date" className="sr-only" checked={dateId === d.id} onChange={() => setDateId(d.id)} />
                    <div>
                      <div className="font-semibold text-ink">{d.range}</div>
                      <div className="text-xs text-ink-muted">{d.nights} gece</div>
                    </div>
                    {d.remaining <= 5 ? (
                      <span className="chip bg-amber-100 text-amber-800">Son {d.remaining} yer</span>
                    ) : (
                      <span className="chip bg-emerald-100 text-emerald-800">Müsait</span>
                    )}
                  </label>
                ))}
              </div>
            </Step>
          )}

          {step === 1 && (
            <Step title="Kaç kişi seyahat ediyorsunuz?">
              <div className="space-y-4">
                <Counter label="Yetişkin" hint="12 yaş ve üzeri" value={adults} setValue={setAdults} min={1} />
                <Counter label="Çocuk" hint="2–11 yaş (yatak dahil)" value={children} setValue={setChildren} min={0} />
                <Counter label="Bebek" hint="0–1 yaş" value={infants} setValue={setInfants} min={0} />
              </div>
            </Step>
          )}

          {step === 2 && (
            <Step title="Oda tipini seçin">
              <div className="grid gap-3 sm:grid-cols-2">
                {rooms.map((r) => (
                  <label key={r.code} className={radioCard(roomCode === r.code)}>
                    <input type="radio" name="room" className="sr-only" checked={roomCode === r.code} onChange={() => setRoomCode(r.code)} />
                    <div className="flex items-center gap-2">
                      <BedDouble className="h-5 w-5 text-brand-600" />
                      <div>
                        <div className="font-semibold text-ink">{r.nameTr}</div>
                        <div className="text-xs text-ink-muted">{r.code}</div>
                      </div>
                    </div>
                    {roomCode === r.code && <Check className="h-5 w-5 text-brand-600" />}
                  </label>
                ))}
              </div>
              <p className="mt-3 text-xs text-ink-muted">Tek kişilik odada tek kişi farkı fiyata yansıtılır.</p>
            </Step>
          )}

          {step === 3 && (
            <Step title="İletişim sahibi yolcu bilgileri">
              <div className="grid gap-4 sm:grid-cols-2">
                <Input name="firstName" autoComplete="given-name" label="Ad *" value={lead.firstName} onChange={(v) => setLead({ ...lead, firstName: v })} />
                <Input name="lastName" autoComplete="family-name" label="Soyad *" value={lead.lastName} onChange={(v) => setLead({ ...lead, lastName: v })} />
                <Input name="email" autoComplete="email" label="E-posta *" type="email" value={lead.email} onChange={(v) => setLead({ ...lead, email: v })} />
                <Input name="phone" autoComplete="tel" label="Telefon *" value={lead.phone} onChange={(v) => setLead({ ...lead, phone: v })} placeholder="+90 5xx xxx xx xx" />
                <Input name="birthDate" label="Doğum Tarihi" type="date" value={lead.birthDate} onChange={(v) => setLead({ ...lead, birthDate: v })} />
                <Input name="nationality" label="Uyruk" value={lead.nationality} onChange={(v) => setLead({ ...lead, nationality: v })} />
              </div>
              <p className="mt-3 flex items-center gap-1.5 text-xs text-ink-muted"><ShieldCheck className="h-4 w-4" /> Diğer yolcuların bilgileri rezervasyon sonrası eklenebilir. Pasaport bilgisi talep etmiyoruz.</p>
            </Step>
          )}

          {step === 4 && (
            <Step title="Ek hizmetler (opsiyonel)">
              {extras.length === 0 ? (
                <p className="text-sm text-ink-muted">Bu tur için ek hizmet bulunmuyor.</p>
              ) : (
                <div className="space-y-3">
                  {extras.map((e) => (
                    <label key={e.id} className={checkCard(extraIds.includes(e.id))}>
                      <input type="checkbox" className="sr-only" checked={extraIds.includes(e.id)} onChange={() => toggleExtra(e.id)} />
                      <div className="flex items-center gap-3">
                        <span className={`grid h-5 w-5 place-items-center rounded-md border ${extraIds.includes(e.id) ? "border-brand-600 bg-brand-600 text-white" : "border-slate-300"}`}>
                          {extraIds.includes(e.id) && <Check className="h-3.5 w-3.5" />}
                        </span>
                        <div>
                          <div className="font-semibold text-ink">{e.nameTr}</div>
                          <div className="text-xs text-ink-muted">{e.perPax ? "kişi başı" : "rezervasyon başı"}</div>
                        </div>
                      </div>
                      <div className="font-semibold text-ink">{tl(e.priceMinor)}</div>
                    </label>
                  ))}
                </div>
              )}
            </Step>
          )}

          {step === 5 && (
            <Step title="Özet ve ödeme yöntemi">
              <div className="rounded-xl border border-slate-200">
                {quote?.lines.map((l, i) => (
                  <div key={i} className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5 text-sm last:border-0">
                    <span className="text-ink-soft">{l.label} <span className="text-ink-muted">× {l.qty}</span></span>
                    <span className="font-medium text-ink">{tl(l.totalEurMinor)}</span>
                  </div>
                ))}
              </div>

              <div className="mt-5 space-y-2">
                <div className="text-sm font-semibold text-ink">Ödeme yöntemi</div>
                <PayOption testid="pay-bank" icon={<Banknote className="h-5 w-5" />} title="Banka Havalesi / EFT" desc="IBAN bilgileri rezervasyon sonrası iletilir" active={payment === "BANK_TRANSFER"} onClick={() => setPayment("BANK_TRANSFER")} />
                <PayOption testid="pay-agency" icon={<PhoneCall className="h-5 w-5" />} title="Acente Beni Arasın" desc="Ödeme almadan rezervasyon talebi oluştur" active={payment === "AGENCY"} onClick={() => setPayment("AGENCY")} />
                <div className="flex items-center gap-3 rounded-xl border border-dashed border-slate-200 px-4 py-3 text-sm text-slate-400">
                  <CreditCard className="h-5 w-5" /> Online Kredi Kartı <span className="ml-auto text-xs">yakında</span>
                </div>
              </div>

              <label className="mt-5 flex items-start gap-2 text-sm text-ink-soft">
                <input data-testid="kvkk" type="checkbox" checked={kvkk} onChange={(e) => setKvkk(e.target.checked)} className="mt-0.5 h-4 w-4 rounded border-slate-300" />
                <span><a href="/gizlilik" className="text-brand-700 underline">KVKK aydınlatma metnini</a> ve <a href="/kosullar" className="text-brand-700 underline">kullanım koşullarını</a> okudum, onaylıyorum. <span className="text-ink-muted">(Demo: bu işlem gerçek bir rezervasyon, sözleşme veya ödeme oluşturmaz; bağlayıcı değildir.)</span></span>
              </label>

              {error && <div className="mt-4 flex items-center gap-2 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700"><AlertCircle className="h-4 w-4" /> {error}</div>}
            </Step>
          )}

          {/* Nav */}
          <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-5">
            <button onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0} className="btn-ghost disabled:opacity-40">Geri</button>
            {step < STEPS.length - 1 ? (
              <button data-testid="wizard-next" onClick={() => canNext && setStep((s) => s + 1)} disabled={!canNext} className="btn-primary">Devam Et</button>
            ) : (
              <button data-testid="wizard-submit" onClick={submit} disabled={!canNext || submitting} className="btn-accent">
                {submitting ? <><Loader2 className="h-5 w-5 animate-spin" /> Oluşturuluyor…</> : <>Rezervasyonu Tamamla</>}
              </button>
            )}
          </div>
        </div>

        {/* Price sidebar */}
        <aside className="lg:sticky lg:top-24 lg:h-fit">
          <div className="card p-6">
            <div className="text-sm font-semibold text-ink">Fiyat Özeti</div>
            <div className="mt-3 space-y-1.5 text-sm">
              <SummaryRow label="Kişiler" value={`${adults} yetişkin${children ? `, ${children} çocuk` : ""}${infants ? `, ${infants} bebek` : ""}`} />
              <SummaryRow label="Oda" value={roomCode} />
              {quote && <SummaryRow label="Ara toplam" value={tl(quote.subtotalEurMinor)} />}
              {quote && quote.extrasEurMinor > 0 && <SummaryRow label="Ekstralar" value={tl(quote.extrasEurMinor)} />}
            </div>
            <div className="mt-4 flex items-end justify-between border-t border-slate-100 pt-4">
              <span className="text-sm font-semibold text-ink">Toplam</span>
              <span className="text-2xl font-extrabold text-ink">
                {quoteLoading ? <Loader2 className="h-5 w-5 animate-spin text-slate-400" /> : quote ? formatMoney(quote.totalTryMinor) : "—"}
              </span>
            </div>
            {quote?.earlyBird && <div className="mt-2 chip bg-accent-100 text-accent-700">🎉 Erken rezervasyon fiyatı uygulandı</div>}
            <p className="mt-3 text-xs text-ink-muted">Fiyat sunucu tarafında, seçtiğiniz tarih ve oda için anlık hesaplanır. TRY tutarı rezervasyon anındaki kur ile sabitlenir.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Step({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="mb-4 text-lg font-bold text-ink">{title}</h2>
      {children}
    </div>
  );
}

function radioCard(active: boolean) {
  return `flex cursor-pointer items-center justify-between rounded-xl border-2 p-4 transition ${active ? "border-brand-600 bg-brand-50" : "border-slate-200 hover:border-slate-300"}`;
}
function checkCard(active: boolean) {
  return `flex cursor-pointer items-center justify-between rounded-xl border p-4 transition ${active ? "border-brand-600 bg-brand-50" : "border-slate-200 hover:border-slate-300"}`;
}

function Counter({ label, hint, value, setValue, min }: { label: string; hint: string; value: number; setValue: (n: number) => void; min: number }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-slate-200 p-4">
      <div>
        <div className="font-semibold text-ink">{label}</div>
        <div className="text-xs text-ink-muted">{hint}</div>
      </div>
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => setValue(Math.max(min, value - 1))} className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 text-ink-soft hover:bg-slate-50"><Minus className="h-4 w-4" /></button>
        <span className="w-6 text-center font-bold text-ink">{value}</span>
        <button type="button" onClick={() => setValue(Math.min(9, value + 1))} className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 text-ink-soft hover:bg-slate-50"><Plus className="h-4 w-4" /></button>
      </div>
    </div>
  );
}

function Input({ label, value, onChange, type = "text", placeholder, name, autoComplete }: { label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string; name?: string; autoComplete?: string }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      <input name={name} autoComplete={autoComplete} type={type} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className="input" />
    </label>
  );
}

function PayOption({ icon, title, desc, active, onClick, testid }: { icon: React.ReactNode; title: string; desc: string; active: boolean; onClick: () => void; testid?: string }) {
  return (
    <button data-testid={testid} type="button" onClick={onClick} className={`flex w-full items-center gap-3 rounded-xl border-2 px-4 py-3 text-left transition ${active ? "border-brand-600 bg-brand-50" : "border-slate-200 hover:border-slate-300"}`}>
      <span className={`grid h-9 w-9 place-items-center rounded-lg ${active ? "bg-brand-600 text-white" : "bg-slate-100 text-ink-soft"}`}>{icon}</span>
      <span>
        <span className="block font-semibold text-ink">{title}</span>
        <span className="block text-xs text-ink-muted">{desc}</span>
      </span>
      {active && <Check className="ml-auto h-5 w-5 text-brand-600" />}
    </button>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-ink-muted">{label}</span>
      <span className="font-medium text-ink">{value}</span>
    </div>
  );
}
