"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(
    searchParams.get("error") === "1" ? "Contraseña incorrecta" : null
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Error al iniciar sesión");
        setSubmitting(false);
        return;
      }

      // Cookie was set by the API, now go to /admin
      router.push("/admin");
    } catch (err) {
      console.error(err);
      setError("Error al conectar con el servidor");
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-5 space-y-4">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-full bg-emerald-500 flex items-center justify-center text-lg text-white">
          🐊
        </div>
        <div>
          <h1 className="text-base font-semibold text-slate-900">
            Jacky Crocs Admin
          </h1>
          <p className="text-[11px] text-slate-500">
            Solo para uso interno
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="space-y-1">
          <label className="block text-[11px] font-medium text-slate-700">
            Contraseña admin
          </label>
          <input
            type="password"
            value={password}
            autoComplete="current-password"
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-slate-300 bg-white rounded-lg px-3 py-2 text-base text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400"
            placeholder="••••••••"
          />
        </div>

        {error && (
          <p className="text-[11px] text-rose-600">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={!password || submitting}
          className="w-full inline-flex items-center justify-center rounded-full bg-emerald-500 px-4 py-2.5 text-base font-semibold text-white hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-sm"
        >
          {submitting ? "Entrando…" : "Entrar al panel"}
        </button>
      </form>

      <p className="text-[11px] text-slate-500">
        Si alguien más ve esta pantalla, no compartas la contraseña. Solo debe
        usarse en tu computadora o teléfono de confianza.
      </p>
    </div>
  );
}
