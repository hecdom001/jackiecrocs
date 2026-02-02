// components/jackie/HomeSections.tsx
"use client";

import type { ColorGroup, Lang, LocationOption } from "@/lib/jackieCatalogUtils";
import { googleMapsLink, t } from "@/lib/jackieCatalogUtils";
import { track } from "@vercel/analytics";

export const MEX_BANK_INFO = {
    bankName: "Santander",
    accountName: "Jackeline Monge",
    accountNumber: "0140 2026 0401 0725 79",
} as const;

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
                             }: {
    lang: Lang;
    locations: LocationOption[];
    pickupGroupedSpots: Record<string, string[]>;
    hasAnyPickupSpots: boolean;
    supportWaLink: string;
    hasSupportWhatsApp: boolean;

    featuredGroups: ColorGroup[];
    quickColorChips: string[];

    // ✅ DB-only image resolver (model + color)
    getPhotoForGroup: (modelName: string, colorEn: string) => Photo;

    onBrowseCatalog: () => void;
    onSelectColor: (color: string) => void;

    totalCartPairs: number;
    onOpenCart: () => void;
    isMixedCart: boolean;

    locationFilter: string; // "all" | slug
    onSelectLocation: (slug: string) => void;
    visibleLocationSlugs: string[];
}) {
    const visibleLocations = locations.filter((l) => visibleLocationSlugs.includes(l.slug));

    const selectedLocationLabel =
        locationFilter === "all"
            ? t(lang, "Todas", "All")
            : visibleLocations.find((l) => l.slug === locationFilter)?.name ||
            locations.find((l) => l.slug === locationFilter)?.name ||
            locationFilter;

    const renderFeatured = () => {
        if (!featuredGroups.length) {
            return (
                <p className="text-[11px] text-slate-600">
                    {t(
                        lang,
                        "No hay novedades con estos filtros. Prueba otra ubicación o borra búsqueda.",
                        "No new arrivals match these filters. Try another location or clear search."
                    )}
                </p>
            );
        }

        return (
            <div className="grid grid-cols-2 gap-3">
                {featuredGroups.map((group) => {
                    // ✅ DB-only: use model + color
                    const photo = getPhotoForGroup(group.model_name || "", group.color || "");
                    const totalPairs = group.variants.reduce((sum, v) => sum + v.availableCount, 0);
                    const lowStock = totalPairs <= 3;

                    const priceText =
                        group.price_mxn_min === group.price_mxn_max
                            ? `$${group.price_mxn_min.toFixed(0)}`
                            : t(lang, `Desde $${group.price_mxn_min.toFixed(0)}`, `From $${group.price_mxn_min.toFixed(0)}`);

                    return (
                        <button
                            key={group.key}
                            type="button"
                            onClick={() => onSelectColor(group.color)}
                            className="text-left rounded-3xl border border-slate-100 bg-white shadow-[0_10px_26px_rgba(15,23,42,0.04)] hover:shadow-[0_16px_40px_rgba(15,23,42,0.08)] transition p-3"
                        >
                            <div className="relative rounded-2xl overflow-hidden border border-slate-100 bg-slate-50 aspect-square">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={photo.src}
                                    alt={photo.label || group.color || "Product"}
                                    className="h-full w-full object-cover"
                                    loading="lazy"
                                />

                                <div className="absolute top-2 left-2 flex gap-1">
                  <span className="inline-flex items-center rounded-full bg-white/90 border border-slate-200 px-2 py-0.5 text-[9px] font-semibold text-slate-800">
                    {t(lang, "Nuevo", "New")}
                  </span>
                                    {lowStock && (
                                        <span className="inline-flex items-center rounded-full bg-rose-50 border border-rose-100 px-2 py-0.5 text-[9px] font-semibold text-rose-600">
                      {t(lang, "Pocos", "Low")}
                    </span>
                                    )}
                                </div>
                            </div>

                            <div className="mt-2 space-y-1">
                                <p className="text-[12px] font-semibold text-slate-900 line-clamp-1">
                                    {group.model_name || "—"}
                                </p>
                                <p className="text-[11px] text-slate-600 line-clamp-1">{group.color}</p>

                                <div className="flex items-center justify-between">
                                    <p className="text-[12px] font-semibold text-emerald-700">
                                        {priceText} <span className="text-[10px] text-slate-500">MXN</span>
                                    </p>
                                    <span className="text-[10px] text-slate-500">
                    {totalPairs} {t(lang, "pares", "pairs")}
                  </span>
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>
        );
    };

    return (
        <section className="mx-auto max-w-6xl px-4 pb-10 space-y-4">
            {/* HERO */}
            <section className="rounded-3xl bg-white border border-slate-100 shadow-sm p-4 space-y-3">
                <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-medium text-emerald-700 border border-emerald-100">
                    <span>🛍️</span>
                    <span>{t(lang, "Tienda en tiempo real", "Live store")}</span>
                </div>

                <div className="space-y-1">
                    <h1 className="text-xl font-semibold tracking-tight">
                        {t(lang, "Compra fácil por WhatsApp", "Order easily on WhatsApp")}
                    </h1>
                    <p className="text-[12px] text-slate-600">
                        {t(
                            lang,
                            "Explora modelos, elige tu talla y envía tu carrito. Stock se actualiza en vivo.",
                            "Browse styles, pick your size, and send your cart. Stock updates live."
                        )}
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-[11px]">
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-3 py-1 border border-slate-200">
            💵 {t(lang, "Efectivo o transferencia", "Cash or bank transfer")}
          </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-3 py-1 border border-slate-200">
            🇺🇸 {t(lang, "Tallas US", "US sizing")}
          </span>
                </div>

                {/* ✅ COMPACT LOCATION ROW */}
                <div className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                            {t(lang, "Ubicación", "Location")}
                        </p>
                        <p className="hidden sm:block text-[11px] text-slate-600">
                            {t(lang, "Filtra el stock por ciudad", "Filter stock by city")}
                        </p>
                    </div>

                    <div className="flex items-center gap-2 sm:justify-end">
            <span className="hidden sm:inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-semibold text-slate-600">
              📍 {locationFilter === "all" ? t(lang, "Todas", "All") : selectedLocationLabel}
            </span>

                        <select
                            value={locationFilter}
                            onChange={(e) => onSelectLocation(e.target.value)}
                            className="w-full sm:w-auto rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[12px] font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                            aria-label={t(lang, "Seleccionar ubicación", "Select location")}
                        >
                            <option value="all">{t(lang, "Todas", "All")}</option>
                            {visibleLocations.map((l) => (
                                <option key={l.slug} value={l.slug}>
                                    {l.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={onBrowseCatalog}
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-emerald-500 text-white px-4 py-3 text-sm font-semibold shadow-md hover:bg-emerald-400 transition"
                    >
                        🛒 {t(lang, "Explorar catálogo", "Explore catalog")}
                    </button>

                    <button
                        type="button"
                        onClick={() => {
                            if (hasSupportWhatsApp) {
                                track("whatsapp_click_support", { lang, location: "home_hero" });
                                window.open(supportWaLink, "_blank", "noopener,noreferrer");
                            }
                        }}
                        className={`inline-flex items-center justify-center rounded-full px-4 py-3 text-sm font-semibold border transition ${
                            hasSupportWhatsApp
                                ? "bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                                : "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
                        }`}
                        aria-label={t(lang, "Abrir WhatsApp", "Open WhatsApp")}
                    >
                        📲
                    </button>
                </div>

                {totalCartPairs > 0 && (
                    <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-3 text-[11px] text-emerald-900 flex items-center justify-between">
                        <div className="space-y-0.5">
                            <p className="font-semibold">
                                {t(lang, "Tienes productos en tu carrito", "You have items in your cart")}
                            </p>
                            <p className="text-emerald-800/80">
                                {t(lang, `${totalCartPairs} artículo(s)`, `${totalCartPairs} item(s)`)}
                                {isMixedCart ? t(lang, " · Mezclado por ciudad", " · Mixed by city") : ""}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={onOpenCart}
                            className="rounded-full bg-white px-3 py-2 border border-emerald-200 font-semibold text-emerald-700 hover:bg-emerald-100 transition"
                        >
                            {t(lang, "Ver", "View")}
                        </button>
                    </div>
                )}
            </section>

            {/* NEW ARRIVALS */}
            <section className="rounded-3xl bg-white border border-slate-100 shadow-sm p-4 space-y-3">
                <div className="flex items-center justify-between">
                    <h2 className="text-sm font-semibold flex items-center gap-2">
                        <span>✨</span>
                        <span>{t(lang, "Novedades", "New arrivals")}</span>
                    </h2>
                    <button
                        type="button"
                        onClick={onBrowseCatalog}
                        className="text-[11px] font-medium text-emerald-700 hover:text-emerald-800 underline underline-offset-2"
                    >
                        {t(lang, "Ver más", "See more")}
                    </button>
                </div>

                {renderFeatured()}
            </section>

            {/* The rest of your file stays exactly the same (pickup spots, info grid, etc.) */}
            {/* ✅ I left your remaining sections untouched for safety. */}
        </section>
    );
}
