// app/admin/inventory/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { InventoryItem, InventoryStatus } from "@/types/inventory";
import { useAdminLang, type Lang } from "../adminLangContext";

export const dynamic = "force-dynamic";

const PAGE_SIZE_DESKTOP = 25;
const PAGE_SIZE_MOBILE = 6;

const statusOptions: InventoryStatus[] = [
  "available",
  "reserved",
  "paid_complete",
  "paid_partial",
  "cancelled",
];

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
    case "purple":
      return "Morado";
    case "baby pink":
      return "Rosa Pastel";
    case "red":
      return "Rojo";
    case "lilac":
      return "Lila";
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
  const { lang, t } = useAdminLang(); // shared lang + t

  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // mobile detection + fast mode
  const [isMobile, setIsMobile] = useState(false);
  const [mobileFastMode, setMobileFastMode] =
    useState<"normal" | "fast">("fast");

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

  // Filters panel (mobile)
  const [showFilters, setShowFilters] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);

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
    <div className="space-y-4">
      {/* HEADER */}
      <section className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Left: title + subtitle */}
          <div>
            <h1 className="text-base font-semibold text-slate-900">
              {t("Inventario", "Inventory")}
            </h1>
            <p className="text-xs text-slate-500">
              {t(
                "Gestiona pares desde el teléfono.",
                "Manage pairs from your phone."
              )}
            </p>
          </div>

          {/* Right (desktop): refresh button */}
          <div className="hidden sm:flex">
            <button
              type="button"
              onClick={loadItems}
              disabled={loading}
              className="inline-flex justify-center items-center rounded-full bg-emerald-500 text-white text-xs font-semibold px-4 py-2.5 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-emerald-400 transition shadow-sm"
            >
              {loading
                ? t("Actualizando…", "Refreshing…")
                : t("Actualizar datos", "Refresh data")}
            </button>
          </div>
        </div>

        {/* Mobile: refresh + normal/fast in one bar */}
        <div className="sm:hidden flex gap-2 text-[11px]">
          {/* Normal */}
          <button
            type="button"
            onClick={() => setMobileFastMode("normal")}
            className={`flex-1 rounded-full px-3 py-2.5 font-semibold ${
              mobileFastMode === "normal"
                ? "bg-white shadow text-slate-900 border border-slate-300"
                : "bg-slate-100 text-slate-600"
            }`}
          >
            {t("Normal", "Normal")}
          </button>

          {/* Rápido */}
          <button
            type="button"
            onClick={() => setMobileFastMode("fast")}
            className={`flex-1 rounded-full px-3 py-2.5 font-semibold ${
              mobileFastMode === "fast"
                ? "bg-white shadow text-slate-900 border border-slate-300"
                : "bg-slate-100 text-slate-600"
            }`}
          >
            {t("Rápido", "Fast")}
          </button>

          {/* Refresh */}
          <button
            type="button"
            onClick={loadItems}
            disabled={loading}
            className="flex-1 inline-flex justify-center items-center rounded-full bg-emerald-500 text-white font-semibold px-3 py-2.5 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-emerald-400 transition shadow-sm"
          >
            {loading
              ? t("Actualizando…", "Refreshing…")
              : t("Actualizar datos", "Refresh data")}
          </button>
        </div>

        {errorMsg && (
          <p className="text-[11px] text-rose-600">{errorMsg}</p>
        )}
      </section>



      {/* INVENTORY + FILTERS */}
      <section className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 space-y-4">
        {/* Top summary + filters toggle (mobile) */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm sm:text-base font-semibold text-slate-900">
              {t("Buscar", "Search")}
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

          {/* Mobile: show filters button; Desktop: show full filters bar */}
          <div className="sm:hidden">
            <button
              type="button"
              onClick={() => setShowFilters((prev) => !prev)}
              className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-[11px] text-slate-700 shadow-sm"
            >
              {showFilters
                ? t("Ocultar filtros", "Hide filters")
                : t("Mostrar filtros", "Show filters")}
            </button>
          </div>

          {/* Desktop filter bar */}
          <div className="hidden sm:grid sm:grid-cols-5 gap-2 w-full sm:w-auto sm:min-w-[650px] text-[11px]">
            {/* status */}
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

            {/* size */}
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

            {/* color */}
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

        {/* Mobile filters panel */}
        {showFilters && (
          <div className="sm:hidden rounded-2xl border border-slate-200 bg-white p-3 space-y-3 text-[11px]">
            <div className="grid grid-cols-1 gap-2">
              {/* status */}
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
                  className="border border-slate-300 bg-white rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                >
                  <option value="all">{t("Todos", "All")}</option>
                  {statusOptions.map((st) => (
                    <option key={st} value={st}>
                      {statusLabel[st][lang]}
                    </option>
                  ))}
                </select>
              </div>

              {/* size */}
              <div className="flex flex-col gap-1">
                <span className="text-slate-700">
                  {t("Talla", "Size")}
                </span>
                <select
                  value={sizeFilter}
                  onChange={(e) => setSizeFilter(e.target.value)}
                  className="border border-slate-300 bg-white rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                >
                  <option value="all">{t("Todas", "All")}</option>
                  {sizeOptions.map((sz) => (
                    <option key={sz} value={sz}>
                      {sz}
                    </option>
                  ))}
                </select>
              </div>

              {/* color */}
              <div className="flex flex-col gap-1">
                <span className="text-slate-700">
                  {t("Color", "Color")}
                </span>
                <select
                  value={colorFilter}
                  onChange={(e) => setColorFilter(e.target.value)}
                  className="border border-slate-300 bg-white rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-400"
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
                  className="border border-slate-300 bg-white rounded-lg px-2.5 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                  placeholder={
                    lang === "es"
                      ? "Buscar nombre o +52..."
                      : "Search name or +52..."
                  }
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={clearFilters}
                disabled={!hasActiveFilters}
                className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-[11px] text-slate-700 hover:border-emerald-400 hover:text-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                {t("Limpiar filtros", "Clear filters")}
              </button>
            </div>
          </div>
        )}

        {/* Status chips */}
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

        {/* LIST / TABLE */}
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
            {/* Mobile list */}
            <div className="space-y-3 sm:hidden">
              {paginatedItems.map((item) =>
                mobileFastMode === "fast" ? (
                  <InventoryFastRowMobile
                    key={item.id}
                    item={item}
                    lang={lang}
                    onUpdate={updateItem}
                  />
                ) : (
                  <InventoryCardMobile
                    key={item.id}
                    item={item}
                    lang={lang}
                    onUpdate={updateItem}
                  />
                )
              )}
            </div>

            {/* Desktop table */}
            <div className="hidden sm:block border border-slate-200 rounded-xl">
              <div className="max-h-[70vh] overflow-y-auto overflow-x-auto">
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

            {/* Pagination */}
            {totalFiltered > effectivePageSize && (
              <>
                {/* Mobile */}
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
                        setPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={currentPage === totalPages}
                      className="px-3 py-1.5 rounded-full border border-slate-300 bg-white disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {t("Siguiente", "Next")}
                    </button>
                  </div>
                </div>

                {/* Desktop */}
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

/* ---------- Mobile components ---------- */

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
  const [showDetails, setShowDetails] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<InventoryStatus | null>(
    null
  );

  const t = (es: string, en: string) => (lang === "es" ? es : en);

  useEffect(() => {
    setLocalStatus(item.status);
    setLocalCustomerName(item.customer_name || "");
    setLocalWhatsapp(item.customer_whatsapp || "");
    setLocalNotes(item.notes || "");
  }, [item]);

  const hasChanges =
    localCustomerName !== (item.customer_name || "") ||
    localWhatsapp !== (item.customer_whatsapp || "") ||
    localNotes !== (item.notes || "");

  // save helper
  async function saveWithStatus(newStatus: InventoryStatus) {
    setSaving(true);
    setLocalStatus(newStatus);

    await onUpdate({
      id: item.id,
      status: newStatus,
      customer_name: localCustomerName || null,
      customer_whatsapp: localWhatsapp || null,
      notes: localNotes || null,
    });

    setSaving(false);
  }

  // every status change opens the confirmation popup
  function handleStatusClick(newStatus: InventoryStatus) {
    if (newStatus === localStatus) return;
    setPendingStatus(newStatus);
  }

  async function handleSaveDetails() {
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
    <>
      <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-base font-semibold text-slate-900">
              {translateModelLabel(item.model_name, lang)} · {item.size}
            </p>
            <p className="text-xs text-slate-500">
              {translateColorLabel(item.color, lang)}
            </p>
            <p className="mt-1 text-[11px] text-slate-400 font-mono">
              ID: {item.id.slice(0, 8)}…
            </p>
          </div>
          <div className="text-right">
            <p className="text-base font-semibold text-slate-900">
              ${item.price_mxn.toFixed(0)} MXN
            </p>
            <span
              className={`mt-1 inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${statusBadgeClass}`}
            >
              {statusLabel[localStatus][lang]}
            </span>
          </div>
        </div>

        {/* big status buttons */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => handleStatusClick("available")}
            disabled={saving}
            className="flex-1 rounded-full bg-emerald-500 px-3 py-2.5 text-xs font-semibold text-white disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {t("Disponible", "Available")}
          </button>
          <button
            type="button"
            onClick={() => handleStatusClick("reserved")}
            disabled={saving}
            className="flex-1 rounded-full bg-amber-400 px-3 py-2.5 text-xs font-semibold text-slate-900 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {t("Apartado", "Reserved")}
          </button>
          <button
            type="button"
            onClick={() => handleStatusClick("paid_complete")}
            disabled={saving}
            className="flex-1 rounded-full bg-sky-500 px-3 py-2.5 text-xs font-semibold text-white disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {t("Pagado", "Paid")}
          </button>
        </div>

        {/* details toggle */}
        <button
          type="button"
          onClick={() => setShowDetails((prev) => !prev)}
          className="flex w-full items-center justify-between rounded-full bg-slate-100 px-3 py-1.5 text-[11px] text-slate-700"
        >
          <span>
            {showDetails
              ? t("Ocultar detalles", "Hide details")
              : t("Ver / editar detalles", "View / edit details")}
          </span>
          <span className="text-xs">{showDetails ? "▲" : "▼"}</span>
        </button>

        {showDetails && (
          <div className="space-y-2 pt-1 border-t border-slate-200 mt-1">
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

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={handleSaveDetails}
                disabled={!hasChanges || saving}
                className="inline-flex items-center justify-center rounded-full bg-emerald-500 px-4 py-1.5 text-[11px] font-semibold text-white hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-sm"
              >
                {saving
                  ? t("Guardando…", "Saving…")
                  : hasChanges
                  ? t("Guardar detalles", "Save details")
                  : t("Sin cambios", "No changes")}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* confirm popup (NORMAL mode) */}
      {pendingStatus && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="mx-6 w-full max-w-sm rounded-2xl bg-white p-4 space-y-3 shadow-lg">
            <p className="text-sm font-semibold text-slate-900">
              {t("Cambiar estatus del par", "Change pair status")}
            </p>
            <p className="text-xs text-slate-600">
              {t(
                "Estás a punto de cambiar el estatus:",
                "You are about to change the status:"
              )}
            </p>

            <div className="flex items-center justify-center gap-2 text-xs font-semibold">
              <span className="px-2 py-1 rounded-full bg-slate-100 text-slate-700">
                {statusLabel[localStatus][lang]}
              </span>
              <span className="text-slate-500">→</span>
              <span className="px-2 py-1 rounded-full bg-emerald-100 text-emerald-800">
                {statusLabel[pendingStatus][lang]}
              </span>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setPendingStatus(null)}
                className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-[11px] text-slate-700"
              >
                {t("Cancelar", "Cancel")}
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={async () => {
                  if (!pendingStatus) return;
                  await saveWithStatus(pendingStatus);
                  setPendingStatus(null);
                }}
                className="rounded-full bg-emerald-500 px-3 py-1.5 text-[11px] font-semibold text-white disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {t("Confirmar", "Confirm")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function InventoryFastRowMobile({
  item,
  lang,
  onUpdate,
}: {
  item: InventoryItem;
  lang: Lang;
  onUpdate: (p: Partial<InventoryItem> & { id: string }) => void;
}) {
  const [saving, setSaving] = useState(false);
  const [localStatus, setLocalStatus] =
    useState<InventoryStatus>(item.status);
  const [pendingStatus, setPendingStatus] =
    useState<InventoryStatus | null>(null);

  const t = (es: string, en: string) => (lang === "es" ? es : en);

  useEffect(() => {
    setLocalStatus(item.status);
  }, [item]);

  async function saveStatus(newStatus: InventoryStatus) {
    if (newStatus === localStatus) return;

    setSaving(true);
    setLocalStatus(newStatus);
    await onUpdate({ id: item.id, status: newStatus });
    setSaving(false);
  }

  function handleStatusClick(newStatus: InventoryStatus) {
    if (newStatus === localStatus) return;
    // Open popup
    setPendingStatus(newStatus);
  }

  return (
    <>
      <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2.5 shadow-sm">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900 truncate">
              {translateModelLabel(item.model_name, lang)} · {item.size}
            </p>
            <p className="text-[11px] text-slate-500 truncate">
              {translateColorLabel(item.color, lang)}
            </p>
          </div>
          <p className="text-sm font-semibold text-slate-900 whitespace-nowrap">
            ${item.price_mxn.toFixed(0)} MXN
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => handleStatusClick("available")}
            disabled={saving}
            className={`flex-1 rounded-full px-3 py-2 text-[11px] font-semibold ${
              localStatus === "available"
                ? "bg-emerald-500 text-white"
                : "bg-emerald-50 text-emerald-700"
            } disabled:opacity-40 disabled:cursor-not-allowed`}
          >
            {t("Disponible", "Available")}
          </button>
          <button
            type="button"
            onClick={() => handleStatusClick("reserved")}
            disabled={saving}
            className={`flex-1 rounded-full px-3 py-2 text-[11px] font-semibold ${
              localStatus === "reserved"
                ? "bg-amber-400 text-slate-900"
                : "bg-amber-50 text-amber-700"
            } disabled:opacity-40 disabled:cursor-not-allowed`}
          >
            {t("Apartado", "Reserved")}
          </button>
          <button
            type="button"
            onClick={() => handleStatusClick("paid_complete")}
            disabled={saving}
            className={`flex-1 rounded-full px-3 py-2 text-[11px] font-semibold ${
              localStatus === "paid_complete"
                ? "bg-sky-500 text-white"
                : "bg-sky-50 text-sky-700"
            } disabled:opacity-40 disabled:cursor-not-allowed`}
          >
            {t("Pagado", "Paid")}
          </button>
        </div>
      </div>

      {/* confirmation popup (FAST mode) */}
      {pendingStatus && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="mx-6 w-full max-w-sm rounded-2xl bg-white p-4 space-y-3 shadow-lg">
            <p className="text-sm font-semibold text-slate-900">
              {t("Cambiar estatus", "Change status")}
            </p>
            <p className="text-xs text-slate-600">
              {t(
                "Estás a punto de cambiar el estatus:",
                "You are about to change the status:"
              )}
            </p>

            <div className="flex items-center justify-center gap-2 text-xs font-semibold">
              <span className="px-2 py-1 rounded-full bg-slate-100 text-slate-700">
                {statusLabel[localStatus][lang]}
              </span>
              <span className="text-slate-500">→</span>
              <span className="px-2 py-1 rounded-full bg-emerald-100 text-emerald-800">
                {statusLabel[pendingStatus][lang]}
              </span>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setPendingStatus(null)}
                className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-[11px] text-slate-700"
              >
                {t("Cancelar", "Cancel")}
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={async () => {
                  if (!pendingStatus) return;
                  await saveStatus(pendingStatus);
                  setPendingStatus(null);
                }}
                className="rounded-full bg-emerald-500 px-3 py-1.5 text-[11px] font-semibold text-white disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {t("Confirmar", "Confirm")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
