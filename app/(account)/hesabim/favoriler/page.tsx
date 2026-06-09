import Link from "next/link";
import { Heart } from "lucide-react";
import { getCustomerUser } from "@/lib/auth";
import { getMyFavorites } from "@/lib/account";
import { TourCard } from "@/components/public/TourCard";

export default async function MyFavorites() {
  const user = await getCustomerUser();
  const favorites = user?.customerId ? await getMyFavorites(user.customerId) : [];

  if (favorites.length === 0) {
    return (
      <div className="card grid place-items-center gap-3 p-16 text-center">
        <Heart className="h-9 w-9 text-slate-300" />
        <p className="font-semibold text-ink">Favori turunuz yok</p>
        <p className="text-sm text-ink-muted">Beğendiğiniz turları ♥ ile kaydedin; burada toplansın.</p>
        <Link href="/turlar" className="btn-primary mt-2">Turları Keşfet</Link>
      </div>
    );
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {favorites.map((f) => (
        <TourCard key={f.id} tour={f.tour as any} favorited />
      ))}
    </div>
  );
}
