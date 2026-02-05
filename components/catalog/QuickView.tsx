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
import { X, MapPin, Palette, ShoppingBag } from "lucide-react";

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
    showSize?: boolean;
    showColor?: boolean;
}) {
    if (!open || !group) return null;

    const totalPairs = group.variants.reduce((s, v) => s + v.availableCount, 0);

    const priceMin = Math.min(...group.variants.map((v) => v.price_mxn));
    const priceMax = Math.max(...group.variants.map((v) => v.price_mxn));
    const priceText =
        priceMin === priceMax
            ? `$${priceMin.toFixed(0)} MXN`
            : t(lang, `Desde $${priceMin.toFixed(0)} MXN`, `From $${priceMin.toFixed(0)} MXN`);

    const Pill = ({
                      icon,
                      children,
                  }: {
        icon: React.ReactNode;
        children: React.ReactNode;
    }) => (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700">
      <span className="text-slate-500">{icon}</span>
      <span className="truncate">{children}</span>
    </span>
    );

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

        const sectionClass = isCompact ? "space-y-2" : "space-y-2.5";
        const sizeRowClass = isCompact
            ? "flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-3 py-2"
            : "flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5";

        const labelClass = isCompact
            ? "text-[12px] font-extrabold text-slate-900"
            : "text-[13px] font-extrabold text-slate-900";

        const subtitleClass = "text-[10px] text-slate-500";

        const renderSection = (titleEs: string, titleEn: string, list: PublicItem[]) => {
            if (!list.length) return null;

            return (
                <div className={sectionClass}>
                    <p className="text-[11px] font-extrabold text-slate-900">
                        {t(lang, titleEs, titleEn)}
                    </p>

                    <div className="space-y-2">
                        {list.map((v) => {
                            const qty = quantities[v.id] ?? 0;
                            const atMax = qty >= v.availableCount;
                            const isSelectedSize = sizeFilter !== "all" && v.size === sizeFilter;

                            return (
                                <div
                                    key={v.id}
                                    className={[
                                        sizeRowClass,
                                        isSelectedSize ? "ring-2 ring-emerald-200 border-emerald-200" : "",
                                    ].join(" ")}
                                >
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className={labelClass}>{formatSizeLabel(v.size, lang)}</span>
                                            <span className="text-[11px] font-extrabold text-emerald-700">
                        ${v.price_mxn.toFixed(0)} MXN
                      </span>
                                        </div>
                                        <span className={subtitleClass}>{availabilityText(v.availableCount, lang)}</span>
                                    </div>

                                    {qty === 0 ? (
                                        <button
                                            type="button"
                                            onClick={() => onAdd(v)}
                                            className="inline-flex items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-[12px] font-extrabold text-emerald-800 hover:bg-emerald-100 transition"
                                        >
                                            {t(lang, "Agregar", "Add")}
                                        </button>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => onRemove(v.id)}
                                                className="inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-slate-200 bg-white text-[16px] font-bold text-slate-700 hover:bg-slate-50 transition"
                                                aria-label={t(lang, "Quitar", "Remove")}
                                            >
                                                –
                                            </button>

                                            <div className="min-w-[54px] text-center rounded-2xl border border-emerald-200 bg-emerald-50 px-2 py-2 text-[12px] font-extrabold text-emerald-900">
                                                x{qty}
                                                {atMax ? (
                                                    <div className="text-[9px] font-bold text-emerald-700 -mt-0.5">
                                                        {t(lang, "Máx", "Max")}
                                                    </div>
                                                ) : null}
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() => onAdd(v)}
                                                disabled={atMax}
                                                className={[
                                                    "inline-flex h-9 w-9 items-center justify-center rounded-2xl border text-[16px] font-bold transition",
                                                    atMax
                                                        ? "border-slate-200 text-slate-300 cursor-not-allowed bg-slate-50"
                                                        : "border-emerald-200 bg-white text-emerald-800 hover:bg-emerald-50",
                                                ].join(" ")}
                                                aria-label={t(lang, "Agregar", "Add")}
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
            <div className="space-y-5">
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
            {/* Backdrop */}
            <button
                className="absolute inset-0 bg-black/40"
                onClick={onClose}
                aria-label={t(lang, "Cerrar", "Close")}
            />

            {/* Container */}
            <div className="absolute inset-x-0 bottom-0 sm:inset-0 sm:flex sm:items-center sm:justify-center p-0 sm:p-6">
                <div className="w-full sm:max-w-xl bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 max-h-[88vh] overflow-hidden">
                    {/* Header (sticky) */}
                    <div className="sticky top-0 z-10 bg-white border-b border-slate-200">
                        <div className="p-4 flex items-start justify-between gap-4">
                            <div className="min-w-0">
                                <p className="text-[15px] font-extrabold text-slate-900 leading-snug line-clamp-2">
                                    {translateModelLabel(group.model_name || "Classic", lang)}
                                </p>

                                <div className="mt-2 flex flex-wrap gap-2">
                                    <Pill icon={<Palette size={14} />}>{translateColor(group.color, lang)}</Pill>
                                    <Pill icon={<MapPin size={14} />}>{group.location_name}</Pill>
                                    <Pill icon={<ShoppingBag size={14} />}>
                                        {t(lang, `${totalPairs} pares`, `${totalPairs} pairs`)}
                                    </Pill>
                                </div>

                                <div className="mt-2 text-[13px] font-extrabold text-emerald-700">
                                    {priceText}
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={onClose}
                                className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 transition"
                                aria-label={t(lang, "Cerrar", "Close")}
                            >
                                <X size={18} />
                            </button>
                        </div>
                    </div>

                    {/* Body */}
                    <div className="p-4 overflow-auto max-h-[calc(88vh-120px)]">
                        {renderGroupSizeSections(true)}
                    </div>
                </div>
            </div>
        </div>
    );
}
