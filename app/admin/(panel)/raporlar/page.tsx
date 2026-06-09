import { Target, Trophy, CalendarClock, Users2, TrendingUp, Layers } from "lucide-react";
import { getCrmDashboard } from "@/lib/crm";
import { formatMoney } from "@/lib/money";
import { lifecycleLabel } from "@/lib/labels";

export const metadata = { title: "CRM Raporları" };

const LEAD_LABEL: Record<string, string> = { NEW: "Yeni", CONTACTED: "Görüşüldü", CONVERTED: "Dönüştürüldü", LOST: "Kayıp" };

export default async function Raporlar() {
  const d = await getCrmDashboard();
  const stageMax = Math.max(1, ...d.stages.map((s) => s.value));
  const lifeMax = Math.max(1, ...d.lifecycle.map((l) => l.count));
  const leadMax = Math.max(1, ...d.leadsByStatus.map((l) => l.count));
  const funnelMax = Math.max(1, d.leadsTotal, d.openCount, d.wonCount);
  const agentMax = Math.max(1, ...d.agents.map((a) => a.wonValue));
  const leadToOpp = d.leadsTotal ? Math.round((d.openCount / d.leadsTotal) * 100) : 0;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-extrabold text-ink">CRM Raporları</h1>
        <p className="text-sm text-ink-muted">Satış hattı, dönüşüm ve performans özeti</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={<Target className="h-5 w-5" />} label="Açık Fırsat" value={String(d.openCount)} sub={formatMoney(d.openValue, "EUR")} />
        <StatCard icon={<Trophy className="h-5 w-5" />} label="Kazanma Oranı" value={`%${d.winRate}`} sub={`${d.wonCount} kazanıldı · ${d.lostCount} kayıp`} />
        <StatCard icon={<CalendarClock className="h-5 w-5" />} label="Bekleyen Görev" value={String(d.openTasks)} sub={d.overdueTasks ? `${d.overdueTasks} gecikmiş` : "güncel"} accent={d.overdueTasks > 0} />
        <StatCard icon={<Users2 className="h-5 w-5" />} label="Toplam Kişi" value={String(d.customerCount)} sub={`${d.leadsTotal} talep`} />
      </div>

      <Panel title="Satış Hattı (açık fırsat değeri)" icon={<Layers className="h-4 w-4" />}>
        <div className="space-y-3">
          {d.stages.map((s) => <Bar key={s.name} label={s.name} pct={Math.round((s.value / stageMax) * 100)} sub={`${s.count} · ${formatMoney(s.value, "EUR")}`} />)}
          {d.stages.length === 0 && <Empty />}
        </div>
      </Panel>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Dönüşüm Hunisi" icon={<TrendingUp className="h-4 w-4" />}>
          <div className="space-y-3">
            <Bar label="Talepler" pct={Math.round((d.leadsTotal / funnelMax) * 100)} sub={String(d.leadsTotal)} color="bg-slate-400" />
            <Bar label="Açık Fırsat" pct={Math.round((d.openCount / funnelMax) * 100)} sub={String(d.openCount)} color="bg-sky-500" />
            <Bar label="Kazanıldı" pct={Math.round((d.wonCount / funnelMax) * 100)} sub={String(d.wonCount)} color="bg-emerald-500" />
          </div>
          <p className="mt-3 text-xs text-ink-muted">Talep → Fırsat dönüşümü: <b className="text-ink">%{leadToOpp}</b></p>
        </Panel>

        <Panel title="Kazan / Kaybet" icon={<Trophy className="h-4 w-4" />}>
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-4xl font-extrabold text-emerald-600">%{d.winRate}</div>
              <div className="text-xs text-ink-muted">kazanma oranı</div>
            </div>
            <div className="flex-1 space-y-3">
              <Bar label="Kazanıldı" pct={Math.round((d.wonCount / Math.max(1, d.wonCount + d.lostCount)) * 100)} sub={String(d.wonCount)} color="bg-emerald-500" />
              <Bar label="Kaybedildi" pct={Math.round((d.lostCount / Math.max(1, d.wonCount + d.lostCount)) * 100)} sub={String(d.lostCount)} color="bg-rose-400" />
              <div className="text-xs text-ink-muted">Kazanılan değer: <b className="text-ink">{formatMoney(d.wonValue, "EUR")}</b></div>
            </div>
          </div>
        </Panel>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Kişiler (yaşam döngüsü)" icon={<Users2 className="h-4 w-4" />}>
          <div className="space-y-3">
            {d.lifecycle.map((l) => <Bar key={l.stage} label={lifecycleLabel[l.stage] ?? l.stage} pct={Math.round((l.count / lifeMax) * 100)} sub={String(l.count)} color="bg-brand-500" />)}
            {d.lifecycle.length === 0 && <Empty />}
          </div>
        </Panel>

        <Panel title="Talepler (duruma göre)" icon={<TrendingUp className="h-4 w-4" />}>
          <div className="space-y-3">
            {d.leadsByStatus.map((l) => <Bar key={l.status} label={LEAD_LABEL[l.status] ?? l.status} pct={Math.round((l.count / leadMax) * 100)} sub={String(l.count)} color="bg-amber-500" />)}
            {d.leadsByStatus.length === 0 && <Empty />}
          </div>
        </Panel>
      </div>

      <Panel title="Temsilci Performansı" icon={<Users2 className="h-4 w-4" />}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wide text-ink-muted"><tr><th className="py-2">Temsilci</th><th className="py-2">Açık</th><th className="py-2">Kazanılan</th><th className="py-2">Kazanılan Değer</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {d.agents.map((a) => (
                <tr key={a.name}>
                  <td className="py-2 font-medium text-ink">{a.name}</td>
                  <td className="py-2 text-ink-muted">{a.open}</td>
                  <td className="py-2 text-ink-muted">{a.won}</td>
                  <td className="py-2">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-24 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-emerald-500" style={{ width: `${Math.round((a.wonValue / agentMax) * 100)}%` }} /></div>
                      <span className="text-xs font-semibold text-ink">{formatMoney(a.wonValue, "EUR")}</span>
                    </div>
                  </td>
                </tr>
              ))}
              {d.agents.length === 0 && <tr><td colSpan={4} className="py-6 text-center text-ink-muted">Veri yok.</td></tr>}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

function StatCard({ icon, label, value, sub, accent }: { icon: React.ReactNode; label: string; value: string; sub: string; accent?: boolean }) {
  return (
    <div className="card flex items-center gap-3 p-4">
      <span className={`grid h-11 w-11 place-items-center rounded-xl ${accent ? "bg-rose-50 text-rose-600" : "bg-brand-50 text-brand-700"}`}>{icon}</span>
      <div className="min-w-0">
        <div className="text-xs text-ink-muted">{label}</div>
        <div className="text-xl font-extrabold text-ink">{value}</div>
        <div className="truncate text-[11px] text-ink-muted">{sub}</div>
      </div>
    </div>
  );
}
function Panel({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return <div className="card p-5"><h2 className="mb-4 flex items-center gap-2 font-bold text-ink">{icon} {title}</h2>{children}</div>;
}
function Bar({ label, pct, sub, color = "bg-brand-500" }: { label: string; pct: number; sub: string; color?: string }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs"><span className="text-ink-soft">{label}</span><span className="font-semibold text-ink">{sub}</span></div>
      <div className="h-2.5 rounded-full bg-slate-100"><div className={`h-2.5 rounded-full ${color}`} style={{ width: `${Math.max(2, Math.min(100, pct))}%` }} /></div>
    </div>
  );
}
function Empty() { return <p className="py-3 text-sm text-ink-muted">Veri yok.</p>; }
