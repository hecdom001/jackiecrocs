// app/admin/AdminShell.tsx
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useAdminLang } from "./adminLangContext";

const navItems = [
  {
    href: "/admin",
    label: { es: "Dashboard", en: "Dashboard" },
  },
  {
    href: "/admin/inventory",
    label: { es: "Inventario", en: "Inventory" },
  },
  {
    href: "/admin/inventory/add",
    label: { es: "Agregar pares", en: "Add pairs" },
  },
  {
    href: "/admin/history",
    label: { es: "Historial", en: "History" },
    disabled: true,
  },
];

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/admin/login";
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { lang, setLang, t } = useAdminLang();

  // ✅ single source of truth for “active” state
  const isActive = (href: string) => pathname === href;

  const pageTitle: string =
    pathname === "/admin/inventory/add"
      ? t("Agregar inventario", "Add inventory")
      : pathname === "/admin/inventory"
      ? t("Inventario", "Inventory")
      : pathname === "/admin/history"
      ? t("Historial", "History")
      : "Dashboard";

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="flex">
        {/* Desktop sidebar */}
        {!isLoginPage && (
            <aside className="hidden md:flex md:w-64 md:flex-col md:border-r md:border-slate-200 md:bg-white">
          <div className="flex items-center gap-2 px-4 py-4 border-b border-slate-200">
            <Link href="/admin" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full overflow-hidden bg-emerald-600" />
              <span className="text-sm font-semibold">JackyCrocs</span>
            </Link>
          </div>

          <nav className="flex-1 px-2 py-3 space-y-1 text-sm">
            {navItems.map((item) => {
              const active = isActive(item.href);
              const baseClasses =
                "flex items-center justify-between rounded-xl px-3 py-2 transition";

              if (item.disabled) {
                return (
                  <div
                    key={item.href}
                    className={`${baseClasses} text-slate-400 cursor-not-allowed`}
                  >
                    <span>{item.label[lang]}</span>
                    <span className="text-[10px] uppercase">
                      {lang === "es" ? "Pronto" : "Soon"}
                    </span>
                  </div>
                );
              }

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={
                    active
                      ? `${baseClasses} bg-emerald-50 text-emerald-700`
                      : `${baseClasses} text-slate-600 hover:bg-slate-100`
                  }
                >
                  <span>{item.label[lang]}</span>
                </Link>
              );
            })}
          </nav>
        </aside>
        )}

        {/* Main column */}
        <div className="flex-1 flex flex-col min-h-screen">
         {!isLoginPage && (
            <header className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-white">
              <div className="flex items-center gap-3">
                <Link href="/admin" className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full overflow-hidden bg-emerald-600" />
                </Link>
                <span className="text-sm font-semibold text-slate-900">
                  {pageTitle}
                </span>
              </div>

              <div className="flex items-center gap-3">
                {/* Global language toggle */}
                <div className="inline-flex items-center rounded-full border border-emerald-100 bg-emerald-50 p-0.5 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setLang("es")}
                    className={`px-2.5 py-1 rounded-full ${
                      lang === "es"
                        ? "bg-emerald-500 text-white shadow"
                        : "text-slate-700"
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
                        : "text-slate-700"
                    }`}
                  >
                    EN
                  </button>
                </div>

                {/* Desktop logout */}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="hidden sm:inline-flex items-center rounded-full border border-slate-300 bg-white px-3 py-1.5 text-[11px] text-slate-700 hover:border-rose-400 hover:text-rose-700 transition"
                >
                  {t("Cerrar sesión", "Log out")}
                </button>

                {/* Mobile hamburger */}
                <button
                  type="button"
                  aria-label={t("Abrir menú", "Open menu")}
                  className="md:hidden inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-300 bg-white"
                  onClick={() => setMobileMenuOpen(true)}
                >
                  <div className="space-y-0.5">
                    <span className="block h-0.5 w-4 bg-slate-700 rounded-full" />
                    <span className="block h-0.5 w-4 bg-slate-700 rounded-full" />
                    <span className="block h-0.5 w-4 bg-slate-700 rounded-full" />
                  </div>
                </button>
              </div>
            </header>
          )}
          <main className={ isLoginPage
                ? "flex-1 flex items-center justify-center bg-slate-50"
                : "flex-1 px-3 py-4 md:px-6 md:py-6"
            }
          >
          {children}</main>
        </div>
      </div>

      {/* Mobile slide-over menu */}
      {!isLoginPage && mobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-64 bg-white shadow-lg flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
              <span className="text-sm font-semibold">JackyCrocs</span>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="h-8 w-8 rounded-full border border-slate-300 flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <nav className="flex-1 px-2 py-3 space-y-1 text-sm">
              {navItems.map((item) => {
                const active = isActive(item.href);
                const baseClasses =
                  "flex items-center justify-between rounded-xl px-3 py-2 transition";

                if (item.disabled) {
                  return (
                    <div
                      key={item.href}
                      className={`${baseClasses} text-slate-400 cursor-not-allowed`}
                    >
                      <span>{item.label[lang]}</span>
                      <span className="text-[10px] uppercase">
                        {lang === "es" ? "Pronto" : "Soon"}
                      </span>
                    </div>
                  );
                }

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={
                      active
                        ? `${baseClasses} bg-emerald-50 text-emerald-700`
                        : `${baseClasses} text-slate-600 hover:bg-slate-100`
                    }
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <span>{item.label[lang]}</span>
                  </Link>
                );
              })}

              {/* Mobile logout */}
              <div className="border-t border-slate-200 px-2 py-3">
                <button
                  type="button"
                  onClick={async () => {
                    setMobileMenuOpen(false);
                    await handleLogout();
                  }}
                  className="w-full rounded-xl px-3 py-2 text-sm font-semibold
                            text-rose-600 hover:bg-rose-50 transition
                            flex items-center gap-2"
                >
                  <span>🚪</span>
                  <span>{t("Cerrar sesión", "Log out")}</span>
                </button>
              </div>
            </nav>
          </div>
        </div>
      )}
    </div>
  );
}
