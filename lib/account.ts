import "server-only";
import { db } from "./db";

export async function getMyReservations(customerId: string) {
  return db.reservation.findMany({
    where: { customerId },
    include: { tour: { include: { destination: true } }, tourDate: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function getMyReservationByRef(customerId: string, reference: string) {
  return db.reservation.findFirst({
    where: { reference, customerId },
    include: {
      tour: { include: { destination: true } },
      tourDate: true,
      customer: true,
      passengers: true,
      extras: { include: { optionalExtra: true } },
      payments: true,
    },
  });
}

export async function getMyFavorites(customerId: string) {
  return db.favorite.findMany({
    where: { customerId },
    include: { tour: { include: { destination: true } } },
    orderBy: { createdAt: "desc" },
  });
}

/** Set of tourIds favorited by this customer (for filling ♥ state on cards). */
export async function getFavoriteTourIds(customerId: string): Promise<Set<string>> {
  const favs = await db.favorite.findMany({ where: { customerId }, select: { tourId: true } });
  return new Set(favs.map((f) => f.tourId));
}

/** Toggle a favorite; returns the new state (true = now favorited). */
export async function toggleFavorite(customerId: string, tourId: string) {
  const existing = await db.favorite.findUnique({ where: { customerId_tourId: { customerId, tourId } } });
  if (existing) {
    await db.favorite.delete({ where: { id: existing.id } });
    return false;
  }
  await db.favorite.create({ data: { customerId, tourId } });
  return true;
}

export async function updateCustomerProfile(
  customerId: string,
  data: { firstName: string; lastName: string; phone: string; marketingConsent: boolean },
) {
  await db.customer.update({
    where: { id: customerId },
    data: { firstName: data.firstName, lastName: data.lastName, phone: data.phone, marketingConsent: data.marketingConsent },
  });
}
