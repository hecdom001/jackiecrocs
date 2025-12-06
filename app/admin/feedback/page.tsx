// app/admin/feedback/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { useAdminLang, type Lang } from "../adminLangContext";

type FeedbackRow = {
  id: string;
  message: string;
  lang: "es" | "en";
  context: string | null;
  user_agent: string | null;
  created_at: string;
};

export default function AdminFeedbackPage() {
  const { lang, t } = useAdminLang();
  const [rows, setRows] = useState<FeedbackRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadFeedback = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch("/api/admin/feedback");
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Error loading feedback");
      }

      setRows(data.feedback || []);
    } catch (err: any) {
      console.error("Error loading feedback:", err);
      setError(err.message || "Error loading feedback");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFeedback();
  }, [loadFeedback]);

  return (
    <div className="space-y-4">
      {/* Header + refresh button */}
      <header className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">
            {t("Comentarios de clientes", "Customer Feedback")}
          </h1>
          <p className="text-sm text-slate-500">
            {t("Comentarios enviados desde la página pública", "Comments sent from the public page")}
          </p>
        </div>

        <button
          type="button"
          onClick={loadFeedback}
          disabled={loading}
          className={`inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-medium transition ${
            loading
              ? "bg-slate-100 border-slate-200 text-slate-400 cursor-wait"
              : "bg-white border-slate-200 text-slate-700 hover:border-emerald-400 hover:text-emerald-700"
          }`}
        >  
          {loading
                ? t("Actualizando…", "Refreshing…")
                : t("Actualizar datos", "Refresh data")}
        </button>
      </header>

      {loading && (
        <p className="text-sm text-slate-500">Cargando feedback…</p>
      )}

      {error && <p className="text-sm text-red-500">{error}</p>}

      {!loading && !error && rows.length === 0 && (
        <p className="text-sm text-slate-500">
          {t(" Aún no hay comentarios registrados.", "There are no comments registered yet.")}
        </p>
      )}

      {!loading && !error && rows.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="divide-y divide-slate-100 max-h-[70vh] overflow-auto">
            {rows.map((row) => {
              const date = new Date(row.created_at).toLocaleString("es-MX", {
                dateStyle: "short",
                timeStyle: "short",
              });

              return (
                <div key={row.id} className="px-4 py-3 space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <div className="flex gap-2">
                      <span className="rounded-full bg-slate-100 px-2 py-0.5">
                        {row.lang.toUpperCase()}
                      </span>
                      {row.context && (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5">
                          {row.context}
                        </span>
                      )}
                    </div>
                    <span>{date}</span>
                  </div>

                  <p className="text-sm text-slate-800 whitespace-pre-line">
                    {row.message}
                  </p>

                  {row.user_agent && (
                    <p className="text-[10px] text-slate-400 truncate">
                      {row.user_agent}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
