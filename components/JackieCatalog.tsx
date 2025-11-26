"use client";

import { useEffect, useState } from "react";
import type { InventoryItem } from "@/types/inventory";
import { translateColor } from "@/lib/colorMap";


type Language = "es" | "en";

interface JackieCatalogProps {
  items: InventoryItem[];
  phone: string;
}

export default function JackieCatalog({ items, phone }: JackieCatalogProps) {
  const [lang, setLang] = useState<Language>("es");
  const [inventory, setInventory] = useState<InventoryItem[]>(items);
  const [isRefreshing, setIsRefreshing] = useState(false);


  // Load saved language from localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem("jackiecrocs_lang");
    if (saved === "es" || saved === "en") {
      setLang(saved);
    }
  }, []);

  // Save language when it changes
  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("jackiecrocs_lang", lang);
  }, [lang]);

  useEffect(() => {
    // auto-refresh every 30 seconds
    const interval = setInterval(() => {
      refreshInventory();
    }, 30_000);

    return () => clearInterval(interval);
  }, []);

  const genericMsg =
    lang === "es"
      ? "Hola! Vi tu página de Jackie Crocs y quiero preguntar por modelos y tallas disponibles."
      : "Hi! I saw your Jackie Crocs page and want to ask about available models and sizes.";

  const waAllUrl = `https://wa.me/${phone}?text=${encodeURIComponent(
    genericMsg
  )}`;

  const title = "Jackie Crocs";
  const tagline =
    lang === "es" ? "Venta de Crocs en Tijuana" : "Crocs sales in Tijuana";
  const heroTitle = lang === "es" ? "Jackie Crocs" : "Jackie Crocs";
  const heroSubtitle =
    lang === "es"
      ? "Modelos y tallas disponibles en Tijuana. Revisa el inventario en tiempo real y mándanos mensaje para apartar tu par."
      : "Available models and sizes in Tijuana. Check real-time inventory and message us to reserve your pair.";
  const stockBadge =
    lang === "es"
      ? "Stock actualizado por la vendedora"
      : "Stock updated by the seller";
  const entregaBadge =
    lang === "es"
      ? "Entregas en puntos acordados en Tijuana"
      : "Meetups at agreed points in Tijuana";
  const inventoryTitle =
    lang === "es" ? "Inventario disponible" : "Available inventory";
  const entregasLink =
    lang === "es" ? "Ver puntos de entrega" : "View meetup locations";
  const emptyTitle =
    lang === "es"
      ? "Por ahora no hay pares disponibles."
      : "There are no pairs available right now.";
  const emptySubtitle =
    lang === "es"
      ? "A veces el inventario se agota rápido cuando los videos se hacen virales 🐊. Vuelve a revisar más tarde o mándanos WhatsApp para preguntar por la próxima llegada."
      : "Sometimes inventory sells out fast when videos go viral 🐊. Check back later or message us on WhatsApp to ask about the next restock.";
  const emptyBtn =
    lang === "es" ? "Preguntar por disponibilidad" : "Ask about availability";
  const footerText =
    lang === "es"
      ? "Jackie Crocs · Tijuana · Página para consulta de inventario, las ventas se confirman por WhatsApp."
      : "Jackie Crocs · Tijuana · Inventory page only, sales are confirmed via WhatsApp.";
  const waDirect =
    lang === "es" ? "WhatsApp directo" : "WhatsApp direct contact";

    async function refreshInventory() {
    try {
      setIsRefreshing(true);
      const res = await fetch("/api/inventory", { cache: "no-store" });
      if (!res.ok) {
        console.error("Error refreshing inventory");
        return;
      }
      const data = await res.json();
      setInventory(data.items || []);
    } catch (err) {
      console.error("Error refreshing inventory", err);
    } finally {
      setIsRefreshing(false);
    }
  }


  return (
    <main className="min-h-screen bg-gradient-to-b from-emerald-50/60 via-white to-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 sm:py-8 space-y-6 sm:space-y-8">
        {/* Top nav */}
        <header className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-emerald-600 flex items-center justify-center text-white text-lg">
              🐊
            </div>
            <div>
              <p className="text-sm font-semibold tracking-tight text-emerald-900">
                {title}
              </p>
              <p className="text-[11px] text-gray-500">{tagline}</p>
            </div>
          </div>

         <div className="flex items-center gap-2">
  {/* Language toggle */}
  <div className="inline-flex items-center rounded-full border border-gray-200 bg-white p-0.5 text-[11px]">
    <button
      type="button"
      onClick={() => setLang("es")}
      className={`px-2.5 py-1 rounded-full ${
        lang === "es"
          ? "bg-emerald-600 text-white"
          : "text-gray-600 hover:text-gray-800"
      }`}
    >
      ES
    </button>
    <button
      type="button"
      onClick={() => setLang("en")}
      className={`px-2.5 py-1 rounded-full ${
        lang === "en"
          ? "bg-emerald-600 text-white"
          : "text-gray-600 hover:text-gray-800"
      }`}
    >
      EN
    </button>
  </div>

  {/* Refresh button */}
  <button
    type="button"
    onClick={refreshInventory}
    className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-[11px] font-medium text-gray-700 hover:bg-gray-50 active:scale-[0.97] transition"
  >
    {isRefreshing
      ? lang === "es"
        ? "Actualizando..."
        : "Refreshing..."
      : lang === "es"
      ? "Actualizar"
      : "Refresh"}
  </button>

  <a
    href={waAllUrl}
    target="_blank"
    rel="noopener noreferrer"
    className="hidden sm:inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-white px-3 py-1.5 text-xs font-medium text-emerald-800 hover:bg-emerald-50 transition"
  >
    {waDirect}
  </a>
</div>

        </header>

        {/* Hero */}
        <section className="rounded-2xl border border-emerald-100 bg-white/80 shadow-sm px-4 py-5 sm:px-6 sm:py-6 space-y-3">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-emerald-950 flex items-center gap-2">
            {heroTitle}
            <span className="hidden sm:inline text-2xl">🐊</span>
          </h1>
          <p className="text-sm sm:text-base text-gray-700">{heroSubtitle}</p>
          <div className="flex flex-wrap items-center gap-2 text-[11px] sm:text-xs">
            <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 font-medium text-emerald-800">
              {stockBadge}
            </span>
            <span className="inline-flex items-center rounded-full bg-gray-50 px-2.5 py-1 text-gray-600">
              {entregaBadge}
            </span>
          </div>
        </section>

        {/* Inventory */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-800">
              {inventoryTitle}
            </h2>
            <a
              href="/entregas"
              className="text-xs text-emerald-700 hover:text-emerald-900 underline"
            >
              {entregasLink}
            </a>
          </div>
        
        {inventory.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                {inventory.map((item) => (
                <ItemCard key={item.id} item={item} phone={phone} lang={lang} />
                ))}
            </div>
            )}
        </section>

        {/* Footer */}
        <footer className="pt-2 pb-4 text-center">
          <p className="text-[11px] text-gray-400">{footerText}</p>
        </footer>
      </div>
    </main>
  );
}

function ItemCard({
  item,
  phone,
  lang,
}: {
  item: InventoryItem;
  phone: string;
  lang: Language;
}) {
  const genderLabel =
    item.gender === "men"
      ? lang === "es"
        ? "Hombre"
        : "Men"
      : item.gender === "women"
      ? lang === "es"
        ? "Mujer"
        : "Women"
      : "Unisex";

  const message =
    lang === "es"
      ? `Hola! Vi tus Crocs en Jackie Crocs. Me interesa el modelo ${item.model_name}, color ${item.color}, talla ${item.size}. ¿Sigue disponible?`
      : `Hi! I saw your Crocs on Jackie Crocs. I'm interested in the ${item.model_name}, color ${item.color}, size ${item.size}. Is it still available?`;

  const waUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

  const buttonLabel =
    lang === "es" ? "Preguntar por WhatsApp" : "Message on WhatsApp";

  return (
    <article className="group bg-white/90 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md hover:border-emerald-200 transition overflow-hidden flex flex-col">
      <div className="px-4 pt-4 pb-3 flex-1 space-y-1.5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-sm text-gray-900">
            {item.model_name}
          </h3>
          <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
            {lang === "es" ? "Disponible" : "Available"}
          </span>
        </div>
         <p className="text-xs text-gray-600">
        {lang === "es" ? "Color:" : "Color:"}{" "}
        <span className="font-medium">
            {translateColor(item.color, lang)}
        </span>
        </p>
        <p className="text-xs text-gray-600">
          {lang === "es" ? "Talla:" : "Size:"}{" "}
          <span className="inline-flex items-center rounded-full border border-gray-200 px-2 py-0.5 text-[11px] font-medium">
            {item.size}
          </span>
        </p>
        <p className="text-xs text-gray-600">
          {lang === "es" ? "Para:" : "For:"}{" "}
          <span className="font-medium">{genderLabel}</span>
        </p>
        <p className="text-sm mt-1">
          <span className="font-semibold text-gray-900">
            ${item.price_mxn.toFixed(0)} MXN
          </span>
        </p>
      </div>

      <div className="px-4 pb-3 pt-2 border-t border-gray-100 bg-gray-50/80">
        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex w-full items-center justify-center rounded-full bg-emerald-600 px-3 py-2 text-xs font-medium text-white hover:bg-emerald-700 active:scale-[0.99] transition"
        >
          {buttonLabel}
        </a>
      </div>
    </article>
  );
}
