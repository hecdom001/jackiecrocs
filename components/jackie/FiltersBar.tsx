"use client";

import type { Lang, LocationOption } from "@/lib/jackieCatalogUtils";
import {
    formatSizeLabel,
    translateColor,
    translateCategory,
    t,
} from "@/lib/jackieCatalogUtils";

export type CategoryOption = { id: string; name: string; slug: string };

export function FiltersBar({
                               lang,
                               loading,

                               locationFilter,
                               setLocationFilter,
                               onPersistLocation,
                               locations,
                               visibleLocationSlugs,

                               categoryFilter,
                               setCategoryFilter,
                               categories,

                               brandFilter,
                               setBrandFilter,
                               brands,

                               showSize,
                               showColor,

                               sizeFilter,
                               setSizeFilter,
                               allSizes,

                               colorFilter,
                               setColorFilter,
                               allColors,

                               totalPairsFiltered,
                               formattedLastUpdated,
                               onRefresh,

                               variant = "card",
                           }: {
    lang: Lang;
    loading: boolean;

    locationFilter: string;
    setLocationFilter: (v: string) => void;
    onPersistLocation: (v: string) => void;
    locations: LocationOption[];
    visibleLocationSlugs: string[];

    categoryFilter: string;
    setCategoryFilter: (v: string) => void;
    categories: CategoryOption[];

    brandFilter: string;
    setBrandFilter: (v: string) => void;
    brands: string[];

    showSize: boolean;
    showColor: boolean;

    sizeFilter: string;
    setSizeFilter: (v: string) => void;
    allSizes: string[];

    colorFilter: string;
    setColorFilter: (v: string) => void;
    allColors: string[];

    totalPairsFiltered: number;
    formattedLastUpdated: string | null;

    onRefresh: () => void | Promise<void>;

    /** "card" = standalone top bar (mobile), "flat" = embed inside sidebar card (desktop) */
    variant?: "card" | "flat";
}) {
    const isFlat = variant === "flat";

    // ✅ Desktop sidebar should ALWAYS be stacked (1 column)
    const gridColsClass = isFlat
        ? "grid-cols-1"
        : showSize && showColor
            ? "sm:grid-cols-5"
            : showSize || showColor
                ? "sm:grid-cols-4"
                : "sm:grid-cols-3";

    // Outer wrapper
    const sectionClass = isFlat ? "w-full" : "mx-auto max-w-6xl px-4 pt-4";

    // Inner shell (card vs flat)
    const shellClass = isFlat
        ? "space-y-3"
        : "rounded-3xl bg-white border border-slate-200 shadow-sm p-4 space-y-3";

    // Sidebar needs stronger readability
    const labelClass = isFlat
        ? "text-xs font-semibold text-slate-800"
        : "text-slate-700";

    const selectClass = isFlat
        ? "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[13px] text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-300"
        : "w-full rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-[11px] text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-300";

    const refreshBtnClass = isFlat
        ? "inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-800 hover:bg-slate-50 transition"
        : "inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-medium text-slate-800 hover:border-emerald-400 hover:text-emerald-700 transition";

    return (
        <section className={sectionClass}>
            <div className={shellClass}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <p
                        className={
                            isFlat
                                ? "text-sm font-extrabold text-slate-900"
                                : "text-sm font-semibold text-slate-900"
                        }
                    >
                        {t(lang, "Catálogo", "Catalog")}{" "}
                        <span className="text-slate-500 font-medium">
              ·{" "}
                            {loading
                                ? t(lang, "Cargando…", "Loading…")
                                : t(
                                    lang,
                                    `${totalPairsFiltered} pares`,
                                    `${totalPairsFiltered} pairs`
                                )}
            </span>
                    </p>

                    <button
                        type="button"
                        onClick={() => void onRefresh()}
                        className={refreshBtnClass}
                    >
                        {loading
                            ? t(lang, "Actualizando…", "Refreshing…")
                            : t(lang, "Actualizar", "Refresh")}
                    </button>
                </div>

                <div
                    className={`grid ${gridColsClass} ${
                        isFlat ? "gap-4" : "gap-3"
                    } ${isFlat ? "text-[12px]" : "text-[11px]"}`}
                >
                    {/* Location */}
                    <div className="space-y-1">
                        <p className={labelClass}>{t(lang, "Ubicación", "Location")}</p>
                        <select
                            value={locationFilter}
                            onChange={(e) => {
                                const next = e.target.value;
                                setLocationFilter(next);
                                onPersistLocation(next);
                            }}
                            className={selectClass}
                        >
                            <option value="all">
                                {t(lang, "Todas las ubicaciones", "All locations")}
                            </option>
                            {locations
                                .filter((l) => visibleLocationSlugs.includes(l.slug))
                                .map((l) => (
                                    <option key={l.slug} value={l.slug}>
                                        {l.name}
                                    </option>
                                ))}
                        </select>
                    </div>

                    {/* Category */}
                    <div className="space-y-1">
                        <p className={labelClass}>{t(lang, "Categoría", "Category")}</p>
                        <select
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                            className={selectClass}
                        >
                            <option value="all">
                                {t(lang, "Todas las categorías", "All categories")}
                            </option>
                            {categories.map((c) => (
                                <option key={c.id} value={c.id}>
                                    {translateCategory(c.name || c.slug, lang)}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Brand */}
                    <div className="space-y-1">
                        <p className={labelClass}>{t(lang, "Marca", "Brand")}</p>
                        <select
                            value={brandFilter}
                            onChange={(e) => setBrandFilter(e.target.value)}
                            className={selectClass}
                        >
                            <option value="all">
                                {t(lang, "Todas las marcas", "All brands")}
                            </option>
                            {brands.map((b) => (
                                <option key={b} value={b}>
                                    {b}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Size */}
                    {showSize ? (
                        <div className="space-y-1">
                            <p className={labelClass}>{t(lang, "Talla", "Size")}</p>
                            <select
                                value={sizeFilter}
                                onChange={(e) => setSizeFilter(e.target.value)}
                                className={selectClass}
                            >
                                <option value="all">
                                    {t(lang, "Todas las tallas", "All sizes")}
                                </option>
                                {allSizes.map((sz) => (
                                    <option key={sz} value={sz}>
                                        {formatSizeLabel(sz, lang)}
                                    </option>
                                ))}
                            </select>
                        </div>
                    ) : null}

                    {/* Color */}
                    {showColor ? (
                        <div className="space-y-1">
                            <p className={labelClass}>{t(lang, "Color", "Color")}</p>
                            <select
                                value={colorFilter}
                                onChange={(e) => setColorFilter(e.target.value)}
                                className={selectClass}
                            >
                                <option value="all">
                                    {t(lang, "Todos los colores", "All colors")}
                                </option>
                                {allColors.map((c) => (
                                    <option key={c} value={c}>
                                        {translateColor(c, lang)}
                                    </option>
                                ))}
                            </select>
                        </div>
                    ) : null}
                </div>

                <div className="flex items-start justify-between gap-3">
                    <p className={isFlat ? "text-[10px] text-slate-500 leading-snug" : "text-[10px] text-slate-500"}>
                        {t(
                            lang,
                            "Tip: toca un producto para ver tallas y agregar al carrito.",
                            "Tip: tap a product to view sizes and add to cart."
                        )}
                    </p>

                    {formattedLastUpdated && (
                        <p className="text-[10px] text-slate-500 whitespace-nowrap">
                            {t(lang, "Actualizado", "Updated")}: {formattedLastUpdated}
                        </p>
                    )}
                </div>
            </div>
        </section>
    );
}
