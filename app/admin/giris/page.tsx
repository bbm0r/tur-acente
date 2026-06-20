import { redirect } from "next/navigation";
import { Plane, LogIn, AlertCircle } from "lucide-react";
import { login, getStaffUser } from "@/lib/auth";

export const metadata = { title: "Yönetici Girişi", robots: { index: false } };

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const sp = await searchParams;
  if (await getStaffUser()) redirect("/admin");

  async function action(formData: FormData) {
    "use server";
    const email = String(formData.get("email") || "");
    const password = String(formData.get("password") || "");
    const user = await login(email, password);
    if (!user) redirect("/admin/giris?error=1");
    redirect("/admin");
  }

  return (
    <div className="grid min-h-screen place-items-center bg-gradient-to-br from-brand-700 via-brand-600 to-brand-800 p-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-white">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/15 ring-1 ring-white/25">
            <Plane className="h-6 w-6 -rotate-45" />
          </span>
          <h1 className="mt-3 text-xl font-extrabold">TurAcente Yönetim</h1>
          <p className="text-sm text-white/75">Personel girişi</p>
        </div>

        <form action={action} className="card space-y-4 p-6">
          {sp.error && (
            <div className="flex items-center gap-2 rounded-xl bg-rose-50 px-3 py-2.5 text-sm text-rose-700">
              <AlertCircle className="h-4 w-4" /> E-posta veya şifre hatalı.
            </div>
          )}
          <label className="block">
            <span className="label">E-posta</span>
            <input name="email" type="email" defaultValue="admin@turacente.com" className="input" required />
          </label>
          <label className="block">
            <span className="label">Şifre</span>
            <input name="password" type="password" defaultValue="admin1234" className="input" required />
          </label>
          <button type="submit" className="btn-primary w-full"><LogIn className="h-4 w-4" /> Giriş Yap</button>
          <p className="text-center text-xs text-ink-muted">⚠️ DEMO sistem — örnek giriş: admin@turacente.com / admin1234 (yayında kaldırın)</p>
        </form>
      </div>
    </div>
  );
}
