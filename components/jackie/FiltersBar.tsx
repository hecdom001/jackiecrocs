"use client";

import type { Lang, LocationOption } from "@/lib/jackieCatalogUtils";
import { formatSizeLabel, translateColor, translateCategory, t } from "@/lib/jackieCatalogUtils";

export type CategoryOption = { id: string; name: string; slug: string };

export function FiltersBar({
                               lang,
                               loading,
                               locationFilter,
                               setLocationFilter,
                               locations,
                               visibleLocationSlugs,
                               categoryFilter,
                               setCategoryFilter,
                               categories,
                               brandFilter,
                               setBrandFilter,
                               brands,

                               // ✅ NEW
                               showSize,
                               showColor,

                               // existing
                               sizeFilter,
                               setSizeFilter,
                               allSizes,
                               colorFilter,
                               setColorFilter,
                               allColors,

                               totalPairsFiltered,
                               formattedLastUpdated,
                               onRefresh,
                               onPersistLocation,
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
}) {
    // ✅ columns adapt (3 base + optional size + optional color)
    const gridColsClass =
        showSize && showColor
            ? "sm:grid-cols-5"
            : showSize || showColor
                ? "sm:grid-cols-4"
                : "sm:grid-cols-3";

    return (
        <section className="mx-auto max-w-6xl px-4 pt-4">
            <div className="rounded-3xl bg-white border border-slate-200 shadow-sm p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-900">
                        {t(lang, "Catálogo", "Catalog")}{" "}
                        <span className="text-slate-500 font-medium">
              ·{" "}
                            {loading
                                ? t(lang, "Cargando…", "Loading…")
                                : t(lang, `${totalPairsFiltered} pares`, `${totalPairsFiltered} pairs`)}
            </span>
                    </p>

                    <button
                        type="button"
                        onClick={() => void onRefresh()}
                        className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-medium text-slate-800 hover:border-emerald-400 hover:text-emerald-700 transition"
                    >
                        {loading ? t(lang, "Actualizando…", "Refreshing…") : t(lang, "Actualizar", "Refresh")}
                    </button>
                </div>

                <div className={`grid gap-3 ${gridColsClass} text-[11px]`}>
                    {/* Location */}
                    <div className="space-y-1">
                        <p className="text-slate-700">{t(lang, "Ubicación", "Location")}</p>
                        <select
                            value={locationFilter}
                            onChange={(e) => {
                                const next = e.target.value;
                                setLocationFilter(next);
                                onPersistLocation(next);
                            }}
                            className="w-full rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-[11px] text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
                        >
                            <option value="all">{t(lang, "Todas las ubicaciones", "All locations")}</option>
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
                        <p className="text-slate-700">{t(lang, "Categoría", "Category")}</p>
                        <select
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                            className="w-full rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-[11px] text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
                        >
                            <option value="all">{t(lang, "Todas las categorías", "All categories")}</option>
                            {categories.map((c) => (
                                <option key={c.id} value={c.id}>
                                    {translateCategory(c.name || c.slug, lang)}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Brand */}
                    <div className="space-y-1">
                        <p className="text-slate-700">{t(lang, "Marca", "Brand")}</p>
                        <select
                            value={brandFilter}
                            onChange={(e) => setBrandFilter(e.target.value)}
                            className="w-full rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-[11px] text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
                        >
                            <option value="all">{t(lang, "Todas las marcas", "All brands")}</option>
                            {brands.map((b) => (
                                <option key={b} value={b}>
                                    {b}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* ✅ Size only when applicable */}
                    {showSize ? (
                        <div className="space-y-1">
                            <p className="text-slate-700">{t(lang, "Talla", "Size")}</p>
                            <select
                                value={sizeFilter}
                                onChange={(e) => setSizeFilter(e.target.value)}
                                className="w-full rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-[11px] text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
                            >
                                <option value="all">{t(lang, "Todas las tallas", "All sizes")}</option>
                                {allSizes.map((sz) => (
                                    <option key={sz} value={sz}>
                                        {formatSizeLabel(sz, lang)}
                                    </option>
                                ))}
                            </select>
                        </div>
                    ) : null}

                    {/* ✅ Color only when applicable */}
                    {showColor ? (
                        <div className="space-y-1">
                            <p className="text-slate-700">{t(lang, "Color", "Color")}</p>
                            <select
                                value={colorFilter}
                                onChange={(e) => setColorFilter(e.target.value)}
                                className="w-full rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-[11px] text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
                            >
                                <option value="all">{t(lang, "Todos los colores", "All colors")}</option>
                                {allColors.map((c) => (
                                    <option key={c} value={c}>
                                        {translateColor(c, lang)}
                                    </option>
                                ))}
                            </select>
                        </div>
                    ) : null}
                </div>

                <div className="flex items-center justify-between gap-3">
                    <p className="text-[10px] text-slate-500">
                        {t(
                            lang,
                            "Tip: toca un producto para ver tallas y agregar al carrito.",
                            "Tip: tap a product to view sizes and add to cart."
                        )}
                    </p>

                    {formattedLastUpdated && (
                        <p className="text-[10px] text-slate-500">
                            {t(lang, "Actualizado", "Updated")}: {formattedLastUpdated}
                        </p>
                    )}
                </div>
            </div>
        </section>
    );
}
