// app/admin/inventory/add/page.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useAdminLang } from "../../adminLangContext";
import { translateCategory } from "@/lib/jackieCatalogUtils";
import {
  translateColor,
  translateModelLabel,
} from "@/lib/jackieCatalogUtils";

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

type CategoryOption = {
  id: string;
  slug: string;
  name: string;
};

type ModelRow = {
  id: string;
  name: string;
  brand: string | null;
  category_id: string | null;
  uses_size: boolean;
  uses_color: boolean;
};

type Lang = "es" | "en";

function slugifyLocation(input: string) {
  return input
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");
}

function formatSizeCategory(
    cat: SizeCategory | string | null | undefined,
    lang: Lang
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
          {helper ? <p className="mt-1 text-[10px] text-slate-500">{helper}</p> : null}
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
        <div className="absolute inset-0 bg-black/30" onClick={onClose} aria-hidden="true" />
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
                {t("Operaciones de inventario", "Inventory operations")}
              </h1>
              <p className="text-xs text-slate-500">
                {t("Agrega y mueve items entre ubicaciones.", "Add and move items between locations.")}
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
            onUnauthorized={() => router.push("/admin/login?redirect=/admin/inventory/add")}
        />
      </div>
  );
}

function CollapsibleSection({
                              title,
                              subtitle,
                              defaultOpen = true,
                              children,
                              rightAction,
                            }: {
  title: string;
  subtitle?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
  rightAction?: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
      <section className="bg-white border border-slate-200 rounded-2xl shadow-sm">
        <div className="w-full flex items-start justify-between gap-3 p-4 sm:p-5">
          <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="min-w-0 flex-1 text-left sm:cursor-default"
          >
            <h2 className="text-sm sm:text-base font-semibold text-slate-900">{title}</h2>
            {subtitle ? <p className="text-[11px] text-slate-500 mt-1">{subtitle}</p> : null}
          </button>

          {rightAction ? <div className="hidden sm:block">{rightAction}</div> : null}

          <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="sm:hidden flex-shrink-0 h-8 w-8 rounded-full border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:border-slate-300"
              aria-label={open ? "Collapse section" : "Expand section"}
          >
            {open ? "▲" : "▼"}
          </button>
        </div>

        <div className={`${open ? "block" : "hidden"} sm:block px-4 sm:px-5 pb-4 sm:pb-5`}>
          {rightAction ? <div className="sm:hidden mb-3">{rightAction}</div> : null}
          {children}
        </div>
      </section>
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
  const DEFAULT_COLOR_NA = "N/A";
  const DEFAULT_SIZE_NA_LABEL = "N/A";

  // category/model selection
  const [categoryId, setCategoryId] = useState<string>("");
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);

  // main add form
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
  const [models, setModels] = useState<ModelRow[]>([]);
  const [colors, setColors] = useState<string[]>([]);
  const [sizes, setSizes] = useState<SizeOption[]>([]);
  const [sizesLoading, setSizesLoading] = useState(true);
  const [sizesError, setSizesError] = useState<string | null>(null);

  // resolved defaults
  const [naColorValue, setNaColorValue] = useState<string>(DEFAULT_COLOR_NA);
  const [naSizeId, setNaSizeId] = useState<string>("");

  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // modal state
  const [openAddModel, setOpenAddModel] = useState(false);
  const [openAddColor, setOpenAddColor] = useState(false);
  const [openAddSize, setOpenAddSize] = useState(false);
  const [openAddLocation, setOpenAddLocation] = useState(false);
  const [openAddCategory, setOpenAddCategory] = useState(false);

  // modal form state
  const [newCategoryName, setNewCategoryName] = useState("");

  const [newModelName, setNewModelName] = useState("");
  const [newModelBrand, setNewModelBrand] = useState("");
  const [newModelCategoryId, setNewModelCategoryId] = useState<string>("");
  const [newModelUsesSize, setNewModelUsesSize] = useState(true);
  const [newModelUsesColor, setNewModelUsesColor] = useState(true);

  const [newColorNameEn, setNewColorNameEn] = useState("");
  const [newSizeLabel, setNewSizeLabel] = useState("");
  const [newSizeCategory, setNewSizeCategory] = useState<SizeCategory>("adult");

  const [newLocationName, setNewLocationName] = useState("");

  const [creatingLookup, setCreatingLookup] = useState<
      "category" | "model" | "color" | "size" | "location" | null
  >(null);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [lookupSuccess, setLookupSuccess] = useState<string | null>(null);

  const resetLookupFeedback = () => {
    setLookupError(null);
    setLookupSuccess(null);
  };

  /* ------------------------ Product images (Admin) ------------------------ */
  const SUPABASE_IMAGE_BASE =
      "https://axrfkuupjoddsoswowac.supabase.co/storage/v1/object/public/product-images";
  const PLACEHOLDER_IMAGE = `${SUPABASE_IMAGE_BASE}/placeholderV2.png`;

  type InvPair = { model: string; color_en: string; category_id: string | null; inventory_rows: number };
  type ProductImageRow = { model: string; color_en: string; storage_path: string; updated_at?: string | null };

  const [invPairs, setInvPairs] = useState<InvPair[]>([]);
  const [invPairsLoading, setInvPairsLoading] = useState(false);

  const [productImageMap, setProductImageMap] = useState<Record<string, ProductImageRow>>({});
  const [imgCategoryId, setImgCategoryId] = useState<string>("");
  const [imgModel, setImgModel] = useState<string>("");
  const [imgColor, setImgColor] = useState<string>("");
  const [imgFile, setImgFile] = useState<File | null>(null);
  const [imgSaving, setImgSaving] = useState(false);
  const [imgMsg, setImgMsg] = useState<string | null>(null);
  const [imgPreviewUrl, setImgPreviewUrl] = useState<string | null>(null);
  const [imgLoadingPreview, setImgLoadingPreview] = useState(false);

  const fileInputId = "jw-product-image-file";
  const keyOf = (m: string, c: string) => `${(m || "").trim()}__${(c || "").trim()}`.toLowerCase();

  const currentImage = useMemo(() => {
    if (!imgModel || !imgColor) return null;
    const row = productImageMap[keyOf(imgModel, imgColor)];
    if (!row?.storage_path) return null;
    return row;
  }, [imgModel, imgColor, productImageMap]);

  const currentImageUrl = useMemo(() => {
    if (!currentImage?.storage_path) return null;
    const base = `${SUPABASE_IMAGE_BASE}/${currentImage.storage_path}`;
    const v = currentImage.updated_at ? encodeURIComponent(String(currentImage.updated_at)) : "1";
    return `${base}?v=${v}`;
  }, [currentImage]);

  useEffect(() => {
    if (!imgFile) {
      setImgPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(imgFile);
    setImgPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [imgFile]);

  useEffect(() => {
    if (!imgModel) return;
    setImgLoadingPreview(true);
    const tm = setTimeout(() => setImgLoadingPreview(false), 80);
    return () => clearTimeout(tm);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imgModel, imgColor, currentImageUrl]);

  /* ------------------------ Transfer inventory ------------------------ */

  type TransferInvRow = {
    id: string;
    model: string;
    category_id: string | null;
    uses_color: boolean;
    uses_size: boolean;
    color_en: string;
    size_id: string;
    size_label: string;
    size_category: string | null;
    location_id: string;
  };

  const [transferRows, setTransferRows] = useState<TransferInvRow[]>([]);
  const [transferLoading, setTransferLoading] = useState(false);

  const [trFromLocationId, setTrFromLocationId] = useState<string>("");
  const [trToLocationId, setTrToLocationId] = useState<string>("");
  const [trCategoryId, setTrCategoryId] = useState<string>("");
  const [trModel, setTrModel] = useState<string>("");
  const [trColor, setTrColor] = useState<string>("");
  const [trSizeId, setTrSizeId] = useState<string>("");
  const [trQty, setTrQty] = useState<string>("1");
  const [trSubmitting, setTrSubmitting] = useState(false);
  const [trMsg, setTrMsg] = useState<string | null>(null);

  async function loadTransferRows() {
    setTransferLoading(true);
    try {
      const { data, error } = await supabase
          .from("inventory_items")
          .select(
              `
          id,
          location_id,
          models(name, category_id, uses_color, uses_size),
          colors(name_en),
          sizes(id, label, category)
        `
          )
          .limit(5000);

      if (error) throw error;

      const rows: TransferInvRow[] = (data ?? [])
          .map((r: any) => {
            const id = String(r?.id || "").trim();
            const model = String(r?.models?.name || "").trim();
            const category_id = r?.models?.category_id ? String(r.models.category_id) : null;
            const uses_color = !!r?.models?.uses_color;
            const uses_size = !!r?.models?.uses_size;
            const color_en = String(r?.colors?.name_en || "").trim();
            const size_id = String(r?.sizes?.id || "").trim();
            const size_label = String(r?.sizes?.label || "").trim();
            const size_category = r?.sizes?.category ? String(r.sizes.category) : null;
            const location_id = String(r?.location_id || "").trim();

            if (!id || !model || !location_id || !color_en || !size_id) return null;

            return {
              id,
              model,
              category_id,
              uses_color,
              uses_size,
              color_en,
              size_id,
              size_label,
              size_category,
              location_id,
            };
          })
          .filter(Boolean) as TransferInvRow[];

      setTransferRows(rows);
    } catch (e) {
      console.error("loadTransferRows error:", e);
      setTransferRows([]);
    } finally {
      setTransferLoading(false);
    }
  }

  /* ------------------------ Loaders ------------------------ */

  async function ensureDefaultsExist() {
    // Ensure "N/A" color exists
    try {
      const { data: cRows, error: cErr } = await supabase
          .from("colors")
          .select("name_en")
          .eq("name_en", DEFAULT_COLOR_NA)
          .limit(1);

      if (!cErr && (!cRows || cRows.length === 0)) {
        const { error: insErr } = await supabase.from("colors").insert({ name_en: DEFAULT_COLOR_NA });
        if (insErr) console.warn("Could not insert N/A color (maybe permission):", insErr);
      }
      setNaColorValue(DEFAULT_COLOR_NA);
    } catch (e) {
      console.warn("ensureDefaultsExist colors error:", e);
      setNaColorValue(DEFAULT_COLOR_NA);
    }

    // Ensure size "N/A" exists (category other)
    try {
      const { data: sRows, error: sErr } = await supabase
          .from("sizes")
          .select("id, label, category")
          .eq("label", DEFAULT_SIZE_NA_LABEL)
          .limit(1);

      if (!sErr && sRows && sRows.length > 0) {
        setNaSizeId(String((sRows as any)[0].id));
        return;
      }

      const { data: maxRow } = await supabase
          .from("sizes")
          .select("sort_order")
          .eq("category", "other")
          .order("sort_order", { ascending: false })
          .limit(1);

      const max = Number((maxRow as any)?.[0]?.sort_order ?? 0);
      const nextSort = Number.isFinite(max) ? max + 1 : 1;

      const { data: inserted, error: insErr } = await supabase
          .from("sizes")
          .insert({ label: DEFAULT_SIZE_NA_LABEL, category: "other", sort_order: nextSort })
          .select("id")
          .single();

      if (!insErr && inserted?.id) setNaSizeId(String(inserted.id));
    } catch (e) {
      console.warn("ensureDefaultsExist sizes error:", e);
    }
  }

  async function loadCategories() {
    setCategoriesLoading(true);
    setCategoriesError(null);
    try {
      const { data, error } = await supabase.from("categories").select("id, slug, name").order("name");
      if (error) throw error;

      const list = (data ?? []) as any[];
      const mapped: CategoryOption[] = list.map((c) => ({
        id: String(c.id),
        slug: String(c.slug),
        name: String(c.name),
      }));

      setCategories(mapped);
      setCategoryId((prev) => prev || mapped[0]?.id || "");
      setNewModelCategoryId((prev) => prev || mapped[0]?.id || "");
      setImgCategoryId((prev) => prev || mapped[0]?.id || "");
      setTrCategoryId((prev) => prev || mapped[0]?.id || "");
    } catch (e) {
      console.error("Error loading categories:", e);
      setCategoriesError(t("Error cargando categorías", "Error loading categories"));
      setCategories([]);
    } finally {
      setCategoriesLoading(false);
    }
  }

  async function loadSizes() {
    setSizesLoading(true);
    setSizesError(null);

    const { data, error } = await supabase
        .from("sizes")
        .select("id, label, category, sort_order")
        .order("category", { ascending: true, nullsFirst: true })
        .order("sort_order", { ascending: true, nullsFirst: true });

    if (error) {
      console.error("Error loading sizes:", error);
      setSizesError(t("Error cargando tallas", "Error loading sizes"));
      setSizesLoading(false);
      return;
    }

    const list = (data ?? []) as SizeOption[];
    setSizes(list);

    const naRow = (data ?? []).find((s: any) => String(s.label).toUpperCase() === DEFAULT_SIZE_NA_LABEL);
    setNaSizeId(naRow ? String(naRow.id) : "");

    setSizesLoading(false);
  }

  async function loadColors() {
    const { data, error } = await supabase.from("colors").select("name_en").order("name_en");
    if (error) {
      console.error("Error loading colors:", error);
      return;
    }
    const colorNames = (data ?? []).map((c) => String((c as any).name_en));
    setColors(colorNames);
  }

  async function loadModels() {
    const { data, error } = await supabase
        .from("models")
        .select("id, name, brand, category_id, uses_size, uses_color")
        .order("name");
    if (error) {
      console.error("Error loading models:", error);
      return;
    }

    const rows = (data ?? []) as any[];
    setModels(
        rows.map((m) => ({
          id: String(m.id),
          name: String(m.name),
          brand: m.brand ? String(m.brand) : null,
          category_id: m.category_id ? String(m.category_id) : null,
          uses_size: !!m.uses_size,
          uses_color: !!m.uses_color,
        }))
    );
  }

  async function loadLocations() {
    setLocationsLoading(true);
    setLocationsError(null);

    const { data, error } = await supabase.from("locations").select("id, slug, name").order("name");
    if (error) {
      console.error("Error loading locations:", error);
      setLocationsError(t("Error cargando ubicaciones", "Error loading locations"));
      setLocationsLoading(false);
      return;
    }

    const list = (data ?? []) as LocationOption[];
    setLocations(list);

    const tijuana = list.find((l) => l.slug?.toLowerCase() === "tijuana");
    const defaultLoc = tijuana?.id || list[0]?.id || "";

    setLocationId((prev) => prev || defaultLoc);

    // transfer defaults
    setTrFromLocationId((prev) => prev || defaultLoc);
    setTrToLocationId((prev) => {
      if (prev) return prev;
      const first = defaultLoc;
      const second = list.find((x) => x.id !== first)?.id || first;
      return second;
    });

    setLocationsLoading(false);
  }

  async function loadInventoryPairs() {
    setInvPairsLoading(true);
    try {
      const { data, error } = await supabase
          .from("inventory_items")
          .select(`models(name, category_id), colors(name_en)`)
          .limit(5000);
      if (error) throw error;

      const map = new Map<string, InvPair>();
      for (const row of data ?? []) {
        const model = String((row as any)?.models?.name || "").trim();
        const category_id = (row as any)?.models?.category_id ? String((row as any).models.category_id) : null;
        const color_en = String((row as any)?.colors?.name_en || "").trim();
        if (!model || !color_en) continue;

        const k = keyOf(model, color_en);
        const prev = map.get(k);
        if (!prev) map.set(k, { model, color_en, category_id, inventory_rows: 1 });
        else prev.inventory_rows += 1;
      }

      const list = Array.from(map.values()).sort((a, b) => {
        const m = a.model.localeCompare(b.model);
        if (m !== 0) return m;
        return a.color_en.localeCompare(b.color_en);
      });

      setInvPairs(list);

      if (!imgModel && list.length > 0) {
        const first = list[0];
        setImgModel(first.model);
        setImgColor(first.color_en);
      }
    } catch (e) {
      console.error("loadInventoryPairs error:", e);
      setInvPairs([]);
    } finally {
      setInvPairsLoading(false);
    }
  }

  async function loadProductImagesMap() {
    try {
      const { data, error } = await supabase
          .from("product_images")
          .select(`storage_path, updated_at, models(name), colors(name_en)`)
          .limit(5000);
      if (error) throw error;

      const next: Record<string, ProductImageRow> = {};
      for (const row of (data ?? []) as any[]) {
        const model = String(row?.models?.name || "").trim();
        const color_en = String(row?.colors?.name_en || "").trim();
        const storage_path = String(row?.storage_path || "").trim();
        if (!model || !color_en || !storage_path) continue;

        next[keyOf(model, color_en)] = { model, color_en, storage_path, updated_at: row?.updated_at ?? null };
      }

      setProductImageMap(next);
    } catch (e) {
      console.error("loadProductImagesMap error:", e);
      setProductImageMap({});
    }
  }

  async function uploadAndSaveProductImage() {
    setImgMsg(null);

    // if color hidden, imgColor forced to "N/A"
    if (!imgModel || !imgColor || !imgFile) {
      setImgMsg(t("Selecciona modelo y archivo.", "Pick model and file."));
      return;
    }

    setImgSaving(true);
    try {
      const fd = new FormData();
      fd.append("model", imgModel);
      fd.append("color", imgColor);
      fd.append("file", imgFile);

      const res = await fetch("/api/admin/product-images", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Upload failed");

      setImgMsg(t("Imagen guardada ✅", "Image saved ✅"));
      setImgFile(null);

      await loadProductImagesMap();
    } catch (err: any) {
      console.error(err);
      setImgMsg(err?.message || t("Error guardando imagen.", "Error saving image."));
    } finally {
      setImgSaving(false);
    }
  }

  useEffect(() => {
    (async () => {
      await ensureDefaultsExist();
      await loadCategories();
      await loadSizes();
      await loadColors();
      await loadModels();
      await loadLocations();

      await loadInventoryPairs();
      await loadProductImagesMap();

      await loadTransferRows();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedLocationName = useMemo(() => {
    const l = locations.find((x) => x.id === locationId);
    return l?.name || "";
  }, [locations, locationId]);

  const selectedModel = useMemo(() => {
    if (!modelName) return null;
    return models.find((m) => m.name === modelName) || null;
  }, [models, modelName]);

  const showColor = !!selectedModel?.uses_color;
  const showSize = !!selectedModel?.uses_size;

  // When model changes, apply defaults even if UI hides fields
  useEffect(() => {
    if (!selectedModel) return;

    if (!selectedModel.uses_color) setColor(naColorValue || DEFAULT_COLOR_NA);
    else if (!color) setColor("");

    if (!selectedModel.uses_size) {
      if (naSizeId) setSizeId(naSizeId);
    } else if (!sizeId) {
      setSizeId("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedModel?.name, naSizeId, naColorValue]);

  /* ------------------------ Product images: category-filtered pairs ------------------------ */

  const invPairsFilteredByCategory = useMemo(() => {
    if (!imgCategoryId) return invPairs;
    return invPairs.filter((p) => String(p.category_id || "") === String(imgCategoryId));
  }, [invPairs, imgCategoryId]);

  const imgModelOptions = useMemo(() => {
    const set = new Set(invPairsFilteredByCategory.map((p) => p.model));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [invPairsFilteredByCategory]);

  const imgColorOptions = useMemo(() => {
    if (!imgModel) return [];
    const set = new Set(invPairsFilteredByCategory.filter((p) => p.model === imgModel).map((p) => p.color_en));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [invPairsFilteredByCategory, imgModel]);

  const imgSelectedModel = useMemo(() => {
    return models.find((m) => m.name === imgModel) || null;
  }, [models, imgModel]);

  const imgUsesColor = imgSelectedModel?.uses_color ?? true;

  useEffect(() => {
    if (!imgModel) return;
    if (!imgUsesColor) setImgColor(DEFAULT_COLOR_NA);
  }, [imgModel, imgUsesColor]);

  useEffect(() => {
    if (!imgCategoryId) return;
    if (imgModel && imgModelOptions.includes(imgModel)) return;

    const nextModel = imgModelOptions[0] || "";
    setImgModel(nextModel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imgCategoryId, imgModelOptions]);

  useEffect(() => {
    if (!imgModel) {
      setImgColor("");
      return;
    }
    if (!imgUsesColor) return;
    if (imgColor && imgColorOptions.includes(imgColor)) return;
    setImgColor(imgColorOptions[0] || "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imgModel, imgColorOptions, imgUsesColor]);

  /* ------------------------ Transfer: filters + availability ------------------------ */

  const trSelectedModel = useMemo(() => {
    return models.find((m) => m.name === trModel) || null;
  }, [models, trModel]);

  const trUsesColor = trSelectedModel?.uses_color ?? true;
  const trUsesSize = trSelectedModel?.uses_size ?? true;

  const trRowsFiltered = useMemo(() => {
    return transferRows.filter((r) => {
      if (trFromLocationId && r.location_id !== trFromLocationId) return false;
      if (trCategoryId && String(r.category_id || "") !== String(trCategoryId)) return false;
      return true;
    });
  }, [transferRows, trFromLocationId, trCategoryId]);

  const trModelOptions = useMemo(() => {
    const set = new Set(trRowsFiltered.map((r) => r.model));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [trRowsFiltered]);

  useEffect(() => {
    if (!trModelOptions.length) {
      setTrModel("");
      setTrColor("");
      setTrSizeId("");
      return;
    }
    if (trModel && trModelOptions.includes(trModel)) return;
    setTrModel(trModelOptions[0] || "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trModelOptions]);

  const trRowsForModel = useMemo(() => {
    if (!trModel) return [];
    return trRowsFiltered.filter((r) => r.model === trModel);
  }, [trRowsFiltered, trModel]);

  const trColorOptions = useMemo(() => {
    if (!trUsesColor) return [DEFAULT_COLOR_NA];
    const set = new Set(trRowsForModel.map((r) => r.color_en));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [trRowsForModel, trUsesColor]);

  const trSizeOptions = useMemo(() => {
    if (!trUsesSize) {
      return naSizeId ? [{ id: naSizeId, label: DEFAULT_SIZE_NA_LABEL, category: "other" as any }] : [];
    }
    const map = new Map<string, { id: string; label: string; category: string | null }>();
    for (const r of trRowsForModel) {
      map.set(r.size_id, { id: r.size_id, label: r.size_label, category: r.size_category });
    }
    return Array.from(map.values()).sort((a, b) => {
      const al = a.label.localeCompare(b.label);
      if (al !== 0) return al;
      return String(a.category || "").localeCompare(String(b.category || ""));
    });
  }, [trRowsForModel, trUsesSize, naSizeId]);

  useEffect(() => {
    if (!trModel) return;

    if (!trUsesColor) setTrColor(DEFAULT_COLOR_NA);
    else if (!trColorOptions.includes(trColor)) setTrColor(trColorOptions[0] || "");

    if (!trUsesSize) {
      if (naSizeId) setTrSizeId(naSizeId);
    } else {
      const ids = trSizeOptions.map((s) => s.id);
      if (!ids.includes(trSizeId)) setTrSizeId(ids[0] || "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trModel, trUsesColor, trUsesSize, trColorOptions, trSizeOptions, naSizeId]);

  const trAvailableCount = useMemo(() => {
    if (!trFromLocationId || !trModel) return 0;

    const effectiveColor = trUsesColor ? trColor : DEFAULT_COLOR_NA;
    const effectiveSizeId = trUsesSize ? trSizeId : naSizeId;

    if (!effectiveColor || !effectiveSizeId) return 0;

    return transferRows.filter((r) => {
      if (r.location_id !== trFromLocationId) return false;
      if (r.model !== trModel) return false;
      if (r.color_en !== effectiveColor) return false;
      if (r.size_id !== effectiveSizeId) return false;
      return true;
    }).length;
  }, [transferRows, trFromLocationId, trModel, trColor, trSizeId, trUsesColor, trUsesSize, naSizeId]);

  /* ------------------------ Create Lookups ------------------------ */

  async function createCategory() {
    resetLookupFeedback();
    const name = newCategoryName.trim();
    if (!name) {
      setLookupError(t("Escribe el nombre.", "Enter a name."));
      return;
    }

    const slug = slugifyLocation(name);

    setCreatingLookup("category");
    try {
      const { data: existing, error: exErr } = await supabase
          .from("categories")
          .select("id, slug, name")
          .eq("slug", slug)
          .limit(1);
      if (exErr) throw exErr;

      if (existing && existing.length > 0) {
        setLookupSuccess(t("Esa categoría ya existe. Seleccionada ✅", "That category already exists. Selected ✅"));
        await loadCategories();
        setCategoryId(String(existing[0].id));
        setOpenAddCategory(false);
        setNewCategoryName("");
        return;
      }

      const { data: inserted, error } = await supabase
          .from("categories")
          .insert({ name, slug })
          .select("id, slug, name")
          .single();
      if (error) throw error;

      await loadCategories();
      setCategoryId(String(inserted.id));
      setLookupSuccess(t("Categoría creada ✅", "Category created ✅"));
      setOpenAddCategory(false);
      setNewCategoryName("");
    } catch (err) {
      console.error(err);
      setLookupError(t("No se pudo crear la categoría.", "Could not create category."));
    } finally {
      setCreatingLookup(null);
    }
  }

  async function createModel() {
    resetLookupFeedback();
    const name = newModelName.trim();
    if (!name) {
      setLookupError(t("Escribe el nombre del modelo.", "Enter the model name."));
      return;
    }

    const category_id = (newModelCategoryId || categoryId || "").trim() || null;
    const brand = newModelBrand.trim() || null;
    const uses_size = !!newModelUsesSize;
    const uses_color = !!newModelUsesColor;

    setCreatingLookup("model");
    try {
      const { data: existing, error: exErr } = await supabase
          .from("models")
          .select("id, name")
          .ilike("name", name)
          .limit(1);
      if (exErr) throw exErr;

      if (existing && existing.length > 0) {
        setLookupSuccess(t("Ese modelo ya existe. Seleccionado ✅", "Model already exists. Selected ✅"));
        await loadModels();
        setModelName(existing[0].name);
        setOpenAddModel(false);
        setNewModelName("");
        setNewModelBrand("");
        setNewModelUsesSize(true);
        setNewModelUsesColor(true);
        return;
      }

      const { error } = await supabase.from("models").insert({ name, brand, category_id, uses_size, uses_color });
      if (error) throw error;

      await loadModels();
      setModelName(name);
      setLookupSuccess(t("Modelo creado ✅", "Model created ✅"));
      setOpenAddModel(false);
      setNewModelName("");
      setNewModelBrand("");
      setNewModelUsesSize(true);
      setNewModelUsesColor(true);
    } catch (err) {
      console.error(err);
      setLookupError(t("No se pudo crear el modelo.", "Could not create model."));
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
        setLookupSuccess(t("Ese color ya existe. Seleccionado ✅", "Color already exists. Selected ✅"));
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
      setLookupError(t("No se pudo crear el color.", "Could not create color."));
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
      const { data: existing, error: exErr } = await supabase
          .from("sizes")
          .select("id, label, category")
          .eq("label", label)
          .eq("category", category)
          .limit(1);
      if (exErr) throw exErr;

      if (existing && existing.length > 0) {
        setLookupSuccess(t("Esa talla ya existe. Seleccionada ✅", "Size already exists. Selected ✅"));
        await loadSizes();
        setSizeId(existing[0].id);
        setOpenAddSize(false);
        setNewSizeLabel("");
        setNewSizeCategory("adult");
        return;
      }

      const { data: maxRow, error: maxErr } = await supabase
          .from("sizes")
          .select("sort_order")
          .eq("category", category)
          .order("sort_order", { ascending: false })
          .limit(1);
      if (maxErr) throw maxErr;

      const max = Number((maxRow as any)?.[0]?.sort_order ?? 0);
      const nextSort = Number.isFinite(max) ? max + 1 : 1;

      const { data: inserted, error } = await supabase
          .from("sizes")
          .insert({ label, category, sort_order: nextSort })
          .select("id")
          .single();
      if (error) throw error;

      await loadSizes();
      setSizeId(String((inserted as any).id));
      setLookupSuccess(t("Talla creada ✅", "Size created ✅"));
      setOpenAddSize(false);
      setNewSizeLabel("");
      setNewSizeCategory("adult");
    } catch (err) {
      console.error(err);
      setLookupError(t("No se pudo crear la talla.", "Could not create size."));
    } finally {
      setCreatingLookup(null);
    }
  }

  async function createLocation() {
    resetLookupFeedback();

    const name = newLocationName.trim();
    if (!name) {
      setLookupError(t("Escribe el nombre.", "Enter a name."));
      return;
    }

    const slug = slugifyLocation(name);

    setCreatingLookup("location");
    try {
      const { data: existing, error: exErr } = await supabase
          .from("locations")
          .select("id, slug, name")
          .eq("slug", slug)
          .limit(1);
      if (exErr) throw exErr;

      if (existing && existing.length > 0) {
        setLookupSuccess(t("Esa ubicación ya existe. Seleccionada ✅", "That location already exists. Selected ✅"));
        await loadLocations();
        setLocationId(existing[0].id);
        setOpenAddLocation(false);
        setNewLocationName("");
        return;
      }

      const { data: inserted, error } = await supabase
          .from("locations")
          .insert({ name, slug })
          .select("id, slug, name")
          .single();
      if (error) throw error;

      await loadLocations();
      setLocationId((inserted as any).id);
      setLookupSuccess(t("Ubicación creada ✅", "Location created ✅"));
      setOpenAddLocation(false);
      setNewLocationName("");
    } catch (err) {
      console.error(err);
      setLookupError(t("No se pudo crear la ubicación.", "Could not create location."));
    } finally {
      setCreatingLookup(null);
    }
  }

  /* ------------------------ Inventory submit ------------------------ */

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);

    if (!categoryId.trim() || !modelName.trim() || !price.trim() || !locationId.trim()) {
      setMessage(t("Completa todos los campos antes de guardar.", "Please fill in all fields before saving."));
      return;
    }

    const selected = selectedModel;
    if (!selected) {
      setMessage(t("Selecciona un modelo.", "Select a model."));
      return;
    }

    const effectiveColor = selected.uses_color ? (color || "").trim() : naColorValue || DEFAULT_COLOR_NA;
    if (selected.uses_color && !effectiveColor) {
      setMessage(t("Selecciona un color.", "Select a color."));
      return;
    }

    let effectiveSizeId = selected.uses_size ? (sizeId || "").trim() : naSizeId;
    if (selected.uses_size && !effectiveSizeId) {
      setMessage(t("Selecciona una talla.", "Select a size."));
      return;
    }

    if (!effectiveSizeId) {
      setMessage(t("No se pudo asignar talla.", "Could not assign size."));
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model_name: modelName.trim(),
          color: effectiveColor,
          size_id: effectiveSizeId,
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
        setMessage(data?.error || t("Error al agregar inventario.", "Error adding inventory."));
        return;
      }

      setMessage(t("Agregado correctamente ✅", "Added successfully ✅"));

      setQuantity("1");
      if (selected.uses_size) setSizeId("");
      else if (naSizeId) setSizeId(naSizeId);

      if (selected.uses_color) setColor("");
      else setColor(naColorValue || DEFAULT_COLOR_NA);

      onAdded();
      await loadInventoryPairs();
      await loadTransferRows();
    } catch (err) {
      console.error(err);
      setMessage(t("Error al agregar inventario.", "Error adding inventory."));
    } finally {
      setSubmitting(false);
    }
  }

  /* ------------------------ Transfer submit ------------------------ */

  async function handleTransfer(e: React.FormEvent) {
    e.preventDefault();
    setTrMsg(null);

    if (!trFromLocationId || !trToLocationId) {
      setTrMsg(t("Selecciona origen y destino.", "Pick from/to locations."));
      return;
    }
    if (trFromLocationId === trToLocationId) {
      setTrMsg(t("Origen y destino no pueden ser iguales.", "From and To cannot be the same."));
      return;
    }
    if (!trCategoryId || !trModel) {
      setTrMsg(t("Selecciona categoría y modelo.", "Pick category and model."));
      return;
    }

    const effectiveColor = trUsesColor ? (trColor || "").trim() : DEFAULT_COLOR_NA;
    const effectiveSizeId = trUsesSize ? (trSizeId || "").trim() : naSizeId;

    if (trUsesColor && !effectiveColor) {
      setTrMsg(t("Selecciona color.", "Select a color."));
      return;
    }
    if (trUsesSize && !effectiveSizeId) {
      setTrMsg(t("Selecciona talla.", "Select a size."));
      return;
    }
    if (!effectiveSizeId) {
      setTrMsg(t("No se pudo asignar talla.", "Could not assign size."));
      return;
    }

    const qty = Math.max(1, Number(trQty) || 1);
    if (qty > trAvailableCount) {
      setTrMsg(t("No hay suficiente inventario disponible.", "Not enough inventory available."));
      return;
    }

    setTrSubmitting(true);
    try {
      const res = await fetch("/api/admin/inventory/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          from_location_id: trFromLocationId,
          to_location_id: trToLocationId,
          model_name: trModel,
          color: effectiveColor,
          size_id: effectiveSizeId,
          quantity: qty,
        }),
      });

      if (res.status === 401) {
        onUnauthorized();
        return;
      }

      const data = await res.json();
      if (!res.ok) {
        setTrMsg(data?.error || t("Error transfiriendo inventario.", "Error transferring inventory."));
        return;
      }

      setTrMsg(t("Transferencia realizada ✅", "Transfer completed ✅"));
      setTrQty("1");

      await loadTransferRows();
      await loadInventoryPairs();
    } catch (err) {
      console.error(err);
      setTrMsg(t("Error transfiriendo inventario.", "Error transferring inventory."));
    } finally {
      setTrSubmitting(false);
    }
  }

  /* ------------------------ Modals helpers ------------------------ */

  useEffect(() => {
    if (openAddModel || openAddColor || openAddSize || openAddCategory || openAddLocation) resetLookupFeedback();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openAddModel, openAddColor, openAddSize, openAddCategory, openAddLocation]);

  useEffect(() => {
    if (!openAddModel) return;
    setNewModelCategoryId((prev) => prev || categoryId || categories[0]?.id || "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openAddModel]);

  /* ------------------------ UI ------------------------ */

  const productImagesGridCols = imgUsesColor ? "sm:grid-cols-2 lg:grid-cols-4" : "sm:grid-cols-2 lg:grid-cols-3";
  const productPickEnabled = !!imgModel && (!imgUsesColor || !!imgColor);

  return (
      <>
        {/* ------------------------ Add new items ------------------------ */}
        <CollapsibleSection
            title={t("Agregar nuevo inventario", "Add new inventory")}
            subtitle={t("El modelo define si se usan tallas y/o colores.", "The model defines whether sizes and/or colors are used.")}
            defaultOpen={false}
        >
          <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {/* Category */}
            <div className="space-y-2">
              <FieldHeader
                  label={t("Categoría", "Category")}
                  helper={t("Filtra los modelos disponibles.", "Filters available models.")}
                  action={
                    <MiniButton onClick={() => setOpenAddCategory(true)}>
                      + {t("Nueva", "New")}
                    </MiniButton>
                  }
              />

              {categoriesLoading ? (
                  <div className="text-[11px] text-slate-500">{t("Cargando categorías…", "Loading categories…")}</div>
              ) : categoriesError ? (
                  <div className="text-[11px] text-rose-600">{categoriesError}</div>
              ) : (
                  <select
                      value={categoryId}
                      onChange={(e) => {
                        setCategoryId(e.target.value);
                        setModelName("");
                        setColor("");
                        setSizeId("");
                      }}
                      className="w-full border border-slate-300 bg-white rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                      required
                  >
                    <option value="" disabled>
                      {t("Selecciona una categoría", "Select a category")}
                    </option>
                    {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {translateCategory(c.name,lang)}
                        </option>
                    ))}
                  </select>
              )}
            </div>

            {/* Location */}
            <div className="space-y-2">
              <FieldHeader
                  label={t("Ubicación", "Location")}
                  helper={t("Ciudad donde está físicamente.", "City where it is physically located.")}
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
                          {l.name}
                        </option>
                    ))}
                  </select>
              )}
            </div>

            {/* Model */}
            <div className="space-y-2">
              <FieldHeader
                  label={t("Modelo", "Model")}
                  helper={t("El modelo define si usa talla y/o color.", "The model defines whether it uses size and/or color.")}
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
                {models
                    .filter((m) => (categoryId ? String(m.category_id || "") === String(categoryId) : true))
                    .map((m) => (
                        <option key={m.id} value={m.name}>
                          {translateModelLabel(m.name, lang)}
                        </option>
                    ))}
              </select>

              {selectedModel?.brand ? (
                  <p className="text-[10px] text-slate-500">
                    {t("Marca:", "Brand:")}{" "}
                    <span className="font-semibold text-slate-700">{selectedModel.brand}</span>
                  </p>
              ) : null}
            </div>

            {/* Color */}
            {showColor ? (
                <div className="space-y-2">
                  <FieldHeader
                      label={t("Color", "Color")}
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
                    {!colors.includes(naColorValue) ? <option value={naColorValue}>{naColorValue}</option> : null}
                    {colors.map((c) => (
                        <option key={c} value={c}>
                          {translateColor(c, lang)}
                        </option>
                    ))}
                  </select>
                </div>
            ) : null}

            {/* Size */}
            {showSize ? (
                <div className="space-y-2">
                  <FieldHeader
                      label={t("Talla / Tamaño", "Size")}
                      helper={t("Selecciona una talla", "Select a size")}
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
                      >
                        <option value="">{t("— Selecciona una talla —", "— Select a size —")}</option>
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
            ) : null}

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
                {submitting ? t("Guardando…", "Saving…") : t("Agregar", "Add")}
              </button>
            </div>
          </form>

          {message && <p className="text-[11px] text-right text-emerald-700">{message}</p>}
        </CollapsibleSection>

        {/* ------------------------ Product Images (Admin) ------------------------ */}
        {/* ------------------------ Product Images (Admin) ------------------------ */}
        <CollapsibleSection
            title={t("Imágenes de producto", "Product images")}
            subtitle={t("Sube/actualiza la imagen por modelo.", "Upload/update image by model.")}
            defaultOpen={false}
        >
          <div className="space-y-4">
            {/* ✅ HEADERS only on sm+ (mobile looks cleaner without a header row) */}
            <div className={`hidden sm:grid gap-3 ${productImagesGridCols}`}>
              <div className="min-h-[42px]">
                <FieldHeader label={t("Categoría", "Category")} helper={t("Filtra los modelos.", "Filters models.")} />
              </div>
              <div className="min-h-[42px]">
                <FieldHeader
                    label={t("Modelo", "Model")}
                    helper={t("Solo combos que existen en inventario.", "Only combinations that exist in inventory.")}
                />
              </div>
              {imgUsesColor ? (
                  <div className="min-h-[42px]">
                    <FieldHeader label={t("Color", "Color")} helper=" " />
                  </div>
              ) : null}
              <div className="min-h-[42px]">
                <FieldHeader label={t("Archivo", "File")} helper={t("PNG/JPG recomendado.", "PNG/JPG recommended.")} />
              </div>
            </div>

            {/* ✅ CONTROLS: stack on mobile, grid on sm+ */}
            <div className={`grid gap-3 ${productImagesGridCols}`}>
              {/* Category */}
              <div className="space-y-2">
                {/* mobile label (since header row is hidden) */}
                <div className="sm:hidden">
                  <FieldHeader label={t("Categoría", "Category")} helper={t("Filtra los modelos.", "Filters models.")} />
                </div>
                <select
                    value={imgCategoryId}
                    onChange={(e) => setImgCategoryId(e.target.value)}
                    className="w-full h-11 border border-slate-300 bg-white rounded-lg px-3 text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                >
                  {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {translateCategory(c.name,lang)}
                      </option>
                  ))}
                </select>
              </div>

              {/* Model */}
              <div className="space-y-2">
                <div className="sm:hidden">
                  <FieldHeader
                      label={t("Modelo", "Model")}
                      helper={t("Solo combos que existen en inventario.", "Only combinations that exist in inventory.")}
                  />
                </div>
                <select
                    value={imgModel}
                    onChange={(e) => setImgModel(e.target.value)}
                    className="w-full h-11 border border-slate-300 bg-white rounded-lg px-3 text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                >
                  <option value="">
                    {invPairsLoading ? t("Cargando…", "Loading…") : t("Selecciona un modelo", "Select a model")}
                  </option>
                  {imgModelOptions.map((m) => (
                      <option key={m} value={m}>
                        {translateModelLabel(m, lang)}
                      </option>
                  ))}
                </select>
              </div>

              {/* Color (only if applicable) */}
              {imgUsesColor ? (
                  <div className="space-y-2">
                    <div className="sm:hidden">
                      <FieldHeader label={t("Color", "Color")} helper=" " />
                    </div>
                    <select
                        value={imgColor}
                        onChange={(e) => setImgColor(e.target.value)}
                        className="w-full h-11 border border-slate-300 bg-white rounded-lg px-3 text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                        disabled={!imgModel}
                    >
                      <option value="">{t("Selecciona un color", "Select a color")}</option>
                      {imgColorOptions.map((c) => (
                          <option key={c} value={c}>
                            {translateColor(c, lang)}
                          </option>
                      ))}
                    </select>
                  </div>
              ) : null}

              {/* ✅ File picker: stack on mobile */}
              <div className="space-y-2">
                <div className="sm:hidden">
                  <FieldHeader label={t("Archivo", "File")} helper={t("PNG/JPG recomendado.", "PNG/JPG recommended.")} />
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <input
                      id={fileInputId}
                      type="file"
                      accept="image/*"
                      onChange={(e) => setImgFile(e.target.files?.[0] || null)}
                      className="hidden"
                  />

                  <label
                      htmlFor={fileInputId}
                      className={`h-11 inline-flex items-center justify-center rounded-lg px-4 text-[12px] font-semibold border transition cursor-pointer whitespace-nowrap w-full sm:w-auto ${
                          productPickEnabled
                              ? "border-slate-300 bg-white text-slate-800 hover:border-emerald-400 hover:text-emerald-700"
                              : "border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed"
                      }`}
                      aria-disabled={!productPickEnabled}
                      onClick={(e) => {
                        if (!productPickEnabled) e.preventDefault();
                      }}
                  >
                    {t("Elegir imagen", "Choose image")}
                  </label>

                  {/* filename below on mobile, inline on desktop */}
                  <p className="text-[11px] text-slate-600 sm:truncate sm:flex-1">
                    {imgFile ? imgFile.name : t("Ningún archivo seleccionado", "No file selected")}
                  </p>

                  {imgFile ? (
                      <button
                          type="button"
                          onClick={() => setImgFile(null)}
                          className="h-11 w-full sm:w-11 rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:border-slate-300 flex-shrink-0"
                          aria-label={t("Quitar archivo", "Clear selected file")}
                      >
                        ✕
                      </button>
                  ) : null}
                </div>
              </div>
            </div>

            {/* ✅ Preview: stack nicely on mobile */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="h-14 w-14 rounded-xl border border-slate-200 bg-white overflow-hidden flex items-center justify-center flex-shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                      src={imgPreviewUrl || currentImageUrl || PLACEHOLDER_IMAGE}
                      alt="Current product image"
                      className="h-full w-full object-cover"
                      loading="eager"
                      decoding="async"
                      onLoad={() => setImgLoadingPreview(false)}
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-semibold text-slate-900">{t("Imagen actual", "Current image")}</p>
                  <p className="text-[11px] text-slate-600 sm:truncate break-words">
                    {imgModel ? (
                        <>
                          <span className="font-medium">{translateModelLabel(imgModel, lang)}</span>
                          {imgUsesColor ? <> · {translateColor(imgColor, lang)}</> : null}
                          {currentImage?.storage_path ? (
                              <span className="text-slate-400"> · {currentImage.storage_path}</span>
                          ) : (
                              <span className="text-slate-400"> · {t("Sin imagen", "No image")}</span>
                          )}
                        </>
                    ) : (
                        <span className="text-slate-500">{t("Selecciona modelo.", "Select model.")}</span>
                    )}
                  </p>
                  {imgLoadingPreview ? (
                      <p className="text-[10px] text-slate-400 mt-1">{t("Cargando vista previa…", "Loading preview…")}</p>
                  ) : null}
                </div>

                {/* Refresh stays right on desktop, becomes full width on mobile */}
                <button
                    type="button"
                    onClick={async () => {
                      await loadProductImagesMap();
                      setImgMsg(t("Actualizado ✅", "Refreshed ✅"));
                    }}
                    className="w-full sm:w-auto inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm sm:text-[11px] font-semibold text-slate-700 hover:border-emerald-400 hover:text-emerald-700"
                >
                  {t("Actualizar", "Refresh")}
                </button>
              </div>
            </div>

            {/* Feedback + Save */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-[11px] text-slate-600">
                {imgMsg ? <span className="text-slate-800">{imgMsg}</span> : <span>&nbsp;</span>}
              </div>

              <button
                  type="button"
                  onClick={uploadAndSaveProductImage}
                  disabled={imgSaving || !imgModel || !imgFile || (imgUsesColor && !imgColor)}
                  className="w-full sm:w-auto inline-flex items-center justify-center rounded-full bg-emerald-500 px-6 py-2.5 text-xs font-semibold text-white hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-sm"
              >
                {imgSaving ? t("Subiendo…", "Uploading…") : t("Guardar imagen", "Save image")}
              </button>
            </div>
          </div>
        </CollapsibleSection>


        {/* ------------------------ Transfer inventory ------------------------ */}
        <CollapsibleSection
            title={t("Transferir inventario", "Transfer inventory")}
            subtitle={t("Mueve items entre ubicaciones con filtros.", "Move items between locations with filters.")}
            defaultOpen={false}
        >
          <form onSubmit={handleTransfer} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {/* From */}
            <div className="space-y-2">
              <FieldHeader label={t("Origen", "From")} helper={t("Ubicación actual del item.", "Current item location.")} />
              <select
                  value={trFromLocationId}
                  onChange={(e) => setTrFromLocationId(e.target.value)}
                  className="w-full border border-slate-300 bg-white rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                  required
              >
                {locations.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                ))}
              </select>
            </div>

            {/* To */}
            <div className="space-y-2">
              <FieldHeader label={t("Destino", "To")} helper={t("Nueva ubicación del item.", "New item location.")} />
              <select
                  value={trToLocationId}
                  onChange={(e) => setTrToLocationId(e.target.value)}
                  className="w-full border border-slate-300 bg-white rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                  required
              >
                {locations.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                ))}
              </select>
            </div>

            {/* Category */}
            <div className="space-y-2">
              <FieldHeader label={t("Categoría", "Category")} helper={t("Filtra modelos disponibles.", "Filters available models.")} />
              <select
                  value={trCategoryId}
                  onChange={(e) => {
                    setTrCategoryId(e.target.value);
                    setTrModel("");
                    setTrColor("");
                    setTrSizeId("");
                  }}
                  className="w-full border border-slate-300 bg-white rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                  required
              >
                {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {translateCategory(c.name,lang)}
                    </option>
                ))}
              </select>
            </div>

            {/* Model */}
            <div className="space-y-2">
              <FieldHeader label={t("Modelo", "Model")} helper={t("Solo lo que existe en el origen.", "Only what exists in the From location.")} />
              <select
                  value={trModel}
                  onChange={(e) => setTrModel(e.target.value)}
                  className="w-full border border-slate-300 bg-white rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                  required
              >
                <option value="">
                  {transferLoading ? t("Cargando…", "Loading…") : t("Selecciona un modelo", "Select a model")}
                </option>
                {trModelOptions.map((m) => (
                    <option key={m} value={m}>
                      {translateModelLabel(m, lang)}
                    </option>
                ))}
              </select>
            </div>

            {/* Color (only if applicable) */}
            {trUsesColor ? (
                <div className="space-y-2">
                  <FieldHeader label={t("Color", "Color")} helper=" " />
                  <select
                      value={trColor}
                      onChange={(e) => setTrColor(e.target.value)}
                      className="w-full border border-slate-300 bg-white rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                      required
                      disabled={!trModel}
                  >
                    <option value="">{t("Selecciona un color", "Select a color")}</option>
                    {trColorOptions.map((c) => (
                        <option key={c} value={c}>
                          {translateColor(c, lang)}
                        </option>
                    ))}
                  </select>
                </div>
            ) : null}

            {/* Size (only if applicable) */}
            {trUsesSize ? (
                <div className="space-y-2">
                  <FieldHeader label={t("Talla / Tamaño", "Size")} helper=" " />
                  <select
                      value={trSizeId}
                      onChange={(e) => setTrSizeId(e.target.value)}
                      className="w-full border border-slate-300 bg-white rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                      required
                      disabled={!trModel}
                  >
                    <option value="">{t("— Selecciona una talla —", "— Select a size —")}</option>
                    {trSizeOptions.map((s: any) => {
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
                </div>
            ) : null}

            {/* Quantity */}
            <div className="space-y-2">
              <FieldHeader
                  label={t("Cantidad", "Quantity")}
                  helper={
                    trModel
                        ? t(`Disponible: ${trAvailableCount}`, `Available: ${trAvailableCount}`)
                        : t("Selecciona un modelo.", "Select a model.")
                  }
              />
              <input
                  type="number"
                  min={1}
                  max={Math.max(1, trAvailableCount)}
                  value={trQty}
                  onChange={(e) => setTrQty(e.target.value)}
                  className="w-full border border-slate-300 bg-white rounded-lg px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                  required
                  disabled={!trModel}
              />
            </div>

            {/* Actions */}
            <div className="sm:col-span-2 lg:col-span-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-[11px] text-slate-600">
                {trMsg ? <span className="text-slate-800">{trMsg}</span> : <span>&nbsp;</span>}
              </div>

              <div className="flex gap-2">
                <button
                    type="button"
                    onClick={async () => {
                      await loadTransferRows();
                      setTrMsg(t("Actualizado ✅", "Refreshed ✅"));
                    }}
                    className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-4 py-2 text-[11px] font-semibold text-slate-700 hover:border-emerald-400 hover:text-emerald-700"
                >
                  {t("Actualizar", "Refresh")}
                </button>

                <button
                    type="submit"
                    disabled={
                        trSubmitting ||
                        !trModel ||
                        (trUsesColor && !trColor) ||
                        (trUsesSize && !trSizeId) ||
                        trAvailableCount <= 0
                    }
                    className="inline-flex items-center justify-center rounded-full bg-emerald-500 px-6 py-2.5 text-xs font-semibold text-white hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-sm"
                >
                  {trSubmitting ? t("Transfiriendo…", "Transferring…") : t("Transferir", "Transfer")}
                </button>
              </div>
            </div>
          </form>
        </CollapsibleSection>

        {/* ------------------------ Modals ------------------------ */}

        {/* Add Category Modal */}
        <Modal
            open={openAddCategory}
            title={t("Agregar categoría", "Add category")}
            subtitle={t("El slug se genera automáticamente.", "Slug is generated automatically.")}
            onClose={() => setOpenAddCategory(false)}
        >
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="block text-[11px] font-medium text-slate-700">{t("Nombre", "Name")}</label>
              <input
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder={t("Ej: Bolsas", "Example: Bags")}
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
                  onClick={() => setOpenAddCategory(false)}
                  className="rounded-full border border-slate-200 bg-white px-4 py-2 text-[11px] font-semibold text-slate-700 hover:border-slate-300"
              >
                {t("Cancelar", "Cancel")}
              </button>
              <button
                  type="button"
                  onClick={createCategory}
                  disabled={creatingLookup === "category"}
                  className="rounded-full bg-emerald-500 px-4 py-2 text-[11px] font-semibold text-white hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {creatingLookup === "category" ? t("Guardando…", "Saving…") : t("Crear", "Create")}
              </button>
            </div>
          </div>
        </Modal>

        {/* Add Location Modal */}
        <Modal
            open={openAddLocation}
            title={t("Agregar ubicación", "Add location")}
            subtitle={t("El slug se genera automáticamente.", "Slug is generated automatically.")}
            onClose={() => setOpenAddLocation(false)}
        >
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="block text-[11px] font-medium text-slate-700">{t("Nombre", "Name")}</label>
              <input
                  value={newLocationName}
                  onChange={(e) => setNewLocationName(e.target.value)}
                  placeholder={t("Ej: Tijuana", "Example: Tijuana")}
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

        {/* Add Model Modal */}
        <Modal
            open={openAddModel}
            title={t("Agregar modelo", "Add model")}
            subtitle={t("Define si el modelo usa talla y/o color.", "Define whether the model uses size and/or color.")}
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

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="block text-[11px] font-medium text-slate-700">{t("Marca", "Brand")}</label>
                <input
                    value={newModelBrand}
                    onChange={(e) => setNewModelBrand(e.target.value)}
                    placeholder={t("Ej: Crocs", "Example: Crocs")}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-400"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-medium text-slate-700">{t("Categoría", "Category")}</label>
                <select
                    value={newModelCategoryId || categoryId || ""}
                    onChange={(e) => setNewModelCategoryId(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-400"
                >
                  {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {translateCategory(c.name,lang)}
                      </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-[11px] text-slate-700">
                <input
                    type="checkbox"
                    checked={newModelUsesSize}
                    onChange={(e) => setNewModelUsesSize(e.target.checked)}
                    className="h-4 w-4"
                />
                {t("Usa talla / tamaño", "Uses size")}
              </label>

              <label className="flex items-center gap-2 text-[11px] text-slate-700">
                <input
                    type="checkbox"
                    checked={newModelUsesColor}
                    onChange={(e) => setNewModelUsesColor(e.target.checked)}
                    className="h-4 w-4"
                />
                {t("Usa colores", "Uses colors")}
              </label>

              <p className="text-[10px] text-slate-500">
                {t(
                    "Si desactivas una opción, ese campo se oculta en el formulario y se guarda como N/A.",
                    "If you disable an option, that field is hidden in the form and saved as N/A."
                )}
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

        {/* Add Color Modal */}
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
                <span className="font-semibold">{translateColor(newColorNameEn, "es")}</span>
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

        {/* Add Size Modal */}
        <Modal
            open={openAddSize}
            title={t("Agregar talla / tamaño", "Add size")}
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
                  <option value="Men">{t("Hombre", "Men")}</option>
                  <option value="Women">{t("Mujer", "Women")}</option>
                  <option value="kids">{t("Niños", "Kids")}</option>
                  <option value="youth">{t("Juvenil", "Youth")}</option>
                  <option value="cm">{t("CM", "CM")}</option>
                  <option value="other">{t("Otro", "Other")}</option>
                </select>
                <p className="text-[10px] text-slate-500">{t("Sirve para agrupar tallas en el admin.", "Used to group sizes in admin.")}</p>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-medium text-slate-700">{t("Etiqueta", "Label")}</label>
                <input
                    value={newSizeLabel}
                    onChange={(e) => setNewSizeLabel(e.target.value)}
                    placeholder={t("Ej: M10-W12 o 50ml", "Example: M10-W12 or 50ml")}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-400"
                />
                <p className="text-[10px] text-slate-500">
                  {t("Ej: M10-W12, C8, J3, 23.5 cm, 50ml", "Example: M10-W12, C8, J3, 23.5 cm, 50ml")}
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-[11px] text-slate-700">
                {t("Vista:", "Preview:")}{" "}
                <span className="font-semibold">
                {newSizeLabel || "—"} {newSizeCategory ? `• ${formatSizeCategory(newSizeCategory, lang)}` : ""}
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
