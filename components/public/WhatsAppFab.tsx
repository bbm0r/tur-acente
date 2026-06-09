import { MessageCircle } from "lucide-react";

export function WhatsAppFab() {
  const phone = (process.env.NEXT_PUBLIC_WHATSAPP || "+905555555555").replace(/[^0-9]/g, "");
  const text = encodeURIComponent("Merhaba, turlar hakkında bilgi almak istiyorum.");
  return (
    <a
      href={`https://wa.me/${phone}?text=${text}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="WhatsApp ile iletişim"
      className="fixed bottom-5 right-5 z-50 inline-flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-3 font-semibold text-white shadow-cardHover transition hover:scale-105"
    >
      <MessageCircle className="h-5 w-5" />
      <span className="hidden sm:inline">WhatsApp</span>
    </a>
  );
}
