"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, AlertCircle } from "lucide-react";
import { recordPaymentAction } from "@/app/admin/(panel)/rezervasyonlar/[id]/actions";

const METHODS = [
  { value: "BANK_TRANSFER", label: "Banka Havalesi" },
  { value: "CREDIT_CARD", label: "Kredi Kartı" },
  { value: "CASH", label: "Nakit" },
  { value: "AGENCY_CREDIT", label: "Acente Bakiyesi" },
];

export function PaymentForm({ reservationId, balanceMinor }: { reservationId: string; balanceMinor: number }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [amount, setAmount] = useState(balanceMinor > 0 ? String(Math.round(balanceMinor / 100)) : "");
  const [method, setMethod] = useState("BANK_TRANSFER");
  const [err, setErr] = useState("");

  function submit() {
    setErr("");
    const minor = Math.round(parseFloat(amount.replace(",", ".")) * 100);
    if (!minor || minor <= 0) { setErr("Geçerli tutar girin."); return; }
    start(async () => {
      const r = await recordPaymentAction(reservationId, method, minor);
      if (r.ok) { setAmount(""); router.refresh(); }
      else setErr(r.error);
    });
  }

  return (
    <div className="space-y-2">
      <div className="text-sm font-semibold text-ink">Tahsilat Ekle</div>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-ink-muted">₺</span>
          <input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" placeholder="0" className="input pl-7" />
        </div>
        <select value={method} onChange={(e) => setMethod(e.target.value)} className="input w-40">
          {METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
        </select>
      </div>
      <button onClick={submit} disabled={pending} className="btn-primary w-full">
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Tahsilat Kaydet
      </button>
      {err && <p className="flex items-center gap-1.5 text-xs text-rose-600"><AlertCircle className="h-3.5 w-3.5" /> {err}</p>}
    </div>
  );
}
