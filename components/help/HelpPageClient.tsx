"use client";

import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import {
    buildWhatsAppSupportLink,
    buildWhatsAppLink,
    getCartLocationInfo,
    Lang,
    t,
    type CartLine,
    type PublicItem,
} from "@/lib/jackieCatalogUtils";

import { StoreHeader } from "@/components/layout/StoreHeader";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { SizeGuide } from "@/components/help/SizeGuide";
import { StoreFooter } from "@/components/layout/StoreFooter";
import { CartDrawer } from "@/components/catalog/CartDrawer";
import { supabase } from "@/lib/supabaseClient";
import { useCart } from "@/components/store/CartProvider";

import {
    VISIBLE_LOCATION_SLUGS,
    PICKUP_SPOTS_BY_LOCATION,
    MEX_BANK_INFO,
    PLACEHOLDER_IMAGE,
    type LocationSlug,
    isLocationSlug,
} from "@/components/store/storeConstants";

import {
    subscribeCart,
    countCartPairs,
    requestOpenCart,
    readCart,
} from "@/components/store/storeClient";

import {
    MapPin,
    MessageCircle,
    ArrowUpRight,
    CreditCard,
    HelpCircle,
} from "lucide-react";

function mapsSearchLink(q: string) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        q
    )}`;
}

function prettyCity(slug: string) {
    if (slug === "tijuana") return "Tijuana";
    if (slug === "mexicali") return "Mexicali";
    if (slug === "hermosillo_sonora") return "Hermosillo";
    return slug.replaceAll("_", " ");
}

function PremiumCard({
                         children,
                         className = "",
                     }: {
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <section
            className={`rounded-[28px] border border-slate-200 bg-white/90 backdrop-blur
      shadow-[0_14px_50px_rgba(15,23,42,0.08)] ${className}`}
        >
            {children}
        </section>
    );
}

function SectionTitle({
                          eyebrow,
                          title,
                          subtitle,
                          icon,
                      }: {
    eyebrow?: string;
    title: React.ReactNode;
    subtitle?: React.ReactNode;
    icon?: React.ReactNode;
}) {
    return (
        <div className="flex items-start gap-3">
            {icon ? (
                <div className="mt-0.5 grid h-9 w-9 place-items-center rounded-2xl border border-slate-200 bg-white shadow-sm">
                    {icon}
                </div>
            ) : null}

            <div className="space-y-1">
                {eyebrow ? (
                    <p className="text-[11px] font-extrabold tracking-[0.18em] uppercase text-slate-500">
                        {eyebrow}
                    </p>
                ) : null}
                <h2 className="text-[15px] sm:text-[16px] font-extrabold tracking-tight text-slate-900">
                    {title}
                </h2>
                {subtitle ? (
                    <p className="text-[12px] text-slate-600 leading-relaxed">{subtitle}</p>
                ) : null}
            </div>
        </div>
    );
}

function FaqItem({ q, a }: { q: React.ReactNode; a: React.ReactNode }) {
    return (
        <details className="group rounded-2xl border border-slate-200 bg-white/85 backdrop-blur overflow-hidden shadow-[0_1px_0_rgba(15,23,42,0.04)]">
            <summary className="cursor-pointer list-none px-4 py-3 flex items-center justify-between gap-3">
                <div className="text-[13px] font-extrabold text-slate-900">{q}</div>
                <div className="text-slate-500 text-sm group-open:hidden">+</div>
                <div className="text-slate-500 text-sm hidden group-open:block">–</div>
            </summary>
            <div className="px-4 pb-4 text-[13px] text-slate-700 leading-relaxed">
                {a}
            </div>
        </details>
    );
}

function ActionTile({
                        title,
                        subtitle,
                        icon,
                        onClick,
                        href,
                        tone = "neutral",
                    }: {
    title: string;
    subtitle: string;
    icon: React.ReactNode;
    onClick?: () => void;
    href?: string;
    tone?: "neutral" | "emerald";
}) {
    const base =
        "rounded-2xl border px-4 py-3 text-left shadow-sm transition flex items-center gap-3";
    const styles =
        tone === "emerald"
            ? "border-emerald-200 bg-emerald-50 hover:bg-emerald-100/60"
            : "border-slate-200 bg-white hover:bg-slate-50";

    const inner = (
        <>
            <div className="grid h-9 w-9 place-items-center rounded-2xl border border-slate-200 bg-white">
                {icon}
            </div>
            <div className="min-w-0">
                <p
                    className={`text-[12px] font-extrabold ${
                        tone === "emerald" ? "text-emerald-950" : "text-slate-900"
                    }`}
                >
                    {title}
                </p>
                <p
                    className={`mt-0.5 text-[11px] ${
                        tone === "emerald" ? "text-emerald-900/70" : "text-slate-600"
                    }`}
                >
                    {subtitle}
                </p>
            </div>
            <div className="ml-auto text-slate-400">
                <ArrowUpRight className="h-4 w-4" />
            </div>
        </>
    );

    if (href) {
        return (
            <a href={href} className={`${base} ${styles}`}>
                {inner}
            </a>
        );
    }

    return (
        <button type="button" onClick={onClick} className={`${base} ${styles}`}>
            {inner}
        </button>
    );
}

export default function HelpPageClient() {
    const router = useRouter();
    const sp = useSearchParams();

    const lang = ((sp.get("lang") as Lang) || "es") as Lang;
    const rawLoc = sp.get("loc") || "all";
    const loc: "all" | LocationSlug =
        rawLoc === "all" ? "all" : isLocationSlug(rawLoc) ? rawLoc : "all";

    const [query, setQuery] = useState("");
    const [cartOpen, setCartOpen] = useState(false);

    // ✅ OPTIMIZATION: Memoize computed values
    const supportWaLink = useMemo(() => buildWhatsAppSupportLink(lang, loc), [lang, loc]);

    const visibleCities = useMemo<LocationSlug[]>(() => {
        if (loc !== "all") return [loc];
        return [...VISIBLE_LOCATION_SLUGS];
    }, [loc]);

    // ✅ OPTIMIZATION: Memoize navigation callbacks
    const openCatalog = useCallback(() => {
        router.push(`/?view=catalog&lang=${lang}&loc=${loc}`);
    }, [router, lang, loc]);

    const openHome = useCallback(() => {
        router.push(`/?view=home&lang=${lang}&loc=${loc}`);
    }, [router, lang, loc]);

    const openHelp = useCallback(() => {
        router.push(`/help?lang=${lang}&loc=${loc}`);
    }, [router, lang, loc]);

    const openCart = useCallback(() => {
        setCartOpen(true);
    }, []);

    const closeCart = useCallback(() => {
        setCartOpen(false);
    }, []);

    // ✅ Get cart data from shared provider
    const {
        cartLines,
        totalCartPairs,
        isMixedCart,
        waLinkForCart,
        hasCartWhatsApp,
        cartLocationSlug,
        addToCart: handleAddToCart,
        removeFromCart: handleRemoveFromCart,
        removeItem: removeItemFromCart,
        clearCart,
        getPhotoForItem,
    } = useCart();

    const cartCount = totalCartPairs;

    // ✅ OPTIMIZATION: Memoize FAQ data
    const faq = useMemo(() => {
        return [
            {
                q: t(lang, "¿Cómo aparto un par?", "How do I reserve a pair?"),
                a: t(
                    lang,
                    "Agrega al carrito y envía tu pedido por WhatsApp. Te confirmamos disponibilidad y pick up.",
                    "Add to cart and send your order via WhatsApp. We'll confirm availability and pickup."
                ),
            },
            {
                q: t(lang, "¿Hacen envíos?", "Do you ship?"),
                a: t(
                    lang,
                    "Por ahora es SOLO pick up. El catálogo cambia por ciudad.",
                    "For now it's PICKUP ONLY. Catalog changes by city."
                ),
            },
            {
                q: t(
                    lang,
                    "¿Qué pasa si mi carrito tiene varias ciudades?",
                    "What if my cart has multiple cities?"
                ),
                a: t(
                    lang,
                    "Te recomendamos ordenar por ciudad (pick up). Si mezclas, WhatsApp no se habilita para evitar errores.",
                    "We recommend ordering per city (pickup). If mixed, WhatsApp checkout is disabled to avoid mistakes."
                ),
            },
        ];
    }, [lang]);

    // ✅ OPTIMIZATION: Memoize scroll handlers
    const scrollToPickup = useCallback(() => {
        document
            .getElementById("pickup")
            ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, []);

    const scrollToPayment = useCallback(() => {
        document
            .getElementById("payment")
            ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, []);

    const scrollToSizing = useCallback(() => {
        document
            .getElementById("sizing")
            ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, []);

    const setLangCallback = useCallback((l: Lang) => {
        router.push(`/help?lang=${l}&loc=${loc}`);
    }, [router, loc]);

    return (
        <div className="min-h-screen bg-white text-slate-900">
            {/* premium background glow */}
            <div className="pointer-events-none fixed inset-0 -z-10">
                <div className="absolute -top-40 left-1/2 h-96 w-[900px] -translate-x-1/2 rounded-full bg-slate-100/70 blur-3xl" />
                <div className="absolute top-52 left-1/4 h-72 w-[700px] -translate-x-1/2 rounded-full bg-slate-200/35 blur-3xl" />
                <div className="absolute -bottom-48 right-[-120px] h-96 w-96 rounded-full bg-slate-100/60 blur-3xl" />
            </div>

            {/* Header */}
            <div className="mx-auto w-full max-w-none px-3 sm:px-6 lg:px-10 2xl:px-14">
                <StoreHeader
                    lang={lang}
                    setLang={setLangCallback}
                    query={query}
                    setQuery={setQuery}
                    totalCartPairs={cartCount}
                    onCartClick={openCart}
                    onHomeClick={openHome}
                    view="help"
                    categories={[]}
                    categoryFilter="all"
                    onSelectCategory={undefined}
                    locationSlug={loc}
                />
            </div>

            <main className="mx-auto w-full max-w-screen-2xl px-4 sm:px-6 lg:px-10 py-6 lg:py-10">
                {/* HERO */}
                <PremiumCard className="overflow-hidden">
                    <div className="p-5 sm:p-6 lg:p-8">
                        <div className="space-y-2">
                            <p className="text-[11px] font-extrabold tracking-[0.18em] uppercase text-slate-500">
                                {t(lang, "Ayuda", "Help")}
                            </p>
                            <h1 className="text-[22px] sm:text-[28px] lg:text-[32px] font-extrabold tracking-tight text-slate-900 leading-[1.08]">
                                {t(lang, "Todo para comprar fácil", "Everything to buy easily")}
                            </h1>
                            <p className="text-[13px] text-slate-600 max-w-[64ch] leading-relaxed">
                                {t(
                                    lang,
                                    "Pick up, pago y soporte. Sin ruido, sin confusión.",
                                    "Pickup, payment, and support. Clean and simple."
                                )}
                            </p>
                        </div>

                        {/* Premium tiles */}
                        <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
                            <ActionTile
                                title="WhatsApp"
                                subtitle={t(lang, "Soporte rápido", "Fast support")}
                                icon={<MessageCircle className="h-4 w-4 text-emerald-700" />}
                                href={supportWaLink}
                                tone="emerald"
                            />

                            <ActionTile
                                title={t(lang, "Pick up", "Pickup")}
                                subtitle={t(lang, "Ver ubicaciones", "View locations")}
                                icon={<MapPin className="h-4 w-4 text-slate-700" />}
                                onClick={scrollToPickup}
                            />

                            <ActionTile
                                title={t(lang, "Pago", "Payment")}
                                subtitle={t(lang, "Transferencia", "Bank transfer")}
                                icon={<CreditCard className="h-4 w-4 text-slate-700" />}
                                onClick={scrollToPayment}
                            />

                            <ActionTile
                                title={t(lang, "Tallas", "Sizing")}
                                subtitle={t(lang, "Guía de tallas", "Size guide")}
                                icon={<CreditCard className="h-4 w-4 text-slate-700" />}
                                onClick={scrollToSizing}
                            />
                        </div>
                    </div>
                </PremiumCard>

                {/* Layout */}
                <div className="mt-6 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-4 lg:gap-6">
                    {/* LEFT */}
                    <div className="space-y-4 lg:space-y-6">
                        {/* PICKUP */}
                        <PremiumCard>
                            <div id="pickup" className="p-5 sm:p-6">
                                <SectionTitle
                                    eyebrow={t(lang, "Pick up", "Pickup")}
                                    title={t(lang, "Ubicaciones de pick up", "Pickup locations")}
                                    subtitle={t(lang, "Mapas + WhatsApp por ciudad.", "Maps + WhatsApp per city.")}
                                    icon={<MapPin className="h-4 w-4 text-slate-800" />}
                                />

                                {/* Mobile accordions */}
                                <div className="mt-4 space-y-3 lg:hidden">
                                    {visibleCities.map((slug) => {
                                        const spots = PICKUP_SPOTS_BY_LOCATION[slug] ?? [];
                                        const waCity = buildWhatsAppSupportLink(lang, slug);

                                        return (
                                            <details
                                                key={slug}
                                                className="group rounded-2xl border border-slate-200 bg-white overflow-hidden"
                                            >
                                                <summary className="cursor-pointer list-none px-4 py-3 flex items-center justify-between gap-3">
                                                    <div className="min-w-0">
                                                        <p className="text-[12px] font-extrabold text-slate-900">
                                                            {prettyCity(slug)}
                                                        </p>
                                                        <p className="text-[11px] text-slate-600 truncate">
                                                            {spots.map((s) => s.name).join(" · ")}
                                                        </p>
                                                    </div>
                                                    <div className="text-slate-500 text-sm group-open:hidden">+</div>
                                                    <div className="text-slate-500 text-sm hidden group-open:block">–</div>
                                                </summary>

                                                <div className="px-4 pb-4 space-y-3">
                                                    {spots.map((spot, idx) => (
                                                        <div key={idx} className="space-y-2">
                                                            <p className="text-[12px] font-extrabold text-slate-900">
                                                                {spot.name}
                                                            </p>
                                                            {spot.addressHint && (
                                                                <p className="text-[11px] text-slate-600 leading-relaxed">
                                                                    {spot.addressHint}
                                                                </p>
                                                            )}
                                                            <div className="flex gap-2">
                                                                <a
                                                                    href={mapsSearchLink(spot.name)}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-extrabold text-slate-700 hover:bg-slate-50 transition"
                                                                >
                                                                    <MapPin className="h-3 w-3" />
                                                                    {t(lang, "Ver mapa", "View map")}
                                                                </a>
                                                                <a
                                                                    href={waCity}
                                                                    className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[11px] font-extrabold text-emerald-800 hover:bg-emerald-100/60 transition"
                                                                >
                                                                    <MessageCircle className="h-3 w-3" />
                                                                    WhatsApp
                                                                </a>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </details>
                                        );
                                    })}
                                </div>

                                {/* Desktop grid */}
                                <div className="mt-4 hidden lg:grid lg:grid-cols-2 gap-4">
                                    {visibleCities.map((slug) => {
                                        const spots = PICKUP_SPOTS_BY_LOCATION[slug] ?? [];
                                        const waCity = buildWhatsAppSupportLink(lang, slug);

                                        return (
                                            <div
                                                key={slug}
                                                className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <p className="text-[13px] font-extrabold text-slate-900">
                                                        {prettyCity(slug)}
                                                    </p>
                                                    <a
                                                        href={waCity}
                                                        className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[10px] font-extrabold text-emerald-800 hover:bg-emerald-100/60 transition"
                                                    >
                                                        <MessageCircle className="h-3 w-3" />
                                                        WhatsApp
                                                    </a>
                                                </div>

                                                <div className="space-y-3">
                                                    {spots.map((spot, idx) => (
                                                        <div key={idx} className="space-y-1.5">
                                                            <p className="text-[12px] font-extrabold text-slate-900">
                                                                {spot.name}
                                                            </p>
                                                            {spot.addressHint && (
                                                                <p className="text-[11px] text-slate-600 leading-relaxed">
                                                                    {spot.addressHint}
                                                                </p>
                                                            )}
                                                            <a
                                                                href={mapsSearchLink(spot.name)}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="inline-flex items-center gap-1.5 text-[11px] font-extrabold text-emerald-700 hover:underline"
                                                            >
                                                                <MapPin className="h-3 w-3" />
                                                                {t(lang, "Ver en Maps", "View on Maps")}
                                                            </a>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </PremiumCard>

                        {/* PAYMENT */}
                        <PremiumCard>
                            <div id="payment" className="p-5 sm:p-6">
                                <SectionTitle
                                    eyebrow={t(lang, "Pago", "Payment")}
                                    title={t(lang, "Cómo apartar tu pedido", "How to reserve your order")}
                                    subtitle={t(
                                        lang,
                                        "Transferencia bancaria en México.",
                                        "Bank transfer in Mexico."
                                    )}
                                    icon={<CreditCard className="h-4 w-4 text-slate-800" />}
                                />

                                <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
                                    <div className="space-y-3">
                                        <div>
                                            <p className="text-[11px] font-extrabold tracking-wide uppercase text-slate-500">
                                                {t(lang, "Banco", "Bank")}
                                            </p>
                                            <p className="mt-0.5 text-[13px] font-extrabold text-slate-900">
                                                {MEX_BANK_INFO.bankName}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-[11px] font-extrabold tracking-wide uppercase text-slate-500">
                                                {t(lang, "Titular", "Account holder")}
                                            </p>
                                            <p className="mt-0.5 text-[13px] font-extrabold text-slate-900">
                                                {MEX_BANK_INFO.accountName}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-[11px] font-extrabold tracking-wide uppercase text-slate-500">
                                                {t(lang, "Cuenta", "Account Number")}
                                            </p>
                                            <p className="mt-0.5 text-[13px] font-mono font-extrabold text-slate-900 tracking-wider">
                                                {MEX_BANK_INFO.accountNumber}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-4 rounded-2xl border border-slate-200 bg-white/80 p-4">
                                    <div className="flex items-start gap-3">
                                        <div className="mt-0.5 grid h-6 w-6 place-items-center rounded-full bg-slate-100 text-slate-800 text-[11px] font-extrabold flex-shrink-0">
                                            1
                                        </div>
                                        <div>
                                            <p className="text-[12px] font-extrabold text-slate-900">
                                                {t(lang, "Envía tu pedido por WhatsApp", "Send your order via WhatsApp")}
                                            </p>
                                            <p className="mt-0.5 text-[11px] text-slate-600 leading-relaxed">
                                                {t(
                                                    lang,
                                                    "Agrega al carrito y presiona 'Enviar por WhatsApp'.",
                                                    "Add to cart and press 'Send via WhatsApp'."
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-2 rounded-2xl border border-slate-200 bg-white/80 p-4">
                                    <div className="flex items-start gap-3">
                                        <div className="mt-0.5 grid h-6 w-6 place-items-center rounded-full bg-slate-100 text-slate-800 text-[11px] font-extrabold flex-shrink-0">
                                            2
                                        </div>
                                        <div>
                                            <p className="text-[12px] font-extrabold text-slate-900">
                                                {t(
                                                    lang,
                                                    "Haz la transferencia y envía tu comprobante",
                                                    "Make the transfer and send your receipt"
                                                )}
                                            </p>
                                            <p className="mt-0.5 text-[11px] text-slate-600 leading-relaxed">
                                                {t(
                                                    lang,
                                                    "Después manda tu comprobante por WhatsApp para confirmar tu apartado.",
                                                    "Then send your receipt via WhatsApp so we can confirm your reservation."
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </PremiumCard>

                        {/* FAQ */}
                        <PremiumCard>
                            <div className="p-5 sm:p-6">
                                <SectionTitle
                                    eyebrow="FAQ"
                                    title={t(lang, "Preguntas frecuentes", "Frequently asked questions")}
                                    subtitle={t(lang, "Respuestas rápidas.", "Quick answers.")}
                                    icon={<HelpCircle className="h-4 w-4 text-slate-800" />}
                                />

                                <div className="mt-4 space-y-2">
                                    {faq.map((f, idx) => (
                                        <FaqItem key={idx} q={f.q} a={f.a} />
                                    ))}
                                </div>
                            </div>
                        </PremiumCard>

                        {/* SIZE GUIDE AT THE END */}
                        <PremiumCard>
                            <div id="sizing" className="p-5 sm:p-6">
                                <SectionTitle
                                    eyebrow={t(lang, "Tallas", "Sizing")}
                                    title={t(lang, "Guía de tallas", "Size guide")}
                                    subtitle={t(lang, "Revisa la guía completa aquí.", "See the full guide here.")}
                                    icon={<MapPin className="h-4 w-4 text-slate-800" />}
                                />
                                <div id="size" className="mt-6">
                                    <SizeGuide lang={lang} />
                                </div>
                            </div>
                        </PremiumCard>
                    </div>

                    {/* RIGHT: desktop sticky quick links */}
                    <aside className="hidden lg:block">
                        <div className="sticky top-24 space-y-4">
                            <PremiumCard className="bg-white/80">
                                <div className="p-5">
                                    <p className="text-[12px] font-extrabold text-slate-900">
                                        {t(lang, "Accesos rápidos", "Quick links")}
                                    </p>

                                    <div className="mt-3 space-y-2">
                                        <a
                                            href={supportWaLink}
                                            className="flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 hover:bg-emerald-100/60 transition"
                                        >
                                            <div>
                                                <p className="text-[12px] font-extrabold text-emerald-950">
                                                    WhatsApp
                                                </p>
                                                <p className="text-[11px] text-emerald-900/70">
                                                    {t(lang, "Soporte", "Support")}
                                                </p>
                                            </div>
                                            <ArrowUpRight className="h-4 w-4 text-emerald-900" />
                                        </a>

                                        <button
                                            type="button"
                                            onClick={scrollToPickup}
                                            className="w-full flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 hover:bg-slate-50 transition"
                                        >
                                            <div className="text-left">
                                                <p className="text-[12px] font-extrabold text-slate-900">
                                                    {t(lang, "Pick up", "Pickup")}
                                                </p>
                                                <p className="text-[11px] text-slate-600">
                                                    {t(lang, "Ubicaciones", "Locations")}
                                                </p>
                                            </div>
                                            <ArrowUpRight className="h-4 w-4 text-slate-500" />
                                        </button>

                                        <button
                                            type="button"
                                            onClick={scrollToPayment}
                                            className="w-full flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 hover:bg-slate-50 transition"
                                        >
                                            <div className="text-left">
                                                <p className="text-[12px] font-extrabold text-slate-900">
                                                    {t(lang, "Pago", "Payment")}
                                                </p>
                                                <p className="text-[11px] text-slate-600">
                                                    {t(lang, "Transferencia", "Transfer")}
                                                </p>
                                            </div>
                                            <ArrowUpRight className="h-4 w-4 text-slate-500" />
                                        </button>

                                        <button
                                            type="button"
                                            onClick={scrollToSizing}
                                            className="w-full flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 hover:bg-slate-50 transition"
                                        >
                                            <div className="text-left">
                                                <p className="text-[12px] font-extrabold text-slate-900">
                                                    {t(lang, "Tallas", "Sizing")}
                                                </p>
                                                <p className="text-[11px] text-slate-600">
                                                    {t(lang, "Guía de tallas", "Size guide")}
                                                </p>
                                            </div>
                                            <ArrowUpRight className="h-4 w-4 text-slate-500" />
                                        </button>

                                        <button
                                            type="button"
                                            onClick={openCatalog}
                                            className="w-full rounded-full bg-slate-900 text-white px-4 py-3 text-[12px] font-extrabold hover:bg-black transition"
                                        >
                                            {t(lang, "Volver al catálogo", "Back to catalog")} →
                                        </button>
                                    </div>
                                </div>
                            </PremiumCard>
                        </div>
                    </aside>
                </div>
            </main>

            <StoreFooter lang={lang} supportWaLink={supportWaLink} />

            <MobileBottomNav
                show={true}
                view="help"
                lang={lang}
                cartCount={cartCount}
                onHome={openHome}
                onCatalog={openCatalog}
                onCart={openCart}
                onHelp={openHelp}
            />

            <CartDrawer
                open={cartOpen}
                onClose={closeCart}
                lang={lang}
                cartLines={cartLines}
                totalCartPairs={totalCartPairs}
                isMixedCart={isMixedCart}
                waLinkForCart={waLinkForCart}
                hasCartWhatsApp={hasCartWhatsApp}
                clearCart={clearCart}
                onAdd={handleAddToCart}
                onRemove={handleRemoveFromCart}
                onRemoveItem={removeItemFromCart}
                cartLocationSlug={cartLocationSlug}
                getPhotoForCartItem={getPhotoForItem}
            />
        </div>
    );
}