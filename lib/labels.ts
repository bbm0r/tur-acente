export const transportLabel: Record<string, string> = {
  FLIGHT: "Uçaklı",
  BUS: "Otobüslü",
  CRUISE: "Gemi Turu",
  MIXED: "Uçak + Tur",
  OWN_ARRANGEMENT: "Ulaşım Hariç",
};

export const hotelStars: Record<string, string> = {
  THREE_STAR: "3★ Otel",
  FOUR_STAR: "4★ Otel",
  FIVE_STAR: "5★ Otel",
  BOUTIQUE: "Butik Otel",
  NONE: "",
};

export const paxTypeLabel: Record<string, string> = {
  ADULT: "Yetişkin",
  CHILD_WITH_BED: "Çocuk (yatak dahil)",
  CHILD_NO_BED: "Çocuk (yataksız)",
  INFANT: "Bebek",
};

export const reservationStatusLabel: Record<string, string> = {
  NEW_REQUEST: "Yeni Talep",
  WAITING_PAYMENT: "Ödeme Bekliyor",
  PAYMENT_RECEIVED: "Ödeme Alındı",
  CONFIRMED: "Onaylandı",
  WAITING_SUPPLIER: "Tedarikçi Onayı",
  CANCELLED: "İptal Edildi",
  REFUNDED: "İade Edildi",
  COMPLETED: "Tamamlandı",
};

export const reservationStatusColor: Record<string, string> = {
  NEW_REQUEST: "bg-slate-100 text-slate-700",
  WAITING_PAYMENT: "bg-amber-100 text-amber-800",
  PAYMENT_RECEIVED: "bg-sky-100 text-sky-800",
  CONFIRMED: "bg-emerald-100 text-emerald-800",
  WAITING_SUPPLIER: "bg-violet-100 text-violet-800",
  CANCELLED: "bg-rose-100 text-rose-800",
  REFUNDED: "bg-slate-100 text-slate-600",
  COMPLETED: "bg-brand-100 text-brand-800",
};

export const lifecycleLabel: Record<string, string> = {
  SUBSCRIBER: "Abone",
  LEAD: "Aday",
  OPPORTUNITY: "Fırsat",
  CUSTOMER: "Müşteri",
  REPEAT_CUSTOMER: "Tekrar Müşteri",
  LOST: "Kayıp",
};
