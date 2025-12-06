// app/admin/history/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAdminLang, type Lang } from "../adminLangContext";
import type { InventoryStatus } from "@/types/inventory";

export const dynamic = "force-dynamic";

const MAX_HISTORY = 30;
const MOBILE_PAGE_SIZE = 5;
const DESKTOP_PAGE_SIZE = 20;

const statusLabel: Record<InventoryStatus, { es: string; en: string }> = {
  available: { es: "Disponible", en: "Available" },
  reserved: { es: "Apartado", en: "Reserved" },
  paid_complete: { es: "Pagado Completo", en: "Fully Paid" },
  paid_partial: { es: "Pagado Incompleto", en: "Partially Paid" },
  cancelled: { es: "Cancelado", en: "Cancelled" },
};

type HistoryEntry = {
  id: string;
  model_name: string | null;
  color: string | null;
  size: string;
  price_mxn: number;
  status: InventoryStatus;
  customer_name: string | null;
  customer_whatsapp: string | null;
  notes: string | null;
  updated_at: string;
};

/* ---------- Shared helpers (same logic as inventory page) ---------- */

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
    case "classic platform":
      return "Plataforma Clásica";
    default:
      return modelEn;
  }
}

function formatDate(dt: string, lang: Lang) {
  if (!dt) return "";
  const d = new Date(dt);
  return d.toLocaleString(lang === "es" ? "es-MX" : "en-US", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function statusBadgeClass(status: InventoryStatus) {
  return status === "available"
    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
    : status === "reserved"
    ? "bg-amber-50 text-amber-700 border-amber-200"
    : status === "paid_complete"
    ? "bg-sky-50 text-sky-700 border-sky-200"
    : status === "paid_partial"
    ? "bg-sky-50 text-sky-700 border-sky-200"
    : "bg-rose-50 text-rose-700 border-rose-200";
}

/* ---------- Page ---------- */

export default function AdminHistoryPage() {
  const router = useRouter();
  const { lang, t } = useAdminLang();

  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [isMobile, setIsMobile] = useState(false);
  const [visibleCount, setVisibleCount] = useState<number>(0);

  // Mobile detection (same pattern as inventory page)
  useEffect(() => {
    const checkIsMobile = () => {
      if (typeof window === "undefined") return;
      setIsMobile(window.innerWidth < 640);
    };
    checkIsMobile();
    window.addEventListener("resize", checkIsMobile);
    return () => window.removeEventListener("resize", checkIsMobile);
  }, []);

  const pageSize = isMobile ? MOBILE_PAGE_SIZE : DESKTOP_PAGE_SIZE;

  function handleMaybeUnauthorized(res: Response): boolean {
    if (res.status === 401) {
      router.push("/admin/login?redirect=/admin/history");
      return true;
    }
    return false;
  }

  async function loadHistory() {
    setLoading(true);
    setErrorMsg(null);

    try {
      // Ask backend for up to MAX_HISTORY latest rows
      const res = await fetch(`/api/admin/history?limit=${MAX_HISTORY}`);
      if (handleMaybeUnauthorized(res)) return;

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(
          data.error ||
            "Error cargando historial / Error loading history"
        );
        setEntries([]);
        return;
      }

      // Support either { items: [...] } or { history: [...] }
      const raw: any[] = data.items || data.history || [];

      const normalized: HistoryEntry[] = raw.slice(0, MAX_HISTORY).map((row) => ({
        id: row.id,
        model_name: row.model_name ?? row.models?.name ?? null,
        color: row.color ?? row.colors?.name_en ?? null,
        size: row.size,
        price_mxn: row.price_mxn,
        status: row.status as InventoryStatus,
        customer_name: row.customer_name ?? null,
        customer_whatsapp: row.customer_whatsapp ?? null,
        notes: row.notes ?? null,
        updated_at: row.updated_at,
      }));

      setEntries(normalized);
    } catch (err) {
      console.error("Error loading history", err);
      setErrorMsg(
        "Error cargando historial / Error loading history"
      );
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When entries OR layout (mobile/desktop) changes,
  // set the initial visible count: 10 on mobile, 20 on desktop
  useEffect(() => {
    if (entries.length === 0) return;
    setVisibleCount(
      Math.min(pageSize, entries.length, MAX_HISTORY)
    );
  }, [pageSize, entries.length]);

  const totalEntries = entries.length;
  const visibleEntries = entries.slice(0, Math.min(visibleCount, totalEntries));
  const canLoadMore = visibleCount < Math.min(totalEntries, MAX_HISTORY);

  function handleLoadMore() {
    setVisibleCount((prev) =>
      Math.min(prev + pageSize, totalEntries, MAX_HISTORY)
    );
  }

  return (
    <div className="space-y-4">
      {/* HEADER */}
      <section className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Left: title + subtitle */}
          <div>
            <h1 className="text-base font-semibold text-slate-900">
              {t("Historial", "History")}
            </h1>
            <p className="text-xs text-slate-500">
              {t(
                "Últimos pares actualizados por fecha.",
                "Latest updated pairs by date."
              )}
            </p>
            <p className="mt-0.5 text-[11px] text-slate-500">
              {t(
                `Mostrando hasta ${MAX_HISTORY} pares más recientes.`,
                `Showing up to the latest ${MAX_HISTORY} pairs.`
              )}
            </p>
          </div>

          {/* Right: refresh */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadHistory}
              disabled={loading}
              className="inline-flex justify-center items-center rounded-full bg-emerald-500 text-white text-xs font-semibold px-4 py-2.5 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-emerald-400 transition shadow-sm"
            >
              {loading
                ? t("Actualizando…", "Refreshing…")
                : t("Actualizar datos", "Refresh data")}
            </button>
          </div>
        </div>

        {errorMsg && (
          <p className="text-[11px] text-rose-600">{errorMsg}</p>
        )}
      </section>

      {/* LIST */}
      <section className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm sm:text-base font-semibold text-slate-900">
            {t("Últimos cambios", "Recent updates")}
          </h2>
          <p className="text-[11px] text-slate-500">
            {t(
              `${visibleEntries.length} de ${totalEntries} pares mostrados`,
              `${visibleEntries.length} of ${totalEntries} pairs shown`
            )}
          </p>
        </div>

        {loading && (
          <p className="text-xs text-slate-500">
            {t("Cargando historial…", "Loading history…")}
          </p>
        )}

        {!loading && totalEntries === 0 && !errorMsg && (
          <p className="text-xs text-slate-500">
            {t(
              "Todavía no hay pares con historial reciente.",
              "No recent history entries yet."
            )}
          </p>
        )}

        {!loading && totalEntries > 0 && (
          <>
            {/* Mobile cards */}
            <div className="space-y-3 sm:hidden">
              {visibleEntries.map((entry) => (
                <HistoryCardMobile
                  key={entry.id}
                  entry={entry}
                  lang={lang}
                />
              ))}
            </div>

            {/* Desktop table */}
            <div className="hidden sm:block border border-slate-200 rounded-xl">
              <div className="max-h-[70vh] overflow-y-auto overflow-x-auto">
                <table className="min-w-full text-[11px]">
                  <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
                    <tr>
                      <th className="text-left px-3 py-2 font-semibold text-slate-600">
                        {t("Última actualización", "Last update")}
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
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {visibleEntries.map((entry) => (
                      <HistoryRow key={entry.id} entry={entry} lang={lang} />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Load more button */}
            {canLoadMore && (
              <div className="flex justify-center pt-3">
                <button
                  type="button"
                  onClick={handleLoadMore}
                  className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-4 py-1.5 text-[11px] text-slate-700 hover:border-emerald-400 hover:text-emerald-700 transition"
                >
                  {t("Cargar más", "Load more")}
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}

/* ---------- Desktop row ---------- */

function HistoryRow({ entry, lang }: { entry: HistoryEntry; lang: Lang }) {
  return (
    <tr className="hover:bg-slate-50/70">
      <td className="px-3 py-2 align-top text-slate-500 whitespace-nowrap">
        {formatDate(entry.updated_at, lang)}
      </td>
      <td className="px-3 py-2 align-top text-slate-900 text-xs">
        {translateModelLabel(entry.model_name, lang)}
      </td>
      <td className="px-3 py-2 align-top text-slate-900 text-xs">
        {translateColorLabel(entry.color, lang)}
      </td>
      <td className="px-3 py-2 align-top text-slate-900 text-xs">
        {entry.size}
      </td>
      <td className="px-3 py-2 align-top text-right text-slate-900 text-xs">
        ${entry.price_mxn.toFixed(0)} MXN
      </td>
      <td className="px-3 py-2 align-top">
        <span
          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${statusBadgeClass(
            entry.status
          )}`}
        >
          {statusLabel[entry.status][lang]}
        </span>
      </td>
      <td className="px-3 py-2 align-top text-slate-900 text-xs">
        {entry.customer_name || "—"}
      </td>
      <td className="px-3 py-2 align-top text-slate-900 text-xs">
        {entry.customer_whatsapp || "—"}
      </td>
      <td className="px-3 py-2 align-top text-[11px] text-slate-600 max-w-xs">
        {entry.notes || "—"}
      </td>
    </tr>
  );
}

/* ---------- Mobile card ---------- */

function HistoryCardMobile({
  entry,
  lang,
}: {
  entry: HistoryEntry;
  lang: Lang;
}) {
  const tt = (es: string, en: string) => (lang === "es" ? es : en);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3 space-y-2 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs text-slate-500">
            {formatDate(entry.updated_at, lang)}
          </p>
          <p className="mt-0.5 text-sm font-semibold text-slate-900">
            {translateModelLabel(entry.model_name, lang)} · {entry.size}
          </p>
          <p className="text-[11px] text-slate-500">
            {translateColorLabel(entry.color, lang)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold text-slate-900">
            ${entry.price_mxn.toFixed(0)} MXN
          </p>
          <span
            className={`mt-1 inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${statusBadgeClass(
              entry.status
            )}`}
          >
            {statusLabel[entry.status][lang]}
          </span>
        </div>
      </div>

      {entry.customer_name && (
        <p className="text-[11px] text-slate-700">
          <span className="font-medium">
            {tt("Cliente: ", "Customer: ")}
          </span>
          {entry.customer_name}
        </p>
      )}

      {entry.customer_whatsapp && (
        <p className="text-[11px] text-slate-700">
          <span className="font-medium">WhatsApp: </span>
          {entry.customer_whatsapp}
        </p>
      )}

      {entry.notes && (
        <p className="text-[11px] text-slate-600 whitespace-pre-wrap">
          {entry.notes}
        </p>
      )}
    </div>
  );
}
