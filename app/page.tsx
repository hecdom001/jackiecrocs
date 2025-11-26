import { supabase } from "@/lib/supabaseClient";
import type { InventoryItem } from "@/types/inventory";
import JackieCatalog from "@/components/JackieCatalog";

async function getAvailableItems(): Promise<InventoryItem[]> {
  const { data, error } = await supabase
    .from("inventory_items")
    .select("*")
    .ilike("status", "available") // case-insensitive just in case
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error loading items:", error);
    return [];
  }

  return (data ?? []).map((row: any) => ({
    ...row,
    price_mxn: Number(row.price_mxn),
  }));
}

export default async function HomePage() {
  const items = await getAvailableItems();
  const phone = process.env.WHATSAPP_PHONE || "52XXXXXXXXXX";

  return <JackieCatalog items={items} phone={phone} />;
}
