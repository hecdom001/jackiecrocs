// app/admin/inventory/add/page.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useAdminLang } from "../../adminLangContext";

export const dynamic = "force-dynamic";

type SizeCategory = "adult" | "kids" | "youth" | "cm" | "other";

type SizeOption = {
  id: string;
  label: string;
  category: SizeCategory | string | null;
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
    case "grey black":
      return "Gris/Negro";
    case "beige brown":
      return "Beige/Café";
    default:
      return colorEn;
  }
}

function translateModelLabel(modelEn: string | null | undefined, lang: Lang) {
  if (!modelEn) return "";
  if (lang === "en") return modelEn;
  const key = modelEn.trim().toLowerCase();
  switch (key) {
    case "classic crocs":
      return "Crocs Clásico";
    case "classic platform crocs":
      return "Crocs Plataforma Clásica";
    case "classic shimmer gemstone crocs":
      return "Crocs Clásico Shimmer Gemstone";
    default:
      return modelEn;
  }
}

function slugifyLocation(input: string) {
  return input
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove accents
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function formatSizeCategory(
  cat: SizeCategory | string | null | undefined,
  lang: Lang,
) {
  const key = String(cat || "").trim().toLowerCase();
  if (!key) return "";

  if (lang === "en") {
    switch (key) {
      case "adult":
        return "Adult";
      case "kids":
        return "Kids";
      case "youth":
        return "Youth";
      case "cm":
        return "CM";
      default:
        return key;
    }
  }

  // Spanish
  switch (key) {
    case "adult":
      return "Adulto";
    case "kids":
      return "Niños";
    case "youth":
      return "Juvenil";
    case "cm":
      return "CM";
    default:
      return key;
  }
}

/* ------------------------ Small UI primitives ------------------------ */

function FieldHeader({
  label,
  helper,
  action,
}: {
  label: React.ReactNode;
  helper?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-2">
      <div className="min-w-0">
        <label className="block text-[11px] font-medium text-slate-700">
          {label}
        </label>
        {helper ? (
          <p className="mt-1 text-[10px] text-slate-500">{helper}</p>
        ) : null}
      </div>
      {action ? <div className="flex-shrink-0">{action}</div> : null}
    </div>
  );
}

function MiniButton({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold transition ${
        disabled
          ? "border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed"
          : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
      }`}
    >
      {children}
    </button>
  );
}

function Modal({
  open,
  title,
  subtitle,
  children,
  onClose,
}: {
  open: boolean;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/30"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-xl border border-slate-200">
        <div className="p-4 border-b border-slate-100">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
              {subtitle ? (
                <p className="text-[11px] text-slate-500 mt-1">{subtitle}</p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="h-8 w-8 rounded-full border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:border-slate-300"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}

/* ------------------------ Page ------------------------ */

export default function AddInventoryPage() {
  const router = useRouter();
  const { lang, t } = useAdminLang();

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

/* ------------------------ AddInventorySection ------------------------ */

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

  // locations
  const [locations, setLocations] = useState<LocationOption[]>([]);
  const [locationsLoading, setLocationsLoading] = useState(true);
  const [locationsError, setLocationsError] = useState<string | null>(null);
  const [locationId, setLocationId] = useState("");

  // models/colors/sizes
  const [models, setModels] = useState<string[]>([]);
  const [colors, setColors] = useState<string[]>([]);
  const [sizes, setSizes] = useState<SizeOption[]>([]);
  const [sizesLoading, setSizesLoading] = useState(true);
  const [sizesError, setSizesError] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // modal state
  const [openAddModel, setOpenAddModel] = useState(false);
  const [openAddColor, setOpenAddColor] = useState(false);
  const [openAddSize, setOpenAddSize] = useState(false);
  const [openAddLocation, setOpenAddLocation] = useState(false);

  // modal form state
  const [newModelName, setNewModelName] = useState("");
  const [newColorNameEn, setNewColorNameEn] = useState("");
  const [newSizeLabel, setNewSizeLabel] = useState("");
  const [newSizeCategory, setNewSizeCategory] = useState<SizeCategory>("adult");

  const [newLocationName, setNewLocationName] = useState("");
  const [newLocationSlug, setNewLocationSlug] = useState("");

  const [creatingLookup, setCreatingLookup] = useState<
    "model" | "color" | "size" | "location" | null
  >(null);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [lookupSuccess, setLookupSuccess] = useState<string | null>(null);

  const resetLookupFeedback = () => {
    setLookupError(null);
    setLookupSuccess(null);
  };

  // ---------- Loaders ----------
  async function loadSizes() {
    setSizesLoading(true);
    setSizesError(null);

    // Order by category (alphabetically), then sort_order (numeric)
    const { data, error } = await supabase
      .from("sizes")
      .select("id, label, category, sort_order")
      .order("category", { ascending: true, nullsFirst: true })
      .order("sort_order", { ascending: true, nullsFirst: true });

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
    const colorNames = (data ?? []).map((c) => String(c.name_en));
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
    const modelNames = (data ?? []).map((m) => String(m.name));
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

    const tijuana = list.find((l) => l.slug?.toLowerCase() === "tijuana");
    setLocationId((prev) => prev || tijuana?.id || list[0]?.id || "");

    setLocationsLoading(false);
  }

  useEffect(() => {
    loadSizes();
    loadColors();
    loadModels();
    loadLocations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedLocationName = useMemo(() => {
    const l = locations.find((x) => x.id === locationId);
    return l?.name || "";
  }, [locations, locationId]);

  // ---------- Create Lookups (Model/Color/Size/Location) ----------
  async function createModel() {
    resetLookupFeedback();

    const name = newModelName.trim();
    if (!name) {
      setLookupError(t("Escribe el nombre del modelo.", "Enter the model name."));
      return;
    }

    setCreatingLookup("model");
    try {
      const { data: existing, error: exErr } = await supabase
        .from("models")
        .select("name")
        .ilike("name", name)
        .limit(1);

      if (exErr) throw exErr;

      if (existing && existing.length > 0) {
        setLookupSuccess(
          t("Ese modelo ya existe. Seleccionado ✅", "Model already exists. Selected ✅")
        );
        await loadModels();
        setModelName(existing[0].name);
        setOpenAddModel(false);
        setNewModelName("");
        return;
      }

      const { error } = await supabase.from("models").insert({ name });
      if (error) throw error;

      await loadModels();
      setModelName(name);
      setLookupSuccess(t("Modelo creado ✅", "Model created ✅"));
      setOpenAddModel(false);
      setNewModelName("");
    } catch (err) {
      console.error(err);
      setLookupError(
        t(
          "No se pudo crear el modelo. Revisa la tabla/permiso.",
          "Could not create model. Check table/permission."
        )
      );
    } finally {
      setCreatingLookup(null);
    }
  }

  async function createColor() {
    resetLookupFeedback();

    const name_en = newColorNameEn.trim();
    if (!name_en) {
      setLookupError(t("Escribe el color en inglés.", "Enter the color in English."));
      return;
    }

    setCreatingLookup("color");
    try {
      const { data: existing, error: exErr } = await supabase
        .from("colors")
        .select("name_en")
        .ilike("name_en", name_en)
        .limit(1);

      if (exErr) throw exErr;

      if (existing && existing.length > 0) {
        setLookupSuccess(
          t("Ese color ya existe. Seleccionado ✅", "Color already exists. Selected ✅")
        );
        await loadColors();
        setColor(existing[0].name_en);
        setOpenAddColor(false);
        setNewColorNameEn("");
        return;
      }

      const { error } = await supabase.from("colors").insert({ name_en });
      if (error) throw error;

      await loadColors();
      setColor(name_en);
      setLookupSuccess(t("Color creado ✅", "Color created ✅"));
      setOpenAddColor(false);
      setNewColorNameEn("");
    } catch (err) {
      console.error(err);
      setLookupError(
        t(
          "No se pudo crear el color. Revisa la tabla/permiso.",
          "Could not create color. Check table/permission."
        )
      );
    } finally {
      setCreatingLookup(null);
    }
  }

  async function createSize() {
    resetLookupFeedback();

    const label = newSizeLabel.trim();
    const category = String(newSizeCategory).trim().toLowerCase() as SizeCategory;

    if (!label) {
      setLookupError(t("Escribe la talla.", "Enter the size label."));
      return;
    }
    if (!category) {
      setLookupError(t("Selecciona una categoría.", "Select a category."));
      return;
    }

    setCreatingLookup("size");
    try {
      // Duplicate check: (label + category)
      const { data: existing, error: exErr } = await supabase
        .from("sizes")
        .select("id, label, category")
        .eq("label", label)
        .eq("category", category)
        .limit(1);

      if (exErr) throw exErr;

      if (existing && existing.length > 0) {
        setLookupSuccess(
          t("Esa talla ya existe. Seleccionada ✅", "Size already exists. Selected ✅")
        );
        await loadSizes();
        setSizeId(existing[0].id);
        setOpenAddSize(false);
        setNewSizeLabel("");
        setNewSizeCategory("adult");
        return;
      }

      // Next sort_order INSIDE the same category (best effort)
      const { data: maxRow, error: maxErr } = await supabase
        .from("sizes")
        .select("sort_order")
        .eq("category", category)
        .order("sort_order", { ascending: false })
        .limit(1);

      if (maxErr) throw maxErr;

      const max = Number(maxRow?.[0]?.sort_order ?? 0);
      const nextSort = Number.isFinite(max) ? max + 10 : 10;

      const { data: inserted, error } = await supabase
        .from("sizes")
        .insert({ label, category, sort_order: nextSort })
        .select("id, label, category")
        .single();

      if (error) throw error;

      await loadSizes();
      setSizeId(inserted.id);
      setLookupSuccess(t("Talla creada ✅", "Size created ✅"));
      setOpenAddSize(false);
      setNewSizeLabel("");
      setNewSizeCategory("adult");
    } catch (err) {
      console.error(err);
      setLookupError(
        t(
          "No se pudo crear la talla. Revisa la tabla/permiso/columnas requeridas.",
          "Could not create size. Check table/permission/required columns."
        )
      );
    } finally {
      setCreatingLookup(null);
    }
  }

  async function createLocation() {
    resetLookupFeedback();

    const name = newLocationName.trim();
    const slug = (newLocationSlug.trim() || slugifyLocation(name)).trim();

    if (!name) {
      setLookupError(t("Escribe el nombre.", "Enter a name."));
      return;
    }
    if (!slug) {
      setLookupError(t("Escribe el slug.", "Enter a slug."));
      return;
    }

    setCreatingLookup("location");
    try {
      const { data: existing, error: exErr } = await supabase
        .from("locations")
        .select("id, slug, name")
        .eq("slug", slug)
        .limit(1);

      if (exErr) throw exErr;

      if (existing && existing.length > 0) {
        setLookupSuccess(
          t("Ese slug ya existe. Seleccionado ✅", "That slug already exists. Selected ✅")
        );
        await loadLocations();
        setLocationId(existing[0].id);
        setOpenAddLocation(false);
        setNewLocationName("");
        setNewLocationSlug("");
        return;
      }

      const { data: inserted, error } = await supabase
        .from("locations")
        .insert({ name, slug })
        .select("id, slug, name")
        .single();

      if (error) throw error;

      await loadLocations();
      setLocationId(inserted.id);
      setLookupSuccess(t("Ubicación creada ✅", "Location created ✅"));
      setOpenAddLocation(false);
      setNewLocationName("");
      setNewLocationSlug("");
    } catch (err) {
      console.error(err);
      setLookupError(
        t(
          "No se pudo crear la ubicación. Revisa la tabla/permiso.",
          "Could not create location. Check table/permission."
        )
      );
    } finally {
      setCreatingLookup(null);
    }
  }

  // ---------- Inventory submit ----------
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
        t("Completa todos los campos antes de guardar.", "Please fill in all fields before saving.")
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
          size_id: sizeId,
          price_mxn: Number(price),
          quantity: Number(quantity) || 1,
          location_id: locationId,
        }),
      });

      if (res.status === 401) {
        onUnauthorized();
        return;
      }

      const data = await res.json();
      if (!res.ok) {
        console.error("Error creating inventory:", data);
        setMessage(data.error || t("Error al agregar inventario.", "Error adding inventory."));
        return;
      }

      setMessage(t("Pares agregados correctamente ✅", "Pairs added successfully ✅"));

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

  // Keep slug suggestion when opening location modal
  useEffect(() => {
    if (!openAddLocation) return;
    resetLookupFeedback();
    if (newLocationName.trim() && !newLocationSlug.trim()) {
      setNewLocationSlug(slugifyLocation(newLocationName));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openAddLocation]);

  // Clear modal feedback when opening other modals
  useEffect(() => {
    if (openAddModel || openAddColor || openAddSize) resetLookupFeedback();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openAddModel, openAddColor, openAddSize]);

  return (
    <>
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

        <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {/* Location */}
          <div className="space-y-2">
            <FieldHeader
              label={t("Ubicación", "Location")}
              helper={t(
                "Esto define en qué ciudad está físicamente este par.",
                "This defines which city this pair is physically in."
              )}
              action={
                <MiniButton onClick={() => setOpenAddLocation(true)}>
                  + {t("Nueva", "New")}
                </MiniButton>
              }
            />

            {locationsLoading ? (
              <div className="text-[11px] text-slate-500">{t("Cargando ubicaciones…", "Loading locations…")}</div>
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
                    {l.name} ({l.slug})
                  </option>
                ))}
              </select>
            )}

            {selectedLocationName ? (
              <p className="text-[10px] text-slate-500">
                {t("Seleccionado:", "Selected:")}{" "}
                <span className="font-semibold text-slate-700">{selectedLocationName}</span>
              </p>
            ) : null}
          </div>

          {/* Model */}
          <div className="space-y-2">
            <FieldHeader
              label={t("Modelo", "Model")}
              action={
                <MiniButton onClick={() => setOpenAddModel(true)}>
                  + {t("Nuevo", "New")}
                </MiniButton>
              }
            />
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
          <div className="space-y-2">
            <FieldHeader
              label={t("Color", "Color")}
              helper={t(
                "Modelo y color se guardan en inglés; el público lo ve traducido.",
                "Model and color are stored in English; the public page will translate them."
              )}
              action={
                <MiniButton onClick={() => setOpenAddColor(true)}>
                  + {t("Nuevo", "New")}
                </MiniButton>
              }
            />
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
          </div>

          {/* Size */}
          <div className="space-y-2">
            <FieldHeader
              label={t("Talla", "Size")}
              action={
                <MiniButton onClick={() => setOpenAddSize(true)}>
                  + {t("Nueva", "New")}
                </MiniButton>
              }
            />

            {sizesLoading ? (
              <div className="text-[11px] text-slate-500">{t("Cargando tallas…", "Loading sizes…")}</div>
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
                {sizes.map((s) => {
                  const catLabel = formatSizeCategory(s.category, lang);
                  const suffix = catLabel ? ` • ${catLabel}` : "";
                  return (
                    <option key={s.id} value={s.id}>
                      {s.label}
                      {suffix}
                    </option>
                  );
                })}
              </select>
            )}
          </div>

          {/* Price */}
          <div className="space-y-2">
            <FieldHeader label={t("Precio MXN", "Price MXN")} />
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
          <div className="space-y-2">
            <FieldHeader label={t("Cantidad", "Quantity")} />
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
              {submitting ? t("Guardando…", "Saving…") : t("Agregar pares", "Add pairs")}
            </button>
          </div>
        </form>

        {message && <p className="text-[11px] text-right text-emerald-700">{message}</p>}
      </section>

      {/* ------------------------ Add Location Modal ------------------------ */}
      <Modal
        open={openAddLocation}
        title={t("Agregar ubicación", "Add location")}
        subtitle={t("Se guarda como locations.name y locations.slug.", "Saved as locations.name and locations.slug.")}
        onClose={() => setOpenAddLocation(false)}
      >
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="block text-[11px] font-medium text-slate-700">{t("Nombre", "Name")}</label>
            <input
              value={newLocationName}
              onChange={(e) => {
                const v = e.target.value;
                setNewLocationName(v);
                if (!newLocationSlug.trim()) setNewLocationSlug(slugifyLocation(v));
              }}
              placeholder={t("Ej: Tijuana", "Example: Tijuana")}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-400"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-[11px] font-medium text-slate-700">{t("Slug", "Slug")}</label>
            <input
              value={newLocationSlug}
              onChange={(e) => setNewLocationSlug(e.target.value)}
              placeholder="tijuana"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-400"
            />
            <p className="text-[10px] text-slate-500">
              {t("Solo minúsculas, sin espacios (usa _).", "Lowercase, no spaces (use _).")}
            </p>
          </div>

          {(lookupError || lookupSuccess) && (
            <p className={`text-[11px] ${lookupError ? "text-rose-600" : "text-emerald-700"}`}>
              {lookupError || lookupSuccess}
            </p>
          )}

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setOpenAddLocation(false)}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-[11px] font-semibold text-slate-700 hover:border-slate-300"
            >
              {t("Cancelar", "Cancel")}
            </button>
            <button
              type="button"
              onClick={createLocation}
              disabled={creatingLookup === "location"}
              className="rounded-full bg-emerald-500 px-4 py-2 text-[11px] font-semibold text-white hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {creatingLookup === "location" ? t("Guardando…", "Saving…") : t("Crear", "Create")}
            </button>
          </div>
        </div>
      </Modal>

      {/* ------------------------ Add Model Modal ------------------------ */}
      <Modal
        open={openAddModel}
        title={t("Agregar modelo", "Add model")}
        subtitle={t("Se guarda en inglés (name).", "Stored in English (name).")}
        onClose={() => setOpenAddModel(false)}
      >
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="block text-[11px] font-medium text-slate-700">
              {t("Nombre del modelo (EN)", "Model name (EN)")}
            </label>
            <input
              value={newModelName}
              onChange={(e) => setNewModelName(e.target.value)}
              placeholder="Classic Crocs"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-400"
            />
          </div>

          {(lookupError || lookupSuccess) && (
            <p className={`text-[11px] ${lookupError ? "text-rose-600" : "text-emerald-700"}`}>
              {lookupError || lookupSuccess}
            </p>
          )}

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setOpenAddModel(false)}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-[11px] font-semibold text-slate-700 hover:border-slate-300"
            >
              {t("Cancelar", "Cancel")}
            </button>
            <button
              type="button"
              onClick={createModel}
              disabled={creatingLookup === "model"}
              className="rounded-full bg-emerald-500 px-4 py-2 text-[11px] font-semibold text-white hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {creatingLookup === "model" ? t("Guardando…", "Saving…") : t("Crear", "Create")}
            </button>
          </div>
        </div>
      </Modal>

      {/* ------------------------ Add Color Modal ------------------------ */}
      <Modal
        open={openAddColor}
        title={t("Agregar color", "Add color")}
        subtitle={t("Se guarda en inglés (name_en).", "Stored in English (name_en).")}
        onClose={() => setOpenAddColor(false)}
      >
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="block text-[11px] font-medium text-slate-700">{t("Color (EN)", "Color (EN)")}</label>
            <input
              value={newColorNameEn}
              onChange={(e) => setNewColorNameEn(e.target.value)}
              placeholder="Grey Black"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-400"
            />
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-[11px] text-slate-700">
              {t("Vista en español:", "Spanish preview:")}{" "}
              <span className="font-semibold">{translateColorLabel(newColorNameEn, "es")}</span>
            </p>
          </div>

          {(lookupError || lookupSuccess) && (
            <p className={`text-[11px] ${lookupError ? "text-rose-600" : "text-emerald-700"}`}>
              {lookupError || lookupSuccess}
            </p>
          )}

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setOpenAddColor(false)}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-[11px] font-semibold text-slate-700 hover:border-slate-300"
            >
              {t("Cancelar", "Cancel")}
            </button>
            <button
              type="button"
              onClick={createColor}
              disabled={creatingLookup === "color"}
              className="rounded-full bg-emerald-500 px-4 py-2 text-[11px] font-semibold text-white hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {creatingLookup === "color" ? t("Guardando…", "Saving…") : t("Crear", "Create")}
            </button>
          </div>
        </div>
      </Modal>

      {/* ------------------------ Add Size Modal (WITH CATEGORY) ------------------------ */}
      <Modal
        open={openAddSize}
        title={t("Agregar talla", "Add size")}
        subtitle={t(
          "Se guarda como sizes.label + sizes.category (y asigna sort_order automático).",
          "Saved as sizes.label + sizes.category (with auto sort_order)."
        )}
        onClose={() => setOpenAddSize(false)}
      >
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="block text-[11px] font-medium text-slate-700">{t("Categoría", "Category")}</label>
              <select
                value={newSizeCategory}
                onChange={(e) => setNewSizeCategory(e.target.value as SizeCategory)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-400"
              >
                <option value="adult">{t("Adulto", "Adult")}</option>
                <option value="kids">{t("Niños", "Kids")}</option>
                <option value="youth">{t("Juvenil", "Youth")}</option>
                <option value="cm">{t("CM", "CM")}</option>
                <option value="other">{t("Otro", "Other")}</option>
              </select>
              <p className="text-[10px] text-slate-500">
                {t("Sirve para agrupar tallas en el admin.", "Used to group sizes in admin.")}
              </p>
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] font-medium text-slate-700">{t("Etiqueta de talla", "Size label")}</label>
              <input
                value={newSizeLabel}
                onChange={(e) => setNewSizeLabel(e.target.value)}
                placeholder={t("Ej: M10-W12", "Example: M10-W12")}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-400"
              />
              <p className="text-[10px] text-slate-500">
                {t("Ej: M10-W12, C8, J3, 23.5 cm", "Example: M10-W12, C8, J3, 23.5 cm")}
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-[11px] text-slate-700">
              {t("Vista:", "Preview:")}{" "}
              <span className="font-semibold">
                {newSizeLabel || "—"}{" "}
                {newSizeCategory ? `• ${formatSizeCategory(newSizeCategory, lang)}` : ""}
              </span>
            </p>
          </div>

          {(lookupError || lookupSuccess) && (
            <p className={`text-[11px] ${lookupError ? "text-rose-600" : "text-emerald-700"}`}>
              {lookupError || lookupSuccess}
            </p>
          )}

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setOpenAddSize(false)}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-[11px] font-semibold text-slate-700 hover:border-slate-300"
            >
              {t("Cancelar", "Cancel")}
            </button>
            <button
              type="button"
              onClick={createSize}
              disabled={creatingLookup === "size"}
              className="rounded-full bg-emerald-500 px-4 py-2 text-[11px] font-semibold text-white hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {creatingLookup === "size" ? t("Guardando…", "Saving…") : t("Crear", "Create")}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
