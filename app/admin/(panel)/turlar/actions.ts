"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { getStaffUser } from "@/lib/auth";
import { slugify } from "@/lib/slug";

async function requireStaff() {
  const u = await getStaffUser();
  if (!u) throw new Error("UNAUTHORIZED");
  return u;
}

const E = (eur: number) => Math.round(eur * 100);

const coreSchema = z.object({
  titleTr: z.string().min(3, "Başlık en az 3 karakter"),
  destinationId: z.string().min(1, "Destinasyon seçin"),
  summaryTr: z.string().min(5, "Özet girin"),
  descriptionTr: z.string().min(5, "Açıklama girin"),
  durationDays: z.coerce.number().int().min(1),
  durationNights: z.coerce.number().int().min(0),
  transportType: z.enum(["FLIGHT", "BUS", "CRUISE", "OWN_ARRANGEMENT", "MIXED"]),
  hotelCategory: z.enum(["THREE_STAR", "FOUR_STAR", "FIVE_STAR", "BOUTIQUE", "NONE"]),
  visaRequired: z.boolean(),
  basePriceEur: z.coerce.number().min(0),
  isFeatured: z.boolean(),
  isCampaign: z.boolean(),
  included: z.array(z.string()),
  excluded: z.array(z.string()),
});

export type CoreResult = { ok: true; id: string } | { ok: false; error: string };

export async function createTourAction(input: unknown): Promise<CoreResult> {
  await requireStaff();
  const p = coreSchema.safeParse(input);
  if (!p.success) return { ok: false, error: p.error.issues[0]?.message ?? "Form hatalı." };
  const d = p.data;

  const base = slugify(d.titleTr) || "tur";
  let slug = base;
  for (let i = 2; await db.tour.findUnique({ where: { slug } }); i++) slug = `${base}-${i}`;

  const tour = await db.tour.create({
    data: {
      destinationId: d.destinationId, slug, titleTr: d.titleTr, summaryTr: d.summaryTr, descriptionTr: d.descriptionTr,
      durationDays: d.durationDays, durationNights: d.durationNights, transportType: d.transportType, hotelCategory: d.hotelCategory,
      visaRequired: d.visaRequired, basePriceMinor: E(d.basePriceEur), baseCurrency: "EUR", status: "DRAFT",
      isFeatured: d.isFeatured, isCampaign: d.isCampaign, includedServices: d.included, excludedServices: d.excluded,
      meetingPoint: "İstanbul Havalimanı, Dış Hatlar Gidiş Katı",
      cancellationPolicy: "30 günden önce %10, 15-30 gün arası %50, 15 günden az %100 iptal bedeli.",
      reservationTerms: "Rezervasyon, kapora veya tam ödeme ile kesinleşir.",
    },
  });
  await db.auditLog.create({ data: { actorRealm: "STAFF", action: "tour.create", entity: "tour", entityId: tour.id } });
  revalidatePath("/admin/turlar");
  return { ok: true, id: tour.id };
}

export async function updateTourCoreAction(id: string, input: unknown): Promise<CoreResult> {
  await requireStaff();
  const p = coreSchema.safeParse(input);
  if (!p.success) return { ok: false, error: p.error.issues[0]?.message ?? "Form hatalı." };
  const d = p.data;
  await db.tour.update({
    where: { id },
    data: {
      destinationId: d.destinationId, titleTr: d.titleTr, summaryTr: d.summaryTr, descriptionTr: d.descriptionTr,
      durationDays: d.durationDays, durationNights: d.durationNights, transportType: d.transportType, hotelCategory: d.hotelCategory,
      visaRequired: d.visaRequired, basePriceMinor: E(d.basePriceEur), isFeatured: d.isFeatured, isCampaign: d.isCampaign,
      includedServices: d.included, excludedServices: d.excluded,
    },
  });
  revalidatePath(`/admin/turlar/${id}/duzenle`);
  revalidatePath("/admin/turlar");
  return { ok: true, id };
}

const dateSchema = z.object({
  startDate: z.string().min(8),
  endDate: z.string().min(8),
  quota: z.coerce.number().int().min(1),
  adultEur: z.coerce.number().min(0),
  singleEur: z.coerce.number().min(0),
});

export type SimpleResult = { ok: true } | { ok: false; error: string };

export async function addDateAction(tourId: string, input: unknown): Promise<SimpleResult> {
  await requireStaff();
  const p = dateSchema.safeParse(input);
  if (!p.success) return { ok: false, error: p.error.issues[0]?.message ?? "Tarih bilgileri hatalı." };
  const d = p.data;

  const rooms = await db.roomType.findMany({ where: { code: { in: ["DBL", "SGL"] } } });
  const dbl = rooms.find((r) => r.code === "DBL");
  const sgl = rooms.find((r) => r.code === "SGL");

  const td = await db.tourDate.create({
    data: { tourId, startDate: new Date(d.startDate), endDate: new Date(d.endDate), quota: d.quota, status: "ACTIVE", baseCurrency: "EUR" },
  });

  const child = Math.round(d.adultEur * 0.72);
  const rows: any[] = [];
  if (dbl) rows.push(
    { tourDateId: td.id, roomTypeId: dbl.id, paxType: "ADULT", priceMinor: E(d.adultEur), currency: "EUR" },
    { tourDateId: td.id, roomTypeId: dbl.id, paxType: "CHILD_WITH_BED", priceMinor: E(child), currency: "EUR" },
    { tourDateId: td.id, roomTypeId: dbl.id, paxType: "INFANT", priceMinor: E(75), currency: "EUR" },
  );
  if (sgl) rows.push(
    { tourDateId: td.id, roomTypeId: sgl.id, paxType: "ADULT", priceMinor: E(d.adultEur + d.singleEur), currency: "EUR" },
    { tourDateId: td.id, roomTypeId: sgl.id, paxType: "CHILD_WITH_BED", priceMinor: E(child), currency: "EUR" },
    { tourDateId: td.id, roomTypeId: sgl.id, paxType: "INFANT", priceMinor: E(75), currency: "EUR" },
  );
  await db.tourPrice.createMany({ data: rows });
  revalidatePath(`/admin/turlar/${tourId}/duzenle`);
  return { ok: true };
}

export async function deleteDateAction(tourId: string, dateId: string): Promise<SimpleResult> {
  await requireStaff();
  const count = await db.reservation.count({ where: { tourDateId: dateId, status: { notIn: ["CANCELLED", "REFUNDED"] } } });
  if (count > 0) return { ok: false, error: "Bu kalkışta aktif rezervasyon var, silinemez." };
  await db.tourPrice.deleteMany({ where: { tourDateId: dateId } });
  await db.tourDate.delete({ where: { id: dateId } });
  revalidatePath(`/admin/turlar/${tourId}/duzenle`);
  return { ok: true };
}

export async function setPublishedAction(tourId: string, publish: boolean): Promise<SimpleResult> {
  const u = await requireStaff();
  if (publish) {
    const dates = await db.tourDate.count({ where: { tourId } });
    if (dates === 0) return { ok: false, error: "Yayınlamak için en az bir kalkış tarihi ekleyin." };
  }
  await db.tour.update({ where: { id: tourId }, data: { status: publish ? "PUBLISHED" : "DRAFT", publishedAt: publish ? new Date() : null } });
  await db.auditLog.create({ data: { actorUserId: u.id, actorRealm: "STAFF", action: publish ? "tour.publish" : "tour.unpublish", entity: "tour", entityId: tourId } });
  revalidatePath("/admin/turlar");
  revalidatePath(`/admin/turlar/${tourId}/duzenle`);
  return { ok: true };
}
