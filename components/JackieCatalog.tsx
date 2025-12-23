// components/JackieCatalog.tsx
"use client";

import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/lib/supabaseClient";
import { track } from "@vercel/analytics";
import Image from "next/image";

type Lang = "es" | "en";
type AppTab = "home" | "catalog" | "messages" | "info";
type BuyerType = "all" | "men" | "women" | "kids" | "youth";

type LocationOption = {
  slug: string;
  name: string;
};

type PublicItem = {
  id: string;

  model_name: string;
  color: string; // English (from colors.name_en)

  size: string; // human label from sizes.label (e.g. "M10-W12", "C8", "J1")
  size_id: string; // FK to sizes.id

  // ✅ location
  location_slug: string; // from locations.slug (e.g. "tijuana")
  location_name: string; // from locations.name (e.g. "Tijuana")

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
    case "light pink shimmer":
      return "Rosa Claro con Brillo";
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
    case "classic shimmer gemstone":
      return "Clásico Shimmer Gemstone";
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
    case "lila":
      return "bg-violet-200";
    case "arctic":
      return "bg-sky-100";
    case "camo":
    case "camuflaje":
      return "bg-emerald-200";
    case "light pink shimmer":
    case "pink shimmer":
    case "shimmer pink":
      return "bg-rose-200";
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

// Kept for possible future use; not used in new layout but harmless.
function sizeMatchesBuyerType(size: string, buyerType: BuyerType): boolean {
  const cat = inferSizeCategory(size);

  if (buyerType === "all") return true;

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

function formatSizeLabel(size: string, lang: Lang, buyerType: BuyerType = "all") {
  const isKids = size.startsWith("C");
  const isYouth = size.startsWith("J");

  if (isKids) {
    return lang === "es" ? `Niños ${size} (US)` : `Kids ${size} (US)`;
  }

  if (isYouth) {
    return lang === "es" ? `Juvenil ${size} (US)` : `Junior ${size} (US)`;
  }

  if (size.includes("-")) {
    const [m, w] = size.split("-");
    const men = m.replace(/M/i, "");
    const women = w.replace(/W/i, "");

    if (lang === "es") {
      if (buyerType === "men") return `Hombre ${men} (US)`;
      if (buyerType === "women") return `Mujer ${women} (US)`;
      return `Hombre ${men} / Mujer ${women} (US)`;
    }

    if (buyerType === "men") return `Men ${men} (US)`;
    if (buyerType === "women") return `Women ${women} (US)`;
    return `${size} (US)`;
  }

  return `${size} (US)`;
}

const SUPABASE_IMAGE_BASE =
  "https://axrfkuupjoddsoswowac.supabase.co/storage/v1/object/public/product-images";

const CROCS_PHOTOS = {
  black: {
    src: `${SUPABASE_IMAGE_BASE}/crocs-black.png`,
    label: "Crocs negros",
  },
  beige: {
    src: `${SUPABASE_IMAGE_BASE}/crocs-beige.png`,
    label: "Crocs beige",
  },
  white: {
    src: `${SUPABASE_IMAGE_BASE}/crocs-white.png`,
    label: "Crocs blancos",
  },
  lila: {
    src: `${SUPABASE_IMAGE_BASE}/crocs-lila.png`,
    label: "Crocs lila",
  },
  light_pink: {
    src: `${SUPABASE_IMAGE_BASE}/crocs-light-pink.png`,
    label: "Crocs rosa pastel",
  },
  red: {
    src: `${SUPABASE_IMAGE_BASE}/crocs-red.png`,
    label: "Crocs rojos",
  },
  arctic: {
    src: `${SUPABASE_IMAGE_BASE}/crocs-arctic.png`,
    label: "Crocs Azul Ártico",
  },
  camo: {
    src: `${SUPABASE_IMAGE_BASE}/crocs-camo.png`,
    label: "Crocs Camuflaje",
  },
  gem: {
    src: `${SUPABASE_IMAGE_BASE}/croc-light-pink-shimmer.png`,
    label: "Rosa Claro con Brillo",
  },
} as const;

type CrocsPhotoKey = keyof typeof CROCS_PHOTOS;

function getPhotoForColor(colorEn: string): (typeof CROCS_PHOTOS)[CrocsPhotoKey] | null {
  const key = colorEn.trim().toLowerCase();

  if (key === "black") return CROCS_PHOTOS.black;
  if (key === "white") return CROCS_PHOTOS.white;
  if (key === "beige") return CROCS_PHOTOS.beige;
  if (key === "lilac" || key === "lila") return CROCS_PHOTOS.lila;
  if (key === "red") return CROCS_PHOTOS.red;
  if (key === "arctic") return CROCS_PHOTOS.arctic;
  if (key === "camo" || key === "camuflaje") return CROCS_PHOTOS.camo;
  if (key === "baby pink" || key === "light pink") return CROCS_PHOTOS.light_pink;
  if (key.includes("shimmer")) return CROCS_PHOTOS.gem;

  return null;
}

/** WhatsApp numbers */
const WHATSAPP_NUMBER_TIJUANA =
  process.env.NEXT_PUBLIC_WHATSAPP_PHONE_TIJUANA || "";

const WHATSAPP_NUMBER_MEXICALI =
  process.env.NEXT_PUBLIC_WHATSAPP_PHONE_MEXICALI || "";

// Delivery spots per location
const DELIVERY_SPOTS_BY_LOCATION: Record<string, string[]> = {
  tijuana: [
    "Privada Pizaro - BLVD De las Americas",
    "Colectivo Paseo del Rio",
    "Zona Rio - Calimax Plus Rio",
    "Terrazas de la Presa",
    "UABC Otay",
  ],
  mexicali: [],
};

function googleMapsLink(place: string, city: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${place} ${city}`
  )}`;
}

const MEX_BANK_INFO = {
  bankName: "Santander",
  accountName: "Jackeline Monge",
  accountNumber: "0140 2026 0401 0725 79",
} as const;

const MOBILE_INITIAL_VISIBLE = 4;
const DESKTOP_INITIAL_VISIBLE = 8;

// ---------- WhatsApp helper functions ----------

function getWhatsAppNumberForLocationSlug(slug: string | "all") {
  if (slug === "mexicali") {
    return WHATSAPP_NUMBER_MEXICALI || WHATSAPP_NUMBER_TIJUANA;
  }

  if (slug === "tijuana" || slug === "all") {
    return WHATSAPP_NUMBER_TIJUANA || WHATSAPP_NUMBER_MEXICALI;
  }

  return WHATSAPP_NUMBER_TIJUANA || WHATSAPP_NUMBER_MEXICALI;
}

type CartLocationState = "empty" | "single" | "mixed";

function getCartLocationInfo(cart: CartLine[]): {
  state: CartLocationState;
  slug: string | null;
} {
  if (!cart.length) return { state: "empty", slug: null };

  const slugs = new Set(
    cart.map((line) => line.item.location_slug || "unknown")
  );

  if (slugs.size === 1) {
    const [slug] = Array.from(slugs);
    return { state: "single", slug };
  }

  return { state: "mixed", slug: null };
}

// Support WA link by selected location
function buildWhatsAppSupportLink(lang: Lang, locationSlug: string | "all") {
  const phone = getWhatsAppNumberForLocationSlug(locationSlug);
  if (!phone) return "#";

  const message =
    lang === "es"
      ? "Hola 👋 Tengo dudas sobre tallas o colores de los Crocs."
      : "Hi 👋 I have questions about Crocs sizes or colors.";

  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

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

    const locLine = item.location_name
      ? `Ubicación: ${item.location_name}`
      : "";

    return `• ${idx + 1}:
      ${locLine ? `${locLine}\n      ` : ""}Modelo: ${modelEs} Crocs
      Color: ${colorEs} (${item.color})
      Talla: ${item.size}
      Precio por par: $${item.price_mxn.toFixed(0)} MXN
      ${qtyLine}`;
  });

  const linesEn = cart.map(({ item, count }, idx) => {
    const modelEn = translateModelLabel(item.model_name || "Classic", "en");
    const qtyLine = `Quantity: ${count} ${count === 1 ? "pair" : "pairs"}`;

    const locLine = item.location_name ? `Location: ${item.location_name}` : "";

    return `• ${idx + 1}:
      ${locLine ? `${locLine}\n      ` : ""}Model: ${modelEn} Crocs
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

/** ✅ Use cart’s location; if mixed, return "#" */
function buildWhatsAppLink(cart: CartLine[], lang: Lang) {
  const { state, slug } = getCartLocationInfo(cart);
  if (state !== "single" || !slug) return "#";

  const phone = getWhatsAppNumberForLocationSlug(slug);
  if (!phone) return "#";

  const message = buildWhatsAppMessage(cart, lang);
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

// ---------- Feedback ----------

function FeedbackBox({ lang, context }: { lang: Lang; context: string }) {
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">(
    "idle"
  );

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

// ---------- Size Guide ----------

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
    <section
      id="size-guide"
      className="rounded-3xl bg-white border border-slate-200 shadow-sm p-4 space-y-4"
    >
      <header className="space-y-1">
        <h3 className="text-sm font-semibold flex items-center gap-2 text-slate-900">
          <span>📏</span>
          <span>{t("¿Cómo elegir tu talla?", "How to choose your size")}</span>
        </h3>
        <p className="text-[11px] text-slate-600">
          {t(
            "Todas las tallas de nuestra página están en numeración US. Usa la talla que normalmente compras en México como referencia y, si estás entre dos tallas, te recomendamos elegir la siguiente.",
            "All sizes on this page use US sizing. Use the size you normally buy in Mexico as a reference and if you’re between two sizes, we recommend choosing the next one up."
          )}
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1.1fr)]">
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

// ---------- Grouped color type ----------

type ColorGroup = {
  key: string;
  model_name: string;
  color: string;
  location_slug: string;
  location_name: string;
  price_mxn_min: number;
  price_mxn_max: number;
  variants: PublicItem[];
};

// ---------- Component ----------

export function JackieCatalog() {
  const [lang, setLang] = useState<Lang>("es");
  const [tab, setTab] = useState<AppTab>("home");

  const [items, setItems] = useState<PublicItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // We now always show all sizes (kids, youth, adult) in each color card,
  // so no buyerType selector is needed for filtering.
  const [sizeFilter, setSizeFilter] = useState<string>("all");
  const [colorFilter, setColorFilter] = useState<string>("all");

  const [locations, setLocations] = useState<LocationOption[]>([]);
  const [locationFilter, setLocationFilter] = useState<string>("all");

  const photoList = Object.values(CROCS_PHOTOS);
  const [mobilePhotoIndex, setMobilePhotoIndex] = useState(0);

  const mobileCanPrev = mobilePhotoIndex > 0;
  const mobileCanNext = mobilePhotoIndex < photoList.length - 1;

  const [quantities, setQuantities] = useState<Record<string, number>>({});

  const [pageSize, setPageSize] = useState<number>(MOBILE_INITIAL_VISIBLE);
  const [visibleCount, setVisibleCount] =
    useState<number>(MOBILE_INITIAL_VISIBLE);

  const [isMobile, setIsMobile] = useState(false);

  const t = (es: string, en: string) => (lang === "es" ? es : en);

  const selectedLocationName =
    locationFilter === "all"
      ? t("Todas", "All")
      : locations.find((l) => l.slug === locationFilter)?.name ||
        locationFilter.charAt(0).toUpperCase() + locationFilter.slice(1);

  const selectedCityForMaps =
    locationFilter !== "all"
      ? locations.find((l) => l.slug === locationFilter)?.name || "Tijuana"
      : "Tijuana";

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

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("jackie_tab", tab);
  }, [tab]);

  async function loadLocations() {
    const { data, error } = await supabase
      .from("locations")
      .select("slug, name")
      .order("name", { ascending: true });

    if (error) {
      console.error("Error loading locations:", error);
      return;
    }

    const list: LocationOption[] = (data ?? [])
      .filter((r: any) => r?.slug && r?.name)
      .map((r: any) => ({ slug: String(r.slug), name: String(r.name) }));

    setLocations(list);

    setLocationFilter((prev) => {
      if (prev === "all") return prev;
      const ok = list.some((l) => l.slug === prev);
      return ok ? prev : "all";
    });
  }

  async function loadInventory() {
    setLoading(true);
    setErrorMsg(null);

    const { data, error } = await supabase
      .from("inventory_items")
      .select(
        `
        id,
        size_id,
        location_id,
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
        ),
        locations ( slug, name )
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

    const variantMap = new Map<string, PublicItem>();

    (data ?? []).forEach((row: any) => {
      const model_name: string = row.models?.name ?? "";
      const color: string = row.colors?.name_en ?? "";
      const size_id: string = row.size_id as string;
      const sizeLabel: string = row.sizes?.label ?? "";
      const locSlug: string = row.locations?.slug ?? "unknown";
      const locName: string = row.locations?.name ?? "";
      const price_mxn: number = Number(row.price_mxn);

      if (!size_id || !sizeLabel) {
        console.warn("Skipping inventory row without size info", row);
        return;
      }

      const key = `${model_name}__${color}__${size_id}__${price_mxn}__${locSlug}`;

      const existing = variantMap.get(key);
      if (existing) {
        existing.availableCount += 1;
      } else {
        variantMap.set(key, {
          id: row.id as string,
          model_name,
          color,
          size: sizeLabel,
          size_id,
          location_slug: locSlug,
          location_name: locName,
          price_mxn,
          availableCount: 1,
        });
      }
    });

    const mapped: PublicItem[] = Array.from(variantMap.values());

    setItems(mapped);

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

  useEffect(() => {
    loadLocations();
    loadInventory();
  }, []);

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

  useEffect(() => {
    if (tab !== "catalog") return;

    const id = setInterval(() => loadInventory(), 3 * 60_000);
    return () => clearInterval(id);
  }, [tab]);

  useEffect(() => {
    setVisibleCount(pageSize);
  }, [sizeFilter, colorFilter, locationFilter, items.length, pageSize]);

  useEffect(() => {
    setSizeFilter("all");
    setColorFilter("all");
  }, [locationFilter]);

  // ---- Options for filters ----
  const scopedForOptions = items.filter((i) => {
    const byLoc =
      locationFilter === "all" || i.location_slug === locationFilter;
    return byLoc;
  });

  const allSizes = Array.from(new Set(scopedForOptions.map((i) => i.size)))
    .sort((a, b) => sizeRank(a) - sizeRank(b));

  const allColors = Array.from(new Set(scopedForOptions.map((i) => i.color)))
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));

  // ---- Group inventory: 1 card per color+model+location ----
  const inventoryScoped = items.filter((item) => {
    const byLoc =
      locationFilter === "all" || item.location_slug === locationFilter;
    const byColor = colorFilter === "all" || item.color === colorFilter;
    return byLoc && byColor;
  });

  const groupMap = new Map<string, ColorGroup>();

  for (const item of inventoryScoped) {
    const key = `${item.location_slug}__${item.model_name}__${item.color}`;

    const existing = groupMap.get(key);
    if (!existing) {
      groupMap.set(key, {
        key,
        model_name: item.model_name,
        color: item.color,
        location_slug: item.location_slug,
        location_name: item.location_name,
        price_mxn_min: item.price_mxn,
        price_mxn_max: item.price_mxn,
        variants: [item],
      });
    } else {
      existing.variants.push(item);
      existing.price_mxn_min = Math.min(existing.price_mxn_min, item.price_mxn);
      existing.price_mxn_max = Math.max(existing.price_mxn_max, item.price_mxn);
    }
  }

  let groupsFiltered = Array.from(groupMap.values());

  // Apply size filter at group level (card must have that size)
  if (sizeFilter !== "all") {
    groupsFiltered = groupsFiltered.filter((g) =>
      g.variants.some((v) => v.size === sizeFilter)
    );
  }

  // Sort groups by color, then model, then price
  groupsFiltered.sort((a, b) => {
    const c = a.color.localeCompare(b.color);
    if (c !== 0) return c;
    const m = (a.model_name || "").localeCompare(b.model_name || "");
    if (m !== 0) return m;
    return a.price_mxn_min - b.price_mxn_min;
  });

  const limitedGroups = groupsFiltered.slice(0, visibleCount);

  const totalPairsFiltered = groupsFiltered.reduce((sum, g) => {
    return (
      sum +
      g.variants.reduce((inner, v) => inner + v.availableCount, 0)
    );
  }, 0);

  const showingCount = Math.min(visibleCount, groupsFiltered.length);

  // ---- Cart ----
  const cartLines: CartLine[] = items
    .map((item) => ({
      item,
      count: quantities[item.id] ?? 0,
    }))
    .filter((line) => line.count > 0);

  const cartLocationInfo = getCartLocationInfo(cartLines);
  const isMixedCart = cartLocationInfo.state === "mixed";

  const waLinkForCart = buildWhatsAppLink(cartLines, lang);
  const supportWaLink = buildWhatsAppSupportLink(lang, locationFilter);
  const hasCartWhatsApp =
    !isMixedCart && waLinkForCart !== "#" && cartLines.length > 0;
  const hasSupportWhatsApp = supportWaLink !== "#";

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

  // Helper to render grouped sizes inside a color card
  const renderGroupSizeSections = (group: ColorGroup, isCompact: boolean) => {
    const tLocal = t;

    const adult = group.variants
      .filter((v) => inferSizeCategory(v.size) === "adult")
      .sort((a, b) => sizeRank(a.size) - sizeRank(b.size));
    const youth = group.variants
      .filter((v) => inferSizeCategory(v.size) === "youth")
      .sort((a, b) => sizeRank(a.size) - sizeRank(b.size));
    const kids = group.variants
      .filter((v) => inferSizeCategory(v.size) === "kids")
      .sort((a, b) => sizeRank(a.size) - sizeRank(b.size));
    const unknown = group.variants
      .filter((v) => inferSizeCategory(v.size) === "unknown")
      .sort((a, b) => sizeRank(a.size) - sizeRank(b.size));

    const sectionClass = isCompact
      ? "space-y-1"
      : "space-y-1.5";

    const sizeRowClass = isCompact
      ? "flex items-center justify-between rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1"
      : "flex items-center justify-between rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5";

    const labelClass = isCompact
      ? "text-[11px] font-medium text-slate-900"
      : "text-[12px] font-medium text-slate-900";

    const subtitleClass = "text-[10px] text-slate-500";

    const renderSection = (
      titleEs: string,
      titleEn: string,
      list: PublicItem[]
    ) => {
      if (!list.length) return null;
      return (
        <div className={sectionClass}>
          <p className="text-[11px] font-semibold text-slate-800 flex items-center gap-1">
            <span>
              {titleEs.startsWith("Adulto") ? "👟" : titleEs.startsWith("Juvenil") ? "🧑" : "🧒"}
            </span>
            <span>{tLocal(titleEs, titleEn)}</span>
          </p>
          <div className="space-y-1">
            {list.map((v) => {
              const qty = quantities[v.id] ?? 0;
              const atMax = qty >= v.availableCount;
              const isSelectedSize = sizeFilter !== "all" && v.size === sizeFilter;

              return (
                <div
                  key={v.id}
                  className={`${sizeRowClass} ${
                    isSelectedSize ? "ring-1 ring-emerald-300 bg-emerald-50" : ""
                  }`}
                >
                  <div className="flex flex-col">
                    <span className={labelClass}>
                      {formatSizeLabel(v.size, lang)}
                    </span>
                    <span className={subtitleClass}>
                      {availabilityText(v.availableCount, lang)}
                    </span>
                  </div>

                  {qty === 0 ? (
                    <button
                      type="button"
                      onClick={() => handleAddToCart(v)}
                      className="inline-flex items-center rounded-full border border-emerald-300 bg-white px-2.5 py-1 text-[11px] font-medium text-emerald-700 hover:bg-emerald-50 transition"
                    >
                      <span>+</span>
                      <span className="ml-1 hidden xs:inline">
                        {tLocal("Agregar", "Add")}
                      </span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleRemoveFromCart(v.id)}
                        className="inline-flex items-center justify-center h-7 w-7 rounded-full border border-slate-200 bg-white text-[14px] text-slate-700 hover:border-emerald-400 hover:text-emerald-700 transition"
                      >
                        –
                      </button>

                      <div className="inline-flex items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-800">
                        <span className="mr-1">x{qty}</span>
                        {atMax && (
                          <span className="text-[9px] text-emerald-700">
                            {tLocal("Máx", "Max")}
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleAddToCart(v)}
                        disabled={atMax}
                        className={`inline-flex items-center justify-center h-7 w-7 rounded-full border text-[14px] transition ${
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
              );
            })}
          </div>
        </div>
      );
    };

    return (
      <div className="mt-2 space-y-2">
        {renderSection("Adulto / Unisex", "Adult / Unisex", adult)}
        {renderSection("Juvenil", "Youth", youth)}
        {renderSection("Niños", "Kids", kids)}
        {renderSection("Otras tallas", "Other sizes", unknown)}
      </div>
    );
  };

  // ------------------------------------------------------------------
  // MOBILE VIEW
  // ------------------------------------------------------------------

  if (isMobile) {
    const renderLocationPicker = (variant: "home" | "catalog") => (
      <div className="rounded-3xl bg-white/95 border border-slate-100 p-3 shadow-sm space-y-2">
        <p className="text-[11px] text-slate-700 font-medium flex items-center gap-2">
          <span>📍</span>
          <span>{t("Ubicación", "Location")}</span>
        </p>

        <select
          value={locationFilter}
          onChange={(e) => setLocationFilter(e.target.value)}
          className="w-full rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-[11px] text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
        >
          <option value="all">
            {t("Todas las ubicaciones", "All locations")}
          </option>
          {locations.map((l) => (
            <option key={l.slug} value={l.slug}>
              {l.name}
            </option>
          ))}
        </select>

        {variant === "home" && (
          <p className="text-[10px] text-slate-500">
            {t(
              "Selecciona tu ciudad para ver inventario disponible ahí.",
              "Select your city to see available stock there."
            )}
          </p>
        )}
      </div>
    );

    const renderMobileHome = () => (
      <div className="space-y-4">
        <section className="rounded-3xl bg-white/95 border border-emerald-100 shadow-sm p-4 space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-medium text-emerald-700 border border-emerald-100">
            <span>🛍️</span>
            <span>{t("Catálogo en tiempo real", "Live stock catalog")}</span>
          </div>

          <div className="space-y-1">
            <h1 className="text-xl font-semibold tracking-tight">
              {t("Calzado disponibles", "Footwear available")}
            </h1>
            <p className="text-[12px] text-slate-600">
              {t(
                "Elige ubicación, color y talla, agrégalos al carrito y mándanos tu pedido por WhatsApp.",
                "Pick your location, color and size, add pairs to your cart and send your order on WhatsApp."
              )}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setTab("catalog")}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-emerald-500 text-white px-5 py-3 text-sm font-semibold shadow-md hover:bg-emerald-400 transition"
          >
            <span>🛒</span>
            <span>{t("Ver Calzado disponibles", "View available Footwear")}</span>
          </button>

          <div className="flex flex-wrap items-center gap-2 text-[11px]">
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-3 py-1 border border-slate-200">
              📍 {t("Ubicación", "Location")}: {selectedLocationName}
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
              {t("Última actualización", "Last updated")}: {formattedLastUpdated}
            </p>
          )}
        </section>

        {renderLocationPicker("home")}

        <section className="rounded-3xl bg-white/95 border border-slate-100 p-3 space-y-2">
          <div className="flex items-center justify-between text-[12px]">
            <p className="font-medium">
              {t("Fotos reales del producto", "Real product photos")}
            </p>
            <p className="text-[10px] text-slate-500">
              {mobilePhotoIndex + 1} / {photoList.length}
            </p>
          </div>

          <div className="relative rounded-2xl overflow-hidden border border-slate-100 bg-slate-50">
            <Image
              src={photoList[mobilePhotoIndex].src}
              alt={photoList[mobilePhotoIndex].label}
              width={900}
              height={900}
              className="h-60 w-full object-cover"
              priority={false}
            />

            <button
              type="button"
              disabled={!mobileCanPrev}
              onClick={() => setMobilePhotoIndex((i) => Math.max(0, i - 1))}
              className={`absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-white/90 border shadow flex items-center justify-center text-lg ${
                !mobileCanPrev ? "opacity-30" : "hover:bg-white"
              }`}
            >
              ‹
            </button>

            <button
              type="button"
              disabled={!mobileCanNext}
              onClick={() =>
                setMobilePhotoIndex((i) =>
                  Math.min(photoList.length - 1, i + 1)
                )
              }
              className={`absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-white/90 border shadow flex items-center justify-center text-lg ${
                !mobileCanNext ? "opacity-30" : "hover:bg-white"
              }`}
            >
              ›
            </button>
          </div>
        </section>

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
        {renderLocationPicker("catalog")}

        <div className="rounded-3xl bg-white/95 border border-slate-100 p-3 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-xs">
            <p className="font-medium">
              {t("Calzado disponibles", "Available Footwear")} ·{" "}
              <span className="text-slate-500">{selectedLocationName}</span>
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
                  {formatSizeLabel(sz, lang)}
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
              "Filtra por talla o color, y en cada tarjeta verás todas las tallas disponibles (niños, juvenil y adulto).",
              "Filter by size or color; each card shows all available sizes (kids, youth and adult)."
            )}
          </p>

          {lastUpdated && (
            <p className="text-[10px] text-slate-500 mt-1">
              {t("Última actualización", "Last updated")}: {formattedLastUpdated}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={() => {
            setTab("info");
            setTimeout(() => {
              if (typeof document === "undefined") return;
              const el = document.getElementById("size-guide");
              if (el) {
                el.scrollIntoView({
                  behavior: "smooth",
                  block: "start",
                });
              }
            }, 120);
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

        {totalCartPairs > 0 && (
          <div className="fixed inset-x-0 bottom-[76px] z-30">
            <div className="mx-auto max-w-md px-4">
              {isMixedCart && (
                <p className="mb-1 text-[10px] text-red-500 bg-white/90 rounded-2xl px-3 py-1 shadow">
                  {t(
                    "Tu carrito tiene pares de Tijuana y Mexicali. Por favor haz un pedido por ciudad.",
                    "Your cart has pairs from Tijuana and Mexicali. Please create one order per city."
                  )}
                </p>
              )}
              <a
                href={hasCartWhatsApp ? waLinkForCart : "#"}
                target={hasCartWhatsApp ? "_blank" : undefined}
                rel={hasCartWhatsApp ? "noopener noreferrer" : undefined}
                onClick={(e) => {
                  if (!hasCartWhatsApp) {
                    e.preventDefault();
                    return;
                  }
                  track("whatsapp_click_multi", {
                    count: totalCartPairs,
                    lang,
                    location: "catalog_mobile_sticky",
                  });
                }}
                className={`flex items-center justify-between gap-3 rounded-2xl px-4 py-3 shadow-lg border transition ${
                  hasCartWhatsApp
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
        ) : groupsFiltered.length === 0 ? (
          <p className="text-xs text-slate-600">
            {t(
              "Por ahora no hay pares con estos filtros.",
              "No pairs match these filters right now."
            )}
          </p>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-3">
              {limitedGroups.map((group) => {
                const colorText = translateColor(group.color, lang);
                const modelLabel = translateModelLabel(
                  group.model_name || "Classic",
                  lang
                );
                const photo = getPhotoForColor(group.color);

                const showPriceText =
                  group.price_mxn_min === group.price_mxn_max
                    ? `$${group.price_mxn_min.toFixed(0)} MXN`
                    : t(
                        `Desde $${group.price_mxn_min.toFixed(0)} MXN`,
                        `From $${group.price_mxn_min.toFixed(0)} MXN`
                      );

                const totalPairsForGroup = group.variants.reduce(
                  (sum, v) => sum + v.availableCount,
                  0
                );

                return (
                  <article
                    key={group.key}
                    className="rounded-3xl bg-white/95 border border-slate-100 shadow-[0_8px_20px_rgba(15,23,42,0.03)] hover:shadow-[0_12px_32px_rgba(15,23,42,0.07)] hover:-translate-y-0.5 transition-all flex flex-col p-3 gap-2"
                  >
                    <div className="flex gap-3">
                      {photo && (
                        <div className="relative h-20 w-20 rounded-2xl overflow-hidden border border-slate-100 bg-slate-50 flex-shrink-0">
                          <Image
                            src={photo.src}
                            alt={photo.label}
                            width={300}
                            height={300}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      )}
                      <div className="flex-1">
                        <p className="text-[12px] font-semibold text-slate-900 line-clamp-1">
                          {modelLabel} Crocs
                        </p>
                        <div
                          className={`mt-0.5 h-[4px] w-full rounded-full ${colorLineClass(
                            group.color
                          )} opacity-80`}
                        />
                        <p className="mt-1 text-[11px] text-slate-600 flex flex-col gap-0.5">
                          <span className="flex items-center gap-1.5">
                            <span>{colorText}</span>
                          </span>
                          <span className="text-[10px] text-slate-500">
                            📍 {group.location_name || selectedLocationName}
                          </span>
                        </p>
                        <div className="mt-1 flex items-center justify-between">
                          <div>
                            <p className="text-sm font-semibold text-emerald-600">
                              {showPriceText}
                            </p>
                            <p className="text-[10px] text-slate-500">
                              {t(
                                `${totalPairsForGroup} pares en total`,
                                `${totalPairsForGroup} pairs total`
                              )}
                            </p>
                          </div>
                          <span className="inline-flex items-center rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 px-2.5 py-0.5 text-[9px]">
                            {lang === "es" ? "Varias tallas" : "Multiple sizes"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {renderGroupSizeSections(group, true)}
                  </article>
                );
              })}
            </div>

            <div className="flex flex-col items-center gap-2 mt-1">
              <p className="text-[10px] text-slate-500">
                {lang === "es"
                  ? `Mostrando ${showingCount} de ${groupsFiltered.length} modelos por color`
                  : `Showing ${showingCount} of ${groupsFiltered.length} color options`}
              </p>
              {groupsFiltered.length > limitedGroups.length && (
                <button
                  type="button"
                  onClick={() => setVisibleCount((prev) => prev + pageSize)}
                  className="inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-2 text-[11px] font-medium text-slate-800 hover:border-emerald-400 hover:text-emerald-700 transition"
                >
                  {lang === "es"
                    ? "Mostrar más colores"
                    : "Show more colors"}
                </button>
              )}
            </div>
          </>
        )}

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
              "Mándanos mensaje con talla, color y ubicación. Respuestas de 9am a 7pm.",
              "Send us a message with size, color and location. We reply from 9am to 7pm."
            )}
          </p>

          <a
            href={hasSupportWhatsApp ? supportWaLink : "#"}
            target={hasSupportWhatsApp ? "_blank" : undefined}
            rel={hasSupportWhatsApp ? "noopener noreferrer" : undefined}
            onClick={(e) => {
              if (!hasSupportWhatsApp) {
                e.preventDefault();
                return;
              }
              track("whatsapp_click_support", {
                lang,
                location: "messages",
              });
            }}
            className={`inline-flex w-full items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition ${
              hasSupportWhatsApp
                ? "bg-emerald-500 text-white shadow-md hover:bg-emerald-400"
                : "bg-slate-200 text-slate-500 cursor-not-allowed"
            }`}
          >
            <span className="text-base">📲</span>
            <span>{t("Abrir WhatsApp", "Open WhatsApp")}</span>
          </a>
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
                  {idx + 1}. 📍 {item.location_name || item.location_slug} ·{" "}
                  {translateColor(item.color, lang)} ·{" "}
                  {t("Talla", "Size")} {item.size} · x{count} · $
                  {item.price_mxn.toFixed(0)} MXN
                </li>
              ))}
            </ul>

            {isMixedCart && (
              <p className="text-[10px] text-red-500 mt-1">
                {t(
                  "Tu carrito tiene pares de Tijuana y Mexicali. Por favor haz un pedido por ciudad.",
                  "Your cart has pairs from Tijuana and Mexicali. Please create one order per city."
                )}
              </p>
            )}

            <a
              href={hasCartWhatsApp ? waLinkForCart : "#"}
              target={hasCartWhatsApp ? "_blank" : undefined}
              rel={hasCartWhatsApp ? "noopener noreferrer" : undefined}
              onClick={(e) => {
                if (!hasCartWhatsApp) {
                  e.preventDefault();
                  return;
                }
                track("whatsapp_click_multi", {
                  count: totalCartPairs,
                  lang,
                  location: "messages_tab",
                });
              }}
              className={`inline-flex w-full items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition ${
                hasCartWhatsApp
                  ? "bg-emerald-500 text-white shadow-md hover:bg-emerald-400"
                  : "bg-slate-200 text-slate-500 cursor-not-allowed"
              }`}
            >
              <span>✅</span>
              <span>
                {t("Enviar carrito por WhatsApp", "Send cart via WhatsApp")}
              </span>
            </a>
          </section>
        )}

        <FeedbackBox lang={lang} context="messages_mobile" />
      </div>
    );

    const renderMobileInfo = () => {
      const citySlug = locationFilter === "all" ? "tijuana" : locationFilter;
      const cityName =
        locationFilter === "all"
          ? "Tijuana"
          : locations.find((l) => l.slug === locationFilter)?.name || "Tijuana";

      const spots = DELIVERY_SPOTS_BY_LOCATION[citySlug] ?? [];

      return (
        <div className="space-y-4">
          <section className="rounded-3xl bg-white border border-slate-100 p-4 shadow-sm space-y-2">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <span>📍</span>
              <span>{t("Ubicación seleccionada", "Selected location")}</span>
            </h3>
            <p className="text-[11px] text-slate-700">
              {t("Mostrando inventario para:", "Showing inventory for:")}{" "}
              <span className="font-semibold">{selectedLocationName}</span>
            </p>
          </section>

          <section className="rounded-3xl bg-white border border-slate-100 p-4 shadow-sm space-y-2">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <span>🚚</span>
              <span>{t("Puntos de entrega", "Pickup spots")}</span>
            </h3>

            {spots.length === 0 ? (
              <p className="text-[11px] text-slate-600">
                {t(
                  "Los puntos de entrega se confirman por WhatsApp.",
                  "Pickup spots are confirmed on WhatsApp."
                )}
              </p>
            ) : (
              <ul className="space-y-2">
                {spots.map((spot) => (
                  <li key={spot}>
                    <a
                      href={googleMapsLink(spot, cityName)}
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
            )}
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
        </div>
      );
    };

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
        <header className="sticky top-0 z-20 border-b border-slate-100 bg-white/90 backdrop-blur-sm">
          <div className="mx-auto flex h-14 max-w-md items-center justify-between px-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-lg">
                🐊
              </div>
              <div className="leading-tight">
                <p className="text-sm font-semibold">Jacky Shop</p>
                <p className="text-[10px] text-slate-500">
                  {headerSubtitle} · {selectedLocationName}
                </p>
              </div>
            </div>

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

                    <span
                      className={`text-[10px] leading-none ${
                        active ? "font-medium" : ""
                      }`}
                    >
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

  const desktopSpotsSlug =
    locationFilter === "all" ? "tijuana" : locationFilter;
  const desktopSpots = DELIVERY_SPOTS_BY_LOCATION[desktopSpotsSlug] ?? [];
  const desktopCityName =
    locationFilter === "all"
      ? "Tijuana"
      : locations.find((l) => l.slug === locationFilter)?.name || "Tijuana";

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-slate-50 to-white text-slate-900 pb-24">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-full bg-emerald-500 flex items-center justify-center text-lg text-white">
              🐊
            </div>
            <div className="leading-tight">
              <p className="text-sm font-semibold">Jacky Shop</p>
              <p className="text-[11px] text-slate-500">
                {t("Calzado · Ubicación", "Footwear · Location")}:{" "}
                {selectedLocationName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
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

            <a
              href={hasSupportWhatsApp ? supportWaLink : "#"}
              target={hasSupportWhatsApp ? "_blank" : undefined}
              rel={hasSupportWhatsApp ? "noopener noreferrer" : undefined}
              onClick={(e) => {
                if (!hasSupportWhatsApp) {
                  e.preventDefault();
                  return;
                }
                track("whatsapp_click_support", {
                  lang,
                  location: "nav",
                });
              }}
              className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-medium border transition ${
                hasSupportWhatsApp
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
                  {lang === "es" ? "Calzado disponibles" : "Footwear available"}
                </h1>
                <p className="text-sm text-slate-600 max-w-md">
                  {lang === "es"
                    ? "Elige ubicación, color y talla, agrégalos al carrito y mándanos tu pedido por WhatsApp."
                    : "Pick location, color and size, add pairs to your cart and send your order on WhatsApp."}
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
                    ? "Ver Calzado disponibles"
                    : "View available Footwear"}
                </span>
              </button>

              <div className="flex flex-wrap items-center gap-2 text-[11px] sm:text-xs">
                <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 border border-slate-200">
                  📍 {t("Ubicación", "Location")}: {selectedLocationName}
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

            <div className="w-full max-w-sm mx-auto md:mx-0">
            <div className="rounded-3xl bg-gradient-to-br from-sky-50 via-white to-emerald-50 border border-slate-200 shadow-sm p-4 space-y-4">
              
              {/* Top badge + price */}
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1 rounded-full bg-white/80 px-2.5 py-1 text-[10px] font-medium text-slate-700 border border-slate-200">
                  👟{" "}
                  {lang === "es"
                    ? "Calzado de Calidad"
                    : "Quality Footwear"}
                </span>

                <p className="text-xs text-slate-500">
                  {lang === "es" ? "Desde" : "From"} $600 MXN
                </p>
              </div>

              {/* Location card */}
              <div className="rounded-2xl bg-white/70 border border-slate-200 px-4 py-5 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-slate-900">
                    {lang === "es" ? "Ubicación" : "Location"}
                  </p>
                  <p className="text-[11px] text-slate-600">
                    {selectedLocationName}
                  </p>
                  <p className="mt-2 text-[10px] text-slate-500">
                    {lang === "es"
                      ? "Filtra por talla y color según tu ciudad."
                      : "Filter by size and color for your city."}
                  </p>
                </div>

                <div className="text-4xl md:text-5xl">👟</div>
              </div>

              {/* Description */}
              <p className="text-[11px] text-slate-600">
                {lang === "es"
                  ? "Explora nuestro calzado por color y talla, añade tus pares al carrito y envía tu pedido por WhatsApp."
                  : "Browse our footwear by color and size, add your pairs to the cart and send your order on WhatsApp."}
              </p>
            </div>
          </div>
          </div>
        </section>

        <section className="rounded-2xl bg-white border border-slate-100 p-3 sm:p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-medium text-slate-900">
              {lang === "es" ? "Calzado disponibles" : "Available Footwear"}
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
                {lang === "es" ? "Ubicación" : "Location"}
              </span>
              <select
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="appearance-none rounded-full border border-slate-200 bg-white px-4 py-2 text-[11px] text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
              >
                <option value="all">
                  {t("Todas las ubicaciones", "All locations")}
                </option>
                {locations.map((l) => (
                  <option key={l.slug} value={l.slug}>
                    {l.name}
                  </option>
                ))}
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
                    {formatSizeLabel(sz, lang)}
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
              ? "Filtra por ubicación, talla o color. Cada tarjeta muestra todas las tallas (niños, juvenil y adulto) disponibles para ese color."
              : "Filter by location, size or color. Each card shows all available sizes (kids, youth and adult) for that color."}
          </p>
        </section>

        <section id="inventory-grid">
          {loading ? (
            <p className="text-xs text-slate-600">
              {t("Cargando inventario…", "Loading inventory…")}
            </p>
          ) : errorMsg ? (
            <p className="text-xs text-red-500">{errorMsg}</p>
          ) : groupsFiltered.length === 0 ? (
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
                {limitedGroups.map((group) => {
                  const colorText = translateColor(group.color, lang);
                  const modelLabel = translateModelLabel(
                    group.model_name || "Classic",
                    lang
                  );
                  const photo = getPhotoForColor(group.color);

                  const showPriceText =
                    group.price_mxn_min === group.price_mxn_max
                      ? `$${group.price_mxn_min.toFixed(0)} MXN`
                      : t(
                          `Desde $${group.price_mxn_min.toFixed(0)} MXN`,
                          `From $${group.price_mxn_min.toFixed(0)} MXN`
                        );

                  const totalPairsForGroup = group.variants.reduce(
                    (sum, v) => sum + v.availableCount,
                    0
                  );

                  return (
                    <article
                      key={group.key}
                      className="rounded-3xl bg-white border border-slate-100 shadow-[0_10px_26px_rgba(15,23,42,0.03)] hover:shadow-[0_16px_40px_rgba(15,23,42,0.08)] hover:-translate-y-0.5 transition-all flex flex-col p-4 gap-3"
                    >
                      <div className="flex items-start gap-3">
                        {photo && (
                          <div className="relative h-24 w-24 rounded-2xl overflow-hidden border border-slate-100 bg-slate-50 flex-shrink-0">
                            <Image
                              src={photo.src}
                              alt={photo.label}
                              width={400}
                              height={400}
                              className="h-full w-full object-cover"
                            />
                          </div>
                        )}
                        <div className="flex-1">
                          <h3 className="text-sm font-semibold text-slate-900 line-clamp-1">
                            {modelLabel} Crocs
                          </h3>

                          <div
                            className={`mt-0.5 h-[4px] w-full rounded-full ${colorLineClass(
                              group.color
                            )} opacity-80`}
                          />

                          <p className="mt-1 text-[11px] text-slate-600 flex flex-col gap-1">
                            <span className="flex items-center gap-1.5">
                              <span>{colorText}</span>
                            </span>
                            <span className="text-[10px] text-slate-500">
                              📍 {group.location_name || group.location_slug}
                            </span>
                          </p>

                          <div className="mt-1 flex items-center justify-between">
                            <div>
                              <p className="text-base font-semibold text-emerald-600">
                                {showPriceText}
                              </p>
                              <p className="text-[10px] text-slate-500">
                                {t(
                                  `${totalPairsForGroup} pares en total`,
                                  `${totalPairsForGroup} pairs total`
                                )}
                              </p>
                            </div>
                            <span className="inline-flex items-center rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 px-3 py-0.5 text-[10px]">
                              {lang === "es"
                                ? "Varias tallas"
                                : "Multiple sizes"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {renderGroupSizeSections(group, false)}
                    </article>
                  );
                })}
              </div>

              <div className="flex flex-col items-center gap-2">
                <p className="text-[10px] text-slate-500">
                  {lang === "es"
                    ? `Mostrando ${showingCount} de ${groupsFiltered.length} modelos por color`
                    : `Showing ${showingCount} of ${groupsFiltered.length} color options`}
                </p>

                {groupsFiltered.length > limitedGroups.length && (
                  <button
                    type="button"
                    onClick={() => setVisibleCount((prev) => prev + pageSize)}
                    className="inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-2 text-[11px] font-medium text-slate-800 hover:border-emerald-400 hover:text-emerald-700 transition"
                  >
                    {lang === "es"
                      ? "Mostrar más colores"
                      : "Show more colors"}
                  </button>
                )}
              </div>
            </div>
          )}
        </section>

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
                    "Filtra por ubicación, talla y color, y agrégalos al carrito.",
                    "Filter by location, size and color, then add to cart."
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

              {desktopSpots.length === 0 ? (
                <p className="text-[11px] text-slate-600">
                  {t(
                    "Los puntos de entrega se confirman por WhatsApp.",
                    "Pickup spots are confirmed on WhatsApp."
                  )}
                </p>
              ) : (
                <ul className="space-y-2">
                  {desktopSpots.map((spot) => (
                    <li key={spot}>
                      <a
                        href={googleMapsLink(spot, desktopCityName)}
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
              )}
            </div>

            <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-4 space-y-2">
              <h3 className="text-sm font-medium flex items-center gap-2 text-slate-900">
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

        <FeedbackBox lang={lang} context="catalog_desktop" />
      </div>

      {totalCartPairs > 0 && (
        <div className="fixed bottom-0 inset-x-0 z-30 border-t border-slate-200 bg-white/95 backdrop-blur shadow-[0_-8px_30px_rgba(15,23,42,0.12)]">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex flex-col gap-1">
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
              {isMixedCart && (
                <p className="text-[10px] text-red-500">
                  {t(
                    "Tu carrito tiene pares de Tijuana y Mexicali. Por favor haz un pedido por ciudad.",
                    "Your cart has pairs from Tijuana and Mexicali. Please create one order per city."
                  )}
                </p>
              )}
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
                track("whatsapp_click_multi", {
                  count: totalCartPairs,
                  lang,
                  location: "sticky_cart",
                });
              }}
              className={`inline-flex items-center gap-2 rounded-full px-6 py-3 text-xs sm:text-sm font-semibold transition ${
                hasCartWhatsApp
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
