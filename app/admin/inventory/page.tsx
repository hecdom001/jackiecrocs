// app/admin/inventory/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { InventoryItem, InventoryStatus } from "@/types/inventory";
import { supabase } from "@/lib/supabaseClient";

type SizeOption = {
  id: string;
  label: string;
};

export const dynamic = "force-dynamic";

const PAGE_SIZE_DESKTOP = 25;
const PAGE_SIZE_MOBILE = 4;

const statusOptions: InventoryStatus[] = [
  "available",
  "reserved",
  "paid_complete",
  "paid_partial",
  "cancelled",
];

type Lang = "es" | "en";

const statusLabel: Record<InventoryStatus, { es: string; en: string }> = {
  available: { es: "Disponible", en: "Available" },
  reserved: { es: "Apartado", en: "Reserved" },
  paid_complete: { es: "Pagado Completo", en: "Fully Paid" },
  paid_partial: { es: "Pagado Incompleto", en: "Partially Paid" },
  cancelled: { es: "Cancelado", en: "Cancelled" },
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
    default:
      return modelEn;
  }
}

export default function AdminInventoryPage() {
  const router = useRouter();

  const [lang, setLang] = useState<Lang>("es");
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // mobile detection
  const [isMobile, setIsMobile] = useState(false);
  const [showAddMobile, setShowAddMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => {
      if (typeof window === "undefined") return;
      setIsMobile(window.innerWidth < 640);
    };

    checkIsMobile();
    window.addEventListener("resize", checkIsMobile);
    return () => window.removeEventListener("resize", checkIsMobile);
  }, []);

  // Filters
  const [statusFilter, setStatusFilter] = useState<"all" | InventoryStatus>(
    "all"
  );
  const [sizeFilter, setSizeFilter] = useState<string>("all");
  const [colorFilter, setColorFilter] = useState<string>("all");
  const [customerQuery, setCustomerQuery] = useState("");

  // Pagination
  const [page, setPage] = useState(1);

  const t = (es: string, en: string) => (lang === "es" ? es : en);

  function handleMaybeUnauthorized(res: Response): boolean {
    if (res.status === 401) {
      router.push("/admin/login?redirect=/admin/inventory");
      return true;
    }
    return false;
  }

  async function loadItems() {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/admin/inventory");
      if (handleMaybeUnauthorized(res)) return;

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(
          data.error ||
            "Error cargando inventario / Error loading inventory"
        );
        setItems([]);
        return;
      }
      setItems(data.items || []);
      setPage(1);
    } catch (err) {
      console.error(err);
      setErrorMsg(
        "Error cargando inventario / Error loading inventory"
      );
    } finally {
      setLoading(false);
    }
  }

  async function updateItem(partial: Partial<InventoryItem> & { id: string }) {
    const res = await fetch("/api/admin/inventory", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(partial),
    });

    if (handleMaybeUnauthorized(res)) return;

    if (!res.ok) {
      console.error("Failed to update item");
      return;
    }
    loadItems();
  }

  useEffect(() => {
    loadItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reset page when filters/search change
  useEffect(() => {
    setPage(1);
  }, [statusFilter, sizeFilter, colorFilter, customerQuery]);

  // Filter options
  const sizeOptions = Array.from(new Set(items.map((i) => i.size))).sort();

  const colorFilterOptions = Array.from(new Set(items.map((i) => i.color)))
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));

  const filteredItems = items.filter((item) => {
    const matchesStatus =
      statusFilter === "all" || item.status === statusFilter;

    const matchesSize = sizeFilter === "all" || item.size === sizeFilter;

    const matchesColor =
      colorFilter === "all" || item.color === colorFilter;

    const query = customerQuery.trim().toLowerCase();
    const matchesCustomer =
      !query ||
      (item.customer_name || "").toLowerCase().includes(query) ||
      (item.customer_whatsapp || "").toLowerCase().includes(query);

    return matchesStatus && matchesCustomer && matchesSize && matchesColor;
  });

  // Status counts
  const countsByStatus: Record<InventoryStatus, number> = {
    available: filteredItems.filter((i) => i.status === "available").length,
    reserved: filteredItems.filter((i) => i.status === "reserved").length,
    paid_complete: filteredItems.filter((i) => i.status === "paid_complete")
      .length,
    paid_partial: filteredItems.filter((i) => i.status === "paid_partial")
      .length,
    cancelled: filteredItems.filter((i) => i.status === "cancelled").length,
  };

  const hasActiveFilters =
    statusFilter !== "all" ||
    sizeFilter !== "all" ||
    colorFilter !== "all" ||
    customerQuery.trim() !== "";

  function clearFilters() {
    setStatusFilter("all");
    setSizeFilter("all");
    setColorFilter("all");
    setCustomerQuery("");
  }

  // Pagination
  const effectivePageSize = isMobile ? PAGE_SIZE_MOBILE : PAGE_SIZE_DESKTOP;

  const totalFiltered = filteredItems.length;
  const totalPages =
    totalFiltered === 0 ? 1 : Math.ceil(totalFiltered / effectivePageSize);
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * effectivePageSize;
  const endIndex = startIndex + effectivePageSize;
  const paginatedItems = filteredItems.slice(startIndex, endIndex);

  const showingFrom = totalFiltered === 0 ? 0 : startIndex + 1;
  const showingTo = Math.min(endIndex, totalFiltered);

  return (
    <div className="space-y-6">
      {/* Header + language + refresh */}
      <section className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 sm:p-5 space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm sm:text-base font-semibold text-slate-900">
              {t("Inventario detallado", "Detailed inventory")}
            </h2>
            <p className="text-[11px] text-slate-500">
              {t(
                "Busca y actualiza pares rápidamente en una vista de tabla.",
                "Search and update pairs quickly in a table view."
              )}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-end">
            <div className="inline-flex items-center rounded-full border border-emerald-100 bg-emerald-50 p-0.5 text-[11px] shadow-sm self-start">
              <button
                type="button"
                onClick={() => setLang("es")}
                className={`px-2.5 py-1 rounded-full ${
                  lang === "es"
                    ? "bg-emerald-500 text-white shadow"
                    : "text-slate-700 hover:text-slate-900"
                }`}
              >
                ES
              </button>
              <button
                type="button"
                onClick={() => setLang("en")}
                className={`px-2.5 py-1 rounded-full ${
                  lang === "en"
                    ? "bg-emerald-500 text-white shadow"
                    : "text-slate-700 hover:text-slate-900"
                }`}
              >
                EN
              </button>
            </div>

            <button
              type="button"
              onClick={loadItems}
              disabled={loading}
              className="inline-flex justify-center items-center rounded-full bg-emerald-500 text-white text-xs font-semibold px-5 py-2.5 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-emerald-400 transition shadow-sm"
            >
              {loading
                ? t("Actualizando…", "Refreshing…")
                : t("Actualizar inventario", "Refresh inventory")}
            </button>
          </div>
        </div>

        {errorMsg && (
          <p className="text-[11px] text-rose-600">{errorMsg}</p>
        )}
      </section>

      {/* Add inventory – collapsible on mobile, always visible on desktop */}
      <section className="space-y-3">
        {/* Mobile toggle card */}
        <div className="sm:hidden">
          <button
            type="button"
            onClick={() => setShowAddMobile((prev) => !prev)}
            className="w-full flex items-center justify-between rounded-xl border border-slate-300 bg-white px-3 py-2 text-left shadow-sm active:bg-slate-50"
          >
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-slate-900">
                {t("Agregar nuevos pares", "Add new pairs")}
              </span>
              <span className="text-[11px] text-slate-500">
                {showAddMobile
                  ? t("Toca para ocultar el formulario", "Tap to hide form")
                  : t("Toca para ver el formulario", "Tap to show form")}
              </span>
            </div>
            <span
              className={`ml-2 inline-flex h-6 w-6 items-center justify-center rounded-full border border-slate-300 text-[11px] text-slate-600 transition-transform ${
                showAddMobile ? "rotate-90" : ""
              }`}
            >
              ▶
            </span>
          </button>
        </div>

        {/* Form:
            - Always visible on desktop (sm:block)
            - On mobile only if showAddMobile === true */}
        <div className={isMobile ? (showAddMobile ? "block" : "hidden") : "block"}>
          <AddInventorySection
            t={t}
            lang={lang}
            onAdded={loadItems}
            onUnauthorized={() =>
              router.push("/admin/login?redirect=/admin/inventory")
            }
          />
        </div>
      </section>

      {/* Filters + table / mobile cards */}
      <section className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 sm:p-5 space-y-4">
        {/* Filter bar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm sm:text-base font-semibold text-slate-900">
              {t("Inventario completo", "Full inventory")}
            </h2>
            <p className="text-[11px] text-slate-500">
              {t(
                `${items.length} pares en total`,
                `${items.length} pairs total`
              )}
            </p>
            {filteredItems.length !== items.length && (
              <p className="text-[11px] text-emerald-600 mt-0.5">
                {t(
                  `${filteredItems.length} resultados después de filtros`,
                  `${filteredItems.length} results after filters`
                )}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 w-full sm:w-auto sm:min-w-[650px] text-[11px]">
            {/* status filter */}
            <div className="flex flex-col gap-1">
              <span className="text-slate-700">
                {t("Estatus", "Status")}
              </span>
              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(
                    e.target.value === "all"
                      ? "all"
                      : (e.target.value as InventoryStatus)
                  )
                }
                className="border border-slate-300 bg-white rounded-lg px-2.5 py-1.5 text-[11px] text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-400"
              >
                <option value="all">{t("Todos", "All")}</option>
                {statusOptions.map((st) => (
                  <option key={st} value={st}>
                    {statusLabel[st][lang]}
                  </option>
                ))}
              </select>
            </div>

            {/* size filter */}
            <div className="flex flex-col gap-1">
              <span className="text-slate-700">
                {t("Talla", "Size")}
              </span>
              <select
                value={sizeFilter}
                onChange={(e) => setSizeFilter(e.target.value)}
                className="border border-slate-300 bg-white rounded-lg px-2.5 py-1.5 text-[11px] text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-400"
              >
                <option value="all">{t("Todas", "All")}</option>
                {sizeOptions.map((sz) => (
                  <option key={sz} value={sz}>
                    {sz}
                  </option>
                ))}
              </select>
            </div>

            {/* color filter */}
            <div className="flex flex-col gap-1">
              <span className="text-slate-700">
                {t("Color", "Color")}
              </span>
              <select
                value={colorFilter}
                onChange={(e) => setColorFilter(e.target.value)}
                className="border border-slate-300 bg-white rounded-lg px-2.5 py-1.5 text-[11px] text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-400"
              >
                <option value="all">{t("Todos", "All")}</option>
                {colorFilterOptions.map((c) => (
                  <option key={c} value={c}>
                    {translateColorLabel(c, lang)}
                  </option>
                ))}
              </select>
            </div>

            {/* customer search */}
            <div className="flex flex-col gap-1">
              <span className="text-slate-700">
                {t("Cliente / WhatsApp", "Customer / WhatsApp")}
              </span>
              <input
                value={customerQuery}
                onChange={(e) => setCustomerQuery(e.target.value)}
                className="border border-slate-300 bg-white rounded-lg px-2.5 py-1.5 text-[11px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                placeholder={
                  lang === "es"
                    ? "Buscar nombre o +52..."
                    : "Search name or +52..."
                }
              />
            </div>

            {/* clear filters */}
            <div className="flex flex-col gap-1">
              <span className="text-slate-700">
                {t("Filtros", "Filters")}
              </span>
              <button
                type="button"
                onClick={clearFilters}
                disabled={!hasActiveFilters}
                className="border border-slate-300 bg-white rounded-lg px-2.5 py-1.5 text-[11px] text-slate-800 hover:border-emerald-400 hover:text-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                {t("Limpiar filtros", "Clear filters")}
              </button>
            </div>
          </div>
        </div>

        {/* Status chips row */}
        <div className="flex flex-wrap gap-2 text-[11px]">
          <StatusChip
            label={t("Disponibles", "Available")}
            value={countsByStatus.available}
            colorClass="bg-emerald-50 text-emerald-700 border-emerald-200"
            emoji="🟢"
          />
          <StatusChip
            label={t("Apartados", "Reserved")}
            value={countsByStatus.reserved}
            colorClass="bg-amber-50 text-amber-700 border-amber-200"
            emoji="📌"
          />
          <StatusChip
            label={t("Pagado completo", "Paid complete")}
            value={countsByStatus.paid_complete}
            colorClass="bg-sky-50 text-sky-700 border-sky-200"
            emoji="✅"
          />
          <StatusChip
            label={t("Pagado parcial", "Paid partial")}
            value={countsByStatus.paid_partial}
            colorClass="bg-sky-50 text-sky-700 border-sky-200"
            emoji="🧾"
          />
          <StatusChip
            label={t("Cancelados", "Cancelled")}
            value={countsByStatus.cancelled}
            colorClass="bg-rose-50 text-rose-700 border-rose-200"
            emoji="⛔"
          />
        </div>

        {/* Table / cards + pagination */}
        {items.length === 0 ? (
          <p className="text-xs text-slate-500">
            {t(
              "No hay pares cargados todavía o la sesión no ha cargado.",
              "No pairs loaded yet, or session not loaded."
            )}
          </p>
        ) : filteredItems.length === 0 ? (
          <p className="text-xs text-slate-500">
            {t(
              "No hay resultados con estos filtros.",
              "No results with these filters."
            )}
          </p>
        ) : (
          <>
            {/* Mobile: card layout */}
            <div className="space-y-3 sm:hidden">
              {paginatedItems.map((item) => (
                <InventoryCardMobile
                  key={item.id}
                  item={item}
                  lang={lang}
                  onUpdate={updateItem}
                />
              ))}
            </div>

            {/* Desktop / tablet: table layout */}
            <div className="hidden sm:block border border-slate-200 rounded-xl overflow-hidden sm:max-h-[70vh]">
              <div className="overflow-x-auto">
                <table className="min-w-full text-[11px]">
                  <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
                    <tr>
                      <th className="text-left px-3 py-2 font-semibold text-slate-600">
                        ID
                      </th>
                      <th className="text-left px-3 py-2 font-semibold text-slate-600">
                        {t("Modelo", "Model")}
                      </th>
                      <th className="text-left px-3 py-2 font-semibold text-slate-600">
                        {t("Color", "Color")}
                      </th>
                      <th className="text-left px-3 py-2 font-semibold text-slate-600">
                        {t("Talla", "Size")}
                      </th>
                      <th className="text-right px-3 py-2 font-semibold text-slate-600">
                        {t("Precio", "Price")}
                      </th>
                      <th className="text-left px-3 py-2 font-semibold text-slate-600">
                        {t("Estatus", "Status")}
                      </th>
                      <th className="text-left px-3 py-2 font-semibold text-slate-600">
                        {t("Cliente", "Customer")}
                      </th>
                      <th className="text-left px-3 py-2 font-semibold text-slate-600">
                        WhatsApp
                      </th>
                      <th className="text-left px-3 py-2 font-semibold text-slate-600">
                        {t("Notas", "Notes")}
                      </th>
                      <th className="text-right px-3 py-2 font-semibold text-slate-600">
                        {t("Acciones", "Actions")}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginatedItems.map((item) => (
                      <InventoryRow
                        key={item.id}
                        item={item}
                        lang={lang}
                        onUpdate={updateItem}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination controls */}
            {totalFiltered > effectivePageSize && (
              <>
                {/* Mobile pagination */}
                <div className="flex items-center justify-between gap-2 text-[11px] text-slate-600 mt-3 sm:hidden">
                  <span>
                    {showingFrom}–{showingTo} / {totalFiltered}
                  </span>
                  <div className="inline-flex gap-1">
                    <button
                      type="button"
                      onClick={() =>
                        setPage((p) => Math.max(1, p - 1))
                      }
                      disabled={currentPage === 1}
                      className="px-3 py-1.5 rounded-full border border-slate-300 bg-white disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {t("Anterior", "Prev")}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setPage((p) =>
                          Math.min(totalPages, p + 1)
                        )
                      }
                      disabled={currentPage === totalPages}
                      className="px-3 py-1.5 rounded-full border border-slate-300 bg-white disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {t("Siguiente", "Next")}
                    </button>
                  </div>
                </div>

                {/* Desktop pagination */}
                <div className="hidden sm:flex sm:items-center sm:justify-between gap-2 text-[11px] text-slate-600 mt-3">
                  <p>
                    {t(
                      `Mostrando ${showingFrom}–${showingTo} de ${totalFiltered} pares`,
                      `Showing ${showingFrom}–${showingTo} of ${totalFiltered} pairs`
                    )}
                  </p>
                  <div className="inline-flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setPage((p) => Math.max(1, p - 1))
                      }
                      disabled={currentPage === 1}
                      className="px-3 py-1.5 rounded-full border border-slate-300 bg-white disabled:opacity-40 disabled:cursor-not-allowed hover:border-emerald-400 hover:text-emerald-700 transition"
                    >
                      {t("Anterior", "Previous")}
                    </button>
                    <span>
                      {t(
                        `Página ${currentPage} de ${totalPages}`,
                        `Page ${currentPage} of ${totalPages}`
                      )}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setPage((p) =>
                          Math.min(totalPages, p + 1)
                        )
                      }
                      disabled={currentPage === totalPages}
                      className="px-3 py-1.5 rounded-full border border-slate-300 bg-white disabled:opacity-40 disabled:cursor-not-allowed hover:border-emerald-400 hover:text-emerald-700 transition"
                    >
                      {t("Siguiente", "Next")}
                    </button>
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </section>
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
  const [size, setSize] = useState("");
  const [price, setPrice] = useState("0");
  const [quantity, setQuantity] = useState("0");

  const [models, setModels] = useState<string[]>([]);
  const [colors, setColors] = useState<string[]>([]);
  const [sizes, setSizes] = useState<SizeOption[]>([]);
  const [sizesLoading, setSizesLoading] = useState(true);
  const [sizesError, setSizesError] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Load sizes, models, colors from DB
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

    loadSizes();
    loadColors();
    loadModels();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);

    if (!modelName.trim() || !color.trim() || !size.trim() || !price.trim()) {
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
          model_name: modelName.trim(), // English from DB
          color: color.trim(),          // English from DB
          size: size.trim(),
          price_mxn: Number(price),
          quantity: Number(quantity) || 1,
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
            t(
              "Error al agregar inventario.",
              "Error adding inventory."
            )
        );
        return;
      }

      setMessage(
        t(
          "Pares agregados correctamente ✅",
          "Pairs added successfully ✅"
        )
      );

      setSize("");
      setQuantity("1");
      onAdded();
    } catch (err) {
      console.error(err);
      setMessage(
        t(
          "Error al agregar inventario.",
          "Error adding inventory."
        )
      );
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
        {/* Model (from DB, localized in label) */}
        <div className="space-y-1">
          <label className="block text-[11px] font-medium text-slate-700">
            {t("Modelo", "Model")}
          </label>
          <select
            value={modelName}
            onChange={(e) => setModelName(e.target.value)}
            className="w-full border border-slate-300 bg-white rounded-lg px-3 py-2 text-sm text-slate-900
                       focus:outline-none focus:ring-1 focus:ring-emerald-400"
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

        {/* Color (from DB, localized in label) */}
        <div className="space-y-1">
          <label className="block text-[11px] font-medium text-slate-700">
            {t("Color", "Color")}
          </label>
          <select
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-full border border-slate-300 bg-white rounded-lg px-3 py-2 text-sm text-slate-900
                       focus:outline-none focus:ring-1 focus:ring-emerald-400"
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

        {/* Size dropdown from DB */}
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
              value={size}
              onChange={(e) => setSize(e.target.value)}
              className="w-full border border-slate-300 bg-white rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-400"
              required
            >
              <option value="" disabled>
                {t("Selecciona una talla", "Select a size")}
              </option>
              {sizes.map((s) => (
                <option key={s.id} value={s.label}>
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

/* ---------- Small helpers ---------- */

function StatusChip({
  label,
  value,
  colorClass,
  emoji,
}: {
  label: string;
  value: number;
  colorClass: string;
  emoji: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 ${colorClass}`}
    >
      <span>{emoji}</span>
      <span className="font-medium">
        {label}: {value}
      </span>
    </span>
  );
}

function InventoryRow({
  item,
  lang,
  onUpdate,
}: {
  item: InventoryItem;
  lang: Lang;
  onUpdate: (p: Partial<InventoryItem> & { id: string }) => void;
}) {
  const [localStatus, setLocalStatus] = useState<InventoryStatus>(item.status);
  const [localCustomerName, setLocalCustomerName] = useState(
    item.customer_name || ""
  );
  const [localWhatsapp, setLocalWhatsapp] = useState(
    item.customer_whatsapp || ""
  );
  const [localNotes, setLocalNotes] = useState(item.notes || "");
  const [saving, setSaving] = useState(false);

  const t = (es: string, en: string) => (lang === "es" ? es : en);

  useEffect(() => {
    setLocalStatus(item.status);
    setLocalCustomerName(item.customer_name || "");
    setLocalWhatsapp(item.customer_whatsapp || "");
    setLocalNotes(item.notes || "");
  }, [item]);

  const hasChanges =
    localStatus !== item.status ||
    localCustomerName !== (item.customer_name || "") ||
    localWhatsapp !== (item.customer_whatsapp || "") ||
    localNotes !== (item.notes || "");

  async function handleSave() {
    if (!hasChanges) return;
    setSaving(true);
    await onUpdate({
      id: item.id,
      status: localStatus,
      customer_name: localCustomerName || null,
      customer_whatsapp: localWhatsapp || null,
      notes: localNotes || null,
    });
    setSaving(false);
  }

  const statusBadgeClass =
    localStatus === "available"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : localStatus === "reserved"
      ? "bg-amber-50 text-amber-700 border-amber-200"
      : localStatus === "paid_complete"
      ? "bg-sky-50 text-sky-700 border-sky-200"
      : localStatus === "paid_partial"
      ? "bg-sky-50 text-sky-700 border-sky-200"
      : "bg-rose-50 text-rose-700 border-rose-200";

  return (
    <tr className="hover:bg-slate-50/70">
      <td className="px-3 py-2 align-top text-slate-500">
        <span className="font-mono text-[10px]">
          {item.id.slice(0, 8)}…
        </span>
      </td>
      <td className="px-3 py-2 align-top text-slate-900 text-xs">
        {item.model_name}
      </td>
      <td className="px-3 py-2 align-top text-slate-900 text-xs">
        {translateColorLabel(item.color, lang)}
      </td>
      <td className="px-3 py-2 align-top text-slate-900 text-xs">
        {item.size}
      </td>
      <td className="px-3 py-2 align-top text-right text-slate-900 text-xs">
        ${item.price_mxn.toFixed(0)} MXN
      </td>
      <td className="px-3 py-2 align-top">
        <div className="space-y-1">
          <select
            value={localStatus}
            onChange={(e) =>
              setLocalStatus(e.target.value as InventoryStatus)
            }
            className="w-full border border-slate-300 bg-white rounded-lg px-2 py-1 text-[11px] text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-400"
          >
            {statusOptions.map((st) => (
              <option key={st} value={st}>
                {statusLabel[st][lang]}
              </option>
            ))}
          </select>
          <span
            className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${statusBadgeClass}`}
          >
            {statusLabel[localStatus][lang]}
          </span>
        </div>
      </td>
      <td className="px-3 py-2 align-top">
        <input
          value={localCustomerName}
          onChange={(e) => setLocalCustomerName(e.target.value)}
          className="w-full border border-slate-300 bg-white rounded-lg px-2 py-1 text-[11px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-400"
          placeholder={t("Nombre", "Name")}
        />
      </td>
      <td className="px-3 py-2 align-top">
        <input
          value={localWhatsapp}
          onChange={(e) => setLocalWhatsapp(e.target.value)}
          className="w-full border border-slate-300 bg-white rounded-lg px-2 py-1 text-[11px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-400"
          placeholder="+52..."
        />
      </td>
      <td className="px-3 py-2 align-top">
        <textarea
          value={localNotes}
          onChange={(e) => setLocalNotes(e.target.value)}
          className="w-full border border-slate-300 bg-white rounded-lg px-2 py-1 text-[11px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-400 min-h-[40px]"
        />
      </td>
      <td className="px-3 py-2 align-top text-right">
        <button
          type="button"
          onClick={handleSave}
          disabled={!hasChanges || saving}
          className="inline-flex items-center justify-center rounded-full bg-emerald-500 px-3 py-1 text-[10px] font-semibold text-white hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-sm"
        >
          {saving
            ? t("Guardando…", "Saving…")
            : hasChanges
            ? t("Guardar", "Save")
            : t("OK", "OK")}
        </button>
      </td>
    </tr>
  );
}

/* ---------- Mobile card component ---------- */

function InventoryCardMobile({
  item,
  lang,
  onUpdate,
}: {
  item: InventoryItem;
  lang: Lang;
  onUpdate: (p: Partial<InventoryItem> & { id: string }) => void;
}) {
  const [localStatus, setLocalStatus] = useState<InventoryStatus>(item.status);
  const [localCustomerName, setLocalCustomerName] = useState(
    item.customer_name || ""
  );
  const [localWhatsapp, setLocalWhatsapp] = useState(
    item.customer_whatsapp || ""
  );
  const [localNotes, setLocalNotes] = useState(item.notes || "");
  const [saving, setSaving] = useState(false);

  const t = (es: string, en: string) => (lang === "es" ? es : en);

  useEffect(() => {
    setLocalStatus(item.status);
    setLocalCustomerName(item.customer_name || "");
    setLocalWhatsapp(item.customer_whatsapp || "");
    setLocalNotes(item.notes || "");
  }, [item]);

  const hasChanges =
    localStatus !== item.status ||
    localCustomerName !== (item.customer_name || "") ||
    localWhatsapp !== (item.customer_whatsapp || "") ||
    localNotes !== (item.notes || "");

  async function handleSave() {
    if (!hasChanges) return;
    setSaving(true);
    await onUpdate({
      id: item.id,
      status: localStatus,
      customer_name: localCustomerName || null,
      customer_whatsapp: localWhatsapp || null,
      notes: localNotes || null,
    });
    setSaving(false);
  }

  const statusBadgeClass =
    localStatus === "available"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : localStatus === "reserved"
      ? "bg-amber-50 text-amber-700 border-amber-200"
      : localStatus === "paid_complete"
      ? "bg-sky-50 text-sky-700 border-sky-200"
      : localStatus === "paid_partial"
      ? "bg-sky-50 text-sky-700 border-sky-200"
      : "bg-rose-50 text-rose-700 border-rose-200";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3 space-y-3 shadow-sm">
      {/* Top row: basic info */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-slate-900">
            {translateModelLabel(item.model_name, lang)} ·{" "}
            {translateColorLabel(item.color, lang)} · {item.size}
          </p>
          <p className="text-[11px] text-slate-500 font-mono">
            ID: {item.id.slice(0, 8)}…
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold text-slate-900">
            ${item.price_mxn.toFixed(0)} MXN
          </p>
          <span
            className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold mt-1 ${statusBadgeClass}`}
          >
            {statusLabel[localStatus][lang]}
          </span>
        </div>
      </div>

      {/* Editable fields stacked */}
      <div className="space-y-2">
        <div className="space-y-1">
          <label className="text-[11px] font-medium text-slate-700">
            {t("Estatus", "Status")}
          </label>
          <select
            value={localStatus}
            onChange={(e) =>
              setLocalStatus(e.target.value as InventoryStatus)
            }
            className="w-full border border-slate-300 bg-white rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-400"
          >
            {statusOptions.map((st) => (
              <option key={st} value={st}>
                {statusLabel[st][lang]}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-medium text-slate-700">
            {t("Cliente", "Customer")}
          </label>
          <input
            value={localCustomerName}
            onChange={(e) => setLocalCustomerName(e.target.value)}
            className="w-full border border-slate-300 bg-white rounded-lg px-2.5 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-400"
            placeholder={t("Nombre", "Name")}
          />
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-medium text-slate-700">
            WhatsApp
          </label>
          <input
            value={localWhatsapp}
            onChange={(e) => setLocalWhatsapp(e.target.value)}
            className="w-full border border-slate-300 bg-white rounded-lg px-2.5 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-400"
            placeholder="+52..."
          />
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-medium text-slate-700">
            {t("Notas", "Notes")}
          </label>
          <textarea
            value={localNotes}
            onChange={(e) => setLocalNotes(e.target.value)}
            className="w-full border border-slate-300 bg-white rounded-lg px-2.5 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-400 min-h-[48px]"
          />
        </div>
      </div>

      {/* Save */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          disabled={!hasChanges || saving}
          className="inline-flex items-center justify-center rounded-full bg-emerald-500 px-4 py-1.5 text-[11px] font-semibold text-white hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-sm"
        >
          {saving
            ? t("Guardando…", "Saving…")
            : hasChanges
            ? t("Guardar cambios", "Save changes")
            : t("Sin cambios", "No changes")}
        </button>
      </div>
    </div>
  );
}
