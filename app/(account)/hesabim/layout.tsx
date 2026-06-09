import { redirect } from "next/navigation";
import { getCustomerUser } from "@/lib/auth";
import { Header } from "@/components/public/Header";
import { Footer } from "@/components/public/Footer";
import { WhatsAppFab } from "@/components/public/WhatsAppFab";
import { AccountNav } from "@/components/account/AccountNav";
import { customerLogoutAction } from "./actions";

export const metadata = { title: "Hesabım", robots: { index: false } };

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const user = await getCustomerUser();
  if (!user) redirect("/hesap/giris");

  return (
    <>
      <Header />
      <div className="min-h-[60vh] bg-slate-50">
        <div className="container-page py-8">
          <div className="mb-6 flex items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-extrabold text-ink">Hesabım</h1>
              <p className="text-sm text-ink-muted">Merhaba {user.firstName} 👋</p>
            </div>
            <form action={customerLogoutAction}>
              <button className="btn-ghost px-4 py-2 text-sm">Çıkış Yap</button>
            </form>
          </div>
          <AccountNav />
          <div className="mt-6">{children}</div>
        </div>
      </div>
      <Footer />
      <WhatsAppFab />
    </>
  );
}
