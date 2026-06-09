import { getCustomerUser } from "@/lib/auth";
import { ProfileForm } from "@/components/account/ProfileForm";

export default async function ProfilePage() {
  const user = await getCustomerUser();
  const c = user?.customer;

  return (
    <div className="max-w-lg">
      <ProfileForm
        initial={{
          firstName: c?.firstName ?? "",
          lastName: c?.lastName ?? "",
          email: c?.email ?? "",
          phone: c?.phone ?? "",
          marketingConsent: c?.marketingConsent ?? false,
        }}
      />
    </div>
  );
}
