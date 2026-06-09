const TR: Record<string, string> = {
  ı: "i", İ: "i", ş: "s", Ş: "s", ğ: "g", Ğ: "g", ü: "u", Ü: "u", ö: "o", Ö: "o", ç: "c", Ç: "c",
};

/** Turkish-aware slugify: "İtalya Turları 7 Gece" → "italya-turlari-7-gece". */
export function slugify(input: string) {
  return input
    .split("")
    .map((c) => TR[c] ?? c)
    .join("")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
