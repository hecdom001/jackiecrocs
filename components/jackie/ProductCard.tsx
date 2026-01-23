"use client";

import Image from "next/image";
import type { ColorGroup, Lang } from "@/lib/jackieCatalogUtils";
import { t, translateColor, translateModelLabel, colorLineClass } from "@/lib/jackieCatalogUtils";

export function ProductCard({
                                lang,
                                group,
                                photo,
                                onQuickView,
                            }: {
    lang: Lang;
    group: ColorGroup;
    photo: { src: string; label: string } | null;
    onQuickView: (g: ColorGroup) => void;
}) {
    const totalPairs = group.variants.reduce((s, v) => s + v.availableCount, 0);

    const priceText =
        group.price_mxn_min === group.price_mxn_max
            ? `$${group.price_mxn_min.toFixed(0)} MXN`
            : t(lang, `Desde $${group.price_mxn_min.toFixed(0)} MXN`, `From $${group.price_mxn_min.toFixed(0)} MXN`);

    return (
        <button
            type="button"
            onClick={() => onQuickView(group)}
            className="text-left group rounded-3xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition overflow-hidden"
        >
            <div className="relative aspect-square bg-slate-50">
                {photo ? (
                    <Image
                        src={photo.src}
                        alt={photo.label}
                        fill
                        className="object-cover group-hover:scale-[1.02] transition"
                        sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                    />
                ) : (
                    <div className="h-full w-full flex items-center justify-center text-4xl">👟</div>
                )}

                <div className="absolute left-3 top-3 flex gap-2">
          <span className="rounded-full bg-white/90 border border-slate-200 px-2.5 py-1 text-[10px] font-medium">
            {translateColor(group.color, lang)}
          </span>
                </div>
            </div>

            <div className="p-3 space-y-1">
                <p className="text-[12px] font-semibold line-clamp-1">
                    {translateModelLabel(group.model_name || "Classic", lang)}
                </p>

                <div className={`h-[4px] w-full rounded-full ${colorLineClass(group.color)} opacity-80`} />

                <p className="text-[11px] text-slate-500 line-clamp-1">📍 {group.location_name}</p>

                <div className="flex items-end justify-between pt-1">
                    <p className="text-sm font-semibold text-emerald-600">{priceText}</p>
                    <p className="text-[10px] text-slate-500">{t(lang, `${totalPairs} pares`, `${totalPairs} pairs`)}</p>
                </div>

                <div className="pt-2">
          <span className="inline-flex items-center rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 px-3 py-1 text-[10px] font-medium">
            {t(lang, "Ver tallas", "View sizes")}
          </span>
                </div>
            </div>
        </button>
    );
}
