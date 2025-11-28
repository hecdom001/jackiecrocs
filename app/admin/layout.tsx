// app/admin/layout.tsx
import type { ReactNode } from "react";
import AdminShell from "./AdminShell";
import { AdminLangProvider } from "./adminLangContext";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AdminLangProvider>
      <AdminShell>{children}</AdminShell>
    </AdminLangProvider>
  );
}
