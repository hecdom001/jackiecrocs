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

type InventoryItemDTO = {
  id: string;
  model_name: string | null;
  color: string | null;
  size: string;
  size_id: string;
  location_id: string | null;
  location: { id: string; slug: string; name: string } | null;
  status: "available" | "reserved" | "paid_complete" | "cancelled";
  price_mxn: number;
  customer_name?: string | null;
  notes?: string | null;
};

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
      return "Gris / Negro";
    case "beige brown":
      return "Beige / Café";
    case "grey white":
      return "Gris / Blanco";
    case "rose sugar":
      return "Rosa Azúcar";
    case "crystal white":
      return "Blanco Cristal";
    case "barbie":
      return "Barbie";
    case "batman":
      return "Batman";
    case "buzz lightyear":
      return "Buzz Lightyear";
    case "dragon ball":
      return "Dragon Ball";
    case "hello kitty":
      return "Hello Kitty";
    case "simpsons":
      return "Los Simpson";
    case "stranger things":
      return "Stranger Things";
    case "superman":
      return "Superman";
    case "toy story":
      return "Toy Story";
    case "yoda":
      return "Yoda";
    case "egg":
      return "Huevito";
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
    case "special edition crocs":
      return "Crocs Edición Especial";
    default:
      return modelEn;
  }
}

function slugifyLocation(input: string) {
  return input
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");
}

function formatSizeCategory(cat: SizeCategory | string | null | undefined, lang: Lang) {
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
          <label className="block text-[11px] font-medium text-slate-700">{label}</label>
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
                {subtitle ? <p className="text-[11px] text-slate-500 mt-1">{subtitle}</p> : null}
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
                {t("Agrega y mueve pares entre ubicaciones.", "Add and move pairs between locations.")}
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

  const [creatingLookup, setCreatingLookup] = useState<"model" | "color" | "size" | "location" | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [lookupSuccess, setLookupSuccess] = useState<string | null>(null);

  const resetLookupFeedback = () => {
    setLookupError(null);
    setLookupSuccess(null);
  };

  // ------------------------ Product images (Admin) ------------------------
  const SUPABASE_IMAGE_BASE =
      "https://axrfkuupjoddsoswowac.supabase.co/storage/v1/object/public/product-images";
  const PLACEHOLDER_IMAGE = `${SUPABASE_IMAGE_BASE}/placeholderV2.png`;

  type InvPair = { model: string; color_en: string; inventory_rows: number };
  type ProductImageRow = { model: string; color_en: string; storage_path: string; updated_at?: string | null };

  const [invPairs, setInvPairs] = useState<InvPair[]>([]);
  const [invPairsLoading, setInvPairsLoading] = useState(false);

  // map: "model__color" -> {storage_path, updated_at}
  const [productImageMap, setProductImageMap] = useState<Record<string, ProductImageRow>>({});
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
    // Cache-bust using updated_at if present
    if (!currentImage?.storage_path) return null;
    const base = `${SUPABASE_IMAGE_BASE}/${currentImage.storage_path}`;
    const v = currentImage.updated_at ? encodeURIComponent(String(currentImage.updated_at)) : "1";
    return `${base}?v=${v}`;
  }, [currentImage]);

  useEffect(() => {
    // show preview from selected file
    if (!imgFile) {
      setImgPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(imgFile);
    setImgPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [imgFile]);

  useEffect(() => {
    // When selection changes, show loading state briefly to avoid "flash"
    if (!imgModel || !imgColor) return;
    setImgLoadingPreview(true);
    const tm = setTimeout(() => setImgLoadingPreview(false), 80);
    return () => clearTimeout(tm);
  }, [imgModel, imgColor, currentImageUrl]);

  const imgModelOptions = useMemo(() => {
    const set = new Set(invPairs.map((p) => p.model));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [invPairs]);

  const imgColorOptions = useMemo(() => {
    if (!imgModel) return [];
    const set = new Set(invPairs.filter((p) => p.model === imgModel).map((p) => p.color_en));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [invPairs, imgModel]);

  useEffect(() => {
    // keep selected color valid when model changes
    if (!imgModel) {
      setImgColor("");
      return;
    }
    if (imgColor && imgColorOptions.includes(imgColor)) return;
    setImgColor(imgColorOptions[0] || "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imgModel, invPairs]);

  // ------------------------ Transfer state (IDs-based) ------------------------

  const [allInventory, setAllInventory] = useState<InventoryItemDTO[]>([]);
  const [invLoading, setInvLoading] = useState(false);
  const [invError, setInvError] = useState<string | null>(null);

  const [transferFrom, setTransferFrom] = useState("");
  const [transferTo, setTransferTo] = useState("");
  const [transferModel, setTransferModel] = useState<string>("all");
  const [transferColor, setTransferColor] = useState<string>("all");
  const [transferSizeId, setTransferSizeId] = useState<string>("all");

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [transferSubmitting, setTransferSubmitting] = useState(false);
  const [transferMsg, setTransferMsg] = useState<string | null>(null);

  function clearSelection() {
    setSelectedIds(new Set());
  }
  function toggleSelected(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }
  function selectAllFiltered() {
    setSelectedIds(new Set(transferFiltered.map((x) => x.id)));
  }

  async function loadInventoryForTransfer() {
    setInvLoading(true);
    setInvError(null);
    try {
      const res = await fetch("/api/admin/inventory", { cache: "no-store" });
      if (res.status === 401) {
        onUnauthorized();
        return;
      }
      const data = await res.json();
      setAllInventory(Array.isArray(data?.items) ? data.items : []);
    } catch (e) {
      console.error(e);
      setInvError("Error loading inventory");
    } finally {
      setInvLoading(false);
    }
  }

  async function loadInventoryPairs() {
    setInvPairsLoading(true);
    try {
      const { data, error } = await supabase.from("inventory_items").select(`models(name), colors(name_en)`).limit(5000);
      if (error) throw error;

      const map = new Map<string, InvPair>();

      for (const row of data ?? []) {
        const model = String((row as any)?.models?.name || "").trim();
        const color_en = String((row as any)?.colors?.name_en || "").trim();
        if (!model || !color_en) continue;

        const k = keyOf(model, color_en);
        const prev = map.get(k);
        if (!prev) map.set(k, { model, color_en, inventory_rows: 1 });
        else prev.inventory_rows += 1;
      }

      const list = Array.from(map.values()).sort((a, b) => {
        const m = a.model.localeCompare(b.model);
        if (m !== 0) return m;
        return a.color_en.localeCompare(b.color_en);
      });

      setInvPairs(list);

      // also set defaults for image selector (first available pair)
      if (!imgModel && list.length > 0) {
        setImgModel(list[0].model);
        setImgColor(list[0].color_en);
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
      // Join through models + colors to build a fast map for UI
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

        next[keyOf(model, color_en)] = {
          model,
          color_en,
          storage_path,
          updated_at: row?.updated_at ?? null,
        };
      }

      setProductImageMap(next);
    } catch (e) {
      console.error("loadProductImagesMap error:", e);
      setProductImageMap({});
    }
  }

  async function uploadAndSaveProductImage() {
    setImgMsg(null);

    if (!imgModel || !imgColor || !imgFile) {
      setImgMsg(t("Selecciona modelo, color y archivo.", "Pick model, color, and file."));
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
    } catch (err: any) {
      console.error(err);
      setImgMsg(err?.message || t("Error guardando imagen.", "Error saving image."));
    } finally {
      setImgSaving(false);
    }
  }


  /* ------------------------ Loaders ------------------------ */

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
      setSizesError("Error loading sizes");
      setSizesLoading(false);
      return;
    }

    setSizes((data ?? []) as SizeOption[]);
    setSizesLoading(false);
  }

  async function loadColors() {
    const { data, error } = await supabase.from("colors").select("name_en").order("name_en");
    if (error) {
      console.error("Error loading colors:", error);
      return;
    }
    const colorNames = (data ?? []).map((c) => String(c.name_en));
    setColors(colorNames);
  }

  async function loadModels() {
    const { data, error } = await supabase.from("models").select("name").order("name");
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

    const { data, error } = await supabase.from("locations").select("id, slug, name").order("name");

    if (error) {
      console.error("Error loading locations:", error);
      setLocationsError("Error loading locations");
      setLocationsLoading(false);
      return;
    }

    const list = (data ?? []) as LocationOption[];
    setLocations(list);

    const tijuana = list.find((l) => l.slug?.toLowerCase() === "tijuana");
    const defaultLoc = tijuana?.id || list[0]?.id || "";

    setLocationId((prev) => prev || defaultLoc);

    setTransferFrom((prev) => prev || defaultLoc);
    setTransferTo((prev) => {
      if (prev) return prev;
      const firstDifferent = list.find((x) => x.id !== defaultLoc);
      return firstDifferent?.id || defaultLoc;
    });

    setLocationsLoading(false);
  }

  useEffect(() => {
    loadSizes();
    loadColors();
    loadModels();
    loadLocations();
    loadInventoryForTransfer();

    // For image admin
    loadInventoryPairs();
    loadProductImagesMap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedLocationName = useMemo(() => {
    const l = locations.find((x) => x.id === locationId);
    return l?.name || "";
  }, [locations, locationId]);

  /* ------------------------ Transfer filtered list (AVAILABLE ONLY) ------------------------ */

  const transferFiltered = useMemo(() => {
    const from = transferFrom || "";
    return allInventory.filter((it) => {
      if (it.status !== "available") return false;

      const itLocId = String(it.location?.id || it.location_id || "");
      const matchFrom = !from ? true : itLocId === from;

      const matchModel = transferModel === "all" ? true : (it.model_name || "") === transferModel;
      const matchColor = transferColor === "all" ? true : (it.color || "") === transferColor;
      const matchSize = transferSizeId === "all" ? true : it.size_id === transferSizeId;

      return matchFrom && matchModel && matchColor && matchSize;
    });
  }, [allInventory, transferFrom, transferModel, transferColor, transferSizeId]);

  async function submitTransferSelected() {
    setTransferMsg(null);

    if (!transferTo) {
      setTransferMsg(t("Selecciona destino.", "Select destination."));
      return;
    }
    if (transferFrom === transferTo) {
      setTransferMsg(t("El origen y destino deben ser diferentes.", "From/To must be different."));
      return;
    }
    if (selectedIds.size === 0) {
      setTransferMsg(t("Selecciona al menos un par.", "Select at least one item."));
      return;
    }

    const allowed = new Set(transferFiltered.map((x) => x.id));
    const ids = Array.from(selectedIds).filter((id) => allowed.has(id));
    if (ids.length === 0) {
      setTransferMsg(t("No hay pares válidos seleccionados.", "No valid selected items."));
      return;
    }

    setTransferSubmitting(true);
    try {
      const res = await fetch("/api/admin/inventory/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to_location_id: transferTo,
          item_ids: ids,
        }),
      });

      if (res.status === 401) {
        onUnauthorized();
        return;
      }

      const data = await res.json();
      if (!res.ok) {
        setTransferMsg(data?.error || t("Error al transferir.", "Transfer failed."));
        return;
      }

      setTransferMsg(t(`Transferidos ${data.transferred} ✅`, `Transferred ${data.transferred} ✅`));
      clearSelection();
      loadInventoryForTransfer();
    } catch (err) {
      console.error(err);
      setTransferMsg(t("Error al transferir.", "Transfer failed."));
    } finally {
      setTransferSubmitting(false);
    }
  }

  /* ------------------------ Create Lookups (Model/Color/Size/Location) ------------------------ */

  async function createModel() {
    resetLookupFeedback();
    const name = newModelName.trim();
    if (!name) {
      setLookupError(t("Escribe el nombre del modelo.", "Enter the model name."));
      return;
    }

    setCreatingLookup("model");
    try {
      const { data: existing, error: exErr } = await supabase.from("models").select("name").ilike("name", name).limit(1);
      if (exErr) throw exErr;

      if (existing && existing.length > 0) {
        setLookupSuccess(t("Ese modelo ya existe. Seleccionado ✅", "Model already exists. Selected ✅"));
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
      setLookupError(t("No se pudo crear el modelo. Revisa la tabla/permiso.", "Could not create model. Check table/permission."));
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
      const { data: existing, error: exErr } = await supabase.from("colors").select("name_en").ilike("name_en", name_en).limit(1);
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
      setLookupError(t("No se pudo crear el color. Revisa la tabla/permiso.", "Could not create color. Check table/permission."));
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

      const max = Number(maxRow?.[0]?.sort_order ?? 0);
      const nextSort = Number.isFinite(max) ? max + 1 : 1;

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
      const { data: existing, error: exErr } = await supabase.from("locations").select("id, slug, name").eq("slug", slug).limit(1);
      if (exErr) throw exErr;

      if (existing && existing.length > 0) {
        setLookupSuccess(t("Ese slug ya existe. Seleccionado ✅", "That slug already exists. Selected ✅"));
        await loadLocations();
        setLocationId(existing[0].id);
        setOpenAddLocation(false);
        setNewLocationName("");
        setNewLocationSlug("");
        return;
      }

      const { data: inserted, error } = await supabase.from("locations").insert({ name, slug }).select("id, slug, name").single();
      if (error) throw error;

      await loadLocations();
      setLocationId(inserted.id);
      setLookupSuccess(t("Ubicación creada ✅", "Location created ✅"));
      setOpenAddLocation(false);
      setNewLocationName("");
      setNewLocationSlug("");
    } catch (err) {
      console.error(err);
      setLookupError(t("No se pudo crear la ubicación. Revisa la tabla/permiso.", "Could not create location. Check table/permission."));
    } finally {
      setCreatingLookup(null);
    }
  }

  /* ------------------------ Inventory submit ------------------------ */

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);

    if (!modelName.trim() || !color.trim() || !sizeId.trim() || !price.trim() || !locationId.trim()) {
      setMessage(t("Completa todos los campos antes de guardar.", "Please fill in all fields before saving."));
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
      loadInventoryForTransfer();

      // inventory changed -> refresh pairs list
      loadInventoryPairs();
    } catch (err) {
      console.error(err);
      setMessage(t("Error al agregar inventario.", "Error adding inventory."));
    } finally {
      setSubmitting(false);
    }
  }

  /* ------------------------ Modals helpers ------------------------ */

  useEffect(() => {
    if (!openAddLocation) return;
    resetLookupFeedback();
    if (newLocationName.trim() && !newLocationSlug.trim()) {
      setNewLocationSlug(slugifyLocation(newLocationName));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openAddLocation]);

  useEffect(() => {
    if (openAddModel || openAddColor || openAddSize) resetLookupFeedback();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openAddModel, openAddColor, openAddSize]);

  /* ------------------------ UI ------------------------ */

  return (
      <>
        {/* ------------------------ Add new pairs ------------------------ */}
        <CollapsibleSection
            title={t("Agregar nuevos pares", "Add new pairs")}
            subtitle={t(
                "Se crearán varios registros si pones cantidad mayor a 1.",
                "Multiple records will be created if quantity is greater than 1."
            )}
            defaultOpen={false}
        >
          <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {/* Location */}
            <div className="space-y-2">
              <FieldHeader
                  label={t("Ubicación", "Location")}
                  helper={t("Esto define en qué ciudad está físicamente este par.", "This defines which city this pair is physically in.")}
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
                    {t("Seleccionado:", "Selected:")} <span className="font-semibold text-slate-700">{selectedLocationName}</span>
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
        </CollapsibleSection>

        {/* ------------------------ Product Images (Admin) ------------------------ */}
        <CollapsibleSection
            title={t("Imágenes de producto", "Product images")}
            subtitle={t("Sube/actualiza la imagen por modelo+color.", "Upload/update image by model+color.")}
            defaultOpen={false}
        >
          <div className="space-y-3">
            {/* Row: Model / Color / File */}
            <div className="grid gap-3 lg:grid-cols-3 items-end">
              <div className="space-y-2">
                <FieldHeader
                    label={t("Modelo", "Model")}
                    helper={t("Solo combos que existen en inventario.", "Only combinations that exist in inventory.")}
                />
                <select
                    value={imgModel}
                    onChange={(e) => setImgModel(e.target.value)}
                    className="w-full border border-slate-300 bg-white rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                >
                  <option value="">{invPairsLoading ? t("Cargando…", "Loading…") : t("Selecciona un modelo", "Select a model")}</option>
                  {imgModelOptions.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <FieldHeader label={t("Color", "Color")} />
                <select
                    value={imgColor}
                    onChange={(e) => setImgColor(e.target.value)}
                    className="w-full border border-slate-300 bg-white rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                    disabled={!imgModel}
                >
                  <option value="">{t("Selecciona un color", "Select a color")}</option>
                  {imgColorOptions.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <FieldHeader label={t("Archivo", "File")} helper={t("PNG/JPG recomendado.", "PNG/JPG recommended.")} />

                {/* Custom file picker */}
                <div className="flex items-center gap-2">
                  <input
                      id={fileInputId}
                      type="file"
                      accept="image/*"
                      onChange={(e) => setImgFile(e.target.files?.[0] || null)}
                      className="hidden"
                  />
                  <label
                      htmlFor={fileInputId}
                      className={`inline-flex items-center justify-center rounded-full px-4 py-2 text-[11px] font-semibold border transition cursor-pointer ${
                          imgModel && imgColor
                              ? "border-slate-300 bg-white text-slate-800 hover:border-emerald-400 hover:text-emerald-700"
                              : "border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed"
                      }`}
                      aria-disabled={!(imgModel && imgColor)}
                      onClick={(e) => {
                        if (!(imgModel && imgColor)) e.preventDefault();
                      }}
                  >
                    {t("Elegir imagen", "Choose image")}
                  </label>

                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] text-slate-600 truncate">
                      {imgFile ? imgFile.name : t("Ningún archivo seleccionado", "No file selected")}
                    </p>
                  </div>

                  {imgFile ? (
                      <button
                          type="button"
                          onClick={() => setImgFile(null)}
                          className="h-9 w-9 rounded-full border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:border-slate-300"
                          aria-label="Clear selected file"
                      >
                        ✕
                      </button>
                  ) : null}
                </div>
              </div>
            </div>

            {/* Preview card */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <div className="flex items-center gap-3">
                <div className="h-14 w-14 rounded-xl border border-slate-200 bg-white overflow-hidden flex items-center justify-center">
                  {/* show selected-file preview first, else current image, else placeholder */}
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
                  <p className="text-[11px] font-semibold text-slate-900">
                    {t("Imagen actual", "Current image")}
                  </p>
                  <p className="text-[11px] text-slate-600 truncate">
                    {imgModel && imgColor ? (
                        <>
                          <span className="font-medium">{imgModel}</span> · {imgColor}
                          {currentImage?.storage_path ? (
                              <span className="text-slate-400"> · {currentImage.storage_path}</span>
                          ) : (
                              <span className="text-slate-400"> · {t("Sin imagen", "No image")}</span>
                          )}
                        </>
                    ) : (
                        <span className="text-slate-500">{t("Selecciona modelo y color.", "Select model and color.")}</span>
                    )}
                  </p>

                  {imgLoadingPreview ? (
                      <p className="text-[10px] text-slate-400 mt-1">{t("Cargando vista previa…", "Loading preview…")}</p>
                  ) : null}
                </div>

                <button
                    type="button"
                    onClick={() => {
                      loadProductImagesMap();
                      setImgMsg(t("Actualizado ✅", "Refreshed ✅"));
                    }}
                    className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-4 py-2 text-[11px] font-semibold text-slate-700 hover:border-emerald-400 hover:text-emerald-700"
                >
                  {t("Actualizar", "Refresh")}
                </button>
              </div>
            </div>

            {/* Save action */}
            <div className="flex items-center justify-between gap-2">
              <div className="text-[11px] text-slate-600">
                {imgMsg ? <span className="text-slate-800">{imgMsg}</span> : <span>&nbsp;</span>}
              </div>

              <button
                  type="button"
                  onClick={uploadAndSaveProductImage}
                  disabled={imgSaving || !imgModel || !imgColor || !imgFile}
                  className="inline-flex items-center justify-center rounded-full bg-emerald-500 px-6 py-2.5 text-xs font-semibold text-white hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-sm"
              >
                {imgSaving ? t("Subiendo…", "Uploading…") : t("Guardar imagen", "Save image")}
              </button>
            </div>
          </div>
        </CollapsibleSection>

        {/* ------------------------ Transfer (select items) ------------------------ */}
        <CollapsibleSection
            title={t("Transferir", "Transfer")}
            subtitle={t("Solo pares DISPONIBLES. Selecciona cuáles mover.", "Only AVAILABLE pairs. Select which ones to move.")}
            defaultOpen={false}
            rightAction={
              <div className="flex gap-2">
                <MiniButton onClick={selectAllFiltered} disabled={transferFiltered.length === 0}>
                  {t("Seleccionar todos", "Select all")}
                </MiniButton>
                <MiniButton onClick={clearSelection} disabled={selectedIds.size === 0}>
                  {t("Limpiar", "Clear")}
                </MiniButton>
              </div>
            }
        >
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <FieldHeader label={t("De (origen)", "From (source)")} />
              <select
                  value={transferFrom}
                  onChange={(e) => {
                    setTransferFrom(e.target.value);
                    clearSelection();
                  }}
                  className="w-full border border-slate-300 bg-white rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-400"
              >
                {locations.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name} ({l.slug})
                    </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <FieldHeader label={t("A (destino)", "To (destination)")} />
              <select
                  value={transferTo}
                  onChange={(e) => setTransferTo(e.target.value)}
                  className="w-full border border-slate-300 bg-white rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-400"
              >
                {locations.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name} ({l.slug})
                    </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <FieldHeader label={t("Modelo", "Model")} />
              <select
                  value={transferModel}
                  onChange={(e) => {
                    setTransferModel(e.target.value);
                    clearSelection();
                  }}
                  className="w-full border border-slate-300 bg-white rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-400"
              >
                <option value="all">{t("Todos", "All")}</option>
                {models.map((m) => (
                    <option key={m} value={m}>
                      {translateModelLabel(m, lang)}
                    </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <FieldHeader label={t("Color", "Color")} />
              <select
                  value={transferColor}
                  onChange={(e) => {
                    setTransferColor(e.target.value);
                    clearSelection();
                  }}
                  className="w-full border border-slate-300 bg-white rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-400"
              >
                <option value="all">{t("Todos", "All")}</option>
                {colors.map((c) => (
                    <option key={c} value={c}>
                      {translateColorLabel(c, lang)}
                    </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <FieldHeader label={t("Talla", "Size")} />
              <select
                  value={transferSizeId}
                  onChange={(e) => {
                    setTransferSizeId(e.target.value);
                    clearSelection();
                  }}
                  className="w-full border border-slate-300 bg-white rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-400"
              >
                <option value="all">{t("Todas", "All")}</option>
                {sizes.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <FieldHeader label={t("Acciones", "Actions")} />
              <button
                  type="button"
                  onClick={loadInventoryForTransfer}
                  disabled={invLoading}
                  className="w-full inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:border-emerald-400 hover:text-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {invLoading ? t("Cargando…", "Loading…") : t("Actualizar lista", "Refresh list")}
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 overflow-hidden mt-4">
            <div className="bg-slate-50 border-b border-slate-200 px-3 py-2 text-[11px] text-slate-600 flex items-center justify-between">
            <span>
              {invLoading ? t("Cargando…", "Loading…") : t(`${transferFiltered.length} disponibles`, `${transferFiltered.length} available`)}
            </span>
              <span>
              {t("Seleccionados:", "Selected:")} {selectedIds.size}
            </span>
            </div>

            {invError ? (
                <div className="p-3 text-[11px] text-rose-600">{invError}</div>
            ) : transferFiltered.length === 0 ? (
                <div className="p-3 text-[11px] text-slate-500">{t("No hay pares disponibles con esos filtros.", "No available items with those filters.")}</div>
            ) : (
                <div className="max-h-[360px] overflow-y-auto divide-y divide-slate-100">
                  {transferFiltered.map((it) => {
                    const checked = selectedIds.has(it.id);
                    return (
                        <label key={it.id} className="flex items-center gap-3 px-3 py-2 hover:bg-slate-50 cursor-pointer">
                          <input type="checkbox" checked={checked} onChange={() => toggleSelected(it.id)} className="h-4 w-4" />
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-900 truncate">
                              {translateModelLabel(it.model_name, lang)} · {it.size}
                            </p>
                            <p className="text-[11px] text-slate-500 truncate">
                              {translateColorLabel(it.color, lang)} · {it.location?.name || "—"}
                            </p>
                            <p className="text-[10px] text-slate-400 font-mono">ID: {it.id.slice(0, 8)}…</p>
                          </div>
                          <div className="ml-auto text-sm font-semibold text-slate-900 whitespace-nowrap">${Number(it.price_mxn || 0).toFixed(0)}</div>
                        </label>
                    );
                  })}
                </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 mt-4">
            <button
                type="button"
                onClick={submitTransferSelected}
                disabled={transferSubmitting || selectedIds.size === 0 || !transferTo || transferFrom === transferTo}
                className="inline-flex items-center justify-center rounded-full bg-slate-900 px-6 py-2.5 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-sm"
            >
              {transferSubmitting ? t("Transfiriendo…", "Transferring…") : t("Transferir seleccionados", "Transfer selected")}
            </button>
          </div>

          {transferMsg && <p className="text-[11px] text-right text-slate-700 mt-2">{transferMsg}</p>}
        </CollapsibleSection>

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
              <p className="text-[10px] text-slate-500">{t("Solo minúsculas, sin espacios (usa _).", "Lowercase, no spaces (use _).")}</p>
            </div>

            {(lookupError || lookupSuccess) && (
                <p className={`text-[11px] ${lookupError ? "text-rose-600" : "text-emerald-700"}`}>{lookupError || lookupSuccess}</p>
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
              <label className="block text-[11px] font-medium text-slate-700">{t("Nombre del modelo (EN)", "Model name (EN)")}</label>
              <input
                  value={newModelName}
                  onChange={(e) => setNewModelName(e.target.value)}
                  placeholder="Classic Crocs"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-400"
              />
            </div>

            {(lookupError || lookupSuccess) && (
                <p className={`text-[11px] ${lookupError ? "text-rose-600" : "text-emerald-700"}`}>{lookupError || lookupSuccess}</p>
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
                <p className={`text-[11px] ${lookupError ? "text-rose-600" : "text-emerald-700"}`}>{lookupError || lookupSuccess}</p>
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
                <p className="text-[10px] text-slate-500">{t("Sirve para agrupar tallas en el admin.", "Used to group sizes in admin.")}</p>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-medium text-slate-700">{t("Etiqueta de talla", "Size label")}</label>
                <input
                    value={newSizeLabel}
                    onChange={(e) => setNewSizeLabel(e.target.value)}
                    placeholder={t("Ej: M10-W12", "Example: M10-W12")}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-400"
                />
                <p className="text-[10px] text-slate-500">{t("Ej: M10-W12, C8, J3, 23.5 cm", "Example: M10-W12, C8, J3, 23.5 cm")}</p>
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
                <p className={`text-[11px] ${lookupError ? "text-rose-600" : "text-emerald-700"}`}>{lookupError || lookupSuccess}</p>
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
