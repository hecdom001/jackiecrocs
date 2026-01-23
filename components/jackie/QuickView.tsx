"use client";

import type { ColorGroup, Lang, PublicItem } from "@/lib/jackieCatalogUtils";
import {
    availabilityText,
    formatSizeLabel,
    inferSizeCategory,
    sizeRank,
    t,
    translateColor,
    translateModelLabel,
} from "@/lib/jackieCatalogUtils";

export function QuickView({
                              open,
                              group,
                              lang,
                              onClose,
                              quantities,
                              sizeFilter,
                              onAdd,
                              onRemove,
                          }: {
    open: boolean;
    group: ColorGroup | null;
    lang: Lang;
    onClose: () => void;
    quantities: Record<string, number>;
    sizeFilter: string;
    onAdd: (item: PublicItem) => void;
    onRemove: (itemId: string) => void;
}) {
    if (!open || !group) return null;

    const renderGroupSizeSections = (isCompact: boolean) => {
        const adult = group.variants
            .filter((v) => inferSizeCategory(v.size) === "adult")
            .sort((a, b) => sizeRank(a.size) - sizeRank(b.size));
        const youth = group.variants
            .filter((v) => inferSizeCategory(v.size) === "youth")
            .sort((a, b) => sizeRank(a.size) - sizeRank(b.size));
        const kids = group.variants
            .filter((v) => inferSizeCategory(v.size) === "kids")
            .sort((a, b) => sizeRank(a.size) - sizeRank(b.size));
        const cm = group.variants
            .filter((v) => inferSizeCategory(v.size) === "cm")
            .sort((a, b) => sizeRank(a.size) - sizeRank(b.size));
        const unknown = group.variants
            .filter((v) => inferSizeCategory(v.size) === "unknown")
            .sort((a, b) => sizeRank(a.size) - sizeRank(b.size));

        const sectionClass = isCompact ? "space-y-1" : "space-y-1.5";
        const sizeRowClass = isCompact
            ? "flex items-center justify-between rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1"
            : "flex items-center justify-between rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5";
        const labelClass = isCompact ? "text-[11px] font-medium text-slate-900" : "text-[12px] font-medium text-slate-900";
        const subtitleClass = "text-[10px] text-slate-500";

        const renderSection = (titleEs: string, titleEn: string, list: PublicItem[]) => {
            if (!list.length) return null;
            const icon =
                titleEs === "CM" ? "📏" : titleEs.startsWith("Adulto") ? "👟" : titleEs.startsWith("Juvenil") ? "🧑" : "🧒";

            return (
                <div className={sectionClass}>
                    <p className="text-[11px] font-semibold text-slate-800 flex items-center gap-1">
                        <span>{icon}</span>
                        <span>{t(lang, titleEs, titleEn)}</span>
                    </p>

                    <div className="space-y-1">
                        {list.map((v) => {
                            const qty = quantities[v.id] ?? 0;
                            const atMax = qty >= v.availableCount;
                            const isSelectedSize = sizeFilter !== "all" && v.size === sizeFilter;

                            return (
                                <div
                                    key={v.id}
                                    className={`${sizeRowClass} ${isSelectedSize ? "ring-1 ring-emerald-300 bg-emerald-50" : ""}`}
                                >
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-1">
                                            <span className={labelClass}>{formatSizeLabel(v.size, lang)}</span>
                                            <span className="text-[10px] font-semibold text-emerald-700">- ${v.price_mxn.toFixed(0)} MXN</span>
                                        </div>
                                        <span className={subtitleClass}>{availabilityText(v.availableCount, lang)}</span>
                                    </div>

                                    {qty === 0 ? (
                                        <button
                                            type="button"
                                            onClick={() => onAdd(v)}
                                            className="inline-flex items-center rounded-full border border-emerald-300 bg-white px-2.5 py-1 text-[11px] font-medium text-emerald-700 hover:bg-emerald-50 transition"
                                        >
                                            <span>+</span>
                                            <span className="ml-1 hidden xs:inline">{t(lang, "Agregar", "Add")}</span>
                                        </button>
                                    ) : (
                                        <div className="flex items-center gap-1.5">
                                            <button
                                                type="button"
                                                onClick={() => onRemove(v.id)}
                                                className="inline-flex items-center justify-center h-7 w-7 rounded-full border border-slate-200 bg-white text-[14px] text-slate-700 hover:border-emerald-400 hover:text-emerald-700 transition"
                                            >
                                                –
                                            </button>

                                            <div className="inline-flex items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-800">
                                                <span className="mr-1">x{qty}</span>
                                                {atMax && <span className="text-[9px] text-emerald-700">{t(lang, "Máx", "Max")}</span>}
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() => onAdd(v)}
                                                disabled={atMax}
                                                className={`inline-flex items-center justify-center h-7 w-7 rounded-full border text-[14px] transition ${
                                                    atMax
                                                        ? "border-slate-200 text-slate-300 cursor-not-allowed bg-slate-50"
                                                        : "border-emerald-300 bg-white text-emerald-700 hover:bg-emerald-50"
                                                }`}
                                            >
                                                +
                                            </button>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            );
        };

        return (
            <div className="mt-2 space-y-3">
                {renderSection("Adulto / Unisex", "Adult / Unisex", adult)}
                {renderSection("Juvenil", "Youth", youth)}
                {renderSection("Niños", "Kids", kids)}
                {renderSection("CM", "CM", cm)}
                {renderSection("Otras tallas", "Other sizes", unknown)}
            </div>
        );
    };

    return (
        <div className="fixed inset-0 z-50">
            <button className="absolute inset-0 bg-black/40" onClick={onClose} aria-label={t(lang, "Cerrar", "Close")} />
            <div className="absolute inset-x-0 bottom-0 sm:inset-0 sm:flex sm:items-center sm:justify-center">
                <div className="w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-xl border border-slate-200 max-h-[85vh] overflow-auto">
                    <div className="p-4 border-b border-slate-100 flex items-start justify-between gap-3">
                        <div>
                            <p className="text-sm font-semibold text-slate-900">
                                {translateModelLabel(group.model_name || "Classic", lang)}
                            </p>
                            <p className="text-[11px] text-slate-500">
                                {translateColor(group.color, lang)} · 📍 {group.location_name}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            className="h-9 w-9 rounded-full border border-slate-200 bg-white hover:bg-slate-50"
                        >
                            ✕
                        </button>
                    </div>

                    <div className="p-4">{renderGroupSizeSections(true)}</div>
                </div>
            </div>
        </div>
    );
}
