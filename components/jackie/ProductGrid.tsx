"use client";

import type { ColorGroup, Lang } from "@/lib/jackieCatalogUtils";
import { t } from "@/lib/jackieCatalogUtils";
import { ProductCard } from "./ProductCard";

export function ProductGrid({
                                lang,
                                loading,
                                errorMsg,
                                groupsFiltered,
                                limitedGroups,
                                showingCount,
                                onShowMore,
                                canShowMore,
                                getPhotoForColor,
                                onQuickView,
                            }: {
    lang: Lang;
    loading: boolean;
    errorMsg: string | null;
    groupsFiltered: ColorGroup[];
    limitedGroups: ColorGroup[];
    showingCount: number;
    canShowMore: boolean;
    onShowMore: () => void;
    getPhotoForColor: (color: string) => { src: string; label: string } | null;
    onQuickView: (g: ColorGroup) => void;
}) {
    return (
        <section className="mx-auto max-w-6xl px-4 py-4">
            {loading ? (
                <p className="text-sm text-slate-600">{t(lang, "Cargando inventario…", "Loading inventory…")}</p>
            ) : errorMsg ? (
                <p className="text-sm text-red-500">{errorMsg}</p>
            ) : groupsFiltered.length === 0 ? (
                <p className="text-sm text-slate-600">{t(lang, "No hay pares con estos filtros.", "No pairs match these filters.")}</p>
            ) : (
                <>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                        {limitedGroups.map((g) => (
                            <ProductCard key={g.key} lang={lang} group={g} photo={getPhotoForColor(g.color)} onQuickView={onQuickView} />
                        ))}
                    </div>

                    <div className="flex flex-col items-center gap-2 mt-4">
                        <p className="text-[10px] text-slate-500">
                            {t(lang, `Mostrando ${showingCount} de ${groupsFiltered.length}`, `Showing ${showingCount} of ${groupsFiltered.length}`)}
                        </p>

                        {canShowMore && (
                            <button
                                type="button"
                                onClick={onShowMore}
                                className="inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-2 text-[11px] font-medium text-slate-800 hover:border-emerald-400 hover:text-emerald-700 transition"
                            >
                                {t(lang, "Mostrar más", "Show more")}
                            </button>
                        )}
                    </div>
                </>
            )}
        </section>
    );
}
