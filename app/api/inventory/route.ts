// app/api/inventory/route.ts (or wherever this file lives)
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import type { InventoryItem } from "@/types/inventory";

export async function GET() {
  const { data, error } = await supabase
    .from("inventory_items")
    .select(
      `
      id,
      model_id,
      color_id,
      size_id,
      location_id,
      price_mxn,
      status,
      customer_name,
      customer_whatsapp,
      notes,
      created_at,
      updated_at,
      models ( name ),
      colors ( name_en ),
      sizes ( label ),
      locations ( id, name, slug )
    `
    )
    .eq("status", "available")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error loading inventory:", error);
    return NextResponse.json({ items: [] as InventoryItem[] }, { status: 500 });
  }

  // Flatten joins into top-level fields the UI commonly expects:
  const items: InventoryItem[] = (data ?? []).map((row: any) => ({
    ...row,
    price_mxn: Number(row.price_mxn),

    // ✅ UI convenience fields (safe even if your InventoryItem type already has them)
    model_name: row.models?.name ?? row.model_name ?? null,
    color: row.colors?.name_en ?? row.color ?? null,
    size: row.sizes?.label ?? row.size ?? "",

    // ✅ optional (used by multi-location dashboards)
    location_name: row.locations?.name ?? row.location_name ?? null,
    location_slug: row.locations?.slug ?? row.location_slug ?? null,
  }));

  return NextResponse.json({ items });
}
