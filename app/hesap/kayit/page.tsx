import { redirect } from "next/navigation";
import Link from "next/link";
import { Plane, UserPlus, AlertCircle, ArrowLeft } from "lucide-react";
import { registerCustomer, getCustomerUser } from "@/lib/auth";

export const metadata = { title: "Kayıt Ol" };

const ERRORS: Record<string, string> = {
  email: "Bu e-posta ile zaten bir hesap var. Giriş yapın.",
  kvkk: "Devam etmek için KVKK onayı gereklidir.",
  pw: "Şifre en az 6 karakter olmalıdır.",
  form: "Lütfen tüm alanları doğru doldurun.",
};

export default async function CustomerRegister({ searchParams }: { searchParams: Promise<{ error?: string; next?: string }> }) {
  const sp = await searchParams;
  const next = sp.next || "/hesabim";
  if (await getCustomerUser()) redirect(next);

  async function action(formData: FormData) {
    "use server";
    const firstName = String(formData.get("firstName") || "").trim();
    const lastName = String(formData.get("lastName") || "").trim();
    const email = String(formData.get("email") || "").trim();
    const phone = String(formData.get("phone") || "").trim();
    const password = String(formData.get("password") || "");
    const kvkk = formData.get("kvkk") === "on";
    const nx = String(formData.get("next") || "/hesabim");
    const back = (e: string) => redirect(`/hesap/kayit?error=${e}&next=${encodeURIComponent(nx)}`);

    if (firstName.length < 2 || lastName.length < 2 || !email || phone.length < 7) back("form");
    if (!kvkk) back("kvkk");
    if (password.length < 6) back("pw");
    try {
      await registerCustomer({ firstName, lastName, email, phone, password });
    } catch {
      back("email");
    }
    redirect(nx);
  }

  return (
    <div className="grid min-h-screen place-items-center bg-slate-50 p-4">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-6 flex items-center justify-center gap-2">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-600 text-white"><Plane className="h-5 w-5 -rotate-45" /></span>
          <span className="text-xl font-extrabold text-ink">Tur<span className="text-brand-600">Acente</span></span>
        </Link>
        <form action={action} className="card space-y-4 p-6">
          <input type="hidden" name="next" value={next} />
          <div>
            <h1 className="text-xl font-extrabold text-ink">Hesap oluşturun</h1>
            <p className="mt-1 text-sm text-ink-muted">Aynı e-posta ile yaptığınız geçmiş rezervasyonlar otomatik hesabınıza eklenir.</p>
          </div>
          {sp.error && <div className="flex items-center gap-2 rounded-xl bg-rose-50 px-3 py-2.5 text-sm text-rose-700"><AlertCircle className="h-4 w-4" /> {ERRORS[sp.error] ?? ERRORS.form}</div>}
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block"><span className="label">Ad</span><input name="firstName" required className="input" /></label>
            <label className="block"><span className="label">Soyad</span><input name="lastName" required className="input" /></label>
          </div>
          <label className="block"><span className="label">E-posta</span><input name="email" type="email" required className="input" /></label>
          <label className="block"><span className="label">Telefon</span><input name="phone" required placeholder="+90 5xx xxx xx xx" className="input" /></label>
          <label className="block"><span className="label">Şifre</span><input name="password" type="password" required minLength={6} className="input" /></label>
          <label className="flex items-start gap-2 text-sm text-ink-soft">
            <input type="checkbox" name="kvkk" className="mt-0.5 h-4 w-4 rounded border-slate-300" />
            <span><Link href="/gizlilik" className="text-brand-700 underline">KVKK aydınlatma metnini</Link> okudum, onaylıyorum.</span>
          </label>
          <button type="submit" className="btn-primary w-full"><UserPlus className="h-4 w-4" /> Kayıt Ol</button>
          <p className="text-center text-sm text-ink-muted">Zaten hesabınız var mı? <Link href={`/hesap/giris?next=${encodeURIComponent(next)}`} className="font-semibold text-brand-700 hover:underline">Giriş yapın</Link></p>
        </form>
        <Link href="/" className="mt-4 flex items-center justify-center gap-1 text-sm text-ink-muted hover:text-ink"><ArrowLeft className="h-4 w-4" /> Siteye dön</Link>
      </div>
    </div>
  );
}
