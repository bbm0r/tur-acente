import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format a Date as Turkish day-month-year, e.g. "12 Tem 2026". */
export function formatDateTr(d: Date | string) {
  const date = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function formatDateRangeTr(start: Date | string, end: Date | string) {
  return `${formatDateTr(start)} – ${formatDateTr(end)}`;
}

/** Format a Date as Turkish day-month-year + time, e.g. "12 Tem 2026 14:30". */
export function formatDateTimeTr(d: Date | string) {
  const date = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function nightsBetween(start: Date | string, end: Date | string) {
  const a = new Date(start).getTime();
  const b = new Date(end).getTime();
  return Math.max(0, Math.round((b - a) / 86_400_000));
}
