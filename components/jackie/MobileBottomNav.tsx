"use client";

import React from "react";
import type { Lang } from "@/lib/jackieCatalogUtils";
import { t } from "@/lib/jackieCatalogUtils";

export function MobileBottomNav({
                                    show,
                                    view,
                                    lang,
                                    cartCount,
                                    onHome,
                                    onCatalog,
                                    onCart,
                                    onHelp,
                                }: {
    show: boolean;
    view: "home" | "catalog" | "help";
    lang: Lang;
    cartCount: number;
    onHome: () => void;
    onCatalog: () => void;
    onCart: () => void;
    onHelp: () => void;
}) {
    if (!show) return null;

    const Item = ({
                      active,
                      label,
                      icon,
                      onClick,
                      badge,
                  }: {
        active: boolean;
        label: string;
        icon: React.ReactNode;
        onClick: () => void;
        badge?: number;
    }) => (
        <button
            type="button"
            onClick={onClick}
            className={`relative flex flex-1 flex-col items-center justify-center gap-1 py-2 text-[11px] font-semibold transition ${
                active ? "text-emerald-700" : "text-slate-500"
            }`}
            aria-current={active ? "page" : undefined}
        >
      <span
          className={`grid h-9 w-9 place-items-center rounded-2xl border transition ${
              active ? "bg-emerald-50 border-emerald-200" : "bg-white border-slate-200"
          }`}
      >
        <span className="text-lg leading-none">{icon}</span>
      </span>
            <span>{label}</span>

            {typeof badge === "number" && badge > 0 && (
                <span className="absolute top-1 right-6 min-w-[18px] h-[18px] px-1 rounded-full bg-emerald-600 text-white text-[10px] font-bold grid place-items-center">
          {badge > 99 ? "99+" : badge}
        </span>
            )}
        </button>
    );

    return (
        <>
            <div className="h-24 lg:hidden" />

            <div className="fixed inset-x-0 bottom-0 z-[60] lg:hidden pb-[env(safe-area-inset-bottom)]">
                <div className="mx-auto w-full max-w-md md:max-w-2xl px-4">
                    <div className="rounded-t-3xl border border-slate-200 bg-white/95 backdrop-blur shadow-[0_-12px_40px_rgba(15,23,42,0.16)]">
                        <div className="flex items-stretch px-2 py-2">
                            <Item
                                active={view === "home"}
                                label={t(lang, "Inicio", "Home")}
                                icon="🏠"
                                onClick={onHome}
                            />
                            <Item
                                active={view === "catalog"}
                                label={t(lang, "Catálogo", "Catalog")}
                                icon="🛍️"
                                onClick={onCatalog}
                            />
                            <Item
                                active={view === "help"}
                                label={t(lang, "Ayuda", "Help")}
                                icon="❓"
                                onClick={onHelp}
                            />
                            <Item
                                active={false}
                                label={t(lang, "Carrito", "Cart")}
                                icon="🧺"
                                onClick={onCart}
                                badge={cartCount}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
