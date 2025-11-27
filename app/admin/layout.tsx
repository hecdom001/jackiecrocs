// app/admin/layout.tsx
import type { ReactNode } from "react";
import AdminTopBar from "./AdminTopBar";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-slate-50">
      {/* Sticky top bar */}
      <div className="sticky top-0 z-20">
        <AdminTopBar />
      </div>

      {/* Responsive content container */}
      <div className="max-w-6xl mx-auto w-full px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8">
        {children}
      </div>
    </main>
  );
}
