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
            className={[
                "text-left group w-full overflow-hidden rounded-3xl border border-slate-200 bg-white",
                "shadow-sm transition",
                "hover:-translate-y-0.5 hover:shadow-md hover:border-slate-300",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300",
            ].join(" ")}
        >
            {/* ✅ flex column so content heights match across cards */}
            <div className="flex h-full flex-col">
                {/* Image */}
                <div className="relative aspect-square bg-slate-50">
                    {photo ? (
                        <Image
                            src={photo.src}
                            alt={photo.label || translateModelLabel(group.model_name || "Classic", lang)}
                            fill
                            className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw"
                            priority={false}
                        />
                    ) : (
                        <div className="h-full w-full flex items-center justify-center text-4xl">👟</div>
                    )}

                    {/* Color badge (subtle) */}
                    <div className="absolute right-3 top-3">
            <span className="rounded-full bg-white/90 backdrop-blur border border-slate-200 px-2.5 py-1 text-[10px] font-semibold text-slate-700">
              {translateColor(group.color, lang)}
            </span>
                    </div>
                </div>

                {/* Content */}
                <div className="flex flex-1 flex-col p-3">
                    <div className="min-h-[44px]">
                        <p className="text-[13px] font-extrabold text-slate-900 leading-snug line-clamp-2">
                            {translateModelLabel(group.model_name || "Classic", lang)}
                        </p>

                        <div className={`mt-2 h-[4px] w-full rounded-full ${colorLineClass(group.color)} opacity-80`} />

                        <p className="mt-2 text-[11px] text-slate-500 line-clamp-1">
                            📍 {group.location_name}
                        </p>
                    </div>

                    {/* Price row */}
                    <div className="mt-3 flex items-end justify-between gap-2">
                        <p className="text-[14px] font-extrabold text-emerald-700 leading-none">
                            {priceText}
                        </p>
                        <p className="text-[10px] text-slate-500 whitespace-nowrap">
                            {t(lang, `${totalPairs} pares`, `${totalPairs} pairs`)}
                        </p>
                    </div>

                    {/* CTA pinned at bottom */}
                    <div className="mt-3">
            <span className="inline-flex w-full items-center justify-center rounded-2xl border border-slate-200 bg-white px-3 py-2 text-[12px] font-extrabold text-slate-800 transition group-hover:bg-slate-50">
              {t(lang, "Ver tallas", "View sizes")}
            </span>
                    </div>
                </div>
            </div>
        </button>
    );
}
