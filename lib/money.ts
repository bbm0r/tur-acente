/**
 * Money is stored as integer MINOR units (kuruş / cent) everywhere.
 * Base tour prices are EUR; reservations snapshot an EUR→TRY rate.
 */

export function formatMoney(minor: number, currency = "TRY", locale = "tr-TR") {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(minor / 100);
}

export function formatFrom(minor: number, currency = "TRY") {
  return `${formatMoney(minor, currency)}’den`;
}

/** Convert an EUR minor amount to TRY minor at a given rate (TRY per 1 EUR). */
export function eurToTryMinor(eurMinor: number, rate: number) {
  return Math.round(eurMinor * rate);
}

/** Demo fallback EUR→TRY rate used until a live currency feed is wired in. */
export const DEMO_EUR_TRY = 35.0;
