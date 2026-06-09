import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Tur Acente — Yurt Dışı Paket Turlar",
    template: "%s | Tur Acente",
  },
  description:
    "Mısır, Rusya Moskova, İtalya, Benelüks ve Yunanistan paket turları. Şeffaf fiyat, kolay rezervasyon, güvenli tatil.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3100"),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  );
}
