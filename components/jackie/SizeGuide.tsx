"use client";

import React, { useMemo, useState } from "react";
import Image from "next/image";

import type { Lang } from "@/lib/jackieCatalogUtils";
import { t } from "@/lib/jackieCatalogUtils";

import {
    SIZE_GUIDE_IMAGE_URL_EN,
    SIZE_GUIDE_IMAGE_URL_ES,
} from "@/components/jackie/storeConstants";

export function SizeGuide({ lang }: { lang: Lang }) {
    const [imgError, setImgError] = useState(false);

    const imgSrc = useMemo(() => {
        return lang === "en" ? SIZE_GUIDE_IMAGE_URL_EN : SIZE_GUIDE_IMAGE_URL_ES;
    }, [lang]);

    // Optional fallback table data (kept from your existing component)
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
        <section className="rounded-[28px] border border-slate-200 bg-white shadow-sm overflow-hidden">
            {/* Header */}
            <div className="p-5 sm:p-6">
                <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                        <h3 className="text-[15px] font-extrabold text-slate-900 flex items-center gap-2">
                              <span className="grid h-8 w-8 place-items-center rounded-2xl border border-slate-200 bg-slate-50">
                                📏
                              </span>
                            {t(lang, "Guía de tallas", "Size guide")}
                        </h3>
                    </div>

                    <a
                        href={imgSrc}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-[12px] font-extrabold text-slate-900 hover:bg-slate-50"
                    >
                        🔎 {t(lang, "Ver grande", "Open")}
                    </a>
                </div>

                {/* Image */}
                {!imgError ? (
                    <div className="mt-4">
                        <div className="mt-4 flex justify-center">
                            <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-50
                                  w-full
                                  max-w-[520px]
                                  sm:max-w-[600px]
                                  lg:max-w-[720px]">
                                <Image
                                    src={imgSrc}
                                    alt={t(lang, "Guía de tallas", "Size guide")}
                                    width={1600}
                                    height={1200}
                                    className="h-auto w-full object-contain"
                                    onError={() => setImgError(true)}
                                />
                            </div>
                        </div>


                        {/* Tips */}
                        <div className="mt-4 grid gap-2 sm:grid-cols-2">
                            <div className="rounded-2xl border border-slate-200 bg-white p-4">
                                <p className="text-[12px] font-extrabold text-slate-900">
                                    {t(lang, "Tip rápido", "Quick tip")}
                                </p>
                                <p className="mt-1 text-[12px] text-slate-600">
                                    {t(
                                        lang,
                                        "Tus dedos no deben rozar la parte delantera.",
                                        "Your toes shouldn’t touch the front."
                                    )}
                                </p>
                            </div>

                            <div className="rounded-2xl border border-slate-200 bg-white p-4">
                                <p className="text-[12px] font-extrabold text-slate-900">
                                    {t(lang, "Etiqueta", "Label")}
                                </p>
                                <p className="mt-1 text-[12px] text-slate-600">
                                    {t(
                                        lang,
                                        "M = hombre, W = mujer (ej: M9-W11).",
                                        "M = men, W = women (ex: M9-W11)."
                                    )}
                                </p>
                            </div>
                        </div>
                    </div>
                ) : (
                    // Fallback if image fails
                    <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-[12px] text-slate-700">
                        {t(
                            lang,
                            "No se pudo cargar la imagen. Abre la guía en una pestaña nueva:",
                            "Couldn’t load the image. Open the guide in a new tab:"
                        )}{" "}
                        <a
                            href={imgSrc}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-extrabold text-emerald-700 hover:underline"
                        >
                            {t(lang, "Abrir", "Open")}
                        </a>
                    </div>
                )}
            </div>
        </section>
    );
}
