/** Visual theme per destination — used for gradient banners instead of stock photos. */
export function destinationTheme(slug: string) {
  const map: Record<string, { gradient: string; emoji: string }> = {
    "misir-turlari": { gradient: "from-amber-400 via-orange-500 to-rose-500", emoji: "🏜️" },
    "moskova-turlari": { gradient: "from-rose-500 via-fuchsia-600 to-indigo-700", emoji: "🏛️" },
    "italya-turlari": { gradient: "from-rose-400 via-orange-400 to-amber-500", emoji: "🍝" },
    "beneluks-turlari": { gradient: "from-sky-400 via-blue-500 to-indigo-600", emoji: "🌷" },
    "yunanistan-turlari": { gradient: "from-sky-400 via-cyan-500 to-blue-700", emoji: "🏖️" },
  };
  return map[slug] ?? { gradient: "from-brand-400 to-brand-700", emoji: "✈️" };
}
