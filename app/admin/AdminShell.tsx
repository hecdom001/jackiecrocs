// app/admin/AdminShell.tsx
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
    href: "/admin/feedback",
    label: { es: "Comentarios", en: "Feedback" },
  },
  {
    href: "/admin/history",
    label: { es: "Historial", en: "History" },
    disabled: true,
  },
];

// --- MOBILE BOTTOM NAV (tabs) ---
function AdminMobileNav({
  pathname,
  lang,
}: {
  pathname: string;
  lang: "es" | "en";
}) {
  const router = useRouter();

  // Map each nav item to an icon for the tab bar
  const items = [
    {
      href: "/admin",
      icon: "📊",
    },
    {
      href: "/admin/inventory",
      icon: "📦",
    },
    {
      href: "/admin/inventory/add",
      icon: "➕",
    },
    {
      href: "/admin/feedback",
      icon: "💬",
    },
    {
      href: "/admin/history",
      icon: "📜",
    },
  ].map((tab) => {
    const base = navItems.find((n) => n.href === tab.href)!;
    return {
      ...base,
      icon: tab.icon,
    };
  });

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 bg-white/90 backdrop-blur border-t border-slate-200 md:hidden">
      <div className="mx-auto max-w-md px-4 pb-[calc(env(safe-area-inset-bottom,0px)+0.5rem)] pt-2">
        <div className="flex items-center justify-between rounded-full border border-slate-200 bg-white/95 px-4 py-2 text-[11px] shadow-lg">
          {items.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/admin" && pathname.startsWith(item.href));

            const label = item.label[lang];

            if (item.disabled) {
              return (
                <div
                  key={item.href}
                  className="flex flex-1 flex-col items-center gap-0.5 text-slate-300 cursor-not-allowed"
                >
                  <span className="mb-0.5 flex h-7 w-7 items-center justify-center rounded-full text-base bg-slate-100">
                    {item.icon}
                  </span>
                  <span className="font-normal opacity-70">{label}</span>
                </div>
              );
            }

            return (
              <button
                key={item.href}
                type="button"
                onClick={() => router.push(item.href)}
                className={`flex flex-1 flex-col items-center gap-0.5 ${
                  active ? "text-emerald-600" : "text-slate-400"
                }`}
              >
                <span
                  className={`mb-0.5 flex h-7 w-7 items-center justify-center rounded-full text-base ${
                    active ? "bg-emerald-50" : "bg-slate-100"
                  }`}
                >
                  {item.icon}
                </span>
                <span className={active ? "font-medium" : ""}>{label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathnameRaw = usePathname();
  const pathname = pathnameRaw ?? "";
  const isLoginPage = pathname === "/admin/login";
  const router = useRouter();
  const { lang, setLang, t } = useAdminLang();

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

                {/* Logout – now visible on mobile AND desktop */}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex items-center rounded-full border border-slate-300 bg-white px-3 py-1.5 text-[11px] text-slate-700 hover:border-rose-400 hover:text-rose-700 transition"
                >
                  {t("Cerrar sesión", "Log out")}
                </button>
              </div>
            </header>
          )}

          <main
            className={
              isLoginPage
                ? "flex-1 flex items-center justify-center bg-slate-50"
                : // Extra bottom padding on mobile so content isn't hidden behind bottom nav
                  "flex-1 px-3 py-4 md:px-6 md:py-6 pb-24 md:pb-6"
            }
          >
            {children}
          </main>

          {/* Mobile bottom nav (only when logged in) */}
          {!isLoginPage && (
            <AdminMobileNav pathname={pathname} lang={lang as "es" | "en"} />
          )}
        </div>
      </div>
    </div>
  );
}
