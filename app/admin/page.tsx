// app/admin/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { InventoryItem } from "@/types/inventory";

export const dynamic = "force-dynamic";

type Lang = "es" | "en";

// Helper to translate color names
function translateColorLabel(
  colorEn: string | null | undefined,
  lang: Lang
): string {
  if (!colorEn) {
    return lang === "es" ? "Sin color" : "No color";
  }

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

export default function AdminDashboardPage() {
  const router = useRouter();
  const [lang, setLang] = useState<Lang>("es");
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const t = (es: string, en: string) => (lang === "es" ? es : en);

  function handleMaybeUnauthorized(res: Response): boolean {
    if (res.status === 401) {
      router.push("/admin/login?redirect=/admin");
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
      if (!res.ok) {
        setErrorMsg("Error cargando inventario / Error loading inventory");
        return;
      }
      const data = await res.json();
      setItems(data.items || []);
    } catch (err) {
      console.error(err);
      setErrorMsg("Error cargando inventario / Error loading inventory");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Stats ---
  const total = items.length;
  const totalAvailable = items.filter((i) => i.status === "available").length;
  const totalReserved = items.filter((i) => i.status === "reserved").length;
  const totalPaidComplete = items.filter(
    (i) => i.status === "paid_complete"
  ).length;
  const totalPaidPartial = items.filter(
    (i) => i.status === "paid_partial"
  ).length;
  const totalCancelled = items.filter((i) => i.status === "cancelled").length;

  // Revenue: only fully paid
  const totalRevenuePaid = items
    .filter((i) => i.status === "paid_complete")
    .reduce((sum, i) => sum + i.price_mxn, 0);

  // --- Breakdown by color ---
  type ColorStats = {
    total: number;
    available: number;
    reserved: number;
  };

  const colorsMap = items.reduce<Record<string, ColorStats>>((acc, item) => {
    const key = item.color || "no_color";
    if (!acc[key]) {
      acc[key] = { total: 0, available: 0, reserved: 0 };
    }
    acc[key].total += 1;
    if (item.status === "available") acc[key].available += 1;
    if (item.status === "reserved") acc[key].reserved += 1;
    return acc;
  }, {});

  const colorsList = Object.entries(colorsMap).sort((a, b) =>
    a[0].localeCompare(b[0])
  );

  return (
    <div className="space-y-6">
      {/* Header section (language + refresh) */}
      <section className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 sm:p-5 space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm sm:text-base font-semibold text-slate-900">
              {t("Dashboard de inventario", "Inventory dashboard")}
            </h2>
            <p className="text-[11px] text-slate-500">
              {t(
                "Resumen rápido de todos los estatus y colores.",
                "Quick overview of all statuses and colors."
              )}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Lang toggle */}
            <div className="hidden sm:flex items-center gap-2">
              <span className="text-[11px] text-slate-500">
                {t("Idioma", "Language")}
              </span>
              <div className="inline-flex items-center rounded-full border border-emerald-100 bg-emerald-50 p-0.5 text-[11px] shadow-sm">
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
            </div>

            <button
              type="button"
              onClick={loadItems}
              disabled={loading}
              className="inline-flex justify-center items-center rounded-full bg-emerald-500 text-white text-xs font-semibold px-5 py-2.5 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-emerald-400 transition shadow-sm"
            >
              {loading
                ? t("Actualizando…", "Refreshing…")
                : t("Actualizar datos", "Refresh data")}
            </button>
          </div>
        </div>

        {errorMsg && (
          <p className="text-[11px] text-rose-600 mt-1">{errorMsg}</p>
        )}
      </section>

      {/* STATS GRID: ALL STATUS COUNTS (without delivered) */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label={t("Pares totales", "Total pairs")}
          value={total}
          hint={t("Todos los estados", "All statuses")}
          emoji="👟"
        />
        <StatCard
          label={t("Disponibles", "Available")}
          value={totalAvailable}
          hint={t("Listos para vender", "Ready to sell")}
          emoji="🟢"
        />
        <StatCard
          label={t("Apartados", "Reserved")}
          value={totalReserved}
          hint={t("Clientes interesados", "Interested customers")}
          emoji="📌"
        />
        <StatCard
          label={t("Pagado completo", "Fully paid")}
          value={totalPaidComplete}
          hint={t("Pagados al 100%", "100% paid")}
          emoji="✅"
        />
        <StatCard
          label={t("Pagado parcial", "Partially paid")}
          value={totalPaidPartial}
          hint={t(
            "Pagados parciales",
            "Partial payments"
          )}
          emoji="💵"
        />
        <StatCard
          label={t("Cancelados", "Cancelled")}
          value={totalCancelled}
          hint={t("Ventas canceladas", "Cancelled sales")}
          emoji="⛔️"
        />
      </section>

      {/* REVENUE + STATUS DETAIL */}
      <section className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        {/* Revenue card */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 sm:p-5 space-y-3">
          <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
            <span>💰</span>
            {t("Ingresos estimados", "Estimated revenue")}
          </h3>
          <p className="text-xs text-slate-500">
            {t(
              "Suma de pares pagados completos.",
              "Sum of fully-paid pairs."
            )}
          </p>
          <p className="text-2xl font-semibold text-slate-900 mt-1">
            ${totalRevenuePaid.toLocaleString("es-MX")} MXN
          </p>

          <div className="mt-3 grid gap-2 sm:grid-cols-2 text-[11px]">
            <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 px-3 py-2">
              <p className="font-semibold text-emerald-800">
                {t("Pagado completo", "Fully paid")}
              </p>
              <p className="text-slate-600">
                {totalPaidComplete} {t("pares", "pairs")}
              </p>
            </div>
            <div className="rounded-xl border border-amber-100 bg-amber-50/70 px-3 py-2">
              <p className="font-semibold text-amber-800">
                {t("Pagado parcial", "Partially paid")}
              </p>
              <p className="text-slate-600">
                {totalPaidPartial} {t("pares", "pairs")}
              </p>
            </div>
          </div>
        </div>

        {/* Quick summary by color */}
        <div className="bg-white border border-emerald-100 rounded-2xl shadow-sm p-4 sm:p-5 flex flex-col gap-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <span>🎨</span>
              {t("Resumen por color", "Summary by color")}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {t(
                "Cuántos pares tienes por color y cuántos siguen disponibles.",
                "How many pairs you have per color and how many are still available."
              )}
            </p>
          </div>

          {colorsList.length === 0 ? (
            <p className="text-[11px] text-slate-500">
              {t("Sin datos todavía.", "No data yet.")}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-[11px] border-collapse">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-1.5 pr-3 font-semibold text-slate-600">
                      {t("Color", "Color")}
                    </th>
                    <th className="text-right py-1.5 px-3 font-semibold text-slate-600">
                      {t("Total", "Total")}
                    </th>
                    <th className="text-right py-1.5 px-3 font-semibold text-slate-600">
                      {t("Disponibles", "Available")}
                    </th>
                    <th className="text-right py-1.5 pl-3 font-semibold text-slate-600">
                      {t("Apartados", "Reserved")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {colorsList.map(([colorKey, stats]) => (
                    <tr
                      key={colorKey}
                      className="border-b border-slate-100 last:border-0"
                    >
                      <td className="py-1.5 pr-3 text-slate-800">
                        {translateColorLabel(
                          colorKey === "no_color" ? null : colorKey,
                          lang
                        )}
                      </td>
                      <td className="py-1.5 px-3 text-right text-slate-800">
                        {stats.total}
                      </td>
                      <td className="py-1.5 px-3 text-right text-emerald-700">
                        {stats.available}
                      </td>
                      <td className="py-1.5 pl-3 text-right text-amber-700">
                        {stats.reserved}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
  emoji,
}: {
  label: string;
  value: number;
  hint: string;
  emoji: string;
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 space-y-1.5">
      <p className="text-[11px] text-slate-500 flex items-center gap-1">
        <span>{emoji}</span>
        <span>{label}</span>
      </p>
      <p className="text-2xl font-semibold text-slate-900">{value}</p>
      <p className="text-[11px] text-slate-500">{hint}</p>
    </div>
  );
}
