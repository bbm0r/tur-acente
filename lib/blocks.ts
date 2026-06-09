// Block model + registry shared by the editor (client) and the renderer (server).
// `children` holds nested blocks keyed by slot (e.g. "main", "col-0") for container blocks.
export type Block = { id: string; type: string; props: Record<string, any>; children?: Record<string, Block[]> };

export type FieldDef = {
  key: string;
  label: string;
  type: "text" | "textarea" | "number" | "select" | "destination" | "image" | "images" | "form" | "color" | "toggle" | "align" | "range" | "richtext" | "code";
  options?: { value: string; label: string }[];
  help?: string;
  min?: number;
  max?: number;
  step?: number;
};

// ---- Universal per-block style (the "Stil" tab) — applied by a shared shell in the renderer ----
export type BlockStyle = {
  bg?: string;        // background color (hex) or ""
  bgImage?: string;   // background image url or ""
  overlay?: number;   // 0–80 overlay darkness % (for bgImage)
  textColor?: string; // text color (hex) or ""
  padY?: "" | "none" | "sm" | "md" | "lg" | "xl";
  align?: "" | "left" | "center" | "right";
  anchor?: string;    // in-page link target id
  hideMobile?: boolean;
  hideDesktop?: boolean;
};

export const STYLE_FIELDS: FieldDef[] = [
  { key: "bg", label: "Arka Plan Rengi", type: "color" },
  { key: "bgImage", label: "Arka Plan Görseli", type: "image", help: "Bölümün arkasına tam genişlik görsel" },
  { key: "overlay", label: "Karartma", type: "range", min: 0, max: 80, step: 5, help: "Arka plan görseli için koyuluk" },
  { key: "textColor", label: "Yazı Rengi", type: "color" },
  { key: "padY", label: "Üst/Alt Boşluk", type: "select", options: [
    { value: "", label: "Varsayılan" }, { value: "none", label: "Yok" }, { value: "sm", label: "Küçük" }, { value: "md", label: "Orta" }, { value: "lg", label: "Büyük" }, { value: "xl", label: "Çok Büyük" },
  ] },
  { key: "align", label: "Metin Hizalama", type: "align" },
  { key: "anchor", label: "Çapa (#id)", type: "text", help: "Sayfa içi bağlantı hedefi" },
  { key: "hideMobile", label: "Mobilde Gizle", type: "toggle" },
  { key: "hideDesktop", label: "Masaüstünde Gizle", type: "toggle" },
];

// ---- Forms-builder shared types (client-safe — no server imports here) ----
export type FormFieldType = "text" | "email" | "tel" | "textarea" | "select";
export type FormField = { key: string; label: string; type: FormFieldType; required: boolean; options?: string[] };
export type FormSettings = { successMessage: string; createLead: boolean; notify: boolean };

export const FORM_FIELD_TYPE_LABELS: Record<FormFieldType, string> = {
  text: "Metin",
  email: "E-posta",
  tel: "Telefon",
  textarea: "Uzun Metin",
  select: "Seçim",
};

export type BlockDef = {
  type: string;
  label: string;
  hint: string;
  dynamic?: boolean;
  defaults: Record<string, any>;
  fields: FieldDef[];
};

export const BLOCK_DEFS: BlockDef[] = [
  {
    type: "hero",
    label: "Hero (Kapak)",
    hint: "Büyük başlık + buton + arka plan",
    defaults: { heading: "Hayalindeki tatili planla", subheading: "Net fiyat, kolay rezervasyon.", ctaText: "Turları Keşfet", ctaHref: "/turlar", theme: "brand", bgImage: "", overlay: 40, height: "md", align: "center" },
    fields: [
      { key: "heading", label: "Başlık", type: "text" },
      { key: "subheading", label: "Alt Başlık", type: "textarea" },
      { key: "ctaText", label: "Buton Metni", type: "text" },
      { key: "ctaHref", label: "Buton Linki", type: "text" },
      { key: "bgImage", label: "Arka Plan Fotoğrafı", type: "image", help: "Seçilirse renk temasının yerine geçer" },
      { key: "overlay", label: "Karartma", type: "range", min: 0, max: 80, step: 5, help: "Fotoğraf üzerinde okunabilirlik için" },
      { key: "height", label: "Yükseklik", type: "select", options: [{ value: "sm", label: "Kısa" }, { value: "md", label: "Orta" }, { value: "lg", label: "Uzun" }, { value: "screen", label: "Tam Ekran" }] },
      { key: "align", label: "Hizalama", type: "align" },
      { key: "theme", label: "Renk Teması (fotoğraf yoksa)", type: "select", options: [{ value: "brand", label: "Teal" }, { value: "sunset", label: "Gün Batımı" }, { value: "ocean", label: "Okyanus" }] },
    ],
  },
  {
    type: "heading",
    label: "Başlık",
    hint: "Bölüm başlığı (H1–H4)",
    defaults: { text: "Bölüm Başlığı", subtitle: "", level: "h2", align: "center", color: "" },
    fields: [
      { key: "text", label: "Başlık", type: "text" },
      { key: "subtitle", label: "Alt Metin", type: "text" },
      { key: "level", label: "Seviye", type: "select", options: [{ value: "h1", label: "H1" }, { value: "h2", label: "H2" }, { value: "h3", label: "H3" }, { value: "h4", label: "H4" }] },
      { key: "align", label: "Hizalama", type: "align" },
      { key: "color", label: "Renk", type: "color" },
    ],
  },
  {
    type: "richText",
    label: "Metin Bloğu",
    hint: "Zengin metin (WYSIWYG)",
    defaults: { heading: "", body: "<p>Buraya açıklama metni yazın. Araç çubuğundan kalın, başlık, liste ve bağlantı ekleyebilirsiniz.</p>" },
    fields: [{ key: "heading", label: "Başlık (ops.)", type: "text" }, { key: "body", label: "Metin", type: "richtext" }],
  },
  {
    type: "tourGrid",
    label: "Tur Listesi",
    hint: "Canlı turlar (dinamik)",
    dynamic: true,
    defaults: { title: "Öne Çıkan Turlar", source: "featured", destinationSlug: "", limit: 3 },
    fields: [
      { key: "title", label: "Başlık", type: "text" },
      { key: "source", label: "Kaynak", type: "select", options: [{ value: "featured", label: "Öne çıkanlar" }, { value: "campaign", label: "Kampanyalılar" }, { value: "destination", label: "Destinasyona göre" }] },
      { key: "destinationSlug", label: "Destinasyon", type: "destination", help: "Yalnızca 'Destinasyona göre' için" },
      { key: "limit", label: "Adet", type: "number" },
    ],
  },
  {
    type: "destinationGrid",
    label: "Destinasyon Listesi",
    hint: "Tüm destinasyonlar (dinamik)",
    dynamic: true,
    defaults: { title: "Popüler Destinasyonlar" },
    fields: [{ key: "title", label: "Başlık", type: "text" }],
  },
  {
    type: "searchBar",
    label: "Arama Kutusu",
    hint: "Tur arama formu (dinamik)",
    dynamic: true,
    defaults: { title: "Tur Ara" },
    fields: [{ key: "title", label: "Başlık", type: "text" }],
  },
  {
    type: "features",
    label: "Özellik Kutuları",
    hint: "3-4 avantaj kutusu",
    defaults: { title: "Neden Biz?", itemsText: "Net Fiyat | Gördüğünüz fiyat ödediğiniz fiyat\nKolay Rezervasyon | 2 dakikada tamamlayın\nGüvenli Ödeme | 3D Secure korumalı\n7/24 Destek | Tur boyunca yanınızda" },
    fields: [{ key: "title", label: "Başlık", type: "text" }, { key: "itemsText", label: "Maddeler (her satır: Başlık | Açıklama)", type: "textarea" }],
  },
  {
    type: "cta",
    label: "Çağrı (CTA)",
    hint: "Renkli aksiyon bandı",
    defaults: { heading: "Tatiliniz bir tık uzakta", text: "Müsait tarihleri inceleyin, hemen rezervasyon yapın.", ctaText: "Turları Gör", ctaHref: "/turlar" },
    fields: [{ key: "heading", label: "Başlık", type: "text" }, { key: "text", label: "Metin", type: "text" }, { key: "ctaText", label: "Buton", type: "text" }, { key: "ctaHref", label: "Link", type: "text" }],
  },
  {
    type: "faq",
    label: "S.S.S.",
    hint: "Soru-cevap akordeon",
    defaults: { title: "Sıkça Sorulan Sorular", itemsText: "Vize gerekli mi? | Tura göre değişir, detay sayfasında belirtilir.\nÖdeme nasıl yapılır? | Havale/EFT veya kredi kartı ile." },
    fields: [{ key: "title", label: "Başlık", type: "text" }, { key: "itemsText", label: "Sorular (her satır: Soru | Cevap)", type: "textarea" }],
  },
  {
    type: "form",
    label: "Form",
    hint: "İletişim / başvuru formu (dinamik)",
    dynamic: true,
    defaults: { formKey: "", heading: "Bize Ulaşın", subheading: "" },
    fields: [
      { key: "heading", label: "Başlık (ops.)", type: "text" },
      { key: "subheading", label: "Alt Metin (ops.)", type: "text" },
      { key: "formKey", label: "Form", type: "form", help: "Formlar bölümünde oluşturduğunuz bir formu seçin" },
    ],
  },
  {
    type: "image",
    label: "Görsel",
    hint: "Tek resim (hizalanabilir)",
    defaults: { src: "", alt: "", caption: "", align: "center", width: "full", rounded: true, href: "", newTab: false },
    fields: [
      { key: "src", label: "Görsel", type: "image" },
      { key: "align", label: "Hizalama", type: "align" },
      { key: "width", label: "Genişlik", type: "select", options: [{ value: "sm", label: "Küçük" }, { value: "md", label: "Orta" }, { value: "lg", label: "Büyük" }, { value: "full", label: "Tam" }] },
      { key: "rounded", label: "Yuvarlak Köşe", type: "toggle" },
      { key: "href", label: "Link (ops.)", type: "text" },
      { key: "newTab", label: "Yeni sekmede aç", type: "toggle" },
      { key: "alt", label: "Alt Metin (SEO)", type: "text" },
      { key: "caption", label: "Açıklama (ops.)", type: "text" },
    ],
  },
  {
    type: "html",
    label: "HTML / Gömme",
    hint: "Serbest HTML veya embed kodu",
    defaults: { html: "<!-- HTML, iframe veya gömme kodunu buraya yapıştırın -->" },
    fields: [{ key: "html", label: "HTML Kodu", type: "code", help: "iframe/embed/özel HTML. Yalnızca güvendiğiniz kaynaklardan kod ekleyin (<script> kaldırılır)." }],
  },
  {
    type: "gallery",
    label: "Galeri",
    hint: "Çoklu resim",
    defaults: { title: "", images: [] },
    fields: [
      { key: "title", label: "Başlık (ops.)", type: "text" },
      { key: "images", label: "Görseller", type: "images" },
    ],
  },
  {
    type: "video",
    label: "Video",
    hint: "YouTube / Vimeo",
    defaults: { url: "", caption: "" },
    fields: [
      { key: "url", label: "Video Linki", type: "text", help: "YouTube veya Vimeo linki yapıştırın" },
      { key: "caption", label: "Açıklama (ops.)", type: "text" },
    ],
  },
  {
    type: "button",
    label: "Buton",
    hint: "Tek buton",
    defaults: { text: "Tıkla", href: "/turlar", align: "center", style: "primary", size: "md", fullWidth: false, newTab: false },
    fields: [
      { key: "text", label: "Metin", type: "text" },
      { key: "href", label: "Link", type: "text" },
      { key: "align", label: "Hizalama", type: "align" },
      { key: "style", label: "Stil", type: "select", options: [{ value: "primary", label: "Birincil" }, { value: "accent", label: "Vurgu" }, { value: "ghost", label: "Çerçeve" }] },
      { key: "size", label: "Boyut", type: "select", options: [{ value: "sm", label: "Küçük" }, { value: "md", label: "Orta" }, { value: "lg", label: "Büyük" }] },
      { key: "fullWidth", label: "Tam genişlik", type: "toggle" },
      { key: "newTab", label: "Yeni sekmede aç", type: "toggle" },
    ],
  },
  {
    type: "stats",
    label: "İstatistikler",
    hint: "Rakam bandı",
    defaults: { title: "", itemsText: "5 | Destinasyon\n13+ | Kalkış Tarihi\n%100 | Şeffaf Fiyat\n7/24 | Destek" },
    fields: [
      { key: "title", label: "Başlık (ops.)", type: "text" },
      { key: "itemsText", label: "Maddeler (her satır: Rakam | Etiket)", type: "textarea" },
    ],
  },
  {
    type: "testimonials",
    label: "Müşteri Yorumları",
    hint: "Gerçek yorumlar (dinamik)",
    dynamic: true,
    defaults: { title: "Misafirlerimiz Ne Diyor?", limit: 3 },
    fields: [
      { key: "title", label: "Başlık", type: "text" },
      { key: "limit", label: "Adet", type: "number" },
    ],
  },
  {
    type: "mediaText",
    label: "Görsel + Yazı",
    hint: "Yan yana görsel ve metin",
    defaults: { src: "", imagePos: "left", heading: "Başlık", body: "<p>Açıklama metni buraya.</p>", ctaText: "", ctaHref: "" },
    fields: [
      { key: "src", label: "Görsel", type: "image" },
      { key: "imagePos", label: "Görsel Konumu", type: "select", options: [{ value: "left", label: "Sol" }, { value: "right", label: "Sağ" }] },
      { key: "heading", label: "Başlık", type: "text" },
      { key: "body", label: "Metin", type: "richtext" },
      { key: "ctaText", label: "Buton Metni (ops.)", type: "text" },
      { key: "ctaHref", label: "Buton Linki", type: "text" },
    ],
  },
  {
    type: "section",
    label: "Bölüm (Kapsayıcı)",
    hint: "Blokları gruplar; Stil ile arka plan/boşluk uygula",
    defaults: {},
    fields: [],
  },
  {
    type: "columns",
    label: "Kolonlar",
    hint: "2–3 kolon — içine blok yerleştirin",
    defaults: { count: "2" },
    fields: [
      { key: "count", label: "Kolon Sayısı", type: "select", options: [{ value: "2", label: "2 Kolon" }, { value: "3", label: "3 Kolon" }] },
    ],
  },
  {
    type: "quote",
    label: "Alıntı",
    hint: "Öne çıkan alıntı",
    defaults: { text: "İlham veren bir söz buraya.", author: "" },
    fields: [
      { key: "text", label: "Alıntı", type: "textarea" },
      { key: "author", label: "Kaynak / Kişi", type: "text" },
    ],
  },
  {
    type: "accordion",
    label: "Akordeon",
    hint: "Açılır-kapanır bölümler",
    defaults: { title: "", itemsText: "Başlık 1 | İçerik metni buraya.\nBaşlık 2 | İçerik metni buraya.", firstOpen: false },
    fields: [
      { key: "title", label: "Başlık (ops.)", type: "text" },
      { key: "itemsText", label: "Bölümler (her satır: Başlık | İçerik)", type: "textarea" },
      { key: "firstOpen", label: "İlk bölüm açık başlasın", type: "toggle" },
    ],
  },
  {
    type: "iconList",
    label: "İşaretli Liste",
    hint: "Onay işaretli madde listesi",
    defaults: { title: "", itemsText: "Birinci madde\nİkinci madde\nÜçüncü madde", columns: "1" },
    fields: [
      { key: "title", label: "Başlık (ops.)", type: "text" },
      { key: "itemsText", label: "Maddeler (her satır bir madde; 'Başlık | açıklama' da olur)", type: "textarea" },
      { key: "columns", label: "Sütun", type: "select", options: [{ value: "1", label: "Tek sütun" }, { value: "2", label: "İki sütun" }] },
    ],
  },
  {
    type: "banner",
    label: "Uyarı / Banner",
    hint: "Renkli bilgi şeridi",
    defaults: { text: "Önemli bir duyuru metni.", variant: "info", ctaText: "", ctaHref: "" },
    fields: [
      { key: "text", label: "Metin", type: "textarea" },
      { key: "variant", label: "Tür", type: "select", options: [{ value: "info", label: "Bilgi" }, { value: "success", label: "Başarı" }, { value: "warning", label: "Uyarı" }, { value: "danger", label: "Tehlike" }] },
      { key: "ctaText", label: "Buton Metni (ops.)", type: "text" },
      { key: "ctaHref", label: "Buton Linki", type: "text" },
    ],
  },
  {
    type: "map",
    label: "Harita",
    hint: "Google Haritalar gömme",
    defaults: { query: "İstanbul", height: "md" },
    fields: [
      { key: "query", label: "Adres / Konum", type: "text", help: "Örn. 'Taksim Meydanı, İstanbul'" },
      { key: "height", label: "Yükseklik", type: "select", options: [{ value: "sm", label: "Kısa" }, { value: "md", label: "Orta" }, { value: "lg", label: "Uzun" }] },
    ],
  },
  {
    type: "buttonGroup",
    label: "Buton Grubu",
    hint: "Birden çok buton",
    defaults: { itemsText: "Turları Gör | /turlar\nİletişim | /iletisim", align: "center", style: "primary" },
    fields: [
      { key: "itemsText", label: "Butonlar (her satır: Metin | Link)", type: "textarea" },
      { key: "align", label: "Hizalama", type: "align" },
      { key: "style", label: "Stil", type: "select", options: [{ value: "primary", label: "Birincil" }, { value: "accent", label: "Vurgu" }, { value: "ghost", label: "Çerçeve" }] },
    ],
  },
  {
    type: "divider",
    label: "Ayraç",
    hint: "Yatay çizgi",
    defaults: {},
    fields: [],
  },
  {
    type: "spacer",
    label: "Boşluk",
    hint: "Dikey boşluk",
    defaults: { size: "md" },
    fields: [{ key: "size", label: "Boyut", type: "select", options: [{ value: "sm", label: "Küçük" }, { value: "md", label: "Orta" }, { value: "lg", label: "Büyük" }] }],
  },
];

export const BLOCK_DEF: Record<string, BlockDef> = Object.fromEntries(BLOCK_DEFS.map((b) => [b.type, b]));

// Inserter categorisation. Any block type not listed here falls into a "Diğer"
// group in the editor, so a new block never silently disappears from the inserter.
export const BLOCK_GROUPS: { key: string; label: string; types: string[] }[] = [
  { key: "layout", label: "Düzen", types: ["hero", "heading", "section", "columns", "spacer", "divider"] },
  { key: "content", label: "İçerik", types: ["richText", "html", "mediaText", "quote", "accordion", "faq", "iconList", "features", "stats", "cta", "banner", "button", "buttonGroup", "testimonials"] },
  { key: "media", label: "Medya", types: ["image", "gallery", "video", "map"] },
  { key: "dynamic", label: "Dinamik", types: ["tourGrid", "destinationGrid", "searchBar", "form"] },
];

// ---- Container blocks (true nesting) ----
export const CONTAINER_TYPES = ["section", "columns"] as const;
export const isContainerType = (t: string) => (CONTAINER_TYPES as readonly string[]).includes(t);

/** The editable child slots for a container block (depends on `count` for columns). */
export function blockSlots(b: Block): { key: string; label: string }[] {
  if (b.type === "section") return [{ key: "main", label: "İçerik" }];
  if (b.type === "columns") {
    const n = b.props?.count === "3" ? 3 : 2;
    return Array.from({ length: n }, (_, i) => ({ key: `col-${i}`, label: `Kolon ${i + 1}` }));
  }
  return [];
}

export function parsePairs(text: string) {
  return (text || "")
    .split("\n")
    .map((l) => l.split("|").map((s) => s.trim()))
    .filter((p) => p[0])
    .map((p) => ({ a: p[0], b: p[1] ?? "" }));
}
