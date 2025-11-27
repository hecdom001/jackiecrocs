// app/admin/login/page.tsx
import { Suspense } from "react";
import { LoginForm } from "./LoginForm";

export default function AdminLoginPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-emerald-50 via-slate-50 to-emerald-50">
      <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-10 sm:px-6">
        {/* Logo + title */}
        <header className="mb-6 sm:mb-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500 text-2xl shadow-sm">
            🐊
          </div>
          <h1 className="text-lg font-semibold text-slate-900">
            Jacky Crocs Admin
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Inicia sesión para administrar inventario y pedidos.
          </p>
        </header>

        {/* Card */}
        <div className="rounded-2xl bg-white border border-slate-200 shadow-sm px-4 py-5 sm:px-5 sm:py-6">
          <Suspense
            fallback={
              <div className="text-sm text-slate-600">
                Cargando formulario…
              </div>
            }
          >
            <LoginForm />
          </Suspense>
        </div>

        {/* Helper text */}
        <p className="mt-4 text-center text-[11px] text-slate-500">
          Solo para uso interno 🐊
        </p>
      </div>
    </main>
  );
}
