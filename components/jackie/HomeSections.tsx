// components/jackie/HomeSections.tsx
"use client";

import type { ColorGroup, Lang, LocationOption } from "@/lib/jackieCatalogUtils";
import { t } from "@/lib/jackieCatalogUtils";
import { track } from "@vercel/analytics";

type Photo = { src: string; label: string };

export function HomeSections({
                                 lang,
                                 locations,
                                 pickupGroupedSpots,
                                 hasAnyPickupSpots,
                                 supportWaLink,
                                 hasSupportWhatsApp,

                                 featuredGroups,
                                 quickColorChips,
                                 getPhotoForGroup,

                                 onBrowseCatalog,
                                 onSelectColor,
                                 totalCartPairs,
                                 onOpenCart,
                                 isMixedCart,

                                 locationFilter,
                                 onSelectLocation,
                                 visibleLocationSlugs,
                                 categoryNameById,
                             }: {
    lang: Lang;
    locations: LocationOption[];
    pickupGroupedSpots: Record<string, string[]>;
    hasAnyPickupSpots: boolean;
    supportWaLink: string;
    hasSupportWhatsApp: boolean;

    featuredGroups: ColorGroup[];
    quickColorChips: string[];
    getPhotoForGroup: (modelName: string, colorEn: string) => Photo;

    onBrowseCatalog: () => void;
    onSelectColor: (color: string) => void;

    totalCartPairs: number;
    onOpenCart: () => void;
    isMixedCart: boolean;

    locationFilter: string;
    onSelectLocation: (slug: string) => void;
    visibleLocationSlugs: string[];
    categoryNameById: Record<string, string>;
}) {
    const visibleLocations = locations.filter((l) => visibleLocationSlugs.includes(l.slug));

    const selectedLocationLabel =
        locationFilter === "all"
            ? t(lang, "Todas", "All")
            : visibleLocations.find((l) => l.slug === locationFilter)?.name ||
            locations.find((l) => l.slug === locationFilter)?.name ||
            locationFilter;

    const locationAwareLine =
        locationFilter === "all"
            ? t(
                lang,
                "Elige tu ciudad · SOLO PICK UP · Aparta por WhatsApp",
                "Pick your city · PICK UP ONLY · Reserve on WhatsApp"
            )
            : t(
                lang,
                `SOLO PICK UP en ${selectedLocationLabel} · Aparta por WhatsApp`,
                `PICK UP ONLY in ${selectedLocationLabel} · Reserve on WhatsApp`
            );

    // ----------------------------
    // Premium mixed-category "Novedades"
    // ----------------------------
    const mixedNovedades = (() => {
        // group featuredGroups by category_id from first variant
        const byCat = new Map<string, ColorGroup[]>();

        for (const g of featuredGroups) {
            const catIdRaw = (g.variants?.[0] as any)?.category_id;
            const catId = catIdRaw ? String(catIdRaw) : "other";
            const catName =
                categoryNameById[catId] || (catId === "other" ? t(lang, "Otros", "Other") : catId);

            const list = byCat.get(catName) ?? [];
            list.push(g);
            byCat.set(catName, list);
        }

        // round robin: take 1 per category until we reach N
        const take = 10; // enough for mobile strip + desktop grid
        const cats = Array.from(byCat.keys());
        const out: { g: ColorGroup; cat: string }[] = [];

        let i = 0;
        while (out.length < take && cats.length > 0) {
            const cat = cats[i % cats.length];
            const list = byCat.get(cat) ?? [];
            const next = list.shift();

            if (next) out.push({ g: next, cat });

            if (list.length === 0) {
                byCat.delete(cat);
                const refreshed = Array.from(byCat.keys());
                cats.splice(0, cats.length, ...refreshed);
                i = 0;
                continue;
            }

            i++;
        }

        return out;
    })();

    const renderNovedades = () => {
        if (!mixedNovedades.length) {
            return (
                <p className="mt-3 text-[12px] text-slate-600">
                    {t(lang, "No hay novedades con estos filtros.", "No new arrivals match these filters.")}
                </p>
            );
        }
        // Build mixed-category novedades (round-robin by category)
        const mixed = (() => {
            const byCat = new Map<string, ColorGroup[]>();

            for (const g of featuredGroups) {
                const catId = String((g.variants?.[0] as any)?.category_id ?? "other");
                const catName =
                    categoryNameById[catId] ||
                    (catId === "other" ? t(lang, "Otros", "Other") : catId);

                const list = byCat.get(catName) ?? [];
                list.push(g);
                byCat.set(catName, list);
            }

            const out: { g: ColorGroup; cat: string }[] = [];
            const cats = Array.from(byCat.keys());
            let i = 0;

            while (out.length < 8 && cats.length > 0) {
                const cat = cats[i % cats.length];
                const list = byCat.get(cat);
                if (!list || list.length === 0) {
                    byCat.delete(cat);
                    cats.splice(i % cats.length, 1);
                    i = 0;
                    continue;
                }
                const next = list.shift();
                if (next) out.push({ g: next, cat });
                i++;
            }

            return out;
        })();

        return (
            <>
                {/* Mobile strip */}
                <div className="mt-4 lg:hidden">
                    {/* MOBILE: 2x2 grid (app-like, no scroll) */}
                    <div className="mt-3 lg:hidden grid grid-cols-2 gap-3">
                        {mixed.slice(0, 4).map(({ g, cat }) => {
                            const photo = getPhotoForGroup(g.model_name || "", g.color || "");
                            const totalPairs = g.variants.reduce((s, v) => s + v.availableCount, 0);

                            return (
                                <button
                                    key={g.key}
                                    type="button"
                                    onClick={() => onSelectColor(g.color)}
                                    className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden text-left active:scale-[0.98] transition"
                                >
                                    <div className="relative aspect-square bg-slate-50">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={photo.src}
                                            alt={photo.label || g.color || "Product"}
                                            className="h-full w-full object-cover"
                                        />

                                        <span className="absolute top-2 left-2 rounded-full bg-white/90 border border-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-800">
                                        {cat}
                                      </span>
                                    </div>

                                    <div className="p-3">
                                        <p className="text-[12px] font-extrabold text-slate-900 line-clamp-1">
                                            {g.model_name || "—"}
                                        </p>
                                        <p className="text-[11px] text-slate-600 line-clamp-1">
                                            {g.color}
                                        </p>

                                        <div className="mt-1 flex items-end justify-between">
                                            <p className="text-[12px] font-extrabold text-emerald-700">
                                                ${g.price_mxn_min.toFixed(0)}
                                                <span className="text-[10px] text-slate-500"> MXN</span>
                                            </p>
                                            <p className="text-[10px] text-slate-500 font-semibold">
                                                {totalPairs} {t(lang, "pares", "pairs")}
                                            </p>
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                </div>

                {/* Desktop grid */}
                <div className="hidden lg:grid mt-5 grid-cols-3 xl:grid-cols-4 gap-6 xl:gap-8">
                {mixedNovedades.slice(0, 9).map(({ g, cat }) => {
                        const photo = getPhotoForGroup(g.model_name || "", g.color || "");
                        const totalPairs = g.variants.reduce((s, v) => s + v.availableCount, 0);

                        return (
                            <button
                                key={g.key}
                                type="button"
                                onClick={() => onSelectColor(g.color)}
                                className="group text-left rounded-[30px] border border-slate-200 bg-white shadow-[0_18px_60px_rgba(15,23,42,0.10)] hover:shadow-[0_20px_70px_rgba(15,23,42,0.12)] transition overflow-hidden"
                            >
                                <div className="relative aspect-[16/11] bg-slate-50">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={photo.src} alt={photo.label || g.color || "Product"} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.06]" />
                                    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.35),transparent_60%)]" />
                                    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/18 to-transparent" />

                                    <span className="absolute top-4 left-4 rounded-full bg-white/85 backdrop-blur border border-slate-200 px-3 py-1 text-[11px] font-extrabold text-slate-900">
                                        {cat}
                                      </span>
                                </div>

                                <div className="p-6">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="min-w-0">
                                            <p className="text-[15px] font-extrabold text-slate-900 line-clamp-1">
                                                {g.model_name || "—"}
                                            </p>
                                            <p className="mt-0.5 text-[12px] text-slate-600 line-clamp-1">
                                                {g.color} · 📍 {g.location_name}
                                            </p>
                                        </div>

                                        <p className="text-[14px] font-extrabold text-emerald-700 whitespace-nowrap">
                                            ${g.price_mxn_min.toFixed(0)} MXN
                                        </p>
                                    </div>

                                    <div className="mt-3 flex items-center justify-between">
                                        <p className="text-[11px] text-slate-500 font-semibold">
                                            {totalPairs} {t(lang, "pares disponibles", "pairs available")}
                                        </p>

                                        <span className="inline-flex items-center rounded-full bg-slate-900 text-white px-3 py-1 text-[11px] font-extrabold group-hover:bg-black transition">
                      {t(lang, "Ver catálogo", "View catalog")} →
                    </span>
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </>
        );
    };

    return (
        <section className="mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-10 pb-12 space-y-6">
            {/* HERO (mobile-first app vibe, desktop wow storefront) */}
            <section className="relative overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm">
            {/* soft background glow (NO GREEN) */}
                <div className="pointer-events-none absolute inset-0">
                    <div className="absolute -top-24 left-1/2 h-72 w-[720px] -translate-x-1/2 rounded-full bg-slate-100/70 blur-3xl" />
                    <div className="absolute top-24 left-1/3 h-64 w-[520px] -translate-x-1/2 rounded-full bg-slate-200/35 blur-3xl" />
                    <div className="absolute -bottom-32 right-[-120px] h-80 w-80 rounded-full bg-slate-100/60 blur-3xl" />
                </div>

                {/* content */}
                <div className="relative mx-auto w-full max-w-screen-2xl px-4 sm:px-6 lg:px-8">
                {/* MOBILE / TABLET */}
                    <div className="lg:hidden p-4 sm:p-6">
                        {/* top row */}
                        <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                    <img
                                        src="/og-v3.png"
                                        alt="Aguuacatito.shop"
                                        className="h-8 w-8 rounded-full ring-2 ring-white"
                                    />
                                    <div className="min-w-0">
                                        <p className="text-[12px] font-extrabold text-slate-900 truncate">
                                            Aguuacatito.shop
                                        </p>
                                        <p className="text-[11px] text-slate-600 truncate">
                                            {t(lang, "Compra por WhatsApp · Solo pick up", "WhatsApp checkout · Pick up only")}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <span className="shrink-0 inline-flex items-center gap-2 rounded-full bg-white/80 backdrop-blur border border-slate-200 px-3 py-1 text-[11px] font-semibold text-slate-700">
          📍 {locationFilter === "all" ? t(lang, "Todas", "All") : selectedLocationLabel}
        </span>
                        </div>

                        {/* headline */}
                        <div className="mt-5 space-y-2">
                            <h1 className="text-[28px] leading-[1.05] font-extrabold tracking-tight text-slate-900">
                                {t(lang, "Compra fácil por WhatsApp", "Order easily via WhatsApp")}
                            </h1>
                            <p className="text-[12px] text-slate-600">
                                {t(lang, "Elige tu ciudad y aparta al instante.", "Pick your city and reserve instantly.")}
                            </p>
                            <p className="text-[12px] font-extrabold text-slate-900">{locationAwareLine}</p>
                        </div>

                        {/* city picker panel */}
                        <div className="mt-4 rounded-3xl bg-white/75 backdrop-blur border border-slate-200 p-3 shadow-sm">
                            <p className="text-[10px] font-extrabold uppercase tracking-wide text-slate-500">
                                {t(lang, "Elige tu ciudad", "Choose your city")}
                            </p>

                            <select
                                value={locationFilter}
                                onChange={(e) => onSelectLocation(e.target.value)}
                                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-[12px] font-semibold text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-200"
                            >
                                <option value="all">{t(lang, "Todas", "All")}</option>
                                {visibleLocations.map((l) => (
                                    <option key={l.slug} value={l.slug}>
                                        {l.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* CTAs */}
                        <div className="mt-4 grid grid-cols-[1fr_auto] gap-2">
                            <button
                                type="button"
                                onClick={onBrowseCatalog}
                                className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-600 text-white px-4 py-3 text-sm font-extrabold shadow-sm hover:bg-emerald-700 transition"
                            >
                                🛍️ {t(lang, "Ir al catálogo", "Go to catalog")} →
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    if (hasSupportWhatsApp) {
                                        track("whatsapp_click_support", { lang, location: "home_hero_mobile" });
                                        window.open(supportWaLink, "_blank", "noopener,noreferrer");
                                    }
                                }}
                                className={`inline-flex items-center justify-center rounded-full px-4 py-3 text-sm font-extrabold border shadow-sm transition ${
                                    hasSupportWhatsApp
                                        ? "bg-white/80 backdrop-blur text-slate-900 border-slate-200 hover:bg-white"
                                        : "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
                                }`}
                                aria-label={t(lang, "Abrir WhatsApp", "Open WhatsApp")}
                            >
                                📲
                            </button>
                        </div>

                        {/* cart banner */}
                        {totalCartPairs > 0 && (
                            <div className="mt-4 rounded-3xl border border-slate-200 bg-white/80 backdrop-blur p-3 text-[11px] text-slate-900 flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <p className="font-extrabold">{t(lang, "Tu carrito está listo", "Your cart is ready")}</p>
                                    <p className="text-slate-600 font-semibold">
                                        {t(lang, `${totalCartPairs} artículo(s)`, `${totalCartPairs} item(s)`)}
                                        {isMixedCart ? t(lang, " · Mezclado por ciudad", " · Mixed by city") : ""}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={onOpenCart}
                                    className="rounded-full bg-white px-3 py-2 border border-slate-200 font-extrabold text-slate-900 hover:bg-slate-50 transition"
                                >
                                    {t(lang, "Ver", "View")}
                                </button>
                            </div>
                        )}
                    </div>
                    {/* DESKTOP */}
                    <div className="hidden lg:block py-12">
                        <div className="grid w-full grid-cols-[minmax(0,1fr)_560px] gap-12 items-start">
                            {/* left */}
                                <div className="space-y-6">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <span className="inline-flex items-center gap-2 rounded-full bg-white/90 backdrop-blur border border-slate-200 px-4 py-2 text-[12px] font-extrabold text-slate-900">
                                        <img src="/og-v3.png" alt="Aguuacatito.shop" className="h-5 w-5 rounded-full" />
                                        Aguuacatito.shop
                                      </span>
                                        <span className="inline-flex items-center gap-2 rounded-full bg-white/90 backdrop-blur border border-slate-200 px-4 py-2 text-[12px] font-semibold text-slate-700">
                                            📲 {t(lang, "Nació en TikTok", "Started on TikTok")}
                                          </span>
                                        <span className="inline-flex items-center gap-2 rounded-full bg-white/90 backdrop-blur border border-slate-200 px-4 py-2 text-[12px] font-semibold text-slate-700">
                                        📍 {t(lang, "Pick up only", "Pick up only")}
                                      </span>
                                    </div>

                                    <div className="space-y-3">
                                        <h1 className="text-[52px] leading-[1.02] font-extrabold tracking-tight text-slate-900">
                                            {t(lang, "Compra fácil por WhatsApp", "Order easily via WhatsApp")}
                                        </h1>
                                        <p className="text-[15px] text-slate-600 leading-relaxed max-w-[68ch]">
                                            {t(lang, "Elige tu ciudad y aparta por WhatsApp.", "Pick your city and reserve via WhatsApp.")}
                                        </p>
                                        <p className="text-[15px] font-extrabold text-slate-900">{locationAwareLine}</p>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <button
                                            type="button"
                                            onClick={onBrowseCatalog}
                                            className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-600 text-white px-9 py-4 text-sm font-extrabold shadow-sm hover:bg-emerald-700 transition"
                                        >
                                            🛍️ {t(lang, "Explorar catálogo", "Explore catalog")} →
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (hasSupportWhatsApp) {
                                                    track("whatsapp_click_support", { lang, location: "home_hero_desktop" });
                                                    window.open(supportWaLink, "_blank", "noopener,noreferrer");
                                                }
                                            }}
                                            className={`inline-flex items-center justify-center rounded-full px-9 py-4 text-sm font-extrabold border shadow-sm transition ${
                                                hasSupportWhatsApp
                                                    ? "bg-white text-slate-900 border-slate-200 hover:bg-slate-50"
                                                    : "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
                                            }`}
                                        >
                                            📲 {t(lang, "WhatsApp", "WhatsApp")}
                                        </button>

                                        {totalCartPairs > 0 && (
                                            <button
                                                type="button"
                                                onClick={onOpenCart}
                                                className="inline-flex items-center justify-center rounded-full bg-white border border-slate-200 px-6 py-4 text-sm font-extrabold text-slate-900 hover:bg-slate-50 transition"
                                            >
                                                🧺 {t(lang, "Carrito", "Cart")} · {totalCartPairs}
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* right panel (anchor it to the far right + give it a real width) */}
                                <div className="justify-self-end w-full max-w-[560px] rounded-[28px] bg-white border border-slate-200 overflow-hidden shadow-sm">
                                    <div className="p-6 border-b border-slate-200/60">
                                        <p className="text-[12px] font-extrabold text-slate-900">{t(lang, "Elige tu ciudad", "Choose your city")}</p>
                                        <p className="text-[12px] text-slate-600 mt-1">
                                            {t(lang, "El catálogo cambia por ubicación.", "Catalog changes by location.")}
                                        </p>
                                    </div>

                                    <div className="p-6 space-y-4">
                                        <select
                                            value={locationFilter}
                                            onChange={(e) => onSelectLocation(e.target.value)}
                                            className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-[13px] font-semibold text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-200"
                                        >
                                            <option value="all">{t(lang, "Todas", "All")}</option>
                                            {visibleLocations.map((l) => (
                                                <option key={l.slug} value={l.slug}>
                                                    {l.name}
                                                </option>
                                            ))}
                                        </select>

                                        <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200/60">
                                            <p className="text-[11px] font-extrabold text-slate-900">{t(lang, "Cómo comprar", "How it works")}</p>
                                            <ol className="mt-2 space-y-1 text-[12px] text-slate-600">
                                                <li>1) {t(lang, "Explora catálogo", "Browse catalog")}</li>
                                                <li>2) {t(lang, "Agrega al carrito", "Add to cart")}</li>
                                                <li>3) {t(lang, "Envíalo por WhatsApp", "Send via WhatsApp")}</li>
                                                <li>4) {t(lang, "Pick up", "Pick up")}</li>
                                            </ol>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={totalCartPairs > 0 ? onOpenCart : onBrowseCatalog}
                                            className={`w-full inline-flex items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-extrabold shadow-sm transition ${
                                                totalCartPairs > 0
                                                    ? "bg-emerald-600 text-white hover:bg-emerald-700"
                                                    : "bg-white border border-slate-200 text-slate-900 hover:bg-slate-50"
                                            }`}
                                        >
                                            {totalCartPairs > 0 ? (
                                                <>🧺 {t(lang, "Ver carrito", "View cart")} · {totalCartPairs}</>
                                            ) : (
                                                <>🛍️ {t(lang, "Ir al catálogo", "Go to catalog")}</>
                                            )}
                                        </button>
                                    </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ultra-tight separator */}
            <div className="px-4 sm:px-6 lg:px-10 mt-2">
                <div className="h-px w-full bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
            </div>

            {/* ONE (and only one) NOVEDADES section — mixed categories */}
            <section className="px-4 sm:px-6 lg:px-10 xl:px-16 2xl:px-20 pt-0.5 pb-8">
            <div className="flex items-end justify-between gap-3">
                    <div>
                        <p className="text-[10px] font-extrabold tracking-[0.18em] text-slate-500 uppercase">
                            {t(lang, "Novedades", "New arrivals")}
                        </p>
                        <h2 className="mt-1 text-[16px] sm:text-[18px] font-extrabold text-slate-900 tracking-tight">
                            {t(lang, "De todo un poco", "A bit of everything")}
                        </h2>
                        <p className="mt-1 text-[12px] text-slate-600">
                            {t(lang, "Mezclado por categoría", "Mixed across categories")}
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onBrowseCatalog}
                        className="text-[12px] font-extrabold text-emerald-700 hover:text-emerald-800 underline underline-offset-4"
                    >
                        {t(lang, "Ver todo", "View all")}
                    </button>
                </div>

                {renderNovedades()}
            </section>
        </section>
    );
}
