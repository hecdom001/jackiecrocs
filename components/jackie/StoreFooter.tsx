"use client";

import type { Lang } from "@/lib/jackieCatalogUtils";
import { t } from "@/lib/jackieCatalogUtils";

export function StoreFooter({
                                lang,
                                supportWaLink,
                            }: {
    lang: Lang;
    supportWaLink: string;
}) {
    const year = new Date().getFullYear();

    const Section = ({
                         title,
                         children,
                         defaultOpen = false,
                     }: {
        title: React.ReactNode;
        children: React.ReactNode;
        defaultOpen?: boolean;
    }) => (
        <details
            className="group rounded-2xl border border-slate-200 bg-white"
            open={defaultOpen}
        >
            <summary className="cursor-pointer list-none px-4 py-3 flex items-center justify-between">
                <div className="text-[12px] font-extrabold text-slate-900">{title}</div>
                <span className="text-slate-500 group-open:rotate-180 transition-transform select-none">
          ▾
        </span>
            </summary>
            <div className="px-4 pb-4">{children}</div>
        </details>
    );

    return (
        <footer className="hidden lg:block mt-6 border-t border-slate-200 bg-white">
            <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 py-10">
                {/* MOBILE (compact + app-like) */}
                <div className="lg:hidden space-y-4">
                    {/* Brand row */}
                    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <div className="text-[14px] font-extrabold text-slate-900">
                                    Aguacatito.shop
                                </div>
                                <p className="mt-1 text-[12px] leading-relaxed text-slate-600">
                                    {t(
                                        lang,
                                        "Tienda local · Aparta por WhatsApp · Solo pick up",
                                        "Local shop · Reserve via WhatsApp · Pick up only"
                                    )}
                                </p>
                            </div>

                            {/* Social icons */}
                            <div className="flex items-center gap-3">
                                <a
                                    href="https://www.instagram.com/aguuacatito/"
                                    target="_blank"
                                    rel="noreferrer"
                                    aria-label="Instagram"
                                    className="grid h-10 w-10 place-items-center rounded-full border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition"
                                >
                                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                                        <path d="M7.75 2h8.5A5.75 5.75 0 0122 7.75v8.5A5.75 5.75 0 0116.25 22h-8.5A5.75 5.75 0 012 16.25v-8.5A5.75 5.75 0 017.75 2zm0 1.5A4.25 4.25 0 003.5 7.75v8.5A4.25 4.25 0 007.75 20.5h8.5a4.25 4.25 0 004.25-4.25v-8.5A4.25 4.25 0 0016.25 3.5h-8.5zM12 7a5 5 0 110 10 5 5 0 010-10zm0 1.5a3.5 3.5 0 100 7 3.5 3.5 0 000-7zm5.25-.88a.88.88 0 110 1.76.88.88 0 010-1.76z" />
                                    </svg>
                                </a>

                                <a
                                    href="https://www.tiktok.com/@aguuacatito"
                                    target="_blank"
                                    rel="noreferrer"
                                    aria-label="TikTok"
                                    className="grid h-10 w-10 place-items-center rounded-full border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition"
                                >
                                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                                        <path d="M16.7 5.3c.8.9 1.9 1.4 3.1 1.5v3.1a7.3 7.3 0 01-4.4-1.4v6.4a6 6 0 11-6-6c.4 0 .8 0 1.2.1v3.3a2.7 2.7 0 10 2.2 2.7V2h3.9c.1 1.2.6 2.4 1.4 3.3z" />
                                    </svg>
                                </a>
                            </div>
                        </div>

                        <a
                            href={supportWaLink}
                            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-emerald-600 px-4 py-3 text-sm font-extrabold text-white hover:bg-emerald-700 transition"
                        >
                            📲 {t(lang, "Soporte por WhatsApp", "WhatsApp support")}
                        </a>
                    </div>

                    {/* Accordion sections */}
                    <Section title={t(lang, "Tienda", "Shop")} defaultOpen>
                        <ul className="space-y-2 text-[12px] font-semibold text-slate-700">
                            <li className="text-slate-600">{t(lang, "Catálogo", "Catalog")}</li>
                            <li className="text-slate-600">{t(lang, "Novedades", "New arrivals")}</li>
                            <li className="text-slate-600">{t(lang, "Categorías nuevas pronto", "More categories soon")}</li>
                        </ul>
                    </Section>

                    <Section title={t(lang, "Ayuda", "Help")}>
                        <ul className="space-y-2 text-[12px] font-semibold text-slate-700">
                            <li className="text-slate-600">{t(lang, "Guía de tallas", "Size guide")}</li>
                            <li className="text-slate-600">{t(lang, "Solo pick up", "Pick up only")}</li>
                            <li>
                                <a
                                    href={supportWaLink}
                                    className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-[12px] font-extrabold text-emerald-800"
                                >
                                    📲 WhatsApp
                                </a>
                            </li>
                        </ul>
                    </Section>

                    <Section title={t(lang, "Legal", "Legal")}>
                        <ul className="space-y-2 text-[12px] font-semibold text-slate-700">
                            <li>
                                <a href="/privacy" className="text-slate-600 hover:underline">
                                    {t(lang, "Privacidad", "Privacy")}
                                </a>
                            </li>
                            <li>
                                <a href="/terms" className="text-slate-600 hover:underline">
                                    {t(lang, "Términos", "Terms")}
                                </a>
                            </li>
                            <li>
                                <a href="/policies" className="text-slate-600 hover:underline">
                                    {t(lang, "Políticas", "Policies")}
                                </a>
                            </li>
                        </ul>
                    </Section>

                    <div className="pt-2 text-center text-[11px] text-slate-500">
                        © {year} <span className="font-semibold text-slate-700">Aguacatito.shop</span> ·{" "}
                        {t(lang, "Todos los derechos reservados.", "All rights reserved.")}
                    </div>
                </div>

                {/* DESKTOP (premium grid) */}
                <div className="hidden lg:block">
                    <div className="grid gap-10 md:grid-cols-4">
                        {/* Brand */}
                        <div>
                            <div className="text-lg font-extrabold text-slate-900">Aguacatito.shop</div>
                            <p className="mt-3 max-w-xs text-sm leading-relaxed text-slate-600">
                                {t(
                                    lang,
                                    "Compra fácil por WhatsApp. Solo pick up.",
                                    "Easy shopping via WhatsApp. Pick up only."
                                )}
                            </p>

                            <div className="mt-5 flex items-center gap-4">
                                <a
                                    href="https://www.instagram.com/aguuacatito/"
                                    target="_blank"
                                    rel="noreferrer"
                                    aria-label="Instagram"
                                    className="text-slate-500 hover:text-slate-900 transition"
                                >
                                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                                        <path d="M7.75 2h8.5A5.75 5.75 0 0122 7.75v8.5A5.75 5.75 0 0116.25 22h-8.5A5.75 5.75 0 012 16.25v-8.5A5.75 5.75 0 017.75 2zm0 1.5A4.25 4.25 0 003.5 7.75v8.5A4.25 4.25 0 007.75 20.5h8.5a4.25 4.25 0 004.25-4.25v-8.5A4.25 4.25 0 0016.25 3.5h-8.5zM12 7a5 5 0 110 10 5 5 0 010-10zm0 1.5a3.5 3.5 0 100 7 3.5 3.5 0 000-7zm5.25-.88a.88.88 0 110 1.76.88.88 0 010-1.76z" />
                                    </svg>
                                </a>

                                <a
                                    href="https://www.tiktok.com/@aguuacatito"
                                    target="_blank"
                                    rel="noreferrer"
                                    aria-label="TikTok"
                                    className="text-slate-500 hover:text-slate-900 transition"
                                >
                                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                                        <path d="M16.7 5.3c.8.9 1.9 1.4 3.1 1.5v3.1a7.3 7.3 0 01-4.4-1.4v6.4a6 6 0 11-6-6c.4 0 .8 0 1.2.1v3.3a2.7 2.7 0 10 2.2 2.7V2h3.9c.1 1.2.6 2.4 1.4 3.3z" />
                                    </svg>
                                </a>
                            </div>
                        </div>

                        {/* Shop */}
                        <div>
                            <div className="text-sm font-bold text-slate-900">{t(lang, "Tienda", "Shop")}</div>
                            <ul className="mt-4 space-y-2 text-sm text-slate-600">
                                <li>{t(lang, "Catálogo", "Catalog")}</li>
                                <li>{t(lang, "Nuevas llegadas", "New arrivals")}</li>
                                <li>{t(lang, "Categorías nuevas pronto", "More categories soon")}</li>
                            </ul>
                        </div>

                        {/* Help */}
                        <div>
                            <div className="text-sm font-bold text-slate-900">{t(lang, "Ayuda", "Help")}</div>
                            <ul className="mt-4 space-y-2 text-sm text-slate-600">
                                <li>{t(lang, "Guía de tallas", "Size guide")}</li>
                                <li>{t(lang, "Solo pick up", "Pick up only")}</li>
                                <li>
                                    <a href={supportWaLink} className="font-semibold text-emerald-600 hover:underline">
                                        WhatsApp
                                    </a>
                                </li>
                            </ul>
                        </div>

                        {/* Legal */}
                        <div>
                            <div className="text-sm font-bold text-slate-900">{t(lang, "Legal", "Legal")}</div>
                            <ul className="mt-4 space-y-2 text-sm text-slate-600">
                                <li>
                                    <a href="/privacy" className="hover:underline">
                                        {t(lang, "Privacidad", "Privacy")}
                                    </a>
                                </li>
                                <li>
                                    <a href="/terms" className="hover:underline">
                                        {t(lang, "Términos", "Terms")}
                                    </a>
                                </li>
                                <li>
                                    <a href="/policies" className="hover:underline">
                                        {t(lang, "Políticas", "Policies")}
                                    </a>
                                </li>
                            </ul>
                        </div>
                    </div>

                    <div className="mt-12 flex flex-col gap-3 border-t border-slate-200 pt-6 text-xs text-slate-500 md:flex-row md:items-center md:justify-between">
            <span>
              © {year} <span className="font-semibold text-slate-700">Aguacatito.shop</span>.{" "}
                {t(lang, "Todos los derechos reservados.", "All rights reserved.")}
            </span>
                    </div>
                </div>
            </div>
        </footer>
    );
}
