"use client";

import type { Lang } from "@/lib/jackieCatalogUtils";
import { t } from "@/lib/jackieCatalogUtils";

export function SizeGuide({ lang }: { lang: Lang }) {
    const adultRows = [
        { crocs: "M4-W6", mx: "23 cm" },
        { crocs: "M5-W7", mx: "24 cm" },
        { crocs: "M6-W8", mx: "25 cm" },
        { crocs: "M7-W9", mx: "26 cm" },
        { crocs: "M8-W10", mx: "27 cm" },
        { crocs: "M9-W11", mx: "28 cm" },
        { crocs: "M10-W12", mx: "29 cm" },
        { crocs: "M11", mx: "30 cm" },
        { crocs: "M12", mx: "31 cm" },
        { crocs: "M13", mx: "32 cm" },
    ];

    const kidsRows = [
        { crocs: "C2", mx: "9 cm" },
        { crocs: "C3", mx: "10 cm" },
        { crocs: "C4", mx: "11 cm" },
        { crocs: "C5", mx: "12 cm" },
        { crocs: "C6", mx: "13 cm" },
        { crocs: "C7", mx: "14 cm" },
        { crocs: "C8", mx: "15 cm" },
        { crocs: "C9", mx: "16 cm" },
        { crocs: "C10", mx: "17 cm" },
        { crocs: "C11", mx: "18 cm" },
        { crocs: "C12", mx: "19 cm" },
        { crocs: "C13", mx: "20 cm" },
        { crocs: "J1", mx: "21 cm" },
        { crocs: "J2", mx: "22 cm" },
        { crocs: "J3", mx: "23 cm" },
        { crocs: "J4", mx: "24 cm" },
        { crocs: "J5", mx: "25 cm" },
        { crocs: "J6", mx: "26 cm" },
    ];

    return (
        <section className="rounded-3xl bg-white border border-slate-200 shadow-sm p-4 space-y-4">
            <header className="space-y-1">
                <h3 className="text-sm font-semibold flex items-center gap-2 text-slate-900">
                    <span>📏</span>
                    <span>{t(lang, "¿Cómo elegir tu talla?", "How to choose your size")}</span>
                </h3>
                <p className="text-[11px] text-slate-600">
                    {t(
                        lang,
                        "Todas las tallas están en numeración US. Si estás entre dos tallas, elige la siguiente.",
                        "All sizes use US sizing. If you’re between two sizes, choose the next one up."
                    )}
                </p>
            </header>

            <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                    <p className="text-[11px] font-semibold text-slate-800 uppercase tracking-wide">{t(lang, "Unisex adulto", "Unisex adult")}</p>
                    <div className="overflow-hidden rounded-2xl border border-rose-100 bg-rose-50">
                        <div className="grid grid-cols-2 text-[11px] font-semibold text-white bg-rose-500 px-3 py-2">
                            <span>Crocs</span>
                            <span>{t(lang, "México", "Mexico")}</span>
                        </div>
                        <div className="divide-y divide-rose-100">
                            {adultRows.map((row) => (
                                <div key={row.crocs} className="grid grid-cols-2 text-[11px] text-slate-800 px-3 py-1.5 bg-white/70">
                                    <span>{row.crocs}</span>
                                    <span>{row.mx}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <p className="text-[11px] font-semibold text-slate-800 uppercase tracking-wide">{t(lang, "Infantil / Juvenil", "Kids / Youth")}</p>
                    <div className="overflow-hidden rounded-2xl border border-emerald-100 bg-emerald-50">
                        <div className="grid grid-cols-2 text-[11px] font-semibold text-white bg-emerald-500 px-3 py-2">
                            <span>Crocs</span>
                            <span>{t(lang, "México", "Mexico")}</span>
                        </div>
                        <div className="divide-y divide-emerald-100">
                            {kidsRows.map((row) => (
                                <div key={row.crocs} className="grid grid-cols-2 text-[11px] text-slate-800 px-3 py-1.5 bg-white/70">
                                    <span>{row.crocs}</span>
                                    <span>{row.mx}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <ul className="space-y-1 text-[11px] text-slate-600">
                <li>• {t(lang, "Tus dedos no deben rozar la parte delantera.", "Your toes shouldn’t touch the front.")}</li>
                <li>• {t(lang, "M = hombre, W = mujer (ej: M9-W11).", "M = men, W = women (ex: M9-W11).")}</li>
            </ul>
        </section>
    );
}
