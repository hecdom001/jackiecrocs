// app/admin/AdminTopBar.tsx
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

export default function AdminTopBar() {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const isDashboard = pathname === "/admin";
  const isInventory = pathname.startsWith("/admin/inventory");

  async function handleLogout() {
    try {
      setLoggingOut(true);
      await fetch("/api/admin/logout", { method: "POST" });
    } catch (e) {
      console.error(e);
    } finally {
      setLoggingOut(false);
      router.push("/admin/login");
    }
  }

  return (
    <header className="border-b border-emerald-100 bg-white/90 backdrop-blur">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-3 px-3 sm:px-4 md:px-6 py-2.5">
        {/* Left: logo + title (tap to go home) */}
        <button
          type="button"
          onClick={() => router.push("/admin")}
          className="flex items-center gap-2"
        >
          <div className="h-8 w-8 rounded-full bg-emerald-500 flex items-center justify-center text-lg text-white shadow-sm">
            🐊
          </div>
          <div className="hidden xs:block">
            <p className="text-xs sm:text-sm font-semibold text-slate-900">
              Jacky Crocs Admin
            </p>
            <p className="text-[10px] text-slate-500">
              Panel interno · Admin
            </p>
          </div>
        </button>

        {/* Desktop nav (pills) */}
        <div className="hidden sm:flex items-center gap-2">
          <nav className="flex items-center gap-1 text-[11px]">
            <Link
              href="/admin"
              className={`rounded-full px-3 py-1.5 font-semibold shadow-sm transition ${
                isDashboard
                  ? "bg-emerald-500 text-white"
                  : "border border-slate-200 bg-white text-slate-700 hover:border-emerald-300 hover:text-emerald-700"
              }`}
            >
              Dashboard
            </Link>
            <Link
              href="/admin/inventory"
              className={`rounded-full px-3 py-1.5 font-semibold shadow-sm transition ${
                isInventory
                  ? "bg-emerald-500 text-white"
                  : "border border-slate-200 bg-white text-slate-700 hover:border-emerald-300 hover:text-emerald-700"
              }`}
            >
              Inventario
            </Link>
          </nav>

          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="text-[11px] rounded-full border border-slate-200 px-3 py-1.5 text-slate-700 hover:border-rose-300 hover:text-rose-600 transition bg-white disabled:opacity-40"
          >
            {loggingOut ? "Saliendo…" : "Cerrar sesión"}
          </button>
        </div>

        {/* Mobile nav: simple icon buttons */}
        <div className="flex sm:hidden items-center gap-1">
          <button
            type="button"
            onClick={() => router.push("/admin")}
            className={`h-8 w-8 rounded-full flex items-center justify-center text-lg shadow-sm transition ${
              isDashboard
                ? "bg-emerald-500 text-white"
                : "bg-white border border-slate-200 text-slate-700"
            }`}
            aria-label="Dashboard"
          >
            🏠
          </button>
          <button
            type="button"
            onClick={() => router.push("/admin/inventory")}
            className={`h-8 w-8 rounded-full flex items-center justify-center text-lg shadow-sm transition ${
              isInventory
                ? "bg-emerald-500 text-white"
                : "bg-white border border-slate-200 text-slate-700"
            }`}
            aria-label="Inventario"
          >
            📋
          </button>
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="h-8 w-8 rounded-full flex items-center justify-center text-lg shadow-sm bg-white border border-slate-200 text-slate-700 disabled:opacity-40"
            aria-label="Cerrar sesión"
          >
            ⎋
          </button>
        </div>
      </div>
    </header>
  );
}
