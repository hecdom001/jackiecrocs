// app/admin/inventory/add/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useAdminLang } from "../../adminLangContext"; // note the ../..

export const dynamic = "force-dynamic";

type SizeOption = {
  id: string;
  label: string;
};

type LocationOption = {
  id: string;
  slug: string;
  name: string;
};

type Lang = "es" | "en";

function translateColorLabel(colorEn: string | null | undefined, lang: Lang) {
  if (!colorEn) return "";
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
    case "fuchsia":
      return "Fucsia";
    case "rust brown":
       return "Ladrillo";
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

export default function AddInventoryPage() {
  const router = useRouter();
  const { lang, t } = useAdminLang(); // 👈 shared language

  return (
    <div className="space-y-4">
      <section className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-base font-semibold text-slate-900">
              {t("Agregar inventario", "Add inventory")}
            </h1>
            <p className="text-xs text-slate-500">
              {t(
                "Crea nuevos pares desde esta pantalla.",
                "Create new pairs from this screen."
              )}
            </p>
          </div>

          <div className="flex flex-col gap-2 items-end">
            <button
              type="button"
              onClick={() => router.push("/admin/inventory")}
              className="inline-flex justify-center items-center rounded-full border border-slate-300 bg-white text-[11px] font-semibold px-4 py-2 text-slate-700 hover:border-emerald-400 hover:text-emerald-700"
            >
              {t("Ver inventario", "View inventory")}
            </button>
          </div>
        </div>
      </section>

      <AddInventorySection
        t={t}
        lang={lang}
        onAdded={() => {
          // stay on page after adding
        }}
        onUnauthorized={() =>
          router.push("/admin/login?redirect=/admin/inventory/add")
        }
      />
    </div>
  );
}

/* ---------- AddInventorySection ---------- */

function AddInventorySection({
  t,
  lang,
  onAdded,
  onUnauthorized,
}: {
  t: (es: string, en: string) => string;
  lang: Lang;
  onAdded: () => void;
  onUnauthorized: () => void;
}) {
  const [modelName, setModelName] = useState("");
  const [color, setColor] = useState<string>("");
  const [sizeId, setSizeId] = useState("");
  const [price, setPrice] = useState("0");
  const [quantity, setQuantity] = useState("1");

  // NEW: locations
  const [locations, setLocations] = useState<LocationOption[]>([]);
  const [locationsLoading, setLocationsLoading] = useState(true);
  const [locationsError, setLocationsError] = useState<string | null>(null);
  const [locationId, setLocationId] = useState(""); // selected location_id

  const [models, setModels] = useState<string[]>([]);
  const [colors, setColors] = useState<string[]>([]);
  const [sizes, setSizes] = useState<SizeOption[]>([]);
  const [sizesLoading, setSizesLoading] = useState(true);
  const [sizesError, setSizesError] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Load sizes, models, colors, locations from DB
  useEffect(() => {
    async function loadSizes() {
      setSizesLoading(true);
      setSizesError(null);
      const { data, error } = await supabase
        .from("sizes")
        .select("id, label")
        .order("sort_order", { ascending: true });

      if (error) {
        console.error("Error loading sizes:", error);
        setSizesError("Error loading sizes");
        setSizesLoading(false);
        return;
      }

      setSizes((data ?? []) as SizeOption[]);
      setSizesLoading(false);
    }

    async function loadColors() {
      const { data, error } = await supabase
        .from("colors")
        .select("name_en")
        .order("name_en");

      if (error) {
        console.error("Error loading colors:", error);
        return;
      }

      const colorNames = (data ?? []).map((c) => c.name_en as string);
      setColors(colorNames);
    }

    async function loadModels() {
      const { data, error } = await supabase
        .from("models")
        .select("name")
        .order("name");

      if (error) {
        console.error("Error loading models:", error);
        return;
      }

      const modelNames = (data ?? []).map((m) => m.name as string);
      setModels(modelNames);
    }

    async function loadLocations() {
      setLocationsLoading(true);
      setLocationsError(null);

      const { data, error } = await supabase
        .from("locations")
        .select("id, slug, name")
        .order("name");

      if (error) {
        console.error("Error loading locations:", error);
        setLocationsError("Error loading locations");
        setLocationsLoading(false);
        return;
      }

      const list = (data ?? []) as LocationOption[];
      setLocations(list);

      // Default to Tijuana if present; else first location
      const tijuana = list.find((l) => l.slug?.toLowerCase() === "tijuana");
      setLocationId(tijuana?.id || list[0]?.id || "");

      setLocationsLoading(false);
    }

    loadSizes();
    loadColors();
    loadModels();
    loadLocations();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);

    if (
      !modelName.trim() ||
      !color.trim() ||
      !sizeId.trim() ||
      !price.trim() ||
      !locationId.trim()
    ) {
      setMessage(
        t(
          "Completa todos los campos antes de guardar.",
          "Please fill in all fields before saving."
        )
      );
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/admin/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model_name: modelName.trim(),
          color: color.trim(),
          size_id: sizeId, // use FK id only, API derives label
          price_mxn: Number(price),
          quantity: Number(quantity) || 1,
          location_id: locationId, // ✅ NEW
        }),
      });

      if (res.status === 401) {
        onUnauthorized();
        return;
      }

      const data = await res.json();
      if (!res.ok) {
        console.error("Error creating inventory:", data);
        setMessage(
          data.error ||
            t("Error al agregar inventario.", "Error adding inventory.")
        );
        return;
      }

      setMessage(t("Pares agregados correctamente ✅", "Pairs added successfully ✅"));

      // reset size + quantity; keep model/color/location to speed up bulk entry
      setSizeId("");
      setQuantity("1");
      onAdded();
    } catch (err) {
      console.error(err);
      setMessage(t("Error al agregar inventario.", "Error adding inventory."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 sm:p-5 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-sm sm:text-base font-semibold text-slate-900">
            {t("Agregar nuevos pares", "Add new pairs")}
          </h2>
          <p className="text-[11px] text-slate-500">
            {t(
              "Se crearán varios registros si pones cantidad mayor a 1.",
              "Multiple records will be created if quantity is greater than 1."
            )}
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
      >
        {/* Location (NEW) */}
        <div className="space-y-1">
          <label className="block text-[11px] font-medium text-slate-700">
            {t("Ubicación", "Location")}
          </label>

          {locationsLoading ? (
            <div className="text-[11px] text-slate-500">
              {t("Cargando ubicaciones…", "Loading locations…")}
            </div>
          ) : locationsError ? (
            <div className="text-[11px] text-rose-600">{locationsError}</div>
          ) : (
            <select
              value={locationId}
              onChange={(e) => setLocationId(e.target.value)}
              className="w-full border border-slate-300 bg-white rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-400"
              required
            >
              <option value="" disabled>
                {t("Selecciona una ubicación", "Select a location")}
              </option>
              {locations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          )}

          <p className="text-[10px] text-slate-500">
            {t(
              "Esto define en qué ciudad está físicamente este par.",
              "This defines which city this pair is physically in."
            )}
          </p>
        </div>

        {/* Model */}
        <div className="space-y-1">
          <label className="block text-[11px] font-medium text-slate-700">
            {t("Modelo", "Model")}
          </label>
          <select
            value={modelName}
            onChange={(e) => setModelName(e.target.value)}
            className="w-full border border-slate-300 bg-white rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-400"
            required
          >
            <option value="" disabled>
              {t("Selecciona un modelo", "Select a model")}
            </option>
            {models.map((m) => (
              <option key={m} value={m}>
                {translateModelLabel(m, lang)}
              </option>
            ))}
          </select>
        </div>

        {/* Color */}
        <div className="space-y-1">
          <label className="block text-[11px] font-medium text-slate-700">
            {t("Color", "Color")}
          </label>
          <select
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-full border border-slate-300 bg-white rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-400"
            required
          >
            <option value="" disabled>
              {t("Selecciona un color", "Select a color")}
            </option>
            {colors.map((c) => (
              <option key={c} value={c}>
                {translateColorLabel(c, lang)}
              </option>
            ))}
          </select>

          <p className="text-[10px] text-slate-500">
            {t(
              "Modelo y color se guardan en inglés; el público lo ve traducido.",
              "Model and color are stored in English; the public page will translate them."
            )}
          </p>
        </div>

        {/* Size */}
        <div className="space-y-1">
          <label className="block text-[11px] font-medium text-slate-700">
            {t("Talla", "Size")}
          </label>
          {sizesLoading ? (
            <div className="text-[11px] text-slate-500">
              {t("Cargando tallas…", "Loading sizes…")}
            </div>
          ) : sizesError ? (
            <div className="text-[11px] text-rose-600">{sizesError}</div>
          ) : (
            <select
              value={sizeId}
              onChange={(e) => setSizeId(e.target.value)}
              className="w-full border border-slate-300 bg-white rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-400"
              required
            >
              <option value="" disabled>
                {t("Selecciona una talla", "Select a size")}
              </option>
              {sizes.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Price */}
        <div className="space-y-1">
          <label className="block text-[11px] font-medium text-slate-700">
            {t("Precio MXN", "Price MXN")}
          </label>
          <input
            type="number"
            min={0}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-full border border-slate-300 bg-white rounded-lg px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-400"
            required
          />
        </div>

        {/* Quantity */}
        <div className="space-y-1">
          <label className="block text-[11px] font-medium text-slate-700">
            {t("Cantidad", "Quantity")}
          </label>
          <input
            type="number"
            min={1}
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="w-full border border-slate-300 bg-white rounded-lg px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-400"
            required
          />
        </div>

        {/* Submit */}
        <div className="sm:col-span-2 lg:col-span-3 flex justify-end items-end">
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center justify-center rounded-full bg-emerald-500 px-6 py-2.5 text-xs font-semibold text-white hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-sm"
          >
            {submitting
              ? t("Guardando…", "Saving…")
              : t("Agregar pares", "Add pairs")}
          </button>
        </div>
      </form>

      {message && (
        <p className="text-[11px] text-right text-emerald-700">{message}</p>
      )}
    </section>
  );
}
