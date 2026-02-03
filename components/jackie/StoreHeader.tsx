"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import type { Lang } from "@/lib/jackieCatalogUtils";
import { t } from "@/lib/jackieCatalogUtils";

export type HeaderCategory = { id: string; name: string };

function CartIcon({ className = "h-5 w-5" }: { className?: string }) {
    return (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
            <path
                d="M6.5 6.5H21l-1.6 7.2a2 2 0 0 1-2 1.6H9.1a2 2 0 0 1-2-1.6L5.4 4.5A1.5 1.5 0 0 0 3.9 3.3H2.5"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M10 20.2a1 1 0 1 0 0-2 1 1 0 0 0 0 2ZM17 20.2a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

function Pill({
                  active,
                  children,
                  onClick,
              }: {
    active: boolean;
    children: React.ReactNode;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`shrink-0 rounded-full border px-3 py-1 text-[12px] font-extrabold transition ${
                active
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            }`}
        >
            {children}
        </button>
    );
}

export function StoreHeader({
                                lang,
                                setLang,
                                query,
                                setQuery,
                                totalCartPairs,
                                onCartClick,
                                onHomeClick,
                                view,

                                // ✅ NEW for category tabs
                                categories = [],
                                categoryFilter,
                                onSelectCategory,
                                locationSlug,
                            }: {
    lang: Lang;
    setLang: (l: Lang) => void;
    query: string;
    setQuery: (v: string) => void;
    totalCartPairs: number;
    onCartClick: () => void;
    onHomeClick: () => void;
    view: "home" | "catalog";

    categories?: HeaderCategory[];
    categoryFilter?: string; // "all" | categoryId
    onSelectCategory?: (id: string) => void;
    locationSlug: string;
}) {
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 6);
        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    const showSearch = view === "catalog";
    const showTabs = view === "catalog" && categories.length > 0 && !!onSelectCategory;

    const pickupSpotsByLocation: Record<string, string[]> = {
        tijuana: ["Colectivo Paseo del Rio"],
        mexicali: ["Oaxaca 1820"],
        hermosillo_sonora: ["Villa Bonita"],
    };

    const locationLabel = (slug: string) => {
        if (slug === "tijuana") return "Tijuana";
        if (slug === "mexicali") return "Mexicali";
        if (slug === "hermosillo_sonora") return "Hermosillo";
        return slug;
    };

    const announcement = useMemo(() => {
        if (!locationSlug || locationSlug === "all" || !pickupSpotsByLocation[locationSlug]) {
            return t(
                lang,
                "🛍️ SOLO PICK UP · Elige tu ciudad arriba · WhatsApp para apartar",
                "🛍️ PICKUP ONLY · Choose your city above · WhatsApp to reserve"
            );
        }

        const city = locationLabel(locationSlug);
        const spots = pickupSpotsByLocation[locationSlug] ?? [];
        const spotsText = spots.length ? spots.join(" · ") : t(lang, "Punto de pick up", "Pickup point");

        return t(
            lang,
            `🛍️ PICK UP ${city.toUpperCase()} · ${spotsText} · WhatsApp para apartar`,
            `🛍️ PICKUP ${city.toUpperCase()} · ${spotsText} · WhatsApp to reserve`
        );
    }, [lang, locationSlug]);


    type BannerTone = "black" | "red";

    const bannerTone: BannerTone = "black"; // switch to "red" any time

    const bannerClass =
        ({ black: "bg-black", red: "bg-red-600" } as const)[bannerTone];



    return (
        <header className={`sticky top-0 z-50 bg-white border-b border-slate-200 ${scrolled ? "shadow-sm" : ""}`}>
            {/* Pickup-only moving banner */}
            <div className={`w-full ${bannerClass} text-white`}>
                <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8">
                    <div className="relative overflow-hidden py-2">
                        {/* top/bottom subtle borders for "ecommerce" vibe */}
                        <div className="absolute inset-x-0 top-0 h-px bg-white/10" />
                        <div className="absolute inset-x-0 bottom-0 h-px bg-white/10" />

                        {/* Marquee */}
                        <div className="whitespace-nowrap">
                            <div className="inline-flex items-center gap-10 will-change-transform animate-marquee motion-reduce:animate-none">
          <span className="text-[12px] font-extrabold tracking-wide">
            {announcement}
          </span>
                                <span className="text-[12px] font-extrabold tracking-wide opacity-90">
            {announcement}
          </span>
                                <span className="text-[12px] font-extrabold tracking-wide opacity-80">
            {announcement}
          </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>


            <div className="mx-auto w-full max-w-screen-2xl px-4 sm:px-6 lg:px-8">
                {/* Top row */}
                <div className="relative h-16 flex items-center">
                    {/* Left (desktop): logo + Aguacatito.shop */}
                    <div className="hidden sm:flex items-center gap-3">
                        <button
                            type="button"
                            onClick={onHomeClick}
                            className="inline-flex items-center gap-3"
                            aria-label={t(lang, "Ir a inicio", "Go home")}
                        >
                            <div className="relative h-11 w-11">
                                <Image
                                    src="/og-v3.png"
                                    alt="Aguacatito"
                                    fill
                                    priority
                                    className="object-contain"
                                    sizes="44px"
                                />
                            </div>

                            <div className="flex flex-col leading-tight">
                <span className="text-[14px] font-black tracking-tight text-slate-900">
                  Aguacatito<span className="text-emerald-600">.shop</span>
                </span>
                                <span className="text-[11px] font-semibold text-slate-500">
                  {t(lang, "Compra por WhatsApp", "Shop via WhatsApp")}
                </span>
                            </div>
                        </button>
                    </div>

                    {/* Center (mobile): logo + Aguacatito.shop */}
                    <button
                        type="button"
                        onClick={onHomeClick}
                        className="absolute left-1/2 -translate-x-1/2 inline-flex sm:hidden items-center gap-2"
                        aria-label={t(lang, "Ir a inicio", "Go home")}
                    >
                        <div className="relative h-10 w-10">
                            <Image
                                src="/og-v3.png"
                                alt="Aguacatito"
                                fill
                                priority
                                className="object-contain"
                                sizes="40px"
                            />
                        </div>
                        <span className="text-[13px] font-black tracking-tight text-slate-900">
              Aguacatito<span className="text-emerald-600">.shop</span>
            </span>
                    </button>

                    {/* Center (desktop search only in catalog) */}
                    <div className="hidden sm:flex flex-1 justify-center px-6">
                        {showSearch ? (
                            <div className="w-full max-w-xl">
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔎</span>
                                    <input
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                        placeholder={t(lang, "Buscar modelo, color, ciudad…", "Search model, color, city…")}
                                        className="w-full rounded-2xl border border-slate-200 bg-white pl-9 pr-3 py-2 text-[12px] text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-200"
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="w-full max-w-xl" />
                        )}
                    </div>

                    {/* Right actions */}
                    <div className="flex flex-1 sm:flex-none justify-end items-center gap-2">
                        {/* Language (desktop) */}
                        <div className="hidden sm:flex rounded-full border border-slate-200 bg-white p-1">
                            <button
                                onClick={() => setLang("es")}
                                className={`px-3 py-1 text-[11px] font-extrabold rounded-full transition ${
                                    lang === "es" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-50"
                                }`}
                            >
                                ES
                            </button>
                            <button
                                onClick={() => setLang("en")}
                                className={`px-3 py-1 text-[11px] font-extrabold rounded-full transition ${
                                    lang === "en" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-50"
                                }`}
                            >
                                EN
                            </button>
                        </div>

                        {/* Cart */}
                        <button
                            type="button"
                            onClick={onCartClick}
                            className="relative inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-[12px] font-extrabold text-slate-900 shadow-sm hover:bg-slate-50"
                            aria-label={t(lang, "Abrir carrito", "Open cart")}
                        >
                            <CartIcon />
                            <span className="hidden sm:inline">{t(lang, "Carrito", "Cart")}</span>

                            {totalCartPairs > 0 && (
                                <span className="ml-1 inline-flex min-w-[20px] h-[20px] items-center justify-center rounded-full bg-emerald-600 px-1 text-[11px] font-extrabold text-white">
                  {totalCartPairs > 99 ? "99+" : totalCartPairs}
                </span>
                            )}
                        </button>
                    </div>
                </div>

                {/* Mobile search row (only in catalog) */}
                {showSearch ? (
                    <div className="sm:hidden pb-3">
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔎</span>
                            <input
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder={t(lang, "Buscar modelo, color, ciudad…", "Search model, color, city…")}
                                className="w-full rounded-2xl border border-slate-200 bg-white pl-9 pr-3 py-2 text-[12px] text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-200"
                            />
                        </div>
                    </div>
                ) : null}

                {/* ✅ Category tabs (catalog only) */}
                {showTabs ? (
                    <div className="pb-3">
                        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                            <Pill active={(categoryFilter ?? "all") === "all"} onClick={() => onSelectCategory?.("all")}>
                                {t(lang, "Todo", "All")}
                            </Pill>

                            {categories.map((c) => (
                                <Pill
                                    key={c.id}
                                    active={(categoryFilter ?? "all") === c.id}
                                    onClick={() => onSelectCategory?.(c.id)}
                                >
                                    {c.name}
                                </Pill>
                            ))}
                        </div>
                    </div>
                ) : null}
            </div>
        </header>
    );
}
