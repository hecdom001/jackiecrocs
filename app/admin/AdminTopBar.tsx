// app/admin/AdminTopBar.tsx
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export default function AdminTopBar() {
  const pathname = usePathname();
  const router = useRouter();

  const isDashboard = pathname === "/admin";
  const isInventory = pathname?.startsWith("/admin/inventory");

  async function handleLogout() {
    try {
      await fetch("/api/admin/logout", { method: "POST" });
    } finally {
      router.push("/admin/login");
    }
  }

  return (
    <div className="sticky top-0 z-20 border-b border-emerald-100 bg-white/90 backdrop-blur">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
        {/* Left: logo + title */}
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-emerald-500 flex items-center justify-center text-lg text-white shadow-sm">
            🐊
          </div>
          <div>
            <h1 className="text-sm sm:text-base font-semibold text-slate-900">
              Jacky Crocs Admin
            </h1>
            <p className="text-[11px] text-slate-500">
              Panel interno
            </p>
          </div>
        </div>

        {/* Right: nav + logout */}
        <div className="flex items-center gap-3">
          {/* Nav pills */}
          <div className="hidden sm:flex items-center gap-1 text-[11px]">
            <Link
              href="/admin"
              className={
                isDashboard
                  ? "rounded-full px-3 py-1.5 bg-emerald-500 text-white font-semibold shadow-sm"
                  : "rounded-full px-3 py-1.5 border border-slate-200 bg-white text-slate-700 hover:border-emerald-300 hover:text-emerald-700 transition"
              }
            >
              Dashboard
            </Link>
            <Link
              href="/admin/inventory"
              className={
                isInventory
                  ? "rounded-full px-3 py-1.5 bg-emerald-500 text-white font-semibold shadow-sm"
                  : "rounded-full px-3 py-1.5 border border-slate-200 bg-white text-slate-700 hover:border-emerald-300 hover:text-emerald-700 transition"
              }
            >
              Inventario
            </Link>
          </div>

          {/* Logout */}
          <button
            type="button"
            onClick={handleLogout}
            className="text-[11px] rounded-full border border-slate-200 px-3 py-1.5 text-slate-700 hover:border-rose-300 hover:text-rose-600 transition bg-white"
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    </div>
  );
}
