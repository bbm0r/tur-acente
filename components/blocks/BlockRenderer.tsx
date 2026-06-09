import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, Check, ChevronRight, Quote, Info, CheckCircle2, AlertTriangle, AlertCircle } from "lucide-react";
import type { Block, BlockStyle } from "@/lib/blocks";
import { parsePairs } from "@/lib/blocks";
import { listTours, getFeaturedTours, getCampaignTours, getDestinationsWithCounts, getTestimonials } from "@/lib/catalog";
import { getFormByKey } from "@/lib/forms";
import { TourCard } from "@/components/public/TourCard";
import { DestinationCard } from "@/components/public/DestinationCard";
import { HeroSearch } from "@/components/public/HeroSearch";
import { Stars } from "@/components/public/Stars";
import { DynamicForm } from "@/components/public/DynamicForm";

function toEmbed(url: string) {
  if (!url) return "";
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]{11})/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  const vimeo = url.match(/vimeo\.com\/(\d+)/);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;
  return "";
}

const HERO_THEME: Record<string, string> = {
  brand: "from-brand-700 via-brand-600 to-brand-800",
  sunset: "from-amber-400 via-orange-500 to-rose-500",
  ocean: "from-sky-500 via-cyan-500 to-blue-700",
};

const PAD: Record<string, string> = { none: "py-0", sm: "py-4", md: "py-10", lg: "py-16", xl: "py-24" };

/** Remove the obvious script/handler vectors from staff-authored HTML (richText/html blocks). */
function sanitizeHtml(html: string) {
  return String(html || "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/\son\w+\s*=\s*"[^"]*"/gi, "")
    .replace(/\son\w+\s*=\s*'[^']*'/gi, "")
    .replace(/\son\w+\s*=\s*[^\s>]+/gi, "")
    .replace(/javascript:/gi, "");
}

function hasStyle(s?: BlockStyle) {
  return !!s && !!(s.bg || s.bgImage || s.textColor || s.padY || s.align || s.anchor || s.hideMobile || s.hideDesktop);
}

/** Wraps a block's content with its universal style (background, color, padding, alignment, anchor, visibility). */
function BlockShell({ style, children }: { style?: BlockStyle; children: ReactNode }) {
  if (!hasStyle(style)) return <>{children}</>;
  const s = style!;
  const cls = [
    "relative",
    s.padY ? PAD[s.padY] : "",
    s.align === "center" ? "text-center" : s.align === "right" ? "text-right" : s.align === "left" ? "text-left" : "",
    s.hideMobile ? "hidden sm:block" : "",
    s.hideDesktop ? "sm:hidden" : "",
  ].filter(Boolean).join(" ");
  const inline: CSSProperties = {};
  if (s.bg) inline.backgroundColor = s.bg;
  if (s.textColor) inline.color = s.textColor;
  return (
    <div id={s.anchor || undefined} className={cls} style={inline}>
      {s.bgImage && <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url("${s.bgImage}")` }} aria-hidden />}
      {s.bgImage && s.overlay ? <div className="absolute inset-0 bg-black" style={{ opacity: (s.overlay ?? 0) / 100 }} aria-hidden /> : null}
      <div className={s.bgImage ? "relative" : undefined}>{children}</div>
    </div>
  );
}

async function fetchTours(props: any) {
  const limit = Number(props.limit) || 3;
  if (props.source === "campaign") return getCampaignTours(limit);
  if (props.source === "destination" && props.destinationSlug) return (await listTours({ destinationSlug: props.destinationSlug })).slice(0, limit);
  return getFeaturedTours(limit);
}

const MAX_DEPTH = 4;
// Neutralises the page gutter so blocks placed inside a column fill the column width.
const NESTED = "[&_.container-page]:max-w-none [&_.container-page]:!px-0 [&_.container-page]:!py-3";

export async function BlockRenderer({ blocks, depth = 0 }: { blocks: Block[]; depth?: number }) {
  const rendered = await Promise.all(
    blocks.map(async (b) => {
      const p = b.props ?? {};
      const style = p._style as BlockStyle | undefined;
      let content: ReactNode = null;

      switch (b.type) {
        case "hero": {
          const hasImg = !!p.bgImage;
          const H: Record<string, string> = { sm: "py-16", md: "py-20 sm:py-28", lg: "py-28 sm:py-40", screen: "flex min-h-[80vh] items-center py-20" };
          const cross = p.align === "left" ? "items-start text-left" : p.align === "right" ? "items-end text-right" : "items-center text-center";
          content = (
            <section className={`relative overflow-hidden text-white ${hasImg ? "bg-slate-900" : `bg-gradient-to-br ${HERO_THEME[p.theme] ?? HERO_THEME.brand}`}`}>
              {hasImg && <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url("${p.bgImage}")` }} aria-hidden />}
              {hasImg && <div className="absolute inset-0 bg-black" style={{ opacity: (Number(p.overlay) || 0) / 100 }} aria-hidden />}
              <div className={`container-page relative ${H[p.height] ?? H.md}`}>
                <div className={`mx-auto flex max-w-3xl flex-col ${cross}`}>
                  <h1 className="text-4xl font-extrabold leading-tight sm:text-5xl">{p.heading}</h1>
                  {p.subheading && <p className="mt-4 max-w-2xl text-lg text-white/85">{p.subheading}</p>}
                  {p.ctaText && <Link href={p.ctaHref || "/turlar"} className="btn-accent mt-8">{p.ctaText} <ArrowRight className="h-5 w-5" /></Link>}
                </div>
              </div>
            </section>
          );
          break;
        }

        case "heading": {
          const Tag = (["h1", "h2", "h3", "h4"].includes(p.level) ? p.level : "h2") as "h1" | "h2" | "h3" | "h4";
          const sizeCls = Tag === "h1" ? "text-4xl sm:text-5xl" : Tag === "h2" ? "text-3xl" : Tag === "h3" ? "text-2xl" : "text-xl";
          const alignCls = p.align === "left" ? "text-left" : p.align === "right" ? "text-right" : "text-center";
          content = (
            <section className={`container-page pt-12 ${alignCls}`}>
              <Tag className={`font-extrabold ${sizeCls} text-ink`} style={p.color ? { color: p.color } : undefined}>{p.text}</Tag>
              {p.subtitle && <p className="mt-1.5 text-ink-muted">{p.subtitle}</p>}
            </section>
          );
          break;
        }

        case "richText": {
          const body = String(p.body || "");
          const isHtml = /<\/?[a-z][\s\S]*>/i.test(body);
          content = (
            <section className="container-page py-6">
              <div className="mx-auto max-w-3xl">
                {p.heading && <h2 className="mb-3 text-2xl font-bold text-ink">{p.heading}</h2>}
                {isHtml ? (
                  <div
                    className="max-w-none leading-relaxed text-ink-soft [&_a]:text-brand-700 [&_a]:underline [&_blockquote]:my-3 [&_blockquote]:border-l-4 [&_blockquote]:border-brand-200 [&_blockquote]:pl-4 [&_blockquote]:italic [&_h2]:mb-2 [&_h2]:mt-4 [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-ink [&_h3]:mb-2 [&_h3]:mt-3 [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:text-ink [&_ol]:mb-3 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-3 [&_ul]:mb-3 [&_ul]:list-disc [&_ul]:pl-5"
                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(body) }}
                  />
                ) : (
                  body.split("\n").filter(Boolean).map((para: string, i: number) => (
                    <p key={i} className="mb-3 leading-relaxed text-ink-soft">{para}</p>
                  ))
                )}
              </div>
            </section>
          );
          break;
        }

        case "html":
          content = (
            <section className="container-page py-6">
              <div className="mx-auto max-w-4xl [&_iframe]:w-full [&_iframe]:rounded-xl" dangerouslySetInnerHTML={{ __html: sanitizeHtml(String(p.html || "")) }} />
            </section>
          );
          break;

        case "tourGrid": {
          const tours = await fetchTours(p);
          content = (
            <section className="container-page py-10">
              {p.title && <h2 className="mb-6 text-2xl font-extrabold text-ink">{p.title}</h2>}
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {tours.map((t: any) => <TourCard key={t.id} tour={t} />)}
              </div>
              {tours.length === 0 && <p className="text-ink-muted">Bu seçim için tur bulunamadı.</p>}
            </section>
          );
          break;
        }

        case "destinationGrid": {
          const destinations = await getDestinationsWithCounts();
          content = (
            <section className="container-page py-10">
              {p.title && <h2 className="mb-6 text-2xl font-extrabold text-ink">{p.title}</h2>}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {destinations.map((d) => <DestinationCard key={d.slug} destination={d} />)}
              </div>
            </section>
          );
          break;
        }

        case "searchBar": {
          const destinations = await getDestinationsWithCounts();
          content = (
            <section className="container-page py-8">
              {p.title && <h2 className="mb-4 text-center text-2xl font-extrabold text-ink">{p.title}</h2>}
              <div className="rounded-xl2 bg-brand-700 p-4 sm:p-6">
                <HeroSearch destinations={destinations.map((d) => ({ slug: d.slug, nameTr: d.nameTr }))} />
              </div>
            </section>
          );
          break;
        }

        case "features": {
          const items = parsePairs(p.itemsText);
          content = (
            <section className="container-page py-10">
              {p.title && <h2 className="mb-6 text-2xl font-extrabold text-ink">{p.title}</h2>}
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {items.map((it, i) => (
                  <div key={i} className="card p-6">
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-700"><Check className="h-5 w-5" /></span>
                    <h3 className="mt-4 font-bold text-ink">{it.a}</h3>
                    <p className="mt-1.5 text-sm text-ink-muted">{it.b}</p>
                  </div>
                ))}
              </div>
            </section>
          );
          break;
        }

        case "cta":
          content = (
            <section className="container-page py-10">
              <div className="rounded-xl2 bg-brand-700 px-8 py-12 text-center text-white">
                <h2 className="text-2xl font-extrabold sm:text-3xl">{p.heading}</h2>
                {p.text && <p className="mx-auto mt-2 max-w-xl text-white/85">{p.text}</p>}
                {p.ctaText && <Link href={p.ctaHref || "/turlar"} className="btn-accent mt-6">{p.ctaText} <ArrowRight className="h-5 w-5" /></Link>}
              </div>
            </section>
          );
          break;

        case "faq": {
          const items = parsePairs(p.itemsText);
          content = (
            <section className="container-page py-10">
              {p.title && <h2 className="mb-6 text-2xl font-extrabold text-ink">{p.title}</h2>}
              <div className="mx-auto max-w-3xl space-y-2">
                {items.map((it, i) => (
                  <details key={i} className="group rounded-xl border border-slate-200 bg-white p-4">
                    <summary className="flex cursor-pointer list-none items-center justify-between font-semibold text-ink">{it.a}<ChevronRight className="h-4 w-4 transition group-open:rotate-90" /></summary>
                    <p className="mt-2 text-sm text-ink-muted">{it.b}</p>
                  </details>
                ))}
              </div>
            </section>
          );
          break;
        }

        case "form": {
          const form = p.formKey ? await getFormByKey(p.formKey) : null;
          content = (
            <section className="container-page py-8">
              <div className="mx-auto max-w-2xl">
                {(p.heading || p.subheading) && (
                  <div className="mb-4 text-center">
                    {p.heading && <h2 className="text-2xl font-extrabold text-ink">{p.heading}</h2>}
                    {p.subheading && <p className="mt-1 text-ink-muted">{p.subheading}</p>}
                  </div>
                )}
                {form && form.isActive ? (
                  <DynamicForm formKey={form.key} fields={form.fields} />
                ) : (
                  <div className="card p-6 text-center text-sm text-ink-muted">Form seçilmedi veya pasif. Düzenleyiciden bir form seçin.</div>
                )}
              </div>
            </section>
          );
          break;
        }

        case "image": {
          if (!p.src) { content = null; break; }
          const W: Record<string, string> = { sm: "max-w-xs", md: "max-w-md", lg: "max-w-3xl", full: "max-w-none" };
          const alignWrap = p.align === "left" ? "mr-auto" : p.align === "right" ? "ml-auto" : "mx-auto";
          const frameCls = `${W[p.width] ?? W.full} ${alignWrap}`;
          const imgEl = (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={p.src} alt={p.alt || ""} className={`max-h-[600px] w-full object-cover ${p.rounded === false ? "" : "rounded-xl2"}`} />
          );
          content = (
            <figure className="container-page py-6">
              {p.href
                ? <a href={p.href} target={p.newTab ? "_blank" : undefined} rel={p.newTab ? "noreferrer" : undefined} className={`block ${frameCls}`}>{imgEl}</a>
                : <div className={frameCls}>{imgEl}</div>}
              {p.caption && <figcaption className={`mt-2 text-sm text-ink-muted ${p.align === "left" ? "text-left" : p.align === "right" ? "text-right" : "text-center"}`}>{p.caption}</figcaption>}
            </figure>
          );
          break;
        }

        case "gallery": {
          const imgs: string[] = Array.isArray(p.images) ? p.images : [];
          content = (
            <section className="container-page py-8">
              {p.title && <h2 className="mb-6 text-2xl font-extrabold text-ink">{p.title}</h2>}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {imgs.map((src, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={i} src={src} alt="" className="h-44 w-full rounded-xl object-cover sm:h-52" />
                ))}
              </div>
            </section>
          );
          break;
        }

        case "video": {
          const embed = toEmbed(p.url);
          content = embed ? (
            <section className="container-page py-8">
              <div className="mx-auto aspect-video max-w-3xl overflow-hidden rounded-xl2 bg-black">
                <iframe src={embed} className="h-full w-full" allowFullScreen title="video" />
              </div>
              {p.caption && <p className="mt-2 text-center text-sm text-ink-muted">{p.caption}</p>}
            </section>
          ) : null;
          break;
        }

        case "button": {
          const styleCls = p.style === "accent" ? "btn-accent" : p.style === "ghost" ? "btn-ghost" : "btn-primary";
          const sizeCls = p.size === "sm" ? "px-4 py-2 text-xs" : p.size === "lg" ? "px-7 py-4 text-base" : "";
          const align = p.align === "left" ? "justify-start" : p.align === "right" ? "justify-end" : "justify-center";
          content = (
            <div className={`container-page flex py-5 ${align}`}>
              <Link href={p.href || "/"} target={p.newTab ? "_blank" : undefined} rel={p.newTab ? "noreferrer" : undefined} className={`${styleCls} ${sizeCls} ${p.fullWidth ? "w-full" : ""}`}>{p.text}</Link>
            </div>
          );
          break;
        }

        case "stats": {
          const items = parsePairs(p.itemsText);
          content = (
            <section className="container-page py-8">
              {p.title && <h2 className="mb-6 text-center text-2xl font-extrabold text-ink">{p.title}</h2>}
              <div className="grid grid-cols-2 gap-6 rounded-xl2 bg-brand-700 p-8 text-center text-white sm:grid-cols-4">
                {items.map((it, i) => (
                  <div key={i}>
                    <div className="text-3xl font-extrabold">{it.a}</div>
                    <div className="mt-1 text-sm text-white/75">{it.b}</div>
                  </div>
                ))}
              </div>
            </section>
          );
          break;
        }

        case "testimonials": {
          const list = await getTestimonials(Number(p.limit) || 3);
          content = (
            <section className="container-page py-10">
              {p.title && <h2 className="mb-6 text-2xl font-extrabold text-ink">{p.title}</h2>}
              <div className="grid gap-5 sm:grid-cols-3">
                {list.map((t) => (
                  <div key={t.id} className="card p-6">
                    <Quote className="h-7 w-7 text-brand-200" />
                    <p className="mt-3 text-sm text-ink-soft">{t.bodyTr}</p>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="font-semibold text-ink">{t.customerName}</span>
                      <Stars value={t.rating} />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          );
          break;
        }

        case "mediaText": {
          const right = p.imagePos === "right";
          content = (
            <section className="container-page py-10">
              <div className="grid items-center gap-8 md:grid-cols-2">
                {p.src && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.src} alt={p.heading || ""} className={`max-h-[440px] w-full rounded-xl2 object-cover ${right ? "md:order-2" : ""}`} />
                )}
                <div className={right ? "md:order-1" : ""}>
                  {p.heading && <h2 className="mb-3 text-3xl font-extrabold text-ink">{p.heading}</h2>}
                  <div className="leading-relaxed text-ink-soft [&_a]:text-brand-700 [&_a]:underline [&_ol]:mb-3 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-3 [&_ul]:mb-3 [&_ul]:list-disc [&_ul]:pl-5" dangerouslySetInnerHTML={{ __html: sanitizeHtml(String(p.body || "")) }} />
                  {p.ctaText && <Link href={p.ctaHref || "/turlar"} className="btn-primary mt-5">{p.ctaText} <ArrowRight className="h-4 w-4" /></Link>}
                </div>
              </div>
            </section>
          );
          break;
        }

        case "section": {
          content = depth < MAX_DEPTH ? await BlockRenderer({ blocks: b.children?.main ?? [], depth: depth + 1 }) : null;
          break;
        }

        case "columns": {
          const n = p.count === "3" ? 3 : 2;
          const legacy = [p.col1, p.col2, p.col3];
          const hasChildren = !!b.children && Object.values(b.children).some((arr) => Array.isArray(arr) && arr.length);
          const cols = await Promise.all(
            Array.from({ length: n }).map((_, i) => {
              const kids = b.children?.[`col-${i}`] ?? [];
              if (hasChildren || kids.length) {
                return depth < MAX_DEPTH ? BlockRenderer({ blocks: kids, depth: depth + 1 }) : Promise.resolve(null);
              }
              // Legacy: columns authored before nesting stored each column as a rich-text string.
              return Promise.resolve(
                <div className="leading-relaxed text-ink-soft [&_a]:text-brand-700 [&_a]:underline [&_h2]:mb-2 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-ink [&_h3]:font-semibold [&_h3]:text-ink [&_ol]:mb-3 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-3 [&_ul]:mb-3 [&_ul]:list-disc [&_ul]:pl-5" dangerouslySetInnerHTML={{ __html: sanitizeHtml(String(legacy[i] || "")) }} />,
              );
            }),
          );
          content = (
            <section className="container-page py-8">
              <div className={`grid gap-6 ${n === 3 ? "md:grid-cols-3" : "md:grid-cols-2"}`}>
                {cols.map((col, i) => <div key={i} className={NESTED}>{col}</div>)}
              </div>
            </section>
          );
          break;
        }

        case "quote":
          content = (
            <section className="container-page py-10">
              <figure className="mx-auto max-w-3xl text-center">
                <Quote className="mx-auto h-10 w-10 text-brand-200" />
                <blockquote className="mt-4 text-2xl font-medium leading-relaxed text-ink">{p.text}</blockquote>
                {p.author && <figcaption className="mt-4 text-sm font-semibold text-ink-muted">— {p.author}</figcaption>}
              </figure>
            </section>
          );
          break;

        case "accordion": {
          const items = parsePairs(p.itemsText);
          content = (
            <section className="container-page py-10">
              {p.title && <h2 className="mb-6 text-2xl font-extrabold text-ink">{p.title}</h2>}
              <div className="mx-auto max-w-3xl space-y-2">
                {items.map((it, i) => (
                  <details key={i} open={!!p.firstOpen && i === 0} className="group rounded-xl border border-slate-200 bg-white p-4">
                    <summary className="flex cursor-pointer list-none items-center justify-between font-semibold text-ink">{it.a}<ChevronRight className="h-4 w-4 transition group-open:rotate-90" /></summary>
                    <p className="mt-2 text-sm leading-relaxed text-ink-muted">{it.b}</p>
                  </details>
                ))}
              </div>
            </section>
          );
          break;
        }

        case "iconList": {
          const items = parsePairs(p.itemsText);
          content = (
            <section className="container-page py-8">
              {p.title && <h2 className="mb-5 text-2xl font-extrabold text-ink">{p.title}</h2>}
              <ul className={`mx-auto grid max-w-3xl gap-3 ${p.columns === "2" ? "sm:grid-cols-2" : ""}`}>
                {items.map((it, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-brand-100 text-brand-700"><Check className="h-3.5 w-3.5" /></span>
                    <span className="text-ink-soft">{it.a}{it.b && <span className="text-ink-muted"> — {it.b}</span>}</span>
                  </li>
                ))}
              </ul>
            </section>
          );
          break;
        }

        case "banner": {
          const V: Record<string, { box: string; Icon: typeof Info }> = {
            info: { box: "bg-sky-50 text-sky-800 ring-sky-200", Icon: Info },
            success: { box: "bg-emerald-50 text-emerald-800 ring-emerald-200", Icon: CheckCircle2 },
            warning: { box: "bg-amber-50 text-amber-800 ring-amber-200", Icon: AlertTriangle },
            danger: { box: "bg-rose-50 text-rose-800 ring-rose-200", Icon: AlertCircle },
          };
          const v = V[p.variant] ?? V.info;
          const Icon = v.Icon;
          content = (
            <section className="container-page py-4">
              <div className={`flex flex-wrap items-center gap-3 rounded-xl px-4 py-3 ring-1 ${v.box}`}>
                <Icon className="h-5 w-5 shrink-0" />
                <p className="flex-1 text-sm font-medium">{p.text}</p>
                {p.ctaText && <Link href={p.ctaHref || "/"} className="shrink-0 rounded-lg bg-white/70 px-3 py-1.5 text-sm font-semibold ring-1 ring-black/5 hover:bg-white">{p.ctaText}</Link>}
              </div>
            </section>
          );
          break;
        }

        case "map": {
          const q = encodeURIComponent(String(p.query || "İstanbul"));
          const h = p.height === "sm" ? "h-64" : p.height === "lg" ? "h-[32rem]" : "h-96";
          content = (
            <section className="container-page py-8">
              <div className={`overflow-hidden rounded-xl2 ${h}`}>
                <iframe src={`https://www.google.com/maps?q=${q}&output=embed`} className="h-full w-full border-0" loading="lazy" title="Harita" referrerPolicy="no-referrer-when-downgrade" />
              </div>
            </section>
          );
          break;
        }

        case "buttonGroup": {
          const items = parsePairs(p.itemsText);
          const styleCls = p.style === "accent" ? "btn-accent" : p.style === "ghost" ? "btn-ghost" : "btn-primary";
          const align = p.align === "left" ? "justify-start" : p.align === "right" ? "justify-end" : "justify-center";
          content = (
            <div className={`container-page flex flex-wrap gap-3 py-5 ${align}`}>
              {items.map((it, i) => <Link key={i} href={it.b || "/"} className={styleCls}>{it.a}</Link>)}
            </div>
          );
          break;
        }

        case "divider":
          content = <div className="container-page py-4"><hr className="border-slate-200" /></div>;
          break;

        case "spacer":
          content = <div className={p.size === "lg" ? "h-20" : p.size === "sm" ? "h-6" : "h-12"} />;
          break;

        default:
          content = null;
      }

      if (content == null) return null;
      return <BlockShell key={b.id} style={style}>{content}</BlockShell>;
    }),
  );

  return <>{rendered}</>;
}
