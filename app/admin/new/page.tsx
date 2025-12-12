// app/admin/new/page.tsx
"use client";

import { useEffect, useState, FormEvent } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAdminLang } from "../adminLangContext";

type SizeOption = {
  id: string;
  label: string;
};

export default function AdminNewPage() {
  const { lang, t } = useAdminLang();
  const [adminPassword, setAdminPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  // Lookups / form state
  const [models, setModels] = useState<{ id: string; name: string }[]>([]);
  const [colors, setColors] = useState<{ id: string; name_en: string }[]>([]);
  const [modelSelect, setModelSelect] = useState<string>("");
  const [newModelName, setNewModelName] = useState("");
  const [colorSelect, setColorSelect] = useState<string>("");
  const [newColorName, setNewColorName] = useState("");
  const [sizeId, setSizeId] = useState(""); // 👈 size_id, not label
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("1");

  // Sizes lookup
  const [sizes, setSizes] = useState<SizeOption[]>([]);
  const [sizesLoading, setSizesLoading] = useState(true);
  const [sizesError, setSizesError] = useState<string | null>(null);

  async function loadLookups() {
    if (!adminPassword) return;

    const [modelsRes, colorsRes] = await Promise.all([
      fetch(`/api/admin/models?password=${adminPassword}`).then((r) => r.json()),
      fetch(`/api/admin/colors?password=${adminPassword}`).then((r) => r.json()),
    ]);

    setModels(modelsRes.models || []);
    setColors(colorsRes.colors || []);
  }

  // Load models/colors when password changes
  useEffect(() => {
    if (adminPassword) {
      loadLookups();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminPassword]);

  // Load sizes from Supabase (public read)
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

  const modelOptions = models.map((m) => m.name);
  const colorOptions = colors.map((c) => c.name_en);

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    if (!adminPassword) return;
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
      setMessage(
        t("Debes seleccionar una talla.", "You must select a size.")
      );
      return;
    }

    const res = await fetch("/api/admin/inventory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        adminPassword,
        model_name: finalModel,
        color: finalColor, // stored in English in DB
        size_id: sizeId,   // 👈 send size_id instead of size label
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
      t(
        "Inventario agregado correctamente ✅",
        "Inventory added successfully ✅"
      )
    );

    // reset form
    setModelSelect("");
    setNewModelName("");
    setColorSelect("");
    setNewColorName("");
    setSizeId(""); // 👈 reset size_id
    setPrice("");
    setQuantity("1");
  }

  return (
    <div className="space-y-6">
      {/* Top controls: password */}
      <section className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 sm:p-5 space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="w-full sm:max-w-md">
            <label className="block text-xs font-medium text-slate-700 mb-1">
              {t("Contraseña admin", "Admin password")}
            </label>
            <input
              type="password"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              className="w-full border border-slate-300 bg-white rounded-lg px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400"
              placeholder="••••••••"
            />
            <p className="mt-1 text-[11px] text-slate-500">
              {t(
                "Solo tú y Jackie deben tener esta contraseña.",
                "Only you and Jackie should have this password."
              )}
            </p>
          </div>
        </div>
      </section>

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

        <form
          onSubmit={handleAdd}
          className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
        >
          {/* Model select + other */}
          <Field label={t("Modelo", "Model")}>
            <div className="space-y-1">
              <select
                value={modelSelect}
                onChange={(e) => {
                  setModelSelect(e.target.value);
                  if (e.target.value !== "other") {
                    setNewModelName("");
                  }
                }}
                className="w-full border border-slate-300 bg-white rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                required
                disabled={!adminPassword}
              >
                <option value="" disabled>
                  {t("Selecciona un modelo", "Select a model")}
                </option>

                <option value="other">
                  {t("Otro (nuevo modelo)", "Other (new model)")}
                </option>

                {modelOptions.map((m) => (
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

          {/* Color select + other */}
          <Field label={t("Color (inglés)", "Color (English)")}>
            <div className="space-y-1">
              <select
                value={colorSelect}
                onChange={(e) => {
                  setColorSelect(e.target.value);
                  if (e.target.value !== "other") {
                    setNewColorName("");
                  }
                }}
                className="w-full border border-slate-300 bg-white rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                required
                disabled={!adminPassword}
              >
                <option value="" disabled>
                  {t("Selecciona un color", "Select a color")}
                </option>

                <option value="other">
                  {t("Otro (nuevo color)", "Other (new color)")}
                </option>

                {colorOptions.map((c) => (
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

          {/* Size (dropdown from DB, sends size_id) */}
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
              disabled={!adminPassword}
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
