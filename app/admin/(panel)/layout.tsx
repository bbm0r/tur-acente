import { redirect } from "next/navigation";
import { getStaffUser } from "@/lib/auth";
import { AdminShell } from "@/components/admin/AdminShell";

export const metadata = { title: "Yönetim Paneli", robots: { index: false } };

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const user = await getStaffUser();
  if (!user) redirect("/admin/giris");

  const role = user.userRoles[0]?.role.name ?? "Personel";
  return (
    <AdminShell user={{ firstName: user.firstName, lastName: user.lastName, email: user.email, role }}>
      {children}
    </AdminShell>
  );
}
