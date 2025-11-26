import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import type { InventoryItem } from "@/types/inventory";

function checkPassword(pw: string | null): boolean {
  return !!pw && pw === process.env.ADMIN_PASSWORD;
}

// GET /api/admin/inventory?password=xxx
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const password = searchParams.get("password");

  if (!checkPassword(password)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabaseAdmin
    .from("inventory_items")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Admin GET error:", error);
    return NextResponse.json(
      { error: "Failed to load items" },
      { status: 500 }
    );
  }

  const items: InventoryItem[] = (data ?? []).map((row: any) => ({
    ...row,
    price_mxn: Number(row.price_mxn),
  }));

  return NextResponse.json({ items });
}

// POST /api/admin/inventory  -> add items in bulk
export async function POST(req: Request) {
  const body = await req.json();
  const {
    adminPassword,
    model_name,
    color,
    size,
    price_mxn,
    gender,
    quantity,
  } = body as {
    adminPassword: string;
    model_name: string;
    color: string;
    size: string;
    price_mxn: number;
    gender: string;
    quantity: number;
  };

  if (!checkPassword(adminPassword)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!model_name || !color || !size || !price_mxn || !quantity || !gender) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  const qty = Number(quantity);
  const price = Number(price_mxn);

  const itemsToInsert = Array.from({ length: qty }).map(() => ({
    model_name,
    color,
    size,
    price_mxn: price,
    gender,
    status: "available",
  }));

  const { error } = await supabaseAdmin
    .from("inventory_items")
    .insert(itemsToInsert);

  if (error) {
    console.error("Admin POST error:", error);
    return NextResponse.json(
      { error: "Failed to insert items" },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}

// PATCH /api/admin/inventory  -> update one item
export async function PATCH(req: Request) {
  const body = await req.json();
  const {
    adminPassword,
    id,
    status,
    gender,
    price_mxn,
    customer_name,
    customer_whatsapp,
    notes,
  } = body as Partial<InventoryItem> & {
    adminPassword: string;
    id: string;
  };

  if (!checkPassword(adminPassword)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!id) {
    return NextResponse.json({ error: "Missing item id" }, { status: 400 });
  }

  const update: any = {};
  if (status) update.status = status;
  if (gender) update.gender = gender;
  if (price_mxn !== undefined) update.price_mxn = Number(price_mxn);
  if (customer_name !== undefined) update.customer_name = customer_name;
  if (customer_whatsapp !== undefined)
    update.customer_whatsapp = customer_whatsapp;
  if (notes !== undefined) update.notes = notes;

  const { error } = await supabaseAdmin
    .from("inventory_items")
    .update(update)
    .eq("id", id);

  if (error) {
    console.error("Admin PATCH error:", error);
    return NextResponse.json(
      { error: "Failed to update item" },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
