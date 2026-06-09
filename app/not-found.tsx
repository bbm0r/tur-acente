import Link from "next/link";
import { Compass } from "lucide-react";

export default function NotFound() {
  return (
    <div className="grid min-h-screen place-items-center bg-slate-50 p-6 text-center">
      <div>
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-brand-50 text-brand-600">
          <Compass className="h-8 w-8" />
        </span>
        <h1 className="mt-5 text-3xl font-extrabold text-ink">Sayfa bulunamadı</h1>
        <p className="mt-2 text-ink-muted">Aradığınız sayfa taşınmış veya hiç var olmamış olabilir.</p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/" className="btn-primary">Ana Sayfa</Link>
          <Link href="/turlar" className="btn-ghost">Turları Keşfet</Link>
        </div>
      </div>
    </div>
  );
}
