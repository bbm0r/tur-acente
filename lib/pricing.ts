import "server-only";
import { db } from "./db";
import { DEMO_EUR_TRY, eurToTryMinor } from "./money";

export type QuoteInput = {
  tourDateId: string;
  roomTypeCode: string;
  adults: number;
  children: number;
  infants: number;
  extraIds: string[];
};

export type QuoteLine = {
  label: string;
  qty: number;
  unitEurMinor: number;
  totalEurMinor: number;
};

export type Quote = {
  lines: QuoteLine[];
  subtotalEurMinor: number;
  extrasEurMinor: number;
  discountEurMinor: number;
  totalEurMinor: number;
  rate: number;
  totalTryMinor: number;
  earlyBird: boolean;
  currency: "TRY";
};

/**
 * Deterministic, server-side price computation. Reads the price grid for a
 * departure (date × room type × pax type) and applies early-bird windows.
 * The TRY conversion is snapshotted onto the reservation at creation time.
 */
export async function quote(input: QuoteInput): Promise<Quote> {
  const td = await db.tourDate.findUnique({
    where: { id: input.tourDateId },
    include: { tour: true },
  });
  if (!td) throw new Error("DATE_NOT_FOUND");

  const room = await db.roomType.findUnique({ where: { code: input.roomTypeCode } });
  if (!room) throw new Error("ROOM_NOT_FOUND");

  const prices = await db.tourPrice.findMany({
    where: { tourDateId: td.id, roomTypeId: room.id },
  });
  const row = (pax: string) => prices.find((p) => p.paxType === pax);

  const now = new Date();
  const earlyBird = !!(td.earlyBirdUntil && now <= td.earlyBirdUntil);

  const adultRow = row("ADULT");
  const childRow = row("CHILD_WITH_BED");
  const infantRow = row("INFANT");

  const adultUnit =
    earlyBird && adultRow?.earlyBirdPriceMinor
      ? adultRow.earlyBirdPriceMinor
      : adultRow?.priceMinor ?? td.tour.basePriceMinor;
  const childUnit = childRow?.priceMinor ?? Math.round(adultUnit * 0.75);
  const infantUnit = infantRow?.priceMinor ?? 0;

  const lines: QuoteLine[] = [];
  if (input.adults > 0)
    lines.push({
      label: `Yetişkin · ${room.nameTr}`,
      qty: input.adults,
      unitEurMinor: adultUnit,
      totalEurMinor: adultUnit * input.adults,
    });
  if (input.children > 0)
    lines.push({
      label: "Çocuk (yatak dahil)",
      qty: input.children,
      unitEurMinor: childUnit,
      totalEurMinor: childUnit * input.children,
    });
  if (input.infants > 0)
    lines.push({
      label: "Bebek",
      qty: input.infants,
      unitEurMinor: infantUnit,
      totalEurMinor: infantUnit * input.infants,
    });

  const subtotalEurMinor = lines.reduce((s, l) => s + l.totalEurMinor, 0);

  let extrasEurMinor = 0;
  if (input.extraIds.length) {
    const paxCount = input.adults + input.children;
    const extras = await db.optionalExtra.findMany({
      where: { id: { in: input.extraIds } },
    });
    for (const e of extras) {
      const qty = e.perPax ? paxCount : 1;
      const total = e.priceMinor * qty;
      extrasEurMinor += total;
      lines.push({
        label: e.nameTr,
        qty,
        unitEurMinor: e.priceMinor,
        totalEurMinor: total,
      });
    }
  }

  const discountEurMinor = 0;
  const totalEurMinor = subtotalEurMinor + extrasEurMinor - discountEurMinor;
  const rate = DEMO_EUR_TRY;

  return {
    lines,
    subtotalEurMinor,
    extrasEurMinor,
    discountEurMinor,
    totalEurMinor,
    rate,
    totalTryMinor: eurToTryMinor(totalEurMinor, rate),
    earlyBird,
    currency: "TRY",
  };
}
