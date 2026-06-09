"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Save, Send, Loader2, Users } from "lucide-react";
import { formatDateTimeTr } from "@/lib/utils";
import { updateCampaignAction, sendCampaignAction } from "@/app/admin/(panel)/pazarlama/actions";

type Segment = { id: string; name: string; memberCount: number };
type Recipient = { id: string; name: string; email: string; status: string };
type Campaign = { id: string; name: string; subject: string; body: string; segmentId: string | null; status: string; sentAt: string | null; recipients: Recipient[]; stats: { sent?: number; failed?: number; total?: number } | null };

const STATUS: Record<string, { label: string; cls: string }> = {
  DRAFT: { label: "Taslak", cls: "bg-slate-100 text-slate-600" },
  SENDING: { label: "Gönderiliyor", cls: "bg-amber-100 text-amber-800" },
  SENT: { label: "Gönderildi", cls: "bg-emerald-100 text-emerald-700" },
  SCHEDULED: { label: "Planlandı", cls: "bg-sky-100 text-sky-800" },
  CANCELLED: { label: "İptal", cls: "bg-rose-100 text-rose-700" },
};

export function CampaignComposer({ campaign, segments }: { campaign: Campaign; segments: Segment[] }) {
  const router = useRouter();
  const sent = campaign.status === "SENT";
  const [name, setName] = useState(campaign.name);
  const [subject, setSubject] = useState(campaign.subject);
  const [body, setBody] = useState(campaign.body);
  const [segmentId, setSegmentId] = useState(campaign.segmentId ?? "");
  const [busy, start] = useTransition();
  const [sending, startSend] = useTransition();
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const seg = segments.find((s) => s.id === segmentId);
  const st = STATUS[campaign.status] ?? STATUS.DRAFT;

  function save() {
    setErr(""); setMsg("");
    start(async () => {
      const r = await updateCampaignAction(campaign.id, { name, subject, body, segmentId: segmentId || undefined });
      if (r.ok) { setMsg("Kaydedildi."); router.refresh(); } else setErr(r.error);
    });
  }
  function send() {
    if (!window.confirm(`${seg ? `"${seg.name}" segmentindeki ${seg.memberCount} kişiye` : ""} kampanya gönderilsin mi?`)) return;
    setErr(""); setMsg("");
    startSend(async () => {
      const r = await sendCampaignAction(campaign.id);
      if (r.ok) { setMsg(`Gönderildi: ${r.sent} başarılı, ${r.failed} hata (${r.total} alıcı).`); router.refresh(); } else setErr(r.error);
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className={`chip ${st.cls}`}>{st.label}{campaign.sentAt ? ` · ${formatDateTimeTr(campaign.sentAt)}` : ""}</span>
        {campaign.stats && <span className="text-sm text-ink-muted">{campaign.stats.sent ?? 0} gönderildi · {campaign.stats.failed ?? 0} hata · {campaign.stats.total ?? 0} alıcı</span>}
      </div>
      {msg && <div className="rounded-xl bg-emerald-50 px-4 py-2 text-sm text-emerald-700">{msg}</div>}
      {err && <div className="rounded-xl bg-rose-50 px-4 py-2 text-sm text-rose-700">{err}</div>}

      {!sent ? (
        <div className="card space-y-3 p-5">
          <label className="block"><span className="label">Kampanya Adı</span><input value={name} onChange={(e) => setName(e.target.value)} className="input" /></label>
          <label className="block"><span className="label">Segment (alıcılar)</span>
            <select value={segmentId} onChange={(e) => setSegmentId(e.target.value)} className="input"><option value="">— segment seçin —</option>{segments.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.memberCount} kişi)</option>)}</select>
          </label>
          <label className="block"><span className="label">Konu</span><input value={subject} onChange={(e) => setSubject(e.target.value)} className="input" /></label>
          <label className="block"><span className="label">İçerik (düz metin veya HTML)</span><textarea value={body} onChange={(e) => setBody(e.target.value)} className="input min-h-[180px]" /></label>
          <div className="flex flex-wrap items-center gap-3">
            <button onClick={save} disabled={busy} className="btn-ghost px-4 py-2 text-sm">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Kaydet</button>
            <button onClick={send} disabled={sending || !segmentId || !subject.trim() || !body.trim()} className="btn-primary px-4 py-2 text-sm">{sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Gönder{seg ? ` (${seg.memberCount})` : ""}</button>
            {seg && <span className="flex items-center gap-1 text-xs text-ink-muted"><Users className="h-3.5 w-3.5" /> {seg.memberCount} alıcı</span>}
          </div>
          <p className="text-[11px] text-ink-muted">E-posta sağlayıcısı (Resend) ayarlı değilse gönderim konsola loglanır. Yalnızca segment filtresine uyan kişilere gider.</p>
        </div>
      ) : (
        <div className="card p-5">
          <h3 className="mb-2 font-bold text-ink">{campaign.subject}</h3>
          <div className="leading-relaxed text-ink-soft [&_a]:text-brand-700 [&_a]:underline [&_p]:mb-2" dangerouslySetInnerHTML={{ __html: campaign.body.includes("<") ? campaign.body : campaign.body.replace(/\n/g, "<br/>") }} />
        </div>
      )}

      {campaign.recipients.length > 0 && (
        <div className="card overflow-hidden">
          <div className="border-b border-slate-100 px-4 py-2 text-sm font-bold text-ink">Alıcılar ({campaign.recipients.length})</div>
          <table className="w-full text-sm"><tbody className="divide-y divide-slate-100">
            {campaign.recipients.map((r) => (
              <tr key={r.id}>
                <td className="px-4 py-2 font-medium text-ink">{r.name}</td>
                <td className="px-4 py-2 text-ink-muted">{r.email}</td>
                <td className="px-4 py-2 text-right"><span className={`chip ${r.status === "SENT" ? "bg-emerald-100 text-emerald-700" : r.status === "FAILED" ? "bg-rose-100 text-rose-700" : "bg-slate-100 text-slate-600"}`}>{r.status}</span></td>
              </tr>
            ))}
          </tbody></table>
        </div>
      )}
    </div>
  );
}
