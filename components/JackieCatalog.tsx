"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Lang = "es" | "en";

type PublicItem = {
  id: string;
  model_name: string;
  color: string; // English (from colors.name_en)
  size: string;
  gender: "men" | "women" | "unisex";
  price_mxn: number;
};

const genderLabel: Record<PublicItem["gender"], { es: string; en: string }> = {
  men: { es: "Hombre", en: "Men" },
  women: { es: "Mujer", en: "Women" },
  unisex: { es: "Unisex", en: "Unisex" },
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

// emoji next to color
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

// Public WhatsApp number (set in .env + Vercel)
const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_PHONE || "";

// Build WhatsApp message for one or many items
function buildWhatsAppMessage(items: PublicItem[], lang: Lang) {
  if (!items.length) return "";

  const linesEs = items.map((item, idx) => {
    const colorEs = translateColor(item.color, "es");
    return `• ${idx + 1}:
  Modelo: ${item.model_name || "Crocs"}
  Color: ${colorEs} (${item.color})
  Talla: ${item.size}
  Para: ${genderLabel[item.gender].es}
  Precio: $${item.price_mxn.toFixed(0)} MXN`;
  });

  const linesEn = items.map((item, idx) => {
    return `• ${idx + 1}:
  Model: ${item.model_name || "Crocs"}
  Color: ${item.color}
  Size: ${item.size}
  For: ${genderLabel[item.gender].en}
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

// Build WhatsApp link from items (1 or many)
function buildWhatsAppLink(items: PublicItem[], lang: Lang) {
  if (!WHATSAPP_NUMBER || !items.length) return "#";
  const message = buildWhatsAppMessage(items, lang);
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    message
  )}`;
}

export function JackieCatalog() {
  const [lang, setLang] = useState<Lang>("es");
  const [items, setItems] = useState<PublicItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const [genderFilter, setGenderFilter] = useState<
    "all" | PublicItem["gender"]
  >("all");
  const [sizeFilter, setSizeFilter] = useState<string>("all");

  // multi-select
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

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
        gender,
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
        gender: row.gender,
        price_mxn: Number(row.price_mxn),
        model_name: row.models?.name ?? "",
        color: row.colors?.name_en ?? "",
      })) ?? [];

    setItems(mapped);

    // clean up selected if items disappeared
    setSelectedIds((prev) =>
      prev.filter((id) => mapped.some((i) => i.id === id))
    );

    setLastUpdated(new Date());
    setLoading(false);
  }

  useEffect(() => {
    loadInventory();
  }, []);

  const allSizes = Array.from(new Set(items.map((i) => i.size))).sort();

  const filtered = items.filter((item) => {
    const byGender = genderFilter === "all" || item.gender === genderFilter;
    const bySize = sizeFilter === "all" || item.size === sizeFilter;
    return byGender && bySize;
  });

  const selectedItems = items.filter((i) => selectedIds.includes(i.id));
  const waLinkForSelected = buildWhatsAppLink(selectedItems, lang);

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
    <main className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-sky-50 text-slate-900 pb-20">
      {/* top bar */}
      <header className="sticky top-0 z-10 border-b border-emerald-100 bg-white/90 backdrop-blur">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-full bg-emerald-400 flex items-center justify-center text-lg shadow-sm">
              🐊
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-semibold text-slate-900">
                Jackie Crocs
              </h1>
              <p className="text-[11px] text-slate-500">
                {t(
                  "Sólo consulta de inventario · Pedido por WhatsApp",
                  "Inventory view only · Order via WhatsApp"
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Refresh button */}
            <button
              type="button"
              onClick={loadInventory}
              className="hidden sm:inline-flex items-center rounded-full border border-emerald-300 bg-white px-3 py-1.5 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-50 transition"
            >
              {loading
                ? t("Actualizando…", "Refreshing…")
                : t("Actualizar", "Refresh")}
            </button>

            {/* Language toggle */}
            <div className="inline-flex items-center rounded-full border border-emerald-100 bg-emerald-50 p-0.5 text-[11px] shadow-sm">
              <button
                type="button"
                onClick={() => setLang("es")}
                className={`px-2.5 py-1 rounded-full ${
                  lang === "es"
                    ? "bg-emerald-500 text-white shadow"
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
                    ? "bg-emerald-500 text-white shadow"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                EN
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* TITLE SECTION */}
        <section className="space-y-3">
          <div>
            <h2 className="text-lg sm:text-2xl font-semibold text-slate-900 flex items-center gap-2">
              {lang === "es" ? "Crocs disponibles 👟" : "Available Crocs 👟"}
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-slate-600 max-w-xl">
              {lang === "es"
                ? 'Consulta tallas y colores disponibles. Para comprar, toca "Pedir por WhatsApp" en el par que te interese.'
                : 'Check available sizes and colors. To order, tap "Request via WhatsApp" on the pair you like.'}
            </p>
          </div>

          <div className="flex flex-wrap gap-2 text-[11px] sm:text-xs text-slate-700">
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 border border-emerald-100">
              <span>📍</span>
              {lang === "es" ? "Entrega en Tijuana" : "Pickup in Tijuana"}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 border border-emerald-100">
              <span>💵</span>
              {lang === "es"
                ? "Pago en efectivo o transferencia"
                : "Cash or bank transfer"}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 border border-emerald-100">
              <span>⏰</span>
              {lang === "es"
                ? "Respuestas 9am–7pm"
                : "Replies 9am–7pm"}
            </span>
             <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 border border-emerald-100">
              <span>🇺🇸</span>
              {lang === "es"
                ? "Tallas Americanas"
                : "American sizes"}
            </span>
          </div>

          {lastUpdated && (
            <p className="text-[11px] text-slate-500">
              {t("Última actualización", "Last updated")}: {formattedLastUpdated}
            </p>
          )}
        </section>

        {/* FILTER BAR */}
        <section className="bg-white/95 border border-emerald-100 rounded-2xl p-3 sm:p-4 space-y-3 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-base">🔎</span>
              <p className="text-sm font-semibold text-slate-900">
                {lang === "es" ? "Filtrar inventario" : "Filter inventory"}
              </p>
            </div>
            <p className="text-[11px] text-slate-500">
              {lang === "es"
                ? "⚠️ El inventario se mueve rápido — confirma siempre por WhatsApp."
                : "⚠️ Stock moves fast — always confirm via WhatsApp."}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
            {/* gender filter */}
            <div className="flex flex-col gap-1">
              <span className="text-slate-800">
                {lang === "es" ? "Para:" : "For:"}
              </span>
              <select
                value={genderFilter}
                onChange={(e) =>
                  setGenderFilter(
                    e.target.value === "all"
                      ? "all"
                      : (e.target.value as PublicItem["gender"])
                  )
                }
                className="border border-emerald-100 bg-white rounded-lg px-2.5 py-1.5 text-[11px] text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-300"
              >
                <option value="all">
                  {lang === "es" ? "Todos" : "All"}
                </option>
                <option value="women">{genderLabel.women[lang]}</option>
                <option value="men">{genderLabel.men[lang]}</option>
                <option value="unisex">{genderLabel.unisex[lang]}</option>
              </select>
            </div>

            {/* size filter */}
            <div className="flex flex-col gap-1">
              <span className="text-slate-800">
                {lang === "es" ? "Talla:" : "Size:"}
              </span>
              <select
                value={sizeFilter}
                onChange={(e) => setSizeFilter(e.target.value)}
                className="border border-emerald-100 bg-white rounded-lg px-2.5 py-1.5 text-[11px] text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-300"
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

            {/* count + refresh (mobile) */}
            <div className="flex items-center justify-between sm:justify-end gap-2 text-[11px]">
              <span className="text-slate-500">
                {lang === "es"
                  ? `${filtered.length} pares disponibles`
                  : `${filtered.length} pairs available`}
              </span>
              <button
                type="button"
                onClick={loadInventory}
                className="inline-flex sm:hidden items-center rounded-full border border-emerald-300 bg-white px-3 py-1.5 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-50 transition"
              >
                {loading
                  ? t("Actualizando…", "Refreshing…")
                  : t("Actualizar", "Refresh")}
              </button>
            </div>
          </div>
        </section>

        {/* GRID + PRODUCT CARDS */}
        <section>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {filtered.map((item) => {
                const isSelected = selectedIds.includes(item.id);
                const colorText = translateColor(item.color, lang);
                const emoji = colorEmoji(item.color);

                const waLinkSingle = buildWhatsAppLink([item], lang);

                return (
                  <article
                    key={item.id}
                    className="rounded-2xl border border-emerald-100 bg-white p-3 sm:p-4 flex flex-col gap-3 shadow-sm hover:border-emerald-200 transition"
                  >
                    {/* Title + price */}
                    <div className="flex justify-between items-start gap-2">
                      <div className="space-y-1">
                        <h3 className="text-sm sm:text-base font-semibold text-slate-900">
                          {(item.model_name || "Classic") + " Crocs"}
                        </h3>
                        <p className="text-[11px] text-slate-600">
                          {lang === "es" ? "Color:" : "Color:"}{" "}
                          <span className="font-medium text-slate-800">
                            {colorText}
                          </span>{" "}
                          <span className="align-middle">{emoji}</span>
                        </p>
                        <p className="text-[11px] text-slate-600">
                          {lang === "es" ? "Talla:" : "Size:"}{" "}
                          <span className="font-medium text-slate-800">
                            {item.size}
                          </span>{" "}
                          · {genderLabel[item.gender][lang]}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-base sm:text-lg font-semibold text-emerald-700">
                          ${item.price_mxn.toFixed(0)} MXN
                        </p>
                      </div>
                    </div>

                    {/* info lines */}
                    <div className="space-y-1 text-[11px] text-slate-600">
                      <p className="flex items-center gap-1">
                        <span>📍</span>
                        <span>
                          {lang === "es"
                            ? "Entrega en Tijuana"
                            : "Pickup in Tijuana"}
                        </span>
                      </p>
                      <p className="flex items-center gap-1">
                        <span>💵</span>
                        <span>
                          {lang === "es"
                            ? "Pago en efectivo o transferencia"
                            : "Cash or bank transfer"}
                        </span>
                      </p>
                    </div>

                    {/* selection toggle + per-card WA */}
                    <div className="mt-1 flex flex-col gap-2">
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => handleToggleSelect(item.id)}
                          className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-semibold border transition ${
                            isSelected
                              ? "bg-emerald-500 text-white border-emerald-500 shadow-sm"
                              : "bg-white text-slate-700 border-emerald-200 hover:border-emerald-400 hover:text-emerald-700"
                          }`}
                        >
                          <span className="text-base">
                            {isSelected ? "✅" : "➕"}
                          </span>
                          {isSelected
                            ? lang === "es"
                              ? "Seleccionado"
                              : "Selected"
                            : lang === "es"
                            ? "Agregar al pedido"
                            : "Add to request"}
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* Sticky WhatsApp bar for MULTIPLE selected items */}
      {selectedItems.length > 0 && (
        <div className="fixed bottom-0 inset-x-0 z-20 border-t border-emerald-100 bg-white/95 backdrop-blur shadow-[0_-4px_12px_rgba(15,23,42,0.08)]">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="text-[11px] text-slate-700">
              {lang === "es"
                ? `${selectedItems.length} ${
                    selectedItems.length === 1
                      ? "par seleccionado"
                      : "pares seleccionados"
                  }`
                : `${selectedItems.length} ${
                    selectedItems.length === 1
                      ? "pair selected"
                      : "pairs selected"
                  }`}
            </p>
            <a
              href={waLinkForSelected || "#"}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center gap-2 rounded-full px-5 py-2 text-xs font-semibold transition ${
                WHATSAPP_NUMBER
                  ? "bg-emerald-500 text-white hover:bg-emerald-400"
                  : "bg-slate-300 text-slate-600 cursor-not-allowed"
              }`}
            >
              <span className="text-base">📲</span>
              {lang === "es"
                ? "Pedir todos los seleccionados por WhatsApp"
                : "Request all selected via WhatsApp"}
            </a>
          </div>
        </div>
      )}
    </main>
  );
}
