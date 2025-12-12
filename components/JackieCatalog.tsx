// components/JackieCatalog.tsx
"use client";

import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/lib/supabaseClient";
import { track } from "@vercel/analytics";

type Lang = "es" | "en";
type AppTab = "home" | "catalog" | "messages" | "info";
type BuyerType = "all" | "men" | "women" | "kids" | "youth";

type PublicItem = {
  id: string;
  model_name: string;
  color: string; // English (from colors.name_en)
  size: string;  // human label from sizes.label (e.g. "M10-W12", "C8", "J1")
  size_id: string; // FK to sizes.id
  price_mxn: number;
  availableCount: number; // number of pairs for this variant
};


type CartLine = {
  item: PublicItem;
  count: number;
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
    case "baby pink":
      return "Rosa Pastel";
    case "red":
      return "Rojo";
    case "lilac":
      return "Lila";
    case "arctic":
      return "Azul Ártico";
    case "camo":
      return "Camuflaje";
    default:
      return colorEn;
  }
}

function translateModelLabel(modelEn: string | null | undefined, lang: Lang) {
  if (!modelEn) return "";
  if (lang === "en") return modelEn;

  const key = modelEn.trim().toLowerCase();
  switch (key) {
    case "classic":
      return "Clásico";
    case "classic platform":
      return "Plataforma Clásica";
    default:
      return modelEn;
  }
}

function colorLineClass(colorEn: string) {
  switch (colorEn.trim().toLowerCase()) {
    case "black":
      return "bg-slate-900";
    case "white":
      return "bg-slate-200";
    case "beige":
      return "bg-yellow-100";
    case "pink":
    case "baby pink":
    case "rosa pastel":
      return "bg-pink-200";
    case "red":
      return "bg-red-500";
    case "lilac":
      return "bg-violet-200";
    case "artic":
      return "bh-sky-100";
    default:
      return "bg-slate-300";
  }
}

// -------- SIZE HELPERS (adult / kids / youth) --------

function inferSizeCategory(
  size: string
): "adult" | "kids" | "youth" | "unknown" {
  const s = size.trim().toUpperCase();
  if (/^M\d+-W\d+$/.test(s)) return "adult";
  if (/^C\d+$/.test(s)) return "kids";
  if (/^J\d+$/.test(s)) return "youth";
  return "unknown";
}

// Sorting: kids (C) → youth (J) → adult (M/W)
function sizeRank(size: string): number {
  const cat = inferSizeCategory(size);
  const s = size.trim().toUpperCase();

  if (cat === "kids") {
    const num = parseInt(s.slice(1), 10);
    return 100 + (Number.isNaN(num) ? 0 : num);
  }

  if (cat === "youth") {
    const num = parseInt(s.slice(1), 10);
    return 200 + (Number.isNaN(num) ? 0 : num);
  }

  if (cat === "adult") {
    const match = s.match(/^M(\d+)-W(\d+)$/);
    const men = match ? parseInt(match[1], 10) : 0;
    return 300 + (Number.isNaN(men) ? 0 : men);
  }

  return 1000;
}

function sizeMatchesBuyerType(size: string, buyerType: BuyerType): boolean {
  const cat = inferSizeCategory(size);

  // Always show everything if "all"
  if (buyerType === "all") return true;

  // If we couldn't parse the size pattern, treat as adult/unisex
  if (cat === "unknown") {
    return buyerType === "men" || buyerType === "women";
  }

  if (buyerType === "men" || buyerType === "women") {
    return cat === "adult";
  }
  if (buyerType === "kids") return cat === "kids";
  if (buyerType === "youth") return cat === "youth";

  return true;
}


// Main display formatter based on who the shoe is for
function formatSizeLabel(
  size: string,
  lang: Lang,
  buyerType: BuyerType = "all"
) {
  const isKids = size.startsWith("C");
  const isYouth = size.startsWith("J");

  // --- KIDS (C4, C5, ...) ---
  if (isKids) {
    // English: keep C prefix
    return `${size} (US)`;
  }

  // --- YOUTH (J1, J2, ...) ---
  if (isYouth) {
    // English: keep J prefix
    return `${size} (US)`;
  }

  // --- ADULT UNISEX (M10-W12) ---
  if (size.includes("-")) {
    const [m, w] = size.split("-");
    const men = m.replace(/M/i, "");
    const women = w.replace(/W/i, "");

    if (lang === "es") {
      if (buyerType === "men") return `Hombre ${men} (US)`;
      if (buyerType === "women") return `Mujer ${women} (US)`;
      // default: show both
      return `Hombre ${men} / Mujer ${women} (US)`;
    }

    // English
    if (buyerType === "men") return `Men ${men} (US)`;
    if (buyerType === "women") return `Women ${women} (US)`;
    return `${size} (US)`; // M10-W12 (US)
  }

  // --- FALLBACK (anything else) ---
  return `${size} (US)`;
}



const CROCS_PHOTOS = {
  black: {
    src: "/images/crocs-black.png",
    label: "Crocs negros",
  },
  beige: {
    src: "/images/crocs-beige.png",
    label: "Crocs beige",
  },
  white: {
    src: "/images/crocs-white.png",
    label: "Crocs blancos",
  },
  lila: {
    src: "/images/crocs-lila.png",
    label: "Crocs lila",
  },
  light_pink: {
    src: "/images/crocs-light-pink.png",
    label: "Crocs rosa pastel",
  },
  red: {
    src: "/images/crocs-red.png",
    label: "Crocs rojos",
  },
   arctic: {
    src: "/images/crocs-arctic.png",
    label: "Crocs Azul Ártico",
    },
    camo: {
      src: "/images/crocs-camo.png",
      label: "Crocs Camuflaje",
    },
} as const;

const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_PHONE || "";

const DELIVERY_SPOTS = [
  "Privada Pizaro - BLVD De las Americas",
  "Colectivo Paseo del Rio",
  "Zona Rio - Calimax Plus Rio",
  "Terrazas de la Presa",
  "UABC Otay",
];

function googleMapsLink(place: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    place + " Tijuana"
  )}`;
}

const MEX_BANK_INFO = {
  bankName: "Santander",
  accountName: "Jackeline Monge",
  accountNumber: "0140 2026 0401 0725 79",
} as const;

const MOBILE_INITIAL_VISIBLE = 6;
const DESKTOP_INITIAL_VISIBLE = 12;

// ---------- Helpers ----------

function availabilityText(count: number, lang: Lang) {
  if (lang === "es") {
    if (count <= 0) return "Sin stock";
    if (count === 1) return "Último par";
    if (count <= 3) return `Últimos ${count} pares`;
    if (count <= 9) return `Solo ${count} disponibles`;
    return `${count} disponibles`;
  } else {
    if (count <= 0) return "Out of stock";
    if (count === 1) return "Last pair";
    if (count <= 3) return `Last ${count} pairs`;
    if (count <= 9) return `Only ${count} available`;
    return `${count} available`;
  }
}

function buildWhatsAppMessage(cart: CartLine[], lang: Lang) {
  if (!cart.length) return "";

  const linesEs = cart.map(({ item, count }, idx) => {
    const colorEs = translateColor(item.color, "es");
    const modelEs =
      translateModelLabel(item.model_name || "Classic", "es") || "Crocs";
    const qtyLine = `Cantidad: ${count} ${count === 1 ? "par" : "pares"}`;
    return `• ${idx + 1}:
      Modelo: ${modelEs} Crocs
      Color: ${colorEs} (${item.color})
      Talla: ${item.size}
      Precio por par: $${item.price_mxn.toFixed(0)} MXN
      ${qtyLine}`;
  });

  const linesEn = cart.map(({ item, count }, idx) => {
    const modelEn = translateModelLabel(item.model_name || "Classic", "en");
    const qtyLine = `Quantity: ${count} ${count === 1 ? "pair" : "pairs"}`;
    return `• ${idx + 1}:
      Model: ${modelEn} Crocs
      Color: ${item.color}
      Size: ${item.size}
      Price per pair: $${item.price_mxn.toFixed(0)} MXN
      ${qtyLine}`;
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

function buildWhatsAppLink(cart: CartLine[], lang: Lang) {
  if (!WHATSAPP_NUMBER || !cart.length) return "#";
  const message = buildWhatsAppMessage(cart, lang);
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

function buildWhatsAppSupportLink(lang: Lang) {
  if (!WHATSAPP_NUMBER) return "#";

  const message =
    lang === "es"
      ? "Hola 👋 Tengo dudas sobre tallas o colores de los Crocs."
      : "Hi 👋 I have questions about Crocs sizes or colors.";

  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

function FeedbackBox({ lang, context }: { lang: Lang; context: string }) {
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">(
    "idle"
  );

  // allow any non-empty message; only block while sending
  const disabled = message.trim().length === 0 || status === "sending";

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (disabled) return;

    try {
      setStatus("sending");

      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, lang, context }),
      });

      if (!res.ok) throw new Error("Request failed");

      setStatus("success");
      setMessage("");

      // clear success after a bit so user can see it but send again later
      setTimeout(() => {
        setStatus("idle");
      }, 3000);
    } catch (err) {
      console.error(err);
      setStatus("error");
      setTimeout(() => setStatus("idle"), 3000);
    }
  }

  const label =
    lang === "es"
      ? "¿Cómo podemos mejorar tu experiencia?"
      : "How can we improve your experience?";

  const placeholder =
    lang === "es"
      ? "Cuéntanos si algo te confundió o qué te gustaría ver mejorado…"
      : "Tell us if something was confusing or what we could improve…";

  const buttonText =
    status === "sending"
      ? lang === "es"
        ? "Enviando..."
        : "Sending..."
      : lang === "es"
      ? "Enviar comentario"
      : "Send feedback";

  const successText =
    lang === "es"
      ? "¡Gracias por tu comentario! 💚"
      : "Thanks for your feedback! 💚";

  const errorText =
    lang === "es"
      ? "Hubo un error al enviar. Intenta de nuevo 🙏"
      : "There was an error sending. Please try again 🙏";

  return (
    <section className="mt-4 rounded-3xl bg-white border border-slate-100 p-4 shadow-sm space-y-2">
      <form onSubmit={handleSubmit} className="space-y-2">
        <label className="block text-sm font-semibold text-slate-900">
          {label}
        </label>

        <textarea
          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-base text-slate-800 outline-none focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100 transition"
          rows={3}
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);
            if (status === "success" || status === "error") {
              setStatus("idle");
            }
          }}
          placeholder={placeholder}
          inputMode="text"
          autoComplete="off"
          autoCorrect="on"
          spellCheck={true}
        />

        <div className="flex items-center justify-between gap-2">
          <p className="text-[10px] text-slate-500">
            {lang === "es" ? "Se envía de forma anónima" : "Sent anonymously"}
          </p>
          <button
            type="submit"
            disabled={disabled}
            className={`inline-flex items-center rounded-full px-4 py-1.5 text-xs font-semibold text-white transition ${
              disabled
                ? "bg-emerald-300 cursor-not-allowed"
                : "bg-emerald-500 hover:bg-emerald-400"
            }`}
          >
            {buttonText}
          </button>
        </div>
      </form>

      {status === "success" && (
        <p className="text-[11px] text-emerald-600">{successText}</p>
      )}
      {status === "error" && (
        <p className="text-[11px] text-red-500">{errorText}</p>
      )}
    </section>
  );
}

function SizeGuide({ lang }: { lang: Lang }) {
  const t = (es: string, en: string) => (lang === "es" ? es : en);

  const adultRows = [
    { crocs: "M4-W6", mx: "22" },
    { crocs: "M5-W7", mx: "23" },
    { crocs: "M6-W8", mx: "24" },
    { crocs: "M7-W9", mx: "25" },
    { crocs: "M8-W10", mx: "26" },
    { crocs: "M9-W11", mx: "27" },
    { crocs: "M10-W12", mx: "28" },
    { crocs: "M11", mx: "29" },
    { crocs: "M12", mx: "30" },
    { crocs: "M13", mx: "31" },
  ];

  const kidsRows = [
    { crocs: "C2", mx: "9" },
    { crocs: "C3", mx: "10" },
    { crocs: "C4", mx: "11" },
    { crocs: "C5", mx: "12" },
    { crocs: "C6", mx: "13" },
    { crocs: "C7", mx: "14" },
    { crocs: "C8", mx: "15" },
    { crocs: "C9", mx: "16" },
    { crocs: "C10", mx: "17" },
    { crocs: "C11", mx: "18" },
    { crocs: "C12", mx: "19" },
    { crocs: "C13", mx: "20" },
    { crocs: "J1", mx: "21" },
    { crocs: "J2", mx: "22" },
    { crocs: "J3", mx: "23" },
    { crocs: "J4", mx: "24" },
    { crocs: "J5", mx: "25" },
    { crocs: "J6", mx: "26" },
  ];

  return (
  <section id="size-guide" className="rounded-3xl bg-white border border-slate-200 shadow-sm p-4 space-y-4">
      <header className="space-y-1">
        <h3 className="text-sm font-semibold flex items-center gap-2 text-slate-900">
          <span>📏</span>
          <span>
            {t("¿Cómo elegir tu talla?", "How to choose your size")}
          </span>
        </h3>
        <p className="text-[11px] text-slate-600">
          {t(
            "Todas las tallas de nuestra página están en numeración US. Usa la talla que normalmente compras en México como referencia y, si estás entre dos tallas, te recomendamos elegir la siguiente.",
            "All sizes on this page use US sizing. Use the size you normally buy in Mexico as a reference and if you’re between two sizes, we recommend choosing the next one up."
          )}
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1.1fr)]">
        {/* Adult table */}
        <div className="space-y-2">
          <p className="text-[11px] font-semibold text-slate-800 uppercase tracking-wide">
            {t("Unisex adulto", "Unisex adult")}
          </p>
          <div className="overflow-hidden rounded-2xl border border-rose-100 bg-rose-50">
            <div className="grid grid-cols-2 text-[11px] font-semibold text-white bg-rose-500 px-3 py-2">
              <span>{t("Crocs", "Crocs")}</span>
              <span>{t("México", "Mexico size")}</span>
            </div>
            <div className="divide-y divide-rose-100">
              {adultRows.map((row) => (
                <div
                  key={row.crocs}
                  className="grid grid-cols-2 text-[11px] text-slate-800 px-3 py-1.5 bg-white/70"
                >
                  <span>{row.crocs}</span>
                  <span>{row.mx}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Kids / Youth table */}
        <div className="space-y-2">
          <p className="text-[11px] font-semibold text-slate-800 uppercase tracking-wide">
            {t("Infantil / Juvenil", "Kids / Youth")}
          </p>
          <div className="overflow-hidden rounded-2xl border border-emerald-100 bg-emerald-50">
            <div className="grid grid-cols-2 text-[11px] font-semibold text-white bg-emerald-500 px-3 py-2">
              <span>{t("Crocs", "Crocs")}</span>
              <span>{t("México", "Mexico size")}</span>
            </div>
            <div className="divide-y divide-emerald-100">
              {kidsRows.map((row) => (
                <div
                  key={row.crocs}
                  className="grid grid-cols-2 text-[11px] text-slate-800 px-3 py-1.5 bg-white/70"
                >
                  <span>{row.crocs}</span>
                  <span>{row.mx}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <ul className="space-y-1 text-[11px] text-slate-600">
        <li>
          •{" "}
          {t(
            "Al probarte tus Crocs, tus dedos no deben rozar la parte delantera y el talón debe llegar justo a la última línea de puntos de la suela.",
            "When you try on your Crocs, your toes shouldn’t touch the front and your heel should sit right on the last line of dots on the heel."
          )}
        </li>
        <li>
          •{" "}
          {t(
            "En modelos unisex, la letra M se refiere a tallas de hombre y la letra W a tallas de mujer (ejemplo: M9W11).",
            "On unisex models, M refers to men’s sizes and W to women’s sizes (example: M9W11)."
          )}
        </li>
      </ul>
    </section>
  );
}

function SizeGuideLink({ lang }: { lang: Lang }) {
  const t = (es: string, en: string) => (lang === "es" ? es : en);

  const scrollToGuide = () => {
    const el = document.getElementById("size-guide");
    if (!el) return;

    el.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  return (
    <button
      onClick={scrollToGuide}
      className="block text-xs text-rose-600 hover:text-rose-700 underline underline-offset-2 font-medium mb-2 flex items-center gap-1"
    >
      <span>📏</span>
      <span>{t("¿Cómo elegir tu talla?", "How to choose your size?")}</span>
    </button>
  );
}



// ---------- Component ----------

export function JackieCatalog() {
  const [lang, setLang] = useState<Lang>("es");
  const [tab, setTab] = useState<AppTab>("home");

  const [items, setItems] = useState<PublicItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const [buyerType, setBuyerType] = useState<BuyerType>("all");
  const [sizeFilter, setSizeFilter] = useState<string>("all");
  const [colorFilter, setColorFilter] = useState<string>("all");

  // item.id -> how many pairs user wants of that variant
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  const [pageSize, setPageSize] = useState<number>(MOBILE_INITIAL_VISIBLE);
  const [visibleCount, setVisibleCount] =
    useState<number>(MOBILE_INITIAL_VISIBLE);

  const [isMobile, setIsMobile] = useState(false);

  const t = (es: string, en: string) => (lang === "es" ? es : en);

  // Restore last tab from localStorage (so refresh stays on same tab)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const saved = window.localStorage.getItem("jackie_tab");
    if (
      saved === "home" ||
      saved === "catalog" ||
      saved === "messages" ||
      saved === "info"
    ) {
      setTab(saved as AppTab);
    }
  }, []);

  // Save tab to localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("jackie_tab", tab);
  }, [tab]);

   async function loadInventory() {
    setLoading(true);
    setErrorMsg(null);

    const { data, error } = await supabase
      .from("inventory_items")
      .select(
        `
         id,
        size_id,
        price_mxn,
        status,
        created_at,
        models ( name ),
        colors ( name_en ),
        sizes (
          id,
          label,
          category,
          men_size_us,
          women_size_us,
          kids_code,
          youth_code,
          sort_order
        )
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

    // Group by model + color + size_id + price
    const variantMap = new Map<string, PublicItem>();

    (data ?? []).forEach((row: any) => {
      const model_name: string = row.models?.name ?? "";
      const color: string = row.colors?.name_en ?? "";
      const size_id: string = row.size_id as string;
      const sizeLabel: string = row.sizes?.label ?? "";

      const price_mxn: number = Number(row.price_mxn);

      // If something is off, skip the row (shouldn't happen since size_id is NOT NULL)
      if (!size_id || !sizeLabel) {
        console.warn("Skipping inventory row without size info", row);
        return;
      }

      // Use size_id in the key so we never confuse sizes from different categories
      const key = `${model_name}__${color}__${size_id}__${price_mxn}`;

      const existing = variantMap.get(key);
      if (existing) {
        existing.availableCount += 1;
      } else {
        variantMap.set(key, {
          id: row.id as string,
          model_name,
          color,
          size: sizeLabel,   // ← only from sizes.label
          size_id,
          price_mxn,
          availableCount: 1,
        });
      }
    });

    const mapped: PublicItem[] = Array.from(variantMap.values());

    setItems(mapped);

    // Clean up quantities for items that no longer exist
    setQuantities((prev) => {
      const next: Record<string, number> = {};
      for (const item of mapped) {
        const qty = prev[item.id] ?? 0;
        if (qty > 0) next[item.id] = Math.min(qty, item.availableCount);
      }
      return next;
    });

    setLastUpdated(new Date());
    setLoading(false);
  }


  // initial load
  useEffect(() => {
    loadInventory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // detect mobile vs desktop & set page size
  useEffect(() => {
    if (typeof window === "undefined") return;

    const compute = () => {
      const width = window.innerWidth;
      const mobile = width < 768;
      setIsMobile(mobile);

      const nextPageSize =
        width >= 1024 ? DESKTOP_INITIAL_VISIBLE : MOBILE_INITIAL_VISIBLE;
      setPageSize(nextPageSize);
      setVisibleCount(nextPageSize);
    };

    compute();
    window.addEventListener("resize", compute);
    return () => window.removeEventListener("resize", compute);
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
    setVisibleCount(pageSize);
  }, [sizeFilter, colorFilter, items.length, pageSize]);

  // when buyer type changes, reset size filter
  useEffect(() => {
    setSizeFilter("all");
  }, [buyerType]);

  const allSizes = Array.from(new Set(items.map((i) => i.size)))
    .filter((sz) => sizeMatchesBuyerType(sz, buyerType))
    .sort((a, b) => sizeRank(a) - sizeRank(b));

  const allColors = Array.from(new Set(items.map((i) => i.color)))
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));

  const filtered = items.filter((item) => {
    const byBuyer = sizeMatchesBuyerType(item.size, buyerType);
    const bySize = sizeFilter === "all" || item.size === sizeFilter;
    const byColor = colorFilter === "all" || item.color === colorFilter;
    return byBuyer && bySize && byColor;
  });

  const limited = filtered.slice(0, visibleCount);

  const cartLines: CartLine[] = items
    .map((item) => ({
      item,
      count: quantities[item.id] ?? 0,
    }))
    .filter((line) => line.count > 0);

  const waLinkForCart = buildWhatsAppLink(cartLines, lang);
  const supportWaLink = buildWhatsAppSupportLink(lang);

  const totalCartPairs = cartLines.reduce((sum, l) => sum + l.count, 0);

  const formattedLastUpdated =
    lastUpdated &&
    `${lastUpdated.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })}`;

  const handleAddToCart = (item: PublicItem) => {
    setQuantities((prev) => {
      const current = prev[item.id] ?? 0;
      if (current >= item.availableCount) return prev;
      return { ...prev, [item.id]: current + 1 };
    });
  };

  const handleRemoveFromCart = (itemId: string) => {
    setQuantities((prev) => {
      const current = prev[itemId] ?? 0;
      if (current <= 1) {
        const { [itemId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [itemId]: current - 1 };
    });
  };

  const showingCount = Math.min(visibleCount, filtered.length);
  const totalPairsFiltered = filtered.reduce(
    (sum, item) => sum + item.availableCount,
    0
  );

  // ------------------------------------------------------------------
  // MOBILE VIEW
  // ------------------------------------------------------------------

  if (isMobile) {
    const renderMobileHome = () => (
      <div className="space-y-4">
        {/* Hero card */}
        <section className="rounded-3xl bg-white/95 border border-emerald-100 shadow-sm p-4 space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-medium text-emerald-700 border border-emerald-100">
            <span>🛍️</span>
            <span>{t("Catálogo en tiempo real", "Live stock catalog")}</span>
          </div>

          <div className="space-y-1">
            <h1 className="text-xl font-semibold tracking-tight">
              {t(
                "Crocs disponibles en Tijuana 🐊",
                "Crocs available in Tijuana 🐊"
              )}
            </h1>
            <p className="text-[12px] text-slate-600">
              {t(
                "Elige color y talla, agrégalos al carrito y mándanos tu pedido por WhatsApp.",
                "Pick your color and size, add pairs to your cart and send your order on WhatsApp."
              )}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setTab("catalog")}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-emerald-500 text-white px-5 py-3 text-sm font-semibold shadow-md hover:bg-emerald-400 transition"
          >
            <span>🛒</span>
            <span>{t("Ver crocs disponibles", "View available Crocs")}</span>
          </button>

          <div className="flex flex-wrap items-center gap-2 text-[11px]">
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-3 py-1 border border-slate-200">
              📍 {t("Entrega en Tijuana", "Pickup in Tijuana")}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-3 py-1 border border-slate-200">
              💵 {t("Efectivo o transferencia", "Cash or bank transfer")}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-3 py-1 border border-slate-200">
              🇺🇸 {t("Tallas americanas", "US sizing")}
            </span>
          </div>

          {lastUpdated && (
            <p className="text-[10px] text-slate-500">
              {t("Última actualización", "Last updated")}:{" "}
              {formattedLastUpdated}
            </p>
          )}
        </section>

        {/* Photos strip */}
        <section className="rounded-3xl bg-white/95 border border-slate-100 p-3 space-y-2">
          <div className="flex items-center justify-between text-[12px]">
            <p className="font-medium">
              {t("Fotos reales del producto", "Real product photos")}
            </p>
            <p className="text-[10px] text-slate-500">
              {t("Tomadas por nosotros.", "Taken by us.")}
            </p>
          </div>
          <div className="flex gap-3 overflow-x-auto -mx-3 px-3 pb-1 snap-x snap-mandatory">
            {Object.values(CROCS_PHOTOS).map((photo) => (
              <div
                key={photo.src}
                className="snap-start min-w-[58%] sm:min-w-[30%] rounded-xl overflow-hidden bg-slate-50 border border-slate-100"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.src}
                  alt={photo.label}
                  className="h-40 sm:h-48 w-full object-cover"
                />
              </div>
            ))}
          </div>
        </section>

        {/* how it works */}
        <section className="rounded-3xl bg-white/95 border border-slate-100 p-4 space-y-2">
          <h2 className="text-sm font-semibold">
            {t("¿Cómo funciona?", "How it works")}
          </h2>
          <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-600">
            <li>
              {t(
                "Elige tus pares y agrégalos al carrito.",
                "Choose your pairs and add them to the cart."
              )}
            </li>
            <li>
              {t(
                "Envíanos tu carrito por WhatsApp para confirmar disponibilidad.",
                "Send your cart on WhatsApp to confirm availability."
              )}
            </li>
            <li>
              {t(
                "Acuerda punto de entrega y paga en efectivo o transferencia.",
                "Agree pickup spot and pay in cash or bank transfer."
              )}
            </li>
          </ol>
        </section>
      </div>
    );

    const renderMobileCatalog = () => (
      <div className="space-y-4">
        <div className="rounded-3xl bg-white/95 border border-slate-100 p-3 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-xs">
            <p className="font-medium">
              {t("Crocs disponibles", "Available Crocs")}
            </p>
            <button
              type="button"
              onClick={loadInventory}
              className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-medium text-slate-700 hover:border-emerald-400 hover:text-emerald-700 transition"
            >
              {loading
                ? t("Actualizando…", "Refreshing…")
                : t("Actualizar", "Refresh")}
            </button>
          </div>
          <p className="text-[11px] text-slate-500">
            {loading
              ? t("Cargando inventario…", "Loading inventory…")
              : t(
                  `${totalPairsFiltered} pares disponibles`,
                  `${totalPairsFiltered} pairs available`
                )}
          </p>

          <div className="mt-1 grid grid-cols-1 gap-2 text-[11px]">
            {/* Buyer type selector */}
            <select
              value={buyerType}
              onChange={(e) =>
                setBuyerType(e.target.value as BuyerType)
              }
              className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-[11px] text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
            >
              <option value="all">
                {lang === "es"
                  ? "Todos"
                  : "All"}
              </option>
              <option value="men">
                {lang === "es" ? "Para hombre" : "For men"}
              </option>
              <option value="women">
                {lang === "es" ? "Para mujer" : "For women"}
              </option>
              <option value="kids">
                {lang === "es" ? "Niños" : "Kids"}
              </option>
              <option value="youth">
                {lang === "es" ? "Juvenil" : "Youth"}
              </option>
            </select>

            <select
              value={sizeFilter}
              onChange={(e) => setSizeFilter(e.target.value)}
              className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-[11px] text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
            >
              <option value="all">
                {lang === "es" ? "Todas las tallas" : "All sizes"}
              </option>
              {allSizes.map((sz) => (
                <option key={sz} value={sz}>
                  {formatSizeLabel(sz, lang, buyerType)}
                </option>
              ))}
            </select>

            <select
              value={colorFilter}
              onChange={(e) => setColorFilter(e.target.value)}
              className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-[11px] text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
            >
              <option value="all">
                {lang === "es" ? "Todos los colores" : "All colors"}
              </option>
              {allColors.map((color) => (
                <option key={color} value={color}>
                  {translateColor(color, lang)}
                </option>
              ))}
            </select>
          </div>

          <p className="mt-2 text-[10px] text-slate-500">
            {t(
              "Primero elige si la talla es para hombre, mujer o niños. Luego filtra por talla y color.",
              "First choose if the size is for men, women or kids. Then filter by size and color."
            )}
          </p>

          {lastUpdated && (
            <p className="text-[10px] text-slate-500 mt-1">
              {t("Última actualización", "Last updated")}:{" "}
              {formattedLastUpdated}
            </p>
          )}
        </div>

         <button
          type="button"
          onClick={() => {
            // 1) Change tab to info
            setTab("info");

            // 2) After render, scroll to the size guide
            setTimeout(() => {
              if (typeof document === "undefined") return;
              const el = document.getElementById("size-guide");
              if (el) {
                el.scrollIntoView({
                  behavior: "smooth",
                  block: "start",
                });
              }
            }, 120); // a small delay so the Info tab content mounts
          }}
          className="block text-xs text-rose-600 hover:text-rose-700 underline underline-offset-2 font-medium mb-2 flex items-center gap-1"
        >
          <span>📏</span>
          <span>
            {lang === "es"
              ? "¿Cómo elegir tu talla?"
              : "How to choose your size?"}
          </span>
        </button>

        {/* Sticky cart CTA (only if cart has items) */}
        {totalCartPairs > 0 && (
          <div className="fixed inset-x-0 bottom-[76px] z-30">
            <div className="mx-auto max-w-md px-4">
              <a
                href={waLinkForCart || "#"}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => {
                  if (!WHATSAPP_NUMBER || !cartLines.length) return;
                  track("whatsapp_click_multi", {
                    count: totalCartPairs,
                    lang,
                    location: "catalog_mobile_sticky",
                  });
                }}
                className={`flex items-center justify-between gap-3 rounded-2xl px-4 py-3 shadow-lg border transition ${
                  WHATSAPP_NUMBER && cartLines.length
                    ? "bg-emerald-500 text-white border-emerald-400 hover:bg-emerald-400"
                    : "bg-slate-200 text-slate-500 border-slate-200 cursor-not-allowed"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">📲</span>
                  <div className="leading-tight">
                    <p className="text-sm font-semibold">
                      {t("Enviar carrito", "Send cart")}
                    </p>
                    <p className="text-[11px] opacity-90">
                      {lang === "es"
                        ? `${totalCartPairs} ${
                            totalCartPairs === 1 ? "par" : "pares"
                          } · WhatsApp`
                        : `${totalCartPairs} ${
                            totalCartPairs === 1 ? "pair" : "pairs"
                          } · WhatsApp`}
                    </p>
                  </div>
                </div>

                <span className="text-sm font-semibold">
                  {t("Enviar", "Send")} →
                </span>
              </a>
            </div>
          </div>
        )}



        {errorMsg ? (
          <p className="text-xs text-red-500">{errorMsg}</p>
        ) : filtered.length === 0 ? (
          <p className="text-xs text-slate-600">
            {t(
              "Por ahora no hay pares con estos filtros.",
              "No pairs match these filters right now."
            )}
          </p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              {limited.map((item) => {
                const qty = quantities[item.id] ?? 0;
                const colorText = translateColor(item.color, lang);
                const atMax = qty >= item.availableCount;
                const modelLabel = translateModelLabel(
                  item.model_name || "Classic",
                  lang
                );

                let buttonLabel: string;
                if (qty === 0) {
                  buttonLabel = lang === "es" ? "Agregar" : "Add";
                } else if (atMax) {
                  buttonLabel =
                    (lang === "es" ? "Máximo en carrito · " : "Max in cart · ") +
                    qty;
                } else {
                  buttonLabel =
                    (lang === "es" ? "Agregar otro · " : "Add another · ") +
                    qty;
                }

                return (
                  <article
                    key={item.id}
                    className="rounded-3xl bg-white/95 border border-slate-100 shadow-[0_8px_20px_rgba(15,23,42,0.03)] hover:shadow-[0_12px_32px_rgba(15,23,42,0.07)] hover:-translate-y-0.5 transition-all flex flex-col p-3 gap-2"
                  >
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <p className="text-[11px] font-semibold text-slate-900 line-clamp-1">
                          {modelLabel} Crocs
                        </p>

                        {/* COLOR LINE */}
                        <div
                          className={`mt-0.5 h-[4px] w-full rounded-full ${colorLineClass(
                            item.color
                          )} opacity-80`}
                        />

                        <p className="mt-1 text-[10px] text-slate-600 flex items-center gap-1.5">
                          <span>{colorText}</span>
                          <span className="text-slate-400">·</span>
                          <span>
                            {lang === "es" ? "Talla" : "Size"}{" "}
                            {formatSizeLabel(
                              item.size,
                              lang,
                              buyerType
                            )}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-1">
                      <div>
                        <p className="text-sm font-semibold text-emerald-600">
                          ${item.price_mxn.toFixed(0)} MXN
                        </p>
                        <p className="text-[10px] text-slate-500">
                          {availabilityText(item.availableCount, lang)}
                        </p>
                      </div>
                      <span className="inline-flex items-center rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 px-2.5 py-0.5 text-[9px]">
                        {lang === "es" ? "Disponible" : "Available"}
                      </span>
                    </div>

                    {/* BUTTONS / QTY CONTROL */}
                    <div className="mt-2">
                      {qty === 0 ? (
                        <button
                          type="button"
                          onClick={() => handleAddToCart(item)}
                          className="inline-flex w-full items-center justify-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-medium border bg-white text-slate-800 border-slate-200 hover:border-emerald-400 hover:text-emerald-700 transition"
                        >
                          <span>🛒</span>
                          <span>{lang === "es" ? "Agregar" : "Add"}</span>
                        </button>
                      ) : (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              handleRemoveFromCart(item.id)
                            }
                            className="inline-flex items-center justify-center h-8 w-8 rounded-full border border-slate-200 bg-white text-[16px] text-slate-700 hover:border-emerald-400 hover:text-emerald-700 transition"
                          >
                            –
                          </button>

                          <div className="flex-1 inline-flex items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[11px] font-medium text-emerald-800">
                            <span className="mr-1">🛒</span>
                            <span> x {qty} </span>
                            {atMax && (
                              <span className="ml-1 text-[10px] text-emerald-700">
                                ({lang === "es" ? "Máximo" : "Max"})
                              </span>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() => handleAddToCart(item)}
                            disabled={atMax}
                            className={`inline-flex items-center justify-center h-8 w-8 rounded-full border text-[16px] transition ${
                              atMax
                                ? "border-slate-200 text-slate-300 cursor-not-allowed bg-slate-50"
                                : "border-emerald-300 bg-white text-emerald-700 hover:bg-emerald-50"
                            }`}
                          >
                            +
                          </button>
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>

            <div className="flex flex-col items-center gap-2 mt-1">
              <p className="text-[10px] text-slate-500">
                {lang === "es"
                  ? `Mostrando ${showingCount} de ${filtered.length} opciones`
                  : `Showing ${showingCount} of ${filtered.length} options`}
              </p>
              {filtered.length > limited.length && (
                <button
                  type="button"
                  onClick={() =>
                    setVisibleCount((prev) => prev + pageSize)
                  }
                  className="inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-2 text-[11px] font-medium text-slate-800 hover:border-emerald-400 hover:text-emerald-700 transition"
                >
                  {lang === "es"
                    ? "Mostrar más opciones"
                    : "Show more options"}
                </button>
              )}
            </div>
          </>
        )}
        {/* Spacer so the fixed WhatsApp bar doesn’t cover the last cards */}
        {totalCartPairs > 0 && <div className="h-28" />}
      </div>
    );

    const renderMobileMessages = () => (
      <div className="space-y-4">
        <section className="rounded-3xl bg-white border border-slate-100 p-4 shadow-sm space-y-3">
          <h2 className="text-sm font-semibold">
            {t("Chatea por WhatsApp", "Chat on WhatsApp")}
          </h2>
          <p className="text-[11px] text-slate-600">
            {t(
              "Mándanos mensaje con talla y color que buscas. Respuestas de 9am a 7pm.",
              "Send us a message with the size and color you want. We reply from 9am to 7pm."
            )}
          </p>

          <a
            href={supportWaLink || "#"}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => {
              if (!WHATSAPP_NUMBER) return;
              track("whatsapp_click_support", { lang, location: "messages" });
            }}
            className={`inline-flex w-full items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition ${
              WHATSAPP_NUMBER
                ? "bg-emerald-500 text-white shadow-md hover:bg-emerald-400"
                : "bg-slate-200 text-slate-500 cursor-not-allowed"
            }`}
          >
            <span className="text-base">📲</span>
            <span>{t("Abrir WhatsApp", "Open WhatsApp")}</span>
          </a>

          <ul className="mt-2 space-y-1 text-[11px] text-slate-600">
            <li>
              •{" "}
              {t(
                "Incluye talla (US) y color.",
                "Include size (US) and color."
              )}
            </li>
            <li>
              •{" "}
              {t(
                "Te confirmamos existencia y punto de entrega.",
                "We confirm stock and pickup spot."
              )}
            </li>
            <li>
              •{" "}
              {t(
                "Puedes mandar captura de transferencia.",
                "You can send transfer screenshot."
              )}
            </li>
          </ul>
        </section>

        {cartLines.length > 0 && (
          <section className="rounded-3xl bg-white border border-slate-100 p-4 shadow-sm space-y-3">
            <h3 className="text-sm font-semibold">
              {t("Tu carrito", "Your cart")}
            </h3>
            <p className="text-[11px] text-slate-600">
              {t(
                "Estos pares se enviarán en el mensaje de WhatsApp:",
                "These pairs will be included in the WhatsApp message:"
              )}
            </p>
            <ul className="space-y-1 text-[11px] text-slate-700">
              {cartLines.map(({ item, count }, idx) => (
                <li key={item.id}>
                  {idx + 1}. {translateColor(item.color, lang)} ·{" "}
                  {t("Talla", "Size")} {item.size} · x{count} · $
                  {item.price_mxn.toFixed(0)} MXN
                </li>
              ))}
            </ul>

            <a
              href={waLinkForCart || "#"}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                if (!WHATSAPP_NUMBER || !cartLines.length) return;
                track("whatsapp_click_multi", {
                  count: totalCartPairs,
                  lang,
                  location: "messages_tab",
                });
              }}
              className={`inline-flex w-full items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition ${
                WHATSAPP_NUMBER && cartLines.length
                  ? "bg-emerald-500 text-white shadow-md hover:bg-emerald-400"
                  : "bg-slate-200 text-slate-500 cursor-not-allowed"
              }`}
            >
              <span>✅</span>
              <span>
                {t(
                  "Enviar carrito por WhatsApp",
                  "Send cart via WhatsApp"
                )}
              </span>
            </a>
          </section>
        )}
      </div>
    );

    const renderMobileInfo = () => (
      <div className="space-y-4">
        <section className="rounded-3xl bg-white border border-slate-100 p-4 shadow-sm space-y-2">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <span>🚚</span>
            <span>{t("Puntos de entrega", "Pickup spots")}</span>
          </h3>
          <ul className="space-y-2">
            {DELIVERY_SPOTS.map((spot) => (
              <li key={spot}>
                <a
                  href={googleMapsLink(spot)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-blue-600 hover:underline"
                >
                  <span className="text-red-500">📍</span>
                  <span>{spot}</span>
                </a>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-3xl bg-white border border-slate-100 p-4 shadow-sm space-y-2">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <span>🛍️</span>
            <span>{t("Apartados", "Reservations")}</span>
            <span>-</span>
            <span>{t("Pago por transferencia", "Pay by bank transfer")}</span>
          </h3>

          <p className="text-[11px] text-slate-700 leading-relaxed">
            {t(
              "Para Apartar tu par de Crocs a tu nombre, es necesario realizar un anticipo del 100% del total de tu compra.",
              "To reserve your pair of Crocs under your name, a 100% advance payment of the total purchase amount is required."
            )}
          </p>

          <p className="text-[11px] text-slate-700">
            {t(
              "Puedes hacerlo a la siguiente cuenta:",
              "You can make the deposit to the following account:"
            )}
          </p>

          <div className="space-y-1 text-[11px] text-slate-800">
            <p>
              <span className="font-medium">
                {t("Banco: ", "Bank: ")}
              </span>
              {MEX_BANK_INFO.bankName}
            </p>
            <p>
              <span className="font-medium">
                {t("Titular: ", "Account name: ")}
              </span>
              {MEX_BANK_INFO.accountName}
            </p>
            <p className="break-all">
              <span className="font-medium">
                {t("Cuenta: ", "Account: ")}
              </span>
              {MEX_BANK_INFO.accountNumber}
            </p>
            <p>
              <span className="font-medium">
                {t("Concepto: ", "Reference: ")}
              </span>
              {t("Tu Nombre", "Your Name")}
            </p>
          </div>

          <p className="text-[10px] text-slate-500 mt-1">
            {t(
              "Recuerda mandar foto de tu comprobante.",
              "Please remember to send a photo of your payment receipt."
            )}
          </p>
        </section>
        <SizeGuide lang={lang} />
        {/* Feedback box */}
        <FeedbackBox lang={lang} context="messages_mobile" />
      </div>
    );

    const headerSubtitle =
      tab === "home"
        ? t("Inicio", "Home")
        : tab === "catalog"
        ? t("Catálogo", "Catalog")
        : tab === "messages"
        ? t("Mensajes", "Messages")
        : t("Información", "Info");

    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-white text-slate-900">
        {/* Mobile header */}
        <header className="sticky top-0 z-20 border-b border-slate-100 bg-white/90 backdrop-blur-sm">
          <div className="mx-auto flex h-14 max-w-md items-center justify-between px-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-lg">
                🐊
              </div>
              <div className="leading-tight">
                <p className="text-sm font-semibold">Jacky Crocs</p>
                <p className="text-[10px] text-slate-500">
                  {headerSubtitle}
                </p>
              </div>
            </div>

            {/* language toggle */}
            <div className="inline-flex items-center rounded-full border border-slate-200 bg-slate-100 p-0.5 text-[10px] shadow-sm">
              <button
                type="button"
                onClick={() => setLang("es")}
                className={`px-2 py-0.5 rounded-full ${
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
                className={`px-2 py-0.5 rounded-full ${
                  lang === "en"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                EN
              </button>
            </div>
          </div>
        </header>

        {/* Main */}
        <main className="mx-auto max-w-md px-4 pt-4 pb-28 space-y-4">
          {tab === "home" && renderMobileHome()}
          {tab === "catalog" && renderMobileCatalog()}
          {tab === "messages" && renderMobileMessages()}
          {tab === "info" && renderMobileInfo()}
        </main>

        <nav className="fixed inset-x-0 bottom-0 z-20 bg-white/90 backdrop-blur border-t border-slate-200">
          <div className="mx-auto max-w-md px-4 pb-[calc(env(safe-area-inset-bottom,0px)+0.5rem)] pt-2">
            <div className="flex items-center justify-between rounded-full border border-slate-200 bg-white/95 px-4 py-2 text-[11px] shadow-lg">
              {(
                [
                  {
                    id: "home",
                    icon: "🏠",
                    labelEs: "Inicio",
                    labelEn: "Home",
                  },
                  {
                    id: "catalog",
                    icon: "🛒",
                    labelEs: "Catálogo",
                    labelEn: "Catalog",
                  },
                  {
                    id: "messages",
                    icon: "💬",
                    labelEs: "Mensajes",
                    labelEn: "Messages",
                  },
                  {
                    id: "info",
                    icon: "ℹ️",
                    labelEs: "Info",
                    labelEn: "Info",
                  },
                ] as {
                  id: AppTab;
                  icon: string;
                  labelEs: string;
                  labelEn: string;
                }[]
              ).map(({ id, icon, labelEs, labelEn }) => {
                const active = tab === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setTab(id)}
                    className={`flex flex-1 flex-col items-center justify-center gap-0.5 py-1 ${
                      active ? "text-emerald-600" : "text-slate-400"
                    }`}
                  >
                    <span
                      className={`flex h-7 w-7 items-center justify-center rounded-full text-base ${
                        active ? "bg-emerald-50" : "bg-slate-100"
                      }`}
                    >
                      {icon}
                    </span>

                    <span className={`text-[10px] leading-none ${active ? "font-medium" : ""}`}>
                      {lang === "es" ? labelEs : labelEn}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </nav>
      </div>
    );
  }

  // ------------------------------------------------------------------
  // DESKTOP / TABLET VIEW
  // ------------------------------------------------------------------

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-slate-50 to-white text-slate-900 pb-24">
      {/* TOP NAV */}
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-full bg-emerald-500 flex items-center justify-center text-lg text-white">
              🐊
            </div>
            <div className="leading-tight">
              <p className="text-sm font-semibold">Jacky Crocs</p>
              <p className="text-[11px] text-slate-500">
                {t("Crocs · Tijuana", "Crocs · Tijuana")}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Lang toggle */}
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

            {/* Support CTA */}
            <a
              href={supportWaLink || "#"}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                if (!WHATSAPP_NUMBER) return;
                track("whatsapp_click_support", { lang, location: "nav" });
              }}
              className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-medium border transition ${
                WHATSAPP_NUMBER
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                  : "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
              }`}
            >
              <span>📲</span>
              <span>
                {lang === "es"
                  ? "Dudas por WhatsApp"
                  : "Questions on WhatsApp"}
              </span>
            </a>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 space-y-8">
        {/* HERO / STORE HEADER */}
        <section className="rounded-3xl bg-white/90 border border-emerald-100 shadow-sm p-4 sm:p-6">
          <div className="grid gap-6 md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] items-center">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-medium text-emerald-700 border border-emerald-100">
                <span>🛍️</span>
                <span>
                  {lang === "es"
                    ? "Catálogo en tiempo real"
                    : "Live stock catalog"}
                </span>
              </div>

              <div className="space-y-2">
                <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">
                  {lang === "es"
                    ? "Crocs disponibles en Tijuana 🐊"
                    : "Crocs available in Tijuana 🐊"}
                </h1>
                <p className="text-sm text-slate-600 max-w-md">
                  {lang === "es"
                    ? "Elige color y talla, agrégalos al carrito y mándanos tu pedido por WhatsApp. Terminamos la compra ahí mismo."
                    : "Pick your color and size, add pairs to your cart and send your order on WhatsApp. We finish the purchase there."}
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById("inventory-grid");
                  if (el) el.scrollIntoView({ behavior: "smooth" });
                }}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-500 text-white px-6 py-3 text-sm font-semibold shadow-md hover:bg-emerald-400 transition"
              >
                <span>🛒</span>
                <span>
                  {lang === "es"
                    ? "Ver crocs disponibles"
                    : "View available Crocs"}
                </span>
              </button>

              <div className="flex flex-wrap items-center gap-2 text-[11px] sm:text-xs">
                <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 border border-slate-200">
                  📍{" "}
                  {lang === "es" ? "Entrega en Tijuana" : "Pickup in Tijuana"}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 border border-slate-200">
                  💵{" "}
                  {lang === "es"
                    ? "Pago en efectivo o transferencia"
                    : "Cash or bank transfer"}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 border border-slate-200">
                  🇺🇸 {lang === "es" ? "Tallas americanas" : "US sizing"}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 border border-slate-200">
                  ⏰ {lang === "es" ? "Respuestas 9am–7pm" : "9am–7pm replies"}
                </span>
              </div>

              {lastUpdated && (
                <p className="text-[11px] text-slate-500">
                  {t("Última actualización", "Last updated")}:{" "}
                  {formattedLastUpdated}
                </p>
              )}
            </div>

            {/* Hero highlight card */}
            <div className="w-full max-w-sm mx-auto md:mx-0">
              <div className="rounded-3xl bg-gradient-to-br from-emerald-50 via-white to-sky-50 border border-emerald-100 shadow-sm p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/80 px-2.5 py-1 text-[10px] font-medium text-emerald-700 border border-emerald-100">
                    🌟{" "}
                    {lang === "es"
                      ? "Crocs originales"
                      : "Original Crocs"}
                  </span>
                  <p className="text-xs text-slate-500">
                    {lang === "es" ? "Desde" : "From"} $700 MXN
                  </p>
                </div>

                <div className="rounded-2xl bg-white/70 border border-emerald-100 px-4 py-5 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold text-slate-900">
                      {lang === "es"
                        ? "Colores disponibles"
                        : "Available colors"}
                    </p>
                    <p className="text-[11px] text-slate-600">
                      {lang === "es"
                        ? "Negro · Blanco · Beige · Rojo · Lila · Rosa Pastel"
                        : "Black · White · Beige · Red · Lilac · Light Pink"}
                    </p>
                    <p className="mt-2 text-[10px] text-slate-500">
                      {lang === "es"
                        ? "Tallas americanas para mujer y hombre."
                        : "US sizing for women and men."}
                    </p>
                  </div>
                  <div className="text-4xl md:text-5xl">🐊</div>
                </div>

                <p className="text-[11px] text-slate-600">
                  {lang === "es"
                    ? "Elige tus pares, agrégalos al carrito y mándalos por WhatsApp para confirmar disponibilidad y coordinar entrega."
                    : "Pick your pairs, add them to the cart and send them on WhatsApp to confirm stock and arrange pickup."}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* PHOTO STRIP */}
        <section className="rounded-2xl bg-white border border-slate-100 p-3 sm:p-4 space-y-2">
          <div className="flex items-center justify-between text-[12px] sm:text-sm">
            <p className="font-medium">
              {lang === "es"
                ? "Fotos reales del producto"
                : "Real product photos"}
            </p>
            <p className="text-[11px] text-slate-500">
              {lang === "es" ? "Tomadas por nosotros." : "Taken by us."}
            </p>
          </div>

          <div className="flex gap-3 overflow-x-auto -mx-3 px-3 pb-1 snap-x snap-mandatory">
            {Object.values(CROCS_PHOTOS).map((photo) => (
              <div
                key={photo.src}
                className="snap-start min-w-[58%] sm:min-w-[30%] rounded-xl overflow-hidden bg-slate-50 border border-slate-100"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.src}
                  alt={photo.label}
                  className="h-40 sm:h-48 w-full object-cover"
                />
              </div>
            ))}
          </div>
        </section>

        {/* FILTER BAR */}
        <section className="rounded-2xl bg-white border border-slate-100 p-3 sm:p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-medium text-slate-900">
              {lang === "es" ? "Crocs disponibles" : "Available Crocs"}
            </p>
            <div className="flex items-center gap-2 text-[11px]">
              {loading ? (
                <span className="text-slate-500">
                  {t("Cargando...", "Loading...")}
                </span>
              ) : (
                <span className="text-slate-500">
                  {lang === "es"
                    ? `${totalPairsFiltered} pares disponibles`
                    : `${totalPairsFiltered} pairs available`}
                </span>
              )}
              <button
                type="button"
                onClick={loadInventory}
                className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-medium text-slate-800 hover:border-emerald-400 hover:text-emerald-700 transition"
              >
                {loading
                  ? t("Actualizando…", "Refreshing…")
                  : t("Actualizar", "Refresh")}
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 text-[11px]">
            <div className="flex-1 flex flex-col gap-1">
              <span className="text-slate-700">
                {lang === "es"
                  ? "¿Para quién es la talla?"
                  : "Who is the size for?"}
              </span>
              <select
                value={buyerType}
                onChange={(e) =>
                  setBuyerType(e.target.value as BuyerType)
                }
                className="appearance-none rounded-full border border-slate-200 bg-white px-4 py-2 text-[11px] text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
              >
                <option value="all">
                  {lang === "es"
                    ? "Todos"
                    : "All"}
                </option>
                <option value="men">
                  {lang === "es" ? "Para hombre" : "For men"}
                </option>
                <option value="women">
                  {lang === "es" ? "Para mujer" : "For women"}
                </option>
                <option value="kids">
                  {lang === "es" ? "Niños" : "Kids"}
                </option>
                <option value="youth">
                  {lang === "es" ? "Juvenil" : "Youth"}
                </option>
              </select>
            </div>

            <div className="flex-1 flex flex-col gap-1">
              <span className="text-slate-700">
                {lang === "es" ? "Filtrar por talla" : "Filter by size"}
              </span>
              <select
                value={sizeFilter}
                onChange={(e) => setSizeFilter(e.target.value)}
                className="appearance-none rounded-full border border-slate-200 bg-white px-4 py-2 text-[11px] text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
              >
                <option value="all">
                  {lang === "es" ? "Todas las tallas" : "All sizes"}
                </option>
                {allSizes.map((sz) => (
                  <option key={sz} value={sz}>
                    {formatSizeLabel(sz, lang, buyerType)}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex-1 flex flex-col gap-1">
              <span className="text-slate-700">
                {lang === "es" ? "Filtrar por color" : "Filter by color"}
              </span>
              <select
                value={colorFilter}
                onChange={(e) => setColorFilter(e.target.value)}
                className="appearance-none rounded-full border border-slate-200 bg-white px-4 py-2 text-[11px] text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
              >
                <option value="all">
                  {lang === "es" ? "Todos los colores" : "All colors"}
                </option>
                {allColors.map((color) => (
                  <option key={color} value={color}>
                    {translateColor(color, lang)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <p className="mt-1 text-[10px] text-slate-500">
            {lang === "es"
              ? "Primero elige si es para hombre, mujer o niños; luego puedes filtrar por talla y color."
              : "First choose if it's for men, women or kids; then you can filter by size and color."}
          </p>
        </section>

        {/* PRODUCT GRID */}
        <section id="inventory-grid">
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
            <div className="space-y-3">
                <SizeGuideLink lang={lang} />
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                {limited.map((item) => {
                  const qty = quantities[item.id] ?? 0;
                  const colorText = translateColor(item.color, lang);
                  const atMax = qty >= item.availableCount;
                  const modelLabel = translateModelLabel(
                    item.model_name || "Classic",
                    lang
                  );

                  let buttonLabel: string;
                  if (qty === 0) {
                    buttonLabel =
                      lang === "es" ? "Agregar al carrito" : "Add to cart";
                  } else if (atMax) {
                    buttonLabel =
                      (lang === "es" ? "Máximo en carrito · " : "Max in cart · ") +
                      qty;
                  } else {
                    buttonLabel =
                      (lang === "es" ? "Agregar otro · " : "Add another · ") +
                      qty;
                  }

                  return (
                    <article
                      key={item.id}
                      className="rounded-3xl bg-white border border-slate-100 shadow-[0_10px_26px_rgba(15,23,42,0.03)] hover:shadow-[0_16px_40px_rgba(15,23,42,0.08)] hover:-translate-y-0.5 transition-all flex flex-col p-4 gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          <h3 className="text-sm font-semibold text-slate-900 line-clamp-1">
                            {modelLabel} Crocs
                          </h3>

                          <div
                            className={`mt-0.5 h-[4px] w-full rounded-full ${colorLineClass(
                              item.color
                            )} opacity-80`}
                          />

                          <p className="mt-1 text-[11px] text-slate-600 flex items-center gap-1.5">
                            <span>{colorText}</span>
                            <span className="text-slate-400">·</span>
                            <span>
                              {lang === "es" ? "Talla" : "Size"}{" "}
                              {formatSizeLabel(
                                item.size,
                                lang,
                                buyerType
                              )}
                            </span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-base font-semibold text-emerald-600">
                            ${item.price_mxn.toFixed(0)} MXN
                          </p>
                          <p className="text-[10px] text-slate-500">
                            {availabilityText(item.availableCount, lang)}
                          </p>
                        </div>
                        <span className="inline-flex items-center rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 px-3 py-0.5 text-[10px]">
                          {lang === "es" ? "Disponible" : "Available"}
                        </span>
                      </div>

                      {/* BUTTONS / QTY CONTROL */}
                      <div className="mt-2">
                        {qty === 0 ? (
                          <button
                            type="button"
                            onClick={() => handleAddToCart(item)}
                            className="inline-flex w-full items-center justify-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-medium border bg-white text-slate-800 border-slate-200 hover:border-emerald-400 hover:text-emerald-700 transition"
                          >
                            <span>🛒</span>
                            <span>{lang === "es" ? "Agregar" : "Add"}</span>
                          </button>
                        ) : (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                handleRemoveFromCart(item.id)
                              }
                              className="inline-flex items-center justify-center h-8 w-8 rounded-full border border-slate-200 bg-white text-[16px] text-slate-700 hover:border-emerald-400 hover:text-emerald-700 transition"
                            >
                              –
                            </button>

                            <div className="flex-1 inline-flex items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[11px] font-medium text-emerald-800">
                              <span className="mr-1">🛒</span>
                              <span>
                                {lang === "es"
                                  ? "En carrito"
                                  : "In cart"}{" "}
                                · x
                                {qty}
                              </span>
                              {atMax && (
                                <span className="ml-1 text-[10px] text-emerald-700">
                                  ({lang === "es" ? "Máximo" : "Max"})
                                </span>
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={() => handleAddToCart(item)}
                              disabled={atMax}
                              className={`inline-flex items-center justify-center h-8 w-8 rounded-full border text-[16px] transition ${
                                atMax
                                  ? "border-slate-200 text-slate-300 cursor-not-allowed bg-slate-50"
                                  : "border-emerald-300 bg-white text-emerald-700 hover:bg-emerald-50"
                              }`}
                            >
                              +
                            </button>
                          </div>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>

              <div className="flex flex-col items-center gap-2">
                <p className="text-[10px] text-slate-500">
                  {lang === "es"
                    ? `Mostrando ${showingCount} de ${filtered.length} opciones`
                    : `Showing ${showingCount} of ${filtered.length} options`}
                </p>

                {filtered.length > limited.length && (
                  <button
                    type="button"
                    onClick={() =>
                      setVisibleCount((prev) => prev + pageSize)
                    }
                    className="inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-2 text-[11px] font-medium text-slate-800 hover:border-emerald-400 hover:text-emerald-700 transition"
                  >
                    {lang === "es"
                      ? "Mostrar más opciones"
                      : "Show more options"}
                  </button>
                )}
              </div>
            </div>
          )}
        </section>

        {/* HOW IT WORKS + DELIVERY / PAYMENT */}
        <section className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-4 space-y-3">
            <h3 className="text-sm font-semibold text-slate-900">
              {lang === "es" ? "¿Cómo funciona?" : "How it works"}
            </h3>
            <div className="grid sm:grid-cols-3 gap-3 text-[11px] text-slate-600">
              <div className="space-y-1">
                <p className="font-medium">
                  1. {t("Elige tus pares", "Pick pairs")}
                </p>
                <p>
                  {t(
                    "Filtra por talla y color, y agrégalos al carrito.",
                    "Filter by size and color, then add to cart."
                  )}
                </p>
              </div>
              <div className="space-y-1">
                <p className="font-medium">2. WhatsApp</p>
                <p>
                  {t(
                    "Envía tu carrito por WhatsApp para confirmar disponibilidad.",
                    "Send your cart on WhatsApp to confirm stock."
                  )}
                </p>
              </div>
              <div className="space-y-1">
                <p className="font-medium">
                  3. {t("Entrega y pago", "Pickup & pay")}
                </p>
                <p>
                  {t(
                    "Acuerda punto y horario. Pagas en efectivo o transferencia.",
                    "Agree pickup spot and time. Pay in cash or bank transfer."
                  )}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-4 space-y-2">
              <h3 className="text-sm font-medium flex items-center gap-2 text-slate-900">
                <span>🚚</span>
                {lang === "es" ? "Puntos de entrega" : "Pickup spots"}
              </h3>
             <ul className="space-y-2">
                {DELIVERY_SPOTS.map((spot) => (
                  <li key={spot}>
                    <a
                      href={googleMapsLink(spot)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-blue-600 hover:underline"
                    >
                      <span className="text-red-500">📍</span>
                      <span>{spot}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-4 space-y-2">
              <h3 className="text-sm font-medium flex items-center gap-2 text-slate-900">
                <span>🛍️</span>
                <span>{t("Apartados", "Reservations")}</span>
                <span>-</span>
                <span>
                  {t("Pago por transferencia", "Pay by bank transfer")}
                </span>
              </h3>

              <p className="text-[11px] text-slate-700 leading-relaxed">
                {t(
                  "Para Apartar tu par de Crocs a tu nombre, es necesario realizar un anticipo del 100% del total de tu compra.",
                  "To reserve your pair of Crocs under your name, a 100% advance payment of the total purchase amount is required."
                )}
              </p>

              <p className="text-[11px] text-slate-700">
                {t(
                  "Puedes hacerlo a la siguiente cuenta:",
                  "You can make the deposit to the following account:"
                )}
              </p>

              <div className="space-y-1 text-[11px] text-slate-800">
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
                  {t("Tu Nombre", "Your Name")}
                </p>
              </div>
            </div>
          </div>
        </section>
        <SizeGuide lang={lang} />
      </div>

      {/* STICKY CART BAR (desktop/tablet) */}
      {totalCartPairs > 0 && (
        <div className="fixed bottom-0 inset-x-0 z-30 border-t border-slate-200 bg-white/95 backdrop-blur shadow-[0_-8px_30px_rgba(15,23,42,0.12)]">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="text-[11px] text-slate-700">
              {lang === "es"
                ? `✅ ${totalCartPairs} ${
                    totalCartPairs === 1
                      ? "par listo para enviar por WhatsApp"
                      : "pares listos para enviar por WhatsApp"
                  }`
                : `✅ ${totalCartPairs} ${
                    totalCartPairs === 1
                      ? "pair ready to send on WhatsApp"
                      : "pairs ready to send on WhatsApp"
                  }`}
            </p>
            <a
              href={waLinkForCart || "#"}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                if (!WHATSAPP_NUMBER || !totalCartPairs) return;
                track("whatsapp_click_multi", {
                  count: totalCartPairs,
                  lang,
                  location: "sticky_cart",
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
