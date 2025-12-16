// app/admin/new/page.tsx
"use client";

import { useEffect, useState, FormEvent } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAdminLang } from "../adminLangContext";

type SizeOption = { id: string; label: string };
type LocationOption = { id: string; name: string; slug: string };

export default function AdminNewPage() {
  const { lang, t } = useAdminLang();

  const [message, setMessage] = useState<string | null>(null);

  // Lookups / form state
  const [models, setModels] = useState<string[]>([]);
  const [colors, setColors] = useState<string[]>([]);
  const [locations, setLocations] = useState<LocationOption[]>([]);

  const [modelSelect, setModelSelect] = useState<string>("");
  const [newModelName, setNewModelName] = useState("");
  const [colorSelect, setColorSelect] = useState<string>("");
  const [newColorName, setNewColorName] = useState("");

  const [locationId, setLocationId] = useState<string>(""); // ✅ NEW

  const [sizeId, setSizeId] = useState(""); // size_id, not label
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("1");

  // Sizes lookup
  const [sizes, setSizes] = useState<SizeOption[]>([]);
  const [sizesLoading, setSizesLoading] = useState(true);
  const [sizesError, setSizesError] = useState<string | null>(null);

  // Lookup loading
  const [lookupsLoading, setLookupsLoading] = useState(true);
  const [lookupsError, setLookupsError] = useState<string | null>(null);

  useEffect(() => {
    async function loadAllLookups() {
      setLookupsLoading(true);
      setLookupsError(null);

      try {
        const [modelsRes, colorsRes, locationsRes] = await Promise.all([
          supabase.from("models").select("name").order("name"),
          supabase.from("colors").select("name_en").order("name_en"),
          supabase.from("locations").select("id, name, slug").order("name"),
        ]);

        if (modelsRes.error) throw modelsRes.error;
        if (colorsRes.error) throw colorsRes.error;
        if (locationsRes.error) throw locationsRes.error;

        setModels((modelsRes.data ?? []).map((m: any) => String(m.name)));
        setColors((colorsRes.data ?? []).map((c: any) => String(c.name_en)));
        setLocations(
          (locationsRes.data ?? []).map((l: any) => ({
            id: String(l.id),
            name: String(l.name),
            slug: String(l.slug),
          }))
        );

        // Optional: default to Tijuana if present
        const tijuana = (locationsRes.data ?? []).find(
          (l: any) => String(l.slug).toLowerCase() === "tijuana"
        );
        if (tijuana && !locationId) setLocationId(String(tijuana.id));
      } catch (err) {
        console.error("Error loading lookups:", err);
        setLookupsError("Error loading lookups");
      } finally {
        setLookupsLoading(false);
      }
    }

    loadAllLookups();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load sizes
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

      setSizes(data ?? []);
      setSizesLoading(false);
    }

    loadSizes();
  }, []);

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    setMessage(null);

    const finalModel =
      modelSelect === "other" ? newModelName.trim() : modelSelect.trim();
    const finalColor =
      colorSelect === "other" ? newColorName.trim() : colorSelect.trim();

    if (!finalModel) {
      setMessage(
        t(
          "Debes escribir un modelo nuevo o elegir uno existente.",
          "You must enter a new model or choose an existing one."
        )
      );
      return;
    }

    if (!finalColor) {
      setMessage(
        t(
          "Debes escribir un color nuevo o elegir uno existente.",
          "You must enter a new color or choose an existing one."
        )
      );
      return;
    }

    if (!sizeId) {
      setMessage(t("Debes seleccionar una talla.", "You must select a size."));
      return;
    }

    if (!locationId) {
      setMessage(
        t("Debes seleccionar una ubicación.", "You must select a location.")
      );
      return;
    }

    const res = await fetch("/api/admin/inventory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model_name: finalModel,
        color: finalColor,
        size_id: sizeId,
        location_id: locationId, // ✅ NEW
        price_mxn: Number(price),
        quantity: Number(quantity),
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error || "Error al agregar / Error adding items");
      return;
    }

    setMessage(
      t("Inventario agregado correctamente ✅", "Inventory added successfully ✅")
    );

    // reset form
    setModelSelect("");
    setNewModelName("");
    setColorSelect("");
    setNewColorName("");
    setSizeId("");
    setPrice("");
    setQuantity("1");
    // keep location as-is for speed
  }

  return (
    <div className="space-y-6">
      {/* Add inventory form */}
      <section className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 sm:p-5 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-sm sm:text-base font-semibold text-slate-900">
              {t("Agregar nuevos pares", "Add new pairs")}
            </h2>
            <p className="text-[11px] text-slate-500">
              {t(
                "Se crearán varios registros si pones cantidad > 1.",
                "Multiple records will be created if quantity > 1."
              )}
            </p>
          </div>
        </div>

        {lookupsError && (
          <p className="text-[11px] text-rose-600">{lookupsError}</p>
        )}

        <form
          onSubmit={handleAdd}
          className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
        >
          {/* Location ✅ */}
          <Field label={t("Ubicación", "Location")}>
            {lookupsLoading ? (
              <div className="text-[11px] text-slate-500">
                {t("Cargando ubicaciones…", "Loading locations…")}
              </div>
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
          </Field>

          {/* Model */}
          <Field label={t("Modelo", "Model")}>
            <div className="space-y-1">
              <select
                value={modelSelect}
                onChange={(e) => {
                  setModelSelect(e.target.value);
                  if (e.target.value !== "other") setNewModelName("");
                }}
                className="w-full border border-slate-300 bg-white rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                required
              >
                <option value="" disabled>
                  {t("Selecciona un modelo", "Select a model")}
                </option>
                <option value="other">
                  {t("Otro (nuevo modelo)", "Other (new model)")}
                </option>
                {models.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>

              {modelSelect === "other" && (
                <input
                  value={newModelName}
                  onChange={(e) => setNewModelName(e.target.value)}
                  className="w-full border border-slate-300 bg-white rounded-lg px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                  placeholder={t(
                    "Escribe el nombre del modelo",
                    "Type the new model name"
                  )}
                  required
                />
              )}
            </div>
          </Field>

          {/* Color */}
          <Field label={t("Color (inglés)", "Color (English)")}>
            <div className="space-y-1">
              <select
                value={colorSelect}
                onChange={(e) => {
                  setColorSelect(e.target.value);
                  if (e.target.value !== "other") setNewColorName("");
                }}
                className="w-full border border-slate-300 bg-white rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                required
              >
                <option value="" disabled>
                  {t("Selecciona un color", "Select a color")}
                </option>
                <option value="other">
                  {t("Otro (nuevo color)", "Other (new color)")}
                </option>
                {colors.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              {colorSelect === "other" && (
                <input
                  value={newColorName}
                  onChange={(e) => setNewColorName(e.target.value)}
                  className="w-full border border-slate-300 bg-white rounded-lg px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                  placeholder={t(
                    "Escribe el color en inglés (ej. 'Black')",
                    "Type the color in English (e.g. 'Black')"
                  )}
                  required
                />
              )}
            </div>
          </Field>

          {/* Size */}
          <Field label={t("Talla", "Size")}>
            {sizesLoading ? (
              <div className="text-[11px] text-slate-500">
                {t("Cargando tallas…", "Loading sizes…")}
              </div>
            ) : sizesError ? (
              <div className="text-[11px] text-red-500">{sizesError}</div>
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
          </Field>

          {/* Price */}
          <Field label={t("Precio MXN", "Price MXN")}>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full border border-slate-300 bg-white rounded-lg px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-400"
              required
            />
          </Field>

          {/* Quantity */}
          <Field label={t("Cantidad", "Quantity")}>
            <input
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full border border-slate-300 bg-white rounded-lg px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-400"
              required
            />
          </Field>

          <div className="sm:col-span-2 lg:col-span-3 flex justify-end items-center">
            <button
              type="submit"
              disabled={lookupsLoading || sizesLoading}
              className="inline-flex items-center justify-center rounded-full bg-emerald-500 px-6 py-2.5 text-xs font-semibold text-white hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-sm"
            >
              {t("Agregar pares", "Add pairs")}
            </button>
          </div>
        </form>

        {message && (
          <p className="text-[11px] text-emerald-600 text-right">{message}</p>
        )}
      </section>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <label className="block text-[11px] font-medium text-slate-700">
        {label}
      </label>
      {children}
    </div>
  );
}
