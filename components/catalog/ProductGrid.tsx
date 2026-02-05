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
    getPhotoForColor: (colorOrKey: string) => { src: string; label: string };
    onQuickView: (g: ColorGroup) => void;
}) {
    return (
        // ✅ no max-w + no extra padding here — page already controls width/padding
        <section className="w-full px-0 py-4">
            {loading ? (
                <p className="text-sm text-slate-600">{t(lang, "Cargando inventario…", "Loading inventory…")}</p>
            ) : errorMsg ? (
                <p className="text-sm text-red-500">{errorMsg}</p>
            ) : groupsFiltered.length === 0 ? (
                <p className="text-sm text-slate-600">
                    {t(lang, "No hay pares con estos filtros.", "No pairs match these filters.")}
                </p>
            ) : (
                <>
                    {/* ✅ scales nicer on big screens */}
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-5">
                        {limitedGroups.map((g) => {
                            const imageKey = `${g.model_name}__${g.color}`.toLowerCase();
                            return (
                                <ProductCard
                                    key={g.key}
                                    lang={lang}
                                    group={g}
                                    photo={getPhotoForColor(imageKey)}
                                    onQuickView={onQuickView}
                                />
                            );
                        })}
                    </div>

                    <div className="mt-6 flex flex-col items-center gap-2">
                        <p className="text-[11px] text-slate-500">
                            {t(
                                lang,
                                `Mostrando ${showingCount} de ${groupsFiltered.length}`,
                                `Showing ${showingCount} of ${groupsFiltered.length}`
                            )}
                        </p>

                        {canShowMore && (
                            <button
                                type="button"
                                onClick={onShowMore}
                                className="inline-flex items-center rounded-full border border-slate-200 bg-white px-5 py-2.5 text-[12px] font-semibold text-slate-800 hover:bg-slate-50 transition"
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
