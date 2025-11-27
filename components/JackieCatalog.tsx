"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { track } from "@vercel/analytics";

type Lang = "es" | "en";

type PublicItem = {
  id: string;
  model_name: string;
  color: string; // English (from colors.name_en)
  size: string;
  price_mxn: number;
};

function translateColor(colorEn: string, lang: Lang) {
  if (lang === "en") return colorEn;

  const key = colorEn.trim().toLowerCase();
  switch (key) {
    case "black":
      return "Negro";
    case "white":
      return "Blanco";
    case "beige":
      return "Beige";
    case "purple":
      return "Morado";
    default:
      return colorEn;
  }
}

function colorEmoji(colorEn: string) {
  const key = colorEn.trim().toLowerCase();
  switch (key) {
    case "black":
      return "🖤";
    case "white":
      return "🤍";
    case "beige":
      return "🤎";
    case "purple":
      return "💜";
    default:
      return "🎨";
  }
}

// keep handy if you want per-color hero later
function imageForColor(colorEn: string | null | undefined): string {
  const key = (colorEn || "").trim().toLowerCase();
  if (key === "black") return "/images/crocs-black.jpg";
  if (key === "white") return "/images/crocs-white.jpg";
  if (key === "beige") return "/images/crocs-beige.jpg";
  return "/images/crocs-black.jpg";
}

// static gallery row
const CROCS_PHOTOS: { src: string; label: string }[] = [
  { src: "/images/crocs-black.jpg", label: "Crocs negros" },
  { src: "/images/crocs-white.jpg", label: "Crocs blancos" },
  { src: "/images/crocs-beige.jpg", label: "Crocs beige" },
];

const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_PHONE || "";

// delivery chips & sidebar content
const DELIVERY_SPOTS = [
  "Pinos Presa",
  "Villafloresta",
  "Otay",
  "20 de Noviembre",
  "Macro Burger King",
];

const MEX_BANK_INFO = {
  bankName: "Santander",
  accountName: "Jackeline Monge",
  accountNumber: "014020260401072579",
  Concepto: "Tu nombre",
} as const;

// how many products to show at first / each "show more"
const INITIAL_VISIBLE = 6;

// ---------- WhatsApp helpers ----------

function buildWhatsAppMessage(items: PublicItem[], lang: Lang) {
  if (!items.length) return "";

  const linesEs = items.map((item, idx) => {
    const colorEs = translateColor(item.color, "es");
    return `• ${idx + 1}:
  Modelo: ${item.model_name || "Crocs"}
  Color: ${colorEs} (${item.color})
  Talla: ${item.size}
  Precio: $${item.price_mxn.toFixed(0)} MXN`;
  });

  const linesEn = items.map((item, idx) => {
    return `• ${idx + 1}:
  Model: ${item.model_name || "Crocs"}
  Color: ${item.color}
  Size: ${item.size}
  Price: $${item.price_mxn.toFixed(0)} MXN`;
  });

  if (lang === "es") {
    return `Hola 👋 Me interesan estos pares de Crocs:

${linesEs.join("\n\n")}

¿Siguen disponibles?`;
  }

  return `Hi 👋 I'm interested in these Crocs:

${linesEn.join("\n\n")}

Are they still available?`;
}

function buildWhatsAppLink(items: PublicItem[], lang: Lang) {
  if (!WHATSAPP_NUMBER || !items.length) return "#";
  const message = buildWhatsAppMessage(items, lang);
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    message
  )}`;
}

function buildWhatsAppSupportLink(lang: Lang) {
  if (!WHATSAPP_NUMBER) return "#";

  const message =
    lang === "es"
      ? "Hola 👋 Tengo dudas sobre tallas o colores de los Crocs."
      : "Hi 👋 I have questions about Crocs sizes or colors.";

  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    message
  )}`;
}

// ---------- Component ----------

export function JackieCatalog() {
  const [lang, setLang] = useState<Lang>("es");
  const [items, setItems] = useState<PublicItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const [sizeFilter, setSizeFilter] = useState<string>("all");
  const [colorFilter, setColorFilter] = useState<string>("all");

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [visibleCount, setVisibleCount] = useState<number>(INITIAL_VISIBLE);

  const t = (es: string, en: string) => (lang === "es" ? es : en);

  async function loadInventory() {
    setLoading(true);
    setErrorMsg(null);

    const { data, error } = await supabase
      .from("inventory_items")
      .select(
        `
        id,
        size,
        price_mxn,
        status,
        models ( name ),
        colors ( name_en )
      `
      )
      .eq("status", "available")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading inventory:", error);
      setErrorMsg("Error cargando inventario / Error loading inventory");
      setLoading(false);
      return;
    }

    const mapped: PublicItem[] =
      data?.map((row: any) => ({
        id: row.id,
        size: row.size,
        price_mxn: Number(row.price_mxn),
        model_name: row.models?.name ?? "",
        color: row.colors?.name_en ?? "",
      })) ?? [];

    setItems(mapped);
    setSelectedIds((prev) =>
      prev.filter((id) => mapped.some((i) => i.id === id))
    );
    setLastUpdated(new Date());
    setLoading(false);
  }

  // initial load
  useEffect(() => {
    loadInventory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // auto-refresh every 60s
  useEffect(() => {
    const id = setInterval(() => {
      loadInventory();
    }, 60_000);

    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // reset visible items when filters or inventory change
  useEffect(() => {
    setVisibleCount(INITIAL_VISIBLE);
  }, [sizeFilter, colorFilter, items.length]);

  const allSizes = Array.from(new Set(items.map((i) => i.size))).sort();

  const allColors = Array.from(new Set(items.map((i) => i.color)))
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));

  const filtered = items.filter((item) => {
    const bySize = sizeFilter === "all" || item.size === sizeFilter;
    const byColor = colorFilter === "all" || item.color === colorFilter;
    return bySize && byColor;
  });

  // only show up to visibleCount on screen
  const limited = filtered.slice(0, visibleCount);

  const selectedItems = items.filter((i) => selectedIds.includes(i.id));
  const waLinkForSelected = buildWhatsAppLink(selectedItems, lang);
  const supportWaLink = buildWhatsAppSupportLink(lang);

  const formattedLastUpdated =
    lastUpdated &&
    `${lastUpdated.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })}`;

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 pb-24">
      {/* TOP BAR */}
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-full bg-emerald-500 flex items-center justify-center text-lg text-white">
              🐊
            </div>
            <div className="leading-tight">
              <p className="text-sm font-semibold">Jacky Crocs</p>
              <p className="text-[11px] text-slate-500">
                {t("Crocs originales · Tijuana", "Original Crocs · Tijuana")}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={loadInventory}
              className="hidden sm:inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-medium text-slate-800 hover:border-emerald-400 hover:text-emerald-700 transition"
            >
              {loading
                ? t("Actualizando…", "Refreshing…")
                : t("Actualizar inventario", "Refresh stock")}
            </button>

            <div className="inline-flex items-center rounded-full border border-slate-200 bg-slate-100 p-0.5 text-[11px]">
              <button
                type="button"
                onClick={() => setLang("es")}
                className={`px-2.5 py-1 rounded-full ${
                  lang === "es"
                    ? "bg-white text-slate-900 shadow-sm"
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
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                EN
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 space-y-8">
        {/* HERO */}
        <section className="rounded-2xl bg-white border border-slate-200 shadow-sm p-4 sm:p-5">
          <div className="grid gap-4 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] items-center">
            <div className="space-y-3">
              <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-[11px] font-medium text-slate-800 border border-slate-200">
                <span>🛒</span>
                {lang === "es" ? "Catálogo" : "Catalog"}
              </span>
              <div className="space-y-1">
                <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
                  {lang === "es"
                    ? "Crocs disponibles 🐊✨"
                    : "Available Crocs 🐊✨"}
                </h1>
                <p className="text-sm text-slate-600 max-w-md">
                  {lang === "es"
                    ? "Toca un par, elige tu talla y pídenos por WhatsApp."
                    : "Tap a pair, pick your size and order via WhatsApp."}
                </p>
              </div>
              <div className="flex flex-wrap gap-2 text-[11px] sm:text-xs">
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 border border-slate-200">
                  <span>📍</span>
                  {lang === "es" ? "Entrega en Tijuana" : "Pickup in Tijuana"}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 border border-slate-200">
                  <span>💵</span>
                  {lang === "es"
                    ? "Pago en efectivo o transferencia"
                    : "Cash or transfer"}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 border border-slate-200">
                  <span>⏰</span>
                  {lang === "es" ? "Respuestas 9am–7pm" : "Replies 9am–7pm"}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 border border-slate-200">
                  <span>🇺🇸</span>
                  {lang === "es" ? "Tallas americanas" : "US sizing"}
                </span>
              </div>
              {lastUpdated && (
                <p className="text-[11px] text-slate-500">
                  {t("Última actualización", "Last updated")}:{" "}
                  {formattedLastUpdated}
                </p>
              )}
            </div>

            {/* highlight card */}
            <div className="w-full max-w-[320px] mx-auto md:max-w-xs md:mx-0 md:justify-self-end">
              <div className="rounded-2xl bg-gradient-to-br from-emerald-50 via-white to-sky-50 border border-emerald-100 shadow-sm p-4 space-y-3">
                <span className="inline-flex items-center gap-1 rounded-full bg-white/80 px-2.5 py-1 text-[10px] font-medium text-emerald-700 border border-emerald-100">
                  🌟 {lang === "es" ? "Crocs originales" : "Original Crocs"}
                </span>

                <div>
                  <p className="text-[11px] uppercase tracking-wide text-slate-500">
                    {lang === "es"
                      ? "Precio por par desde"
                      : "Price per pair from"}
                  </p>
                  <p className="text-2xl font-semibold text-slate-900">
                    $600 MXN
                  </p>
                </div>

                <p className="text-[11px] text-slate-600">
                  {lang === "es"
                    ? "Originales, tallas americanas. Entrega en Tijuana y pago en efectivo o transferencia."
                    : "Original pairs, US sizing. Pickup in Tijuana, pay in cash or bank transfer."}
                </p>

                <p className="text-[10px] text-slate-500">
                  {lang === "es"
                    ? "Agrega los pares que te gustan al carrito y envíanos tu mensaje por WhatsApp."
                    : "Add the pairs you like to the cart and send your order on WhatsApp."}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* PHOTO STRIP */}
      <section className="rounded-2xl bg-white border border-slate-100 p-3 sm:p-4 space-y-2">
        <div className="flex items-center justify-between text-[12px] sm:text-sm">
          <p className="font-medium">
            {lang === "es" ? "Fotos reales del producto" : "Real product photos"}
          </p>
          <p className="text-[11px] text-slate-500">
            {lang === "es"
              ? "Tomadas por nosotros, sin filtros."
              : "Taken by us, no filters."}
          </p>
        </div>

        {/* MOBILE: horizontal scroll, no big empty space */}
        <div className="flex md:hidden gap-3 overflow-x-auto -mx-3 px-3 pb-1 snap-x snap-mandatory">
          {CROCS_PHOTOS.map((photo) => (
            <div
              key={photo.src}
              className="snap-start min-w-[58%] rounded-xl overflow-hidden bg-slate-50 border border-slate-100"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.src}
                alt={photo.label}
                className="h-44 w-full object-cover"
              />
            </div>
          ))}
        </div>

        {/* DESKTOP: keep 3-column grid */}
        <div className="hidden md:grid md:grid-cols-3 gap-3">
          {CROCS_PHOTOS.map((photo) => (
            <div
              key={photo.src}
              className="rounded-xl overflow-hidden bg-slate-50 border border-slate-100"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.src}
                alt={photo.label}
                className="h-60 w-full object-cover"
              />
            </div>
          ))}
        </div>
      </section>



        {/* FILTERS */}
        <section className="rounded-2xl bg-white border border-slate-100 p-3 sm:p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-medium text-slate-900">
              {lang === "es" ? "Filtrar inventario" : "Filter inventory"}
            </p>
            <p className="text-[11px] text-slate-500">
              {lang === "es"
                ? "Se están vendiendo rápido — confirma por WhatsApp."
                : "Stock moves quickly — always confirm on WhatsApp."}
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[11px]">
            <div className="flex flex-col gap-1">
              <span className="text-slate-700">
                {lang === "es" ? "Talla" : "Size"}
              </span>
              <select
                value={sizeFilter}
                onChange={(e) => setSizeFilter(e.target.value)}
                className="appearance-none rounded-full border border-slate-200 bg-white px-4 py-2 text-[11px] text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
              >
                <option value="all">
                  {lang === "es" ? "Todas" : "All"}
                </option>
                {allSizes.map((sz) => (
                  <option key={sz} value={sz}>
                    {sz}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-slate-700">
                {lang === "es" ? "Color" : "Color"}
              </span>
              <select
                value={colorFilter}
                onChange={(e) => setColorFilter(e.target.value)}
                className="appearance-none rounded-full border border-slate-200 bg-white px-4 py-2 text-[11px] text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
              >
                <option value="all">
                  {lang === "es" ? "Todos" : "All"}
                </option>
                {allColors.map((color) => (
                  <option key={color} value={color}>
                    {translateColor(color, lang)}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col justify-between gap-1">
              <span className="text-slate-700">
                {lang === "es" ? "Resultado" : "Result"}
              </span>
              <div className="flex items-center justify-between gap-2 text-[11px]">
                <span className="text-slate-600">
                  {lang === "es"
                    ? `${filtered.length} pares disponibles`
                    : `${filtered.length} pairs available`}
                </span>
                <button
                  type="button"
                  onClick={loadInventory}
                  className="inline-flex sm:hidden items-center rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-medium text-slate-800 hover:border-emerald-400 hover:text-emerald-700 transition"
                >
                  {loading
                    ? t("Actualizando…", "Refreshing…")
                    : t("Actualizar", "Refresh")}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* MAIN CONTENT: product grid + sidebar */}
        <section className="grid gap-4 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
          {/* LEFT: products */}
          <div>
            {loading ? (
              <p className="text-xs text-slate-600">
                {t("Cargando inventario…", "Loading inventory…")}
              </p>
            ) : errorMsg ? (
              <p className="text-xs text-red-500">{errorMsg}</p>
            ) : filtered.length === 0 ? (
              <p className="text-xs text-slate-600">
                {t(
                  "Por ahora no hay pares con estos filtros.",
                  "No pairs match these filters right now."
                )}
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {limited.map((item) => {
                  const isSelected = selectedIds.includes(item.id);
                  const colorText = translateColor(item.color, lang);
                  const emoji = colorEmoji(item.color);

                  return (
                    <article
                      key={item.id}
                      className="rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow p-3.5 sm:p-4 flex flex-col gap-3"
                    >
                      <div className="flex justify-between items-start gap-3">
                        <div className="space-y-1">
                          <h3 className="text-sm sm:text-base font-medium text-slate-900">
                            {(item.model_name || "Classic") + " Crocs"}
                          </h3>
                          <span className="inline-block text-[10px] text-emerald-600 font-medium">
                            ✅{" "}
                            {lang === "es"
                              ? "Disponible hoy"
                              : "Available today"}
                          </span>
                          <p className="text-[11px] text-slate-600">
                            {emoji} {colorText} ·{" "}
                            {lang === "es" ? "Talla" : "Size"} {item.size}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg sm:text-xl font-semibold text-emerald-600">
                            ${item.price_mxn.toFixed(0)} MXN
                          </p>
                          <p className="text-[10px] text-slate-500">
                            {lang === "es"
                              ? "Precio por par"
                              : "Price per pair"}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-1 text-[11px] text-slate-600">
                        <p>📍 {t("Entrega en Tijuana", "Pickup in Tijuana")}</p>
                        <p>
                          💵{" "}
                          {t(
                            "Pago en efectivo o transferencia",
                            "Pay in cash or bank transfer"
                          )}
                        </p>
                      </div>

                      {/* single CTA – toggle select */}
                      <div className="mt-1 flex">
                        <button
                          type="button"
                          onClick={() => handleToggleSelect(item.id)}
                          className={`inline-flex w-full items-center justify-center gap-2 rounded-full px-3 py-1.75 text-[11px] font-medium border transition ${
                            isSelected
                              ? "bg-emerald-500 text-white border-emerald-500 shadow-sm"
                              : "bg-white text-slate-800 border-slate-200 hover:border-emerald-400 hover:text-emerald-700"
                          }`}
                        >
                          <span>{isSelected ? "✅" : "🤍"}</span>
                          <span>
                            {isSelected
                              ? lang === "es"
                                ? "En carrito"
                                : "In cart"
                              : lang === "es"
                              ? "Lo quiero"
                              : "I want it"}
                          </span>
                        </button>
                      </div>
                    </article>
                  );
                })}

                {/* Show more button */}
                {filtered.length > limited.length && (
                  <div className="col-span-full mt-2 flex justify-center">
                    <button
                      type="button"
                      onClick={() =>
                        setVisibleCount((prev) => prev + INITIAL_VISIBLE)
                      }
                      className="inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-2 text-[11px] font-medium text-slate-800 hover:border-emerald-400 hover:text-emerald-700 transition"
                    >
                      {lang === "es"
                        ? "Mostrar más pares"
                        : "Show more pairs"}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* RIGHT SIDEBAR */}
          <aside className="space-y-4">
            {/* Entregas */}
            <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-4 space-y-2">
              <h3 className="text-sm font-medium flex items-center gap-2 text-slate-900">
                <span>🚚</span>
                {lang === "es" ? "Entregas" : "Deliveries"}
              </h3>
              <p className="text-[11px] text-slate-600">
                {lang === "es"
                  ? "Elige el punto que te quede mejor. El horario exacto se confirma por WhatsApp."
                  : "Pick the spot that works best. Exact time is agreed via WhatsApp."}
              </p>
              <ul className="space-y-1 text-[12px] text-slate-800">
                {DELIVERY_SPOTS.map((spot) => (
                  <li key={spot} className="flex items-center gap-2">
                    <span>📍</span>
                    <span>{spot}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Bank info */}
            <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-4 space-y-2">
              <h3 className="text-sm font-medium flex items-center gap-2 text-slate-900">
                <span>💳🇲🇽</span>
                {lang === "es"
                  ? "Pago por transferencia"
                  : "Pay by bank transfer"}
              </h3>
              <p className="text-[11px] text-slate-600">
                {lang === "es"
                  ? "Después de transferir, envía captura por WhatsApp para confirmar tu pedido."
                  : "After you transfer, send a screenshot on WhatsApp to confirm your order."}
              </p>
              <div className="space-y-1 text-[11px] sm:text-xs text-slate-800">
                <p>
                  <span className="font-medium">
                    {lang === "es" ? "Banco: " : "Bank: "}
                  </span>
                  {MEX_BANK_INFO.bankName}
                </p>
                <p>
                  <span className="font-medium">
                    {lang === "es" ? "Titular: " : "Account name: "}
                  </span>
                  {MEX_BANK_INFO.accountName}
                </p>
                <p className="break-all">
                  <span className="font-medium">
                    {lang === "es" ? "Cuenta: " : "Account: "}
                  </span>
                  {MEX_BANK_INFO.accountNumber}
                </p>
                <p className="break-all">
                  <span className="font-medium">Concepto: </span>
                  {MEX_BANK_INFO.Concepto}
                </p>
              </div>
            </div>

            {/* Questions */}
            <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-3 sm:p-4 space-y-2">
              <h3 className="text-sm font-medium flex items-center gap-2 text-slate-900">
                <span>❓</span>
                {lang === "es"
                  ? "¿Dudas sobre tallas o colores?"
                  : "Questions about sizes or colors?"}
              </h3>
              <p className="text-[10px] sm:text-[11px] text-slate-600">
                {lang === "es"
                  ? "Mándanos mensaje por WhatsApp y te ayudamos a elegir talla y color. Respuestas de 9am a 7pm."
                  : "Send us a WhatsApp message and we’ll help you pick size and color. Replies from 9am to 7pm."}
              </p>

              <a
                href={supportWaLink || "#"}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => {
                  if (!WHATSAPP_NUMBER) return;
                  track("whatsapp_click_support", { lang });
                }}
                className={`inline-flex w-full items-center justify-center gap-2 rounded-full px-3 py-1.75 text-[11px] font-medium border transition ${
                  WHATSAPP_NUMBER
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                    : "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
                }`}
              >
                <span>📲</span>
                <span>
                  {lang === "es"
                    ? "Preguntar por WhatsApp"
                    : "Ask on WhatsApp"}
                </span>
              </a>
            </div>
          </aside>
        </section>
      </div>

      {/* STICKY CART BAR */}
      {selectedItems.length > 0 && (
        <div className="fixed bottom-0 inset-x-0 z-30 border-t border-slate-200 bg-white/95 backdrop-blur shadow-[0_-8px_30px_rgba(15,23,42,0.12)]">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="text-[11px] text-slate-700">
              {lang === "es"
                ? `✅ ${selectedItems.length} ${
                    selectedItems.length === 1
                      ? "par listo para enviar"
                      : "pares listos para enviar"
                  }`
                : `✅ ${selectedItems.length} ${
                    selectedItems.length === 1
                      ? "pair ready to send"
                      : "pairs ready to send"
                  }`}
            </p>
            <a
              href={waLinkForSelected || "#"}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                if (!WHATSAPP_NUMBER || !selectedItems.length) return;
                track("whatsapp_click_multi", {
                  count: selectedItems.length,
                  lang,
                });
              }}
              className={`inline-flex items-center gap-2 rounded-full px-6 py-3 text-xs sm:text-sm font-semibold transition ${
                WHATSAPP_NUMBER
                  ? "bg-emerald-500 text-white shadow-md hover:bg-emerald-400"
                  : "bg-slate-200 text-slate-500 cursor-not-allowed"
              }`}
            >
              <span className="text-base">📲</span>
              {lang === "es"
                ? "Enviar carrito por WhatsApp"
                : "Send cart via WhatsApp"}
            </a>
          </div>
        </div>
      )}
    </main>
  );
}
