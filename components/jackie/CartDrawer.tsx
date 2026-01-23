"use client";

import type { CartLine, Lang, PublicItem } from "@/lib/jackieCatalogUtils";
import { t, translateColor } from "@/lib/jackieCatalogUtils";
import { track } from "@vercel/analytics";

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
}) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50">
            <button className="absolute inset-0 bg-black/40" onClick={onClose} aria-label={t(lang, "Cerrar", "Close")} />
            <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl border-l border-slate-200 flex flex-col">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                    <div>
                        <p className="text-sm font-semibold">{t(lang, "Carrito", "Cart")}</p>
                        <p className="text-[11px] text-slate-500">
                            {t(lang, `${totalCartPairs} artículo(s)`, `${totalCartPairs} item(s)`)}
                        </p>
                    </div>
                    <button className="h-9 w-9 rounded-full border border-slate-200 bg-white hover:bg-slate-50" onClick={onClose}>
                        ✕
                    </button>
                </div>

                <div className="p-4 flex-1 overflow-auto">
                    {cartLines.length === 0 ? (
                        <p className="text-sm text-slate-600">{t(lang, "Tu carrito está vacío.", "Your cart is empty.")}</p>
                    ) : (
                        <ul className="space-y-2">
                            {cartLines.map(({ item, count }, idx) => (
                                <li key={item.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-3 flex gap-2">
                                    <div className="flex-1">
                                        <p className="text-[12px] font-medium line-clamp-2">
                                            {idx + 1}. 📍 {item.location_name} · {translateColor(item.color, lang)} · {t(lang, "Talla", "Size")}{" "}
                                            {item.size}
                                        </p>
                                        <p className="text-[11px] text-slate-500">
                                            x{count} · ${item.price_mxn.toFixed(0)} MXN
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-1">
                                        <button onClick={() => onRemove(item.id)} className="h-8 w-8 rounded-full border border-slate-200 bg-white">
                                            –
                                        </button>
                                        <span className="w-6 text-center text-sm font-semibold">{count}</span>
                                        <button onClick={() => onAdd(item)} className="h-8 w-8 rounded-full border border-emerald-300 bg-white">
                                            +
                                        </button>
                                        <button onClick={() => onRemoveItem(item.id)} className="h-8 w-8 rounded-full border border-rose-300 bg-white">
                                            🗑️
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}

                    {isMixedCart && (
                        <p className="mt-3 text-[11px] text-red-500">
                            {t(
                                lang,
                                "Tu carrito tiene pares de diferentes ciudades. Haz un pedido por ciudad.",
                                "Your cart has items from different cities. Please create one order per city."
                            )}
                        </p>
                    )}
                </div>

                <div className="p-4 border-t border-slate-100 space-y-2">
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
                        className={`w-full inline-flex items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-semibold transition ${
                            hasCartWhatsApp ? "bg-emerald-500 text-white hover:bg-emerald-400" : "bg-slate-200 text-slate-500 cursor-not-allowed"
                        }`}
                    >
                        📲 {t(lang, "Enviar por WhatsApp", "Send on WhatsApp")}
                    </a>

                    <button
                        onClick={clearCart}
                        className="w-full inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm"
                    >
                        🗑️ {t(lang, "Vaciar carrito", "Clear cart")}
                    </button>
                </div>
            </div>
        </div>
    );
}
