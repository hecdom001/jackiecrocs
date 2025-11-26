"use client";

import { useEffect, useState, FormEvent } from "react";
import type { InventoryItem, InventoryStatus } from "@/types/inventory";

const statusOptions: InventoryStatus[] = [
  "available",
  "reserved",
  "paid",
  "delivered",
  "cancelled",
];

const genderOptions = [
  { value: "unisex", labelEs: "Unisex", labelEn: "Unisex" },
  { value: "men", labelEs: "Hombre", labelEn: "Men" },
  { value: "women", labelEs: "Mujer", labelEn: "Women" },
];

type Lang = "es" | "en";

const statusLabel: Record<InventoryStatus, { es: string; en: string }> = {
  available: { es: "disponible", en: "available" },
  reserved: { es: "apartado", en: "reserved" },
  paid: { es: "pagado", en: "paid" },
  delivered: { es: "entregado", en: "delivered" },
  cancelled: { es: "cancelado", en: "cancelled" },
};

export default function AdminPage() {
  const [lang, setLang] = useState<Lang>("es");
  const [adminPassword, setAdminPassword] = useState("");
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // filters
  const [sizeFilter, setSizeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | InventoryStatus>(
    "all"
  );
  const [genderFilter, setGenderFilter] = useState<"all" | string>("all");
  const [customerQuery, setCustomerQuery] = useState("");



  // form state
  const [modelName, setModelName] = useState("");
  const [color, setColor] = useState("");
  const [size, setSize] = useState("");
  const [gender, setGender] = useState("unisex");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("1");

  const t = (es: string, en: string) => (lang === "es" ? es : en);

  async function loadItems() {
    if (!adminPassword) return;
    setLoading(true);
    setAuthError(null);
    try {
      const res = await fetch(
        `/api/admin/inventory?password=${encodeURIComponent(adminPassword)}`
      );
      const data = await res.json();
      if (!res.ok) {
        setAuthError(data.error || "Auth error");
        setItems([]);
        return;
      }
      setItems(data.items || []);
    } catch (err) {
      console.error(err);
      setAuthError("Error loading inventory");
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    if (!adminPassword) return;

    setMessage(null);

    const res = await fetch("/api/admin/inventory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        adminPassword,
        model_name: modelName.trim(),
        color: color.trim(),
        size: size.trim(),
        price_mxn: Number(price),
        gender,
        quantity: Number(quantity),
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error || "Error al agregar / Error adding items");
      return;
    }

    setMessage(
      t("Inventario agregado correctamente ✅", "Inventory added successfully ✅")
    );
    setModelName("");
    setColor("");
    setSize("");
    setPrice("");
    setQuantity("1");
    setGender("unisex");
    loadItems();
  }

  async function updateItem(partial: Partial<InventoryItem> & { id: string }) {
    if (!adminPassword) return;
    const res = await fetch("/api/admin/inventory", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        adminPassword,
        ...partial,
      }),
    });
    if (!res.ok) {
      console.error("Failed to update item");
      return;
    }
    loadItems();
  }

  useEffect(() => {
    if (adminPassword) {
      loadItems();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminPassword]);

    const filteredItems = items.filter((item) => {
    const matchesStatus =
      statusFilter === "all" || item.status === statusFilter;

    const matchesGender =
      genderFilter === "all" || item.gender === genderFilter;

    const matchesSize = sizeFilter === "all" || item.size === sizeFilter;

    const query = customerQuery.trim().toLowerCase();
    const matchesCustomer =
      !query ||
      (item.customer_name || "").toLowerCase().includes(query) ||
      (item.customer_whatsapp || "").toLowerCase().includes(query);

    return matchesStatus && matchesGender && matchesCustomer && matchesSize;
  });


  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900">
      {/* sticky top bar */}
      <div className="sticky top-0 z-20 border-b border-slate-800/70 bg-slate-950/80 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-emerald-500 flex items-center justify-center text-lg">
              🐊
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-semibold text-slate-50">
                Jackie Crocs Admin
              </h1>
              <p className="text-[11px] text-slate-400">
                {t(
                  "Panel interno para manejar inventario.",
                  "Internal panel to manage inventory."
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden sm:inline text-[11px] text-slate-400">
              {t("Idioma", "Language")}
            </span>
            <div className="inline-flex items-center rounded-full border border-slate-700 bg-slate-900 p-0.5 text-[11px]">
              <button
                type="button"
                onClick={() => setLang("es")}
                className={`px-2.5 py-1 rounded-full ${
                  lang === "es"
                    ? "bg-emerald-500 text-slate-950"
                    : "text-slate-300 hover:text-white"
                }`}
              >
                ES
              </button>
              <button
                type="button"
                onClick={() => setLang("en")}
                className={`px-2.5 py-1 rounded-full ${
                  lang === "en"
                    ? "bg-emerald-500 text-slate-950"
                    : "text-slate-300 hover:text-white"
                }`}
              >
                EN
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* main content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Access + refresh */}
        <section className="bg-slate-900/80 border border-slate-700 rounded-2xl shadow-lg shadow-black/30 p-4 sm:p-5 space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="w-full sm:max-w-md">
              <label className="block text-xs font-medium text-slate-200 mb-1">
                {t("Contraseña admin", "Admin password")}
              </label>
              <input
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                className="w-full border border-slate-600/80 bg-slate-900/80 rounded-lg px-3 py-2 text-sm text-slate-50 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/80"
                placeholder="••••••••"
              />
              {authError && (
                <p className="mt-1 text-[11px] text-red-400">{authError}</p>
              )}
              {!authError && (
                <p className="mt-1 text-[11px] text-slate-500">
                  {t(
                    "Solo tú y Jackie deben tener esta contraseña.",
                    "Only you and Jackie should have this password."
                  )}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={loadItems}
              disabled={!adminPassword || loading}
              className="inline-flex justify-center items-center rounded-full bg-emerald-500 text-slate-950 text-xs font-semibold px-5 py-2.5 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-emerald-400 transition"
            >
              {loading
                ? t("Actualizando…", "Refreshing…")
                : t("Actualizar inventario", "Refresh inventory")}
            </button>
          </div>
        </section>

        {/* Add inventory */}
        <section className="bg-slate-950/80 border border-slate-800 rounded-2xl shadow-lg shadow-black/30 p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="text-sm sm:text-base font-semibold text-slate-50">
                {t("Agregar nuevos pares", "Add new pairs")}
              </h2>
              <p className="text-[11px] text-slate-500">
                {t(
                  "Se crearán varios registros si pones cantidad > 1.",
                  "Multiple records will be created if quantity > 1."
                )}
              </p>
            </div>
          </div>

          <form
            onSubmit={handleAdd}
            className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
          >
            <Field
              label={t("Modelo", "Model")}
              children={
                <input
                  value={modelName}
                  onChange={(e) => setModelName(e.target.value)}
                  className="w-full border border-slate-700 bg-slate-900/80 rounded-lg px-3 py-2 text-sm text-slate-50 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/80"
                  required
                />
              }
            />
            <Field
              label={t("Color (inglés)", "Color (English)")}
              children={
                <input
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-full border border-slate-700 bg-slate-900/80 rounded-lg px-3 py-2 text-sm text-slate-50 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/80"
                  required
                />
              }
            />
            <Field
              label={t("Talla", "Size")}
              children={
                <input
                  value={size}
                  onChange={(e) => setSize(e.target.value)}
                  className="w-full border border-slate-700 bg-slate-900/80 rounded-lg px-3 py-2 text-sm text-slate-50 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/80"
                  required
                />
              }
            />
            <Field
              label={t("Para", "For")}
              children={
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full border border-slate-700 bg-slate-900/80 rounded-lg px-3 py-2 text-sm text-slate-50 focus:outline-none focus:ring-1 focus:ring-emerald-500/80"
                >
                  {genderOptions.map((g) => (
                    <option key={g.value} value={g.value}>
                      {t(g.labelEs, g.labelEn)}
                    </option>
                  ))}
                </select>
              }
            />
            <Field
              label={t("Precio MXN", "Price MXN")}
              children={
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full border border-slate-700 bg-slate-900/80 rounded-lg px-3 py-2 text-sm text-slate-50 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/80"
                  required
                />
              }
            />
            <Field
              label={t("Cantidad", "Quantity")}
              children={
                <input
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full border border-slate-700 bg-slate-900/80 rounded-lg px-3 py-2 text-sm text-slate-50 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/80"
                  required
                />
              }
            />

            <div className="sm:col-span-2 lg:col-span-3 flex justify-end items-center">
              <button
                type="submit"
                disabled={!adminPassword}
                className="inline-flex items-center justify-center rounded-full bg-emerald-500 px-6 py-2.5 text-xs font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                {t("Agregar pares", "Add pairs")}
              </button>
            </div>
          </form>

          {message && (
            <p className="text-[11px] text-emerald-300 text-right">{message}</p>
          )}
        </section>

        {/* Inventory list */}
        <section className="bg-slate-950/80 border border-slate-800 rounded-2xl shadow-lg shadow-black/30 p-4 sm:p-5 space-y-4">
  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
    <div>
      <h2 className="text-sm sm:text-base font-semibold text-slate-50">
        {t("Inventario completo", "Full inventory")}
      </h2>
      <p className="text-[11px] text-slate-500">
        {t(
          `${items.length} pares en total`,
          `${items.length} pairs total`
        )}
      </p>
      {filteredItems.length !== items.length && (
        <p className="text-[11px] text-emerald-300 mt-0.5">
          {t(
            `${filteredItems.length} resultados después de filtros`,
            `${filteredItems.length} results after filters`
          )}
        </p>
      )}
    </div>

    {/* filters */}
    <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 w-full sm:w-auto sm:min-w-[550px] text-[11px]">
      {/* status filter */}
      <div className="flex flex-col gap-1">
        <span className="text-slate-300">
          {t("Estatus", "Status")}
        </span>
        <select
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(
              e.target.value === "all"
                ? "all"
                : (e.target.value as InventoryStatus)
            )
          }
          className="border border-slate-700 bg-slate-900/80 rounded-lg px-2.5 py-1.5 text-[11px] text-slate-50 focus:outline-none focus:ring-1 focus:ring-emerald-500/80"
        >
          <option value="all">
            {t("Todos", "All")}
          </option>
          {statusOptions.map((st) => (
            <option key={st} value={st}>
              {statusLabel[st][lang]}
            </option>
          ))}
        </select>
      </div>

      {/* gender filter */}
      <div className="flex flex-col gap-1">
        <span className="text-slate-300">
          {t("Para", "For")}
        </span>
        <select
          value={genderFilter}
          onChange={(e) => setGenderFilter(e.target.value)}
          className="border border-slate-700 bg-slate-900/80 rounded-lg px-2.5 py-1.5 text-[11px] text-slate-50 focus:outline-none focus:ring-1 focus:ring-emerald-500/80"
        >
          <option value="all">
            {t("Todos", "All")}
          </option>
          {genderOptions.map((g) => (
            <option key={g.value} value={g.value}>
              {t(g.labelEs, g.labelEn)}
            </option>
          ))}
        </select>
      </div>

      {/* size filter */}
<div className="flex flex-col gap-1">
  <span className="text-slate-300">
    {t("Talla", "Size")}
  </span>
  <select
    value={sizeFilter}
    onChange={(e) => setSizeFilter(e.target.value)}
    className="border border-slate-700 bg-slate-900/80 rounded-lg px-2.5 py-1.5 text-[11px] text-slate-50 focus:outline-none focus:ring-1 focus:ring-emerald-500/80"
  >
    <option value="all">{t("Todas", "All")}</option>

    {/* dynamically load all sizes */}
    {Array.from(new Set(items.map((i) => i.size))).map((size) => (
      <option key={size} value={size}>
        {size}
      </option>
    ))}
  </select>
</div>


      {/* customer search */}
      <div className="flex flex-col gap-1">
        <span className="text-slate-300">
          {t("Cliente / WhatsApp", "Customer / WhatsApp")}
        </span>
        <input
          value={customerQuery}
          onChange={(e) => setCustomerQuery(e.target.value)}
          className="border border-slate-700 bg-slate-900/80 rounded-lg px-2.5 py-1.5 text-[11px] text-slate-50 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/80"
          placeholder={
            lang === "es" ? "Buscar nombre o +52..." : "Search name or +52..."
          }
        />
      </div>
    </div>
  </div>


          {items.length === 0 ? (
  <p className="text-xs text-slate-400">
    {t(
      "No hay pares cargados todavía o la contraseña es incorrecta.",
      "No pairs loaded yet, or password is incorrect."
    )}
  </p>
) : filteredItems.length === 0 ? (
  <p className="text-xs text-slate-400">
    {t(
      "No hay resultados con estos filtros.",
      "No results with these filters."
    )}
  </p>
) : (
  <div className="space-y-3">
    {filteredItems.map((item) => (
      <InventoryCard
        key={item.id}
        item={item}
        lang={lang}
        onUpdate={updateItem}
      />
    ))}
  </div>
)}

        </section>
      </div>
    </main>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <label className="block text-[11px] font-medium text-slate-300">
        {label}
      </label>
      {children}
    </div>
  );
}

function InventoryCard({
  item,
  lang,
  onUpdate,
}: {
  item: InventoryItem;
  lang: Lang;
  onUpdate: (p: Partial<InventoryItem> & { id: string }) => void;
}) {
  const t = (es: string, en: string) => (lang === "es" ? es : en);

  const statusBadge =
    item.status === "available"
      ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/40"
      : item.status === "reserved"
      ? "bg-amber-500/15 text-amber-200 border border-amber-500/40"
      : item.status === "paid"
      ? "bg-sky-500/15 text-sky-200 border border-sky-500/40"
      : item.status === "delivered"
      ? "bg-slate-500/15 text-slate-200 border border-slate-400/40"
      : "bg-rose-500/15 text-rose-200 border border-rose-500/40";

  // 👇 Local editable state (no auto save)
  const [localStatus, setLocalStatus] = useState<InventoryStatus>(item.status);
  const [localGender, setLocalGender] = useState(item.gender);
  const [localCustomerName, setLocalCustomerName] = useState(
    item.customer_name || ""
  );
  const [localWhatsapp, setLocalWhatsapp] = useState(
    item.customer_whatsapp || ""
  );
  const [localNotes, setLocalNotes] = useState(item.notes || "");
  const [saving, setSaving] = useState(false);

  // If parent reloads items, sync the local state
  useEffect(() => {
    setLocalStatus(item.status);
    setLocalGender(item.gender);
    setLocalCustomerName(item.customer_name || "");
    setLocalWhatsapp(item.customer_whatsapp || "");
    setLocalNotes(item.notes || "");
  }, [item]);

  const hasChanges =
    localStatus !== item.status ||
    localGender !== item.gender ||
    localCustomerName !== (item.customer_name || "") ||
    localWhatsapp !== (item.customer_whatsapp || "") ||
    localNotes !== (item.notes || "");

  async function handleSave() {
    if (!hasChanges) return;
    setSaving(true);
    await onUpdate({
      id: item.id,
      status: localStatus,
      gender: localGender as any,
      customer_name: localCustomerName || null,
      customer_whatsapp: localWhatsapp || null,
      notes: localNotes || null,
    });
    setSaving(false);
  }

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-3 sm:p-4 space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="space-y-0.5">
          <p className="text-sm font-semibold text-slate-50">
            {item.model_name} · {item.color} · {item.size}
          </p>
          <p className="text-[11px] text-slate-500">
            ID: {item.id.slice(0, 8)}…
          </p>
        </div>
        <div className="flex items-center gap-3 justify-between sm:justify-end">
          <div className="text-right">
            <p className="text-sm font-semibold text-slate-50">
              ${item.price_mxn.toFixed(0)} MXN
            </p>
            <p className="text-[11px] text-slate-400">
              {t("Estado", "Status")} ·{" "}
              {statusLabel[item.status][lang].toLowerCase()}
            </p>
          </div>
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusBadge}`}
          >
            {statusLabel[item.status][lang]}
          </span>
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <div className="space-y-1">
          <label className="text-[11px] font-medium text-slate-300">
            {t("Estatus", "Status")}
          </label>
         <select
  value={localStatus}
  onChange={(e) =>
    setLocalStatus(e.target.value as InventoryStatus)
  }
  className="w-full border border-slate-700 bg-slate-950/80 rounded-lg px-2.5 py-1.5 text-xs text-slate-50 focus:outline-none focus:ring-1 focus:ring-emerald-500/80"
>
  {statusOptions.map((st) => (
    <option key={st} value={st}>
      {statusLabel[st][lang]}
    </option>
  ))}
</select>
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-medium text-slate-300">
            {t("Para", "For")}
          </label>
          <select
            value={localGender}
            onChange={(e) => setLocalGender(e.target.value)}
            className="w-full border border-slate-700 bg-slate-950/80 rounded-lg px-2.5 py-1.5 text-xs text-slate-50 focus:outline-none focus:ring-1 focus:ring-emerald-500/80"
          >
            {genderOptions.map((g) => (
              <option key={g.value} value={g.value}>
                {t(g.labelEs, g.labelEn)}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-medium text-slate-300">
            {t("Cliente (opcional)", "Customer (optional)")}
          </label>
          <input
            value={localCustomerName}
            onChange={(e) => setLocalCustomerName(e.target.value)}
            className="w-full border border-slate-700 bg-slate-950/80 rounded-lg px-2.5 py-1.5 text-xs text-slate-50 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/80"
            placeholder={t("Nombre", "Name")}
          />
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-medium text-slate-300">
            WhatsApp
          </label>
          <input
            value={localWhatsapp}
            onChange={(e) => setLocalWhatsapp(e.target.value)}
            className="w-full border border-slate-700 bg-slate-950/80 rounded-lg px-2.5 py-1.5 text-xs text-slate-50 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/80"
            placeholder="+52..."
          />
        </div>

        <div className="sm:col-span-2 space-y-1">
          <label className="text-[11px] font-medium text-slate-300">
            {t("Notas (entrega, etc.)", "Notes (meetup, etc.)")}
          </label>
          <textarea
            value={localNotes}
            onChange={(e) => setLocalNotes(e.target.value)}
            className="w-full border border-slate-700 bg-slate-950/80 rounded-lg px-2.5 py-1.5 text-xs text-slate-50 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/80 min-h-[48px]"
          />
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          disabled={!hasChanges || saving}
          className="inline-flex items-center justify-center rounded-full bg-emerald-500 px-4 py-1.5 text-[11px] font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          {saving
            ? t("Guardando…", "Saving…")
            : hasChanges
            ? t("Guardar cambios", "Save changes")
            : t("Sin cambios", "No changes")}
        </button>
      </div>
    </div>
  );
}

