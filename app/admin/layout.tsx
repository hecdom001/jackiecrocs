// app/admin/layout.tsx
import type { ReactNode } from "react";
import AdminTopBar from "./AdminTopBar";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-slate-50">
      <AdminTopBar />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {children}
      </main>
    </div>
  );
}
