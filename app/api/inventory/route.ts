import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import type { InventoryItem } from "@/types/inventory";

export async function GET() {
  const { data, error } = await supabase
    .from("inventory_items")
    .select("*")
    .ilike("status", "available")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error loading inventory:", error);
    return NextResponse.json({ items: [] as InventoryItem[] }, { status: 500 });
  }

  const items: InventoryItem[] = (data ?? []).map((row: any) => ({
    ...row,
    price_mxn: Number(row.price_mxn),
  }));

  return NextResponse.json({ items });
}
