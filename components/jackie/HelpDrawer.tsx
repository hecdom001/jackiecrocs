"use client";

import React, { useMemo } from "react";
import { t, type Lang } from "@/lib/jackieCatalogUtils";
import {SizeGuide} from "@/components/jackie/SizeGuide";
import {FeedbackBox} from "@/components/jackie/FeedbackBox";

export type MexBankInfo = {
    bankName: string;
    accountName: string;
    accountNumber: string;
};

export function HelpDrawer({
                               open,
                               onClose,
                               lang,
                               locationSlug,
                               pickupSpotsByLocation,
                               supportWaLink,
                               hasSupportWhatsApp,
                               bankInfo,
                               onOpenSizeGuide, // you can wire this to scroll or open modal later
                           }: {
    open: boolean;
    onClose: () => void;
    lang: Lang;
    locationSlug: string;
    pickupSpotsByLocation: Record<string, string[]>;
    supportWaLink: string;
    hasSupportWhatsApp: boolean;
    bankInfo: MexBankInfo;
    onOpenSizeGuide: () => void;
}) {
    if (!open) return null;

    const locationLabel = (slug: string) => {
        if (slug === "tijuana") return "Tijuana";
        if (slug === "mexicali") return "Mexicali";
        if (slug === "hermosillo_sonora") return "Hermosillo";
        return slug;
    };

    const grouped = useMemo(() => {
        // if "all", show all groups; else only that location
        if (!locationSlug || locationSlug === "all") return pickupSpotsByLocation;
        return { [locationSlug]: pickupSpotsByLocation[locationSlug] ?? [] };
    }, [locationSlug, pickupSpotsByLocation]);

    const buildMapsLink = (query: string) => {
        const q = encodeURIComponent(query);
        return `https://www.google.com/maps/search/?api=1&query=${q}`;
    };

    return (
        <div className="fixed inset-0 z-[80]">
            {/* backdrop */}
            <button
                type="button"
                className="absolute inset-0 bg-black/40"
                onClick={onClose}
                aria-label={t(lang, "Cerrar", "Close")}
            />

            {/* sheet */}
            <div className="absolute inset-x-0 bottom-0 lg:inset-y-0 lg:right-0 lg:left-auto">
                <div className="mx-auto w-full max-w-md md:max-w-2xl lg:max-w-[520px] lg:h-full">
                    <div className="max-h-[85vh] lg:max-h-none lg:h-full overflow-auto rounded-t-3xl lg:rounded-l-3xl lg:rounded-tr-none bg-white border border-slate-200 shadow-2xl">
                        {/* header */}
                        <div className="sticky top-0 bg-white/95 backdrop-blur border-b border-slate-100 p-4 flex items-center justify-between">
                            <div>
                                <p className="text-sm font-extrabold text-slate-900">
                                    {t(lang, "Ayuda", "Help")}
                                </p>
                                <p className="text-[12px] text-slate-600">
                                    {t(lang, "Todo en un solo lugar", "Everything in one place")}
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={onClose}
                                className="h-9 w-9 rounded-full border border-slate-200 bg-white hover:bg-slate-50"
                                aria-label={t(lang, "Cerrar", "Close")}
                            >
                                ✕
                            </button>
                        </div>

                        <div className="p-4 space-y-4">
                            {/* Pickup */}
                            <div className="rounded-3xl border border-slate-200 bg-white p-4">
                                <p className="text-[12px] font-extrabold text-slate-900">
                                    📍 {t(lang, "Pick up", "Pickup")}
                                </p>
                                <p className="mt-1 text-[12px] text-slate-600">
                                    {t(lang, "Abre ubicación en Google Maps", "Open location in Google Maps")}
                                </p>

                                <div className="mt-3 space-y-3">
                                    {Object.entries(grouped).map(([slug, spots]) => (
                                        <div key={slug}>
                                            <p className="text-[12px] font-extrabold text-slate-900">
                                                {locationLabel(slug)}
                                            </p>

                                            {spots?.length ? (
                                                <div className="mt-2 space-y-2">
                                                    {spots.map((s) => (
                                                        <a
                                                            key={s}
                                                            href={buildMapsLink(`${s} ${locationLabel(slug)}`)}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-[12px] font-semibold text-slate-800 hover:bg-slate-100"
                                                        >
                                                            <span className="truncate">{s}</span>
                                                            <span className="text-slate-500">↗</span>
                                                        </a>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="mt-2 text-[12px] text-slate-500">
                                                    {t(lang, "Sin ubicaciones registradas.", "No locations listed.")}
                                                </p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Contact */}
                            <div className="rounded-3xl border border-slate-200 bg-white p-4">
                                <p className="text-[12px] font-extrabold text-slate-900">
                                    💬 {t(lang, "Contacto", "Contact")}
                                </p>

                                <a
                                    href={hasSupportWhatsApp ? supportWaLink : "#"}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`mt-3 w-full inline-flex items-center justify-center rounded-full px-4 py-3 text-[12px] font-extrabold shadow-sm transition ${
                                        hasSupportWhatsApp
                                            ? "bg-emerald-600 text-white hover:bg-emerald-700"
                                            : "bg-slate-100 text-slate-400 cursor-not-allowed"
                                    }`}
                                >
                                    WhatsApp →
                                </a>
                            </div>

                            {/* Bank transfer */}
                            <div className="rounded-3xl border border-slate-200 bg-white p-4">
                                <p className="text-[12px] font-extrabold text-slate-900">
                                    🏦 {t(lang, "Transferencia", "Bank transfer")}
                                </p>

                                <div className="mt-3 space-y-2 text-[12px] text-slate-700">
                                    <div className="flex items-center justify-between gap-3">
                                        <span className="text-slate-500">{t(lang, "Banco", "Bank")}</span>
                                        <span className="font-semibold">{bankInfo.bankName}</span>
                                    </div>
                                    <div className="flex items-center justify-between gap-3">
                                        <span className="text-slate-500">{t(lang, "Nombre", "Name")}</span>
                                        <span className="font-semibold">{bankInfo.accountName}</span>
                                    </div>
                                    <div className="flex items-center justify-between gap-3">
                                        <span className="text-slate-500">{t(lang, "Cuenta", "Account")}</span>
                                        <span className="font-semibold">{bankInfo.accountNumber}</span>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => navigator.clipboard?.writeText(bankInfo.accountNumber)}
                                    className="mt-3 w-full rounded-full border border-slate-200 bg-white px-4 py-3 text-[12px] font-extrabold text-slate-900 hover:bg-slate-50"
                                >
                                    {t(lang, "Copiar cuenta", "Copy account")} →
                                </button>
                            </div>

                            <div className="space-y-6">
                                {/* Size guide */}
                                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                                    <h3 className="text-sm font-extrabold text-slate-900">
                                        {t(lang, "Guía de tallas", "Size guide")}
                                    </h3>
                                    <div className="mt-3">
                                        <SizeGuide lang={lang} />
                                    </div>
                                </div>

                                {/* Feedback */}
                                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                                    <h3 className="text-sm font-extrabold text-slate-900">
                                        {t(lang, "Comentarios", "Feedback")}
                                    </h3>
                                    <FeedbackBox lang={lang} context="storefront" />
                                </div>
                            </div>

                            <div className="h-2" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
