"use client";

import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";

export type Lang = "es" | "en";

type AdminLangContextType = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (es: string, en: string) => string;
};

const AdminLangContext = createContext<AdminLangContextType | undefined>(
  undefined
);

export function AdminLangProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>("es");
  const t = (es: string, en: string) => (lang === "es" ? es : en);

  return (
    <AdminLangContext.Provider value={{ lang, setLang, t }}>
      {children}
    </AdminLangContext.Provider>
  );
}

export function useAdminLang() {
  const ctx = useContext(AdminLangContext);
  if (!ctx) {
    throw new Error("useAdminLang must be used inside AdminLangProvider");
  }
  return ctx;
}
