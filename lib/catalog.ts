import "server-only";
import { db } from "./db";
import { DEMO_EUR_TRY, eurToTryMinor } from "./money";

const PUBLISHED = { status: "PUBLISHED" as const, deletedAt: null };
const upcomingActive = {
  status: { in: ["ACTIVE", "FULL"] as ("ACTIVE" | "FULL")[] },
  startDate: { gte: new Date() },
};

/** Headline "from" price for a tour card: base EUR → TRY. */
export function tryFromEur(minorEur: number) {
  return eurToTryMinor(minorEur, DEMO_EUR_TRY);
}

export async function getDestinationsWithCounts() {
  const [destinations, counts] = await Promise.all([
    db.destination.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    }),
    db.tour.groupBy({ by: ["destinationId"], where: PUBLISHED, _count: true }),
  ]);
  const map = new Map(counts.map((c) => [c.destinationId, c._count]));
  return destinations.map((d) => ({ ...d, tourCount: map.get(d.id) ?? 0 }));
}

export async function getFeaturedTours(limit = 6) {
  return db.tour.findMany({
    where: { ...PUBLISHED, isFeatured: true },
    include: { destination: true },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function getCampaignTours(limit = 4) {
  return db.tour.findMany({
    where: { ...PUBLISHED, isCampaign: true },
    include: { destination: true },
    take: limit,
  });
}

export async function listTours(opts: {
  destinationSlug?: string;
  q?: string;
  campaign?: boolean;
} = {}) {
  return db.tour.findMany({
    where: {
      ...PUBLISHED,
      ...(opts.destinationSlug ? { destination: { slug: opts.destinationSlug } } : {}),
      ...(opts.campaign ? { isCampaign: true } : {}),
      ...(opts.q
        ? {
            OR: [
              { titleTr: { contains: opts.q, mode: "insensitive" } },
              { summaryTr: { contains: opts.q, mode: "insensitive" } },
              { destination: { nameTr: { contains: opts.q, mode: "insensitive" } } },
            ],
          }
        : {}),
    },
    include: {
      destination: true,
      tourDates: { where: upcomingActive, orderBy: { startDate: "asc" }, take: 1 },
    },
    orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
  });
}

export async function getDestinationBySlug(slug: string) {
  return db.destination.findUnique({ where: { slug } });
}

export async function getTourBySlug(slug: string) {
  return db.tour.findFirst({
    where: { slug, ...PUBLISHED },
    include: {
      destination: true,
      images: { orderBy: { sortOrder: "asc" } },
      itineraryDays: { orderBy: { dayNumber: "asc" } },
      faqs: { where: { isPublished: true }, orderBy: { sortOrder: "asc" } },
      optionalExtras: { where: { isActive: true } },
      tourDates: {
        where: upcomingActive,
        orderBy: { startDate: "asc" },
        include: { prices: { include: { roomType: true } } },
      },
    },
  });
}

export async function getSimilarTours(tourId: string, destinationId: string, limit = 3) {
  return db.tour.findMany({
    where: { ...PUBLISHED, destinationId, id: { not: tourId } },
    include: { destination: true },
    take: limit,
  });
}

export async function getTestimonials(limit = 6) {
  return db.testimonial.findMany({
    where: { isPublished: true },
    orderBy: { sortOrder: "asc" },
    take: limit,
  });
}
