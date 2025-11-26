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

const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_PHONE || "";

// Build localized WhatsApp link for each item
function buildWhatsAppLink(item: PublicItem, lang: Lang) {
  const colorEs = translateColor(item.color, "es");

  const messageEs = `Hola 👋 Me interesa este par de Crocs:

Modelo: ${item.model_name || "Crocs"}
Color: ${colorEs} (${item.color})
Talla: ${item.size}
Para: ${
    genderLabel[item.gender].es
  }
Precio: $${item.price_mxn.toFixed(0)} MXN

¿Sigue disponible?`;

  const messageEn = `Hi 👋 I'm interested in this pair of Crocs:

Model: ${item.model_name || "Crocs"}
Color: ${item.color}
Size: ${item.size}
For: ${genderLabel[item.gender].en}
Price: $${item.price_mxn.toFixed(0)} MXN

Is it still available?`;

  const message = lang === "es" ? messageEs : messageEn;

  if (!WHATSAPP_NUMBER) {
    console.warn("NEXT_PUBLIC_WHATSAPP_PHONE is not set");
  }

  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    message
  )}`;
}

export function JackieCatalog() {
  const [lang, setLang] = useState<Lang>("es");
  const [items, setItems] = useState<PublicItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [genderFilter, setGenderFilter] = useState<
    "all" | PublicItem["gender"]
  >("all");
  const [sizeFilter, setSizeFilter] = useState<string>("all");

  useEffect(() => {
    async function load() {
      setLoading(true);
      setErrorMsg(null);

      // join inventory_items with models + colors, only available items
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
      setLoading(false);
    }

    load();
  }, []);

  const t = (es: string, en: string) => (lang === "es" ? es : en);

  const allSizes = Array.from(new Set(items.map((i) => i.size))).sort();

  const filtered = items.filter((item) => {
    const byGender = genderFilter === "all" || item.gender === genderFilter;
    const bySize = sizeFilter === "all" || item.size === sizeFilter;
    return byGender && bySize;
  });

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 text-slate-50">
      {/* top bar */}
      <header className="sticky top-0 z-10 border-b border-slate-800/70 bg-slate-950/80 backdrop-blur">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-emerald-500 flex items-center justify-center text-lg">
              🐊
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-semibold">
                Jackie Crocs
              </h1>
              <p className="text-[11px] text-slate-400">
                {t(
                  "Inventario actualizado en Tijuana",
                  "Updated stock in Tijuana"
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden sm:inline text-[11px] text-slate-400">
              {t("Idioma", "Language")}
            </span>
            <div className="inline-flex items-center rounded-full border border-slate-700 bg-slate-900 p-0.5 text-[11px]">
              <button
                type="button"
                onClick={() => setLang("es")}
                className={`px-2.5 py-1 rounded-full ${
                  lang === "es"
                    ? "bg-emerald-500 text-slate-950"
                    : "text-slate-300 hover:text-white"
                }`}
              >
                ES
              </button>
              <button
                type="button"
                onClick={() => setLang("en")}
                className={`px-2.5 py-1 rounded-full ${
                  lang === "en"
                    ? "bg-emerald-500 text-slate-950"
                    : "text-slate-300 hover:text-white"
                }`}
              >
                EN
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* intro */}
        <section className="space-y-2">
          <h2 className="text-lg sm:text-xl font-semibold">
            {t("Crocs disponibles ahora", "Crocs available now")}
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl">
            {t(
              "Aquí puedes ver qué tallas y colores están disponibles. Para comprar, manda mensaje por WhatsApp usando el botón en cada par.",
              "Here you can see which sizes and colors are available. To buy, use the WhatsApp button on each pair."
            )}
          </p>
        </section>

        {/* filters */}
        <section className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3 sm:p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-[11px] text-slate-400">
              {t(
                `${filtered.length} pares disponibles`,
                `${filtered.length} pairs available`
              )}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
            {/* gender filter */}
            <div className="flex flex-col gap-1">
              <span className="text-slate-300">{t("Para", "For")}</span>
              <select
                value={genderFilter}
                onChange={(e) =>
                  setGenderFilter(
                    e.target.value === "all"
                      ? "all"
                      : (e.target.value as PublicItem["gender"])
                  )
                }
                className="border border-slate-700 bg-slate-900/80 rounded-lg px-2.5 py-1.5 text-[11px] text-slate-50 focus:outline-none focus:ring-1 focus:ring-emerald-500/80"
              >
                <option value="all">{t("Todos", "All")}</option>
                <option value="women">{genderLabel.women[lang]}</option>
                <option value="men">{genderLabel.men[lang]}</option>
                <option value="unisex">{genderLabel.unisex[lang]}</option>
              </select>
            </div>

            {/* size filter */}
            <div className="flex flex-col gap-1">
              <span className="text-slate-300">{t("Talla", "Size")}</span>
              <select
                value={sizeFilter}
                onChange={(e) => setSizeFilter(e.target.value)}
                className="border border-slate-700 bg-slate-900/80 rounded-lg px-2.5 py-1.5 text-[11px] text-slate-50 focus:outline-none focus:ring-1 focus:ring-emerald-500/80"
              >
                <option value="all">{t("Todas", "All")}</option>
                {allSizes.map((sz) => (
                  <option key={sz} value={sz}>
                    {sz}
                  </option>
                ))}
              </select>
            </div>

            {/* info note */}
            <div className="flex items-center text-[11px] text-slate-400">
              {t(
                "Inventario se mueve rápido, confirma siempre por WhatsApp.",
                "Stock moves fast, always confirm via WhatsApp."
              )}
            </div>
          </div>
        </section>

        {/* inventory grid */}
        <section>
          {loading ? (
            <p className="text-xs text-slate-400">
              {t("Cargando inventario…", "Loading inventory…")}
            </p>
          ) : errorMsg ? (
            <p className="text-xs text-red-400">{errorMsg}</p>
          ) : filtered.length === 0 ? (
            <p className="text-xs text-slate-400">
              {t(
                "Por ahora no hay pares con estos filtros.",
                "No pairs match these filters right now."
              )}
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {filtered.map((item) => (
                <article
                  key={item.id}
                  className="rounded-2xl border border-slate-800 bg-slate-900/80 p-3 sm:p-4 flex flex-col gap-2"
                >
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-50">
                        {item.model_name || "Crocs"}
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        {t("Color", "Color")}:{" "}
                        {translateColor(item.color, lang)}{" "}
                        <span className="text-slate-500">
                          ({item.color})
                        </span>
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {t("Talla", "Size")}: {item.size} ·{" "}
                        {genderLabel[item.gender][lang]}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-emerald-400">
                        ${item.price_mxn.toFixed(0)} MXN
                      </p>
                      <p className="text-[10px] text-slate-500">
                        {t("Paga en efectivo al entregar", "Cash on delivery")}
                      </p>
                    </div>
                  </div>

                  <div className="mt-2 flex justify-end">
                    <a
                      href={buildWhatsAppLink(item, lang)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-full bg-green-500 px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-green-400 transition"
                    >
                      <span className="text-base">📲</span>
                      {lang === "es"
                        ? "Pedir por WhatsApp"
                        : "Request via WhatsApp"}
                    </a>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
