"use client";

import React, { useEffect, useMemo } from "react";
import type { CartLine, Lang, PublicItem } from "@/lib/jackieCatalogUtils";
import { t, translateColor, formatSizeLabel } from "@/lib/jackieCatalogUtils";
import { track } from "@vercel/analytics";
import Image from "next/image";

function moneyMXN(n: number) {
    // 1400 -> $1,400 MXN (no decimals)
    try {
        return new Intl.NumberFormat("es-MX", {
            style: "currency",
            currency: "MXN",
            maximumFractionDigits: 0,
        }).format(n);
    } catch {
        return `$${n.toFixed(0)} MXN`;
    }
}

export function CartDrawer({
                               open,
                               onClose,
                               lang,
                               cartLines,
                               totalCartPairs,
                               isMixedCart,
                               waLinkForCart,
                               hasCartWhatsApp,
                               clearCart,
                               onAdd,
                               onRemove,
                               onRemoveItem,
                               cartLocationSlug,
                               getPhotoForCartItem,
                           }: {
    open: boolean;
    onClose: () => void;
    lang: Lang;
    cartLines: CartLine[];
    totalCartPairs: number;
    isMixedCart: boolean;
    waLinkForCart: string;
    hasCartWhatsApp: boolean;
    clearCart: () => void;
    onAdd: (item: PublicItem) => void;
    onRemove: (itemId: string) => void;
    onRemoveItem: (itemId: string) => void;
    cartLocationSlug: string;
    getPhotoForCartItem: (item: PublicItem) => { src: string; label: string };
}) {
    // ✅ 1) Lock background scroll while cart is open
    useEffect(() => {
        if (!open) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = prev;
        };
    }, [open]);

    const subtotal = useMemo(() => {
        return cartLines.reduce((sum, { item, count }) => sum + item.price_mxn * count, 0);
    }, [cartLines]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50">
            {/* overlay */}
            <button
                className="absolute inset-0 bg-black/40"
                onClick={onClose}
                aria-label={t(lang, "Cerrar", "Close")}
            />

            {/* drawer */}
            <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl border-l border-slate-200 flex flex-col">
                {/* header */}
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                    <div>
                        <p className="text-sm font-extrabold text-slate-900">
                            {t(lang, "Carrito", "Cart")}
                        </p>
                        <p className="text-[11px] text-slate-500">
                            {t(lang, `${totalCartPairs} artículo(s)`, `${totalCartPairs} item(s)`)}
                        </p>
                    </div>

                    <button
                        className="h-9 w-9 rounded-full border border-slate-200 bg-white hover:bg-slate-50"
                        onClick={onClose}
                        aria-label={t(lang, "Cerrar", "Close")}
                    >
                        ✕
                    </button>
                </div>

                {/* content */}
                <div className="p-4 flex-1 overflow-auto">
                    {cartLines.length === 0 ? (
                        <div className="rounded-3xl border border-slate-200 bg-white p-5">
                            <p className="text-sm font-semibold text-slate-900">
                                {t(lang, "Tu carrito está vacío.", "Your cart is empty.")}
                            </p>
                            <p className="mt-1 text-[12px] text-slate-600">
                                {t(
                                    lang,
                                    "Elige un producto para ver tallas y agregarlo.",
                                    "Pick a product to view sizes and add it."
                                )}
                            </p>

                            <button
                                onClick={onClose}
                                className="mt-4 inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                            >
                                {t(lang, "Seguir comprando", "Continue shopping")}
                            </button>
                        </div>
                    ) : (
                        <ul className="space-y-3">
                            {cartLines.map(({ item, count }) => (
                                <li
                                    key={item.id}
                                    className="rounded-3xl border border-slate-200 bg-white p-4"
                                >
                                    {/* top row */}
                                    <div className="flex items-start gap-3">
                                        {/* Thumbnail */}
                                        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                                            <Image
                                                src={getPhotoForCartItem(item).src}
                                                alt={getPhotoForCartItem(item).label || item.model_name || "Product"}
                                                fill
                                                className="object-cover"
                                                sizes="64px"
                                            />
                                        </div>

                                        {/* Content + remove */}
                                        <div className="flex min-w-0 flex-1 items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <p className="text-[13px] font-extrabold text-slate-900 line-clamp-1">
                                                    {item.model_name ?? t(lang, "Producto", "Product")}
                                                </p>

                                                <p className="mt-1 text-[11px] text-slate-600 flex flex-wrap items-center gap-x-2 gap-y-1">
                                                    <span>📍 {item.location_name}</span>
                                                    <span className="text-slate-300">•</span>
                                                    <span>{translateColor(item.color, lang)}</span>
                                                    <span className="text-slate-300">•</span>
                                                    <span>
          {t(lang, "Talla", "Size")}:{" "}
                                                        <span className="font-semibold text-slate-800">
            {formatSizeLabel(item.size, lang)}
          </span>
        </span>
                                                </p>

                                                <div className="mt-2 flex items-baseline gap-2">
        <span className="text-[12px] font-semibold text-slate-700">
          {moneyMXN(item.price_mxn)}
        </span>
                                                    <span className="text-[11px] text-slate-400">× {count}</span>
                                                </div>
                                            </div>

                                            <button
                                                onClick={() => onRemoveItem(item.id)}
                                                className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-[11px] font-semibold text-rose-700 hover:bg-rose-100"
                                                aria-label={t(lang, "Quitar", "Remove")}
                                            >
                                                🗑️ {t(lang, "Quitar", "Remove")}
                                            </button>
                                        </div>
                                    </div>


                                    {/* ✅ subtle divider */}
                                    <div className="mt-4 border-t border-slate-100 pt-4 flex items-center justify-between">
                                        {/* quantity controls */}
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => onRemove(item.id)}
                                                className="h-9 w-9 rounded-full border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                                                aria-label={t(lang, "Restar", "Decrease")}
                                            >
                                                –
                                            </button>

                                            <span className="min-w-[32px] text-center text-sm font-extrabold text-slate-900">
                        {count}
                      </span>

                                            <button
                                                onClick={() => onAdd(item)}
                                                className="h-9 w-9 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                                                aria-label={t(lang, "Sumar", "Increase")}
                                            >
                                                +
                                            </button>
                                        </div>

                                        {/* line total */}
                                        <div className="text-right">
                                            <p className="text-[10px] text-slate-500">
                                                {t(lang, "Total", "Total")}
                                            </p>
                                            <p className="text-sm font-extrabold text-slate-900">
                                                {moneyMXN(item.price_mxn * count)}
                                            </p>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}

                    {isMixedCart && cartLines.length > 0 && (
                        <p className="mt-4 text-[11px] text-rose-600">
                            {t(
                                lang,
                                "Tu carrito tiene pares de diferentes ciudades. Haz un pedido por ciudad.",
                                "Your cart has items from different cities. Please create one order per city."
                            )}
                        </p>
                    )}
                </div>

                {/* footer */}
                <div className="p-4 border-t border-slate-100 space-y-3">
                    <div className="flex items-center justify-between">
                        <p className="text-[12px] text-slate-600">{t(lang, "Subtotal", "Subtotal")}</p>
                        {/* ✅ stronger subtotal */}
                        <p className="text-base font-extrabold text-slate-900">
                            {moneyMXN(subtotal)}
                        </p>
                    </div>

                    <a
                        href={hasCartWhatsApp ? waLinkForCart : "#"}
                        target={hasCartWhatsApp ? "_blank" : undefined}
                        rel={hasCartWhatsApp ? "noopener noreferrer" : undefined}
                        onClick={(e) => {
                            if (!hasCartWhatsApp) {
                                e.preventDefault();
                                return;
                            }
                            track("whatsapp_click_cart", {
                                count: totalCartPairs,
                                lang,
                                ui_location: "cart_drawer",
                                cart_location_slug: cartLocationSlug,
                            });
                        }}
                        className={`w-full inline-flex items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-extrabold transition ${
                            hasCartWhatsApp
                                ? "bg-emerald-600 text-white hover:bg-emerald-700"
                                : "bg-slate-200 text-slate-500 cursor-not-allowed"
                        }`}
                    >
                        📲 {t(lang, "Enviar por WhatsApp", "Send on WhatsApp")}
                    </a>

                    {/* ✅ microcopy */}
                    <p className="text-[10px] text-slate-500 text-center">
                        {t(lang, "Te responderemos por WhatsApp.", "We’ll reply via WhatsApp.")}
                    </p>

                    <button
                        onClick={clearCart}
                        className="w-full inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                    >
                        🗑️ {t(lang, "Vaciar carrito", "Clear cart")}
                    </button>
                </div>
            </div>
        </div>
    );
}
