import { redirect } from "next/navigation";
import Link from "next/link";
import { Plane, LogIn, AlertCircle, ArrowLeft } from "lucide-react";
import { loginCustomer, getCustomerUser } from "@/lib/auth";

export const metadata = { title: "Giriş Yap" };

export default async function CustomerLogin({ searchParams }: { searchParams: Promise<{ error?: string; next?: string }> }) {
  const sp = await searchParams;
  const next = sp.next || "/hesabim";
  if (await getCustomerUser()) redirect(next);

  async function action(formData: FormData) {
    "use server";
    const email = String(formData.get("email") || "");
    const password = String(formData.get("password") || "");
    const nx = String(formData.get("next") || "/hesabim");
    const user = await loginCustomer(email, password);
    if (!user) redirect(`/hesap/giris?error=1&next=${encodeURIComponent(nx)}`);
    redirect(nx);
  }

  return (
    <div className="grid min-h-screen place-items-center bg-slate-50 p-4">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-6 flex items-center justify-center gap-2">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-600 text-white"><Plane className="h-5 w-5 -rotate-45" /></span>
          <span className="text-xl font-extrabold text-ink">Tur<span className="text-brand-600">Acente</span></span>
        </Link>
        <form action={action} className="card space-y-4 p-6">
          <input type="hidden" name="next" value={next} />
          <div>
            <h1 className="text-xl font-extrabold text-ink">Hesabınıza giriş yapın</h1>
            <p className="mt-1 text-sm text-ink-muted">Rezervasyonlarınızı ve favorilerinizi görüntüleyin.</p>
          </div>
          {sp.error && <div className="flex items-center gap-2 rounded-xl bg-rose-50 px-3 py-2.5 text-sm text-rose-700"><AlertCircle className="h-4 w-4" /> E-posta veya şifre hatalı.</div>}
          <label className="block"><span className="label">E-posta</span><input name="email" type="email" required className="input" /></label>
          <label className="block"><span className="label">Şifre</span><input name="password" type="password" required className="input" /></label>
          <button type="submit" className="btn-primary w-full"><LogIn className="h-4 w-4" /> Giriş Yap</button>
          <p className="text-center text-sm text-ink-muted">Hesabınız yok mu? <Link href={`/hesap/kayit?next=${encodeURIComponent(next)}`} className="font-semibold text-brand-700 hover:underline">Kayıt olun</Link></p>
        </form>
        <Link href="/" className="mt-4 flex items-center justify-center gap-1 text-sm text-ink-muted hover:text-ink"><ArrowLeft className="h-4 w-4" /> Siteye dön</Link>
      </div>
    </div>
  );
}
