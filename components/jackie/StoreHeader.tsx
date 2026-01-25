"use client";

import type { Lang } from "@/lib/jackieCatalogUtils";
import { t } from "@/lib/jackieCatalogUtils";

export function StoreHeader({
                                lang,
                                setLang,
                                subtitle,
                                query,
                                setQuery,
                                totalCartPairs,
                                onCartClick,
                                onHomeClick, // ✅ NEW
                            }: {
    lang: Lang;
    setLang: (l: Lang) => void;
    subtitle: string;
    query: string;
    setQuery: (v: string) => void;
    totalCartPairs: number;
    onCartClick: () => void;
    onHomeClick: () => void; // ✅ NEW
}) {
    return (
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
            <div className="mx-auto max-w-6xl px-4 py-3 flex items-center gap-3">
                {/* ✅ CLICKABLE LOGO / TITLE */}
                <button
                    type="button"
                    onClick={onHomeClick}
                    className="flex items-center gap-2 min-w-[150px] text-left rounded-xl hover:bg-slate-100 px-1 py-1 transition focus:outline-none focus:ring-2 focus:ring-emerald-200"
                    aria-label={t(lang, "Ir a inicio", "Go to home")}
                >
                    <div className="h-9 w-9 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                        👟
                    </div>
                    <div className="leading-tight">
                        <p className="text-sm font-semibold">Jacky Wear</p>
                        <p className="text-[11px] text-slate-500 line-clamp-1">{subtitle}</p>
                    </div>
                </button>

                {/* SEARCH */}
                <div className="flex-1">
                    <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder={t(lang, "Buscar (modelo, color…)", "Search (model, color…)")}
                        className="w-full rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400"
                    />
                </div>

                {/* CART */}
                <button
                    type="button"
                    onClick={onCartClick}
                    className="relative inline-flex items-center justify-center h-10 w-10 rounded-full border border-slate-200 bg-white hover:bg-slate-50"
                    aria-label={t(lang, "Abrir carrito", "Open cart")}
                >
                    🧺
                    {totalCartPairs > 0 && (
                        <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[11px] flex items-center justify-center">
              {totalCartPairs > 9 ? "9+" : totalCartPairs}
            </span>
                    )}
                </button>

                {/* LANG SWITCH */}
                <div className="inline-flex items-center rounded-full border border-slate-200 bg-slate-100 p-0.5 text-[11px]">
                    <button
                        type="button"
                        onClick={() => setLang("es")}
                        className={`px-2.5 py-1 rounded-full ${
                            lang === "es"
                                ? "bg-white shadow-sm text-slate-900"
                                : "text-slate-600 hover:text-slate-900"
                        }`}
                    >
                        ES
                    </button>
                    <button
                        type="button"
                        onClick={() => setLang("en")}
                        className={`px-2.5 py-1 rounded-full ${
                            lang === "en"
                                ? "bg-white shadow-sm text-slate-900"
                                : "text-slate-600 hover:text-slate-900"
                        }`}
                    >
                        EN
                    </button>
                </div>
            </div>
        </header>
    );
}
