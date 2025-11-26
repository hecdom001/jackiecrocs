import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient"; // <- same client you already use

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

// Small helper to check admin password
function checkPassword(password: string | null) {
  if (!ADMIN_PASSWORD) {
    console.warn("ADMIN_PASSWORD is not set in env");
    return false;
  }
  return password === ADMIN_PASSWORD;
}

/**
 * GET /api/admin/inventory?password=...
 * Returns: { items: InventoryItemDTO[] }
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const password = searchParams.get("password");

  if (!checkPassword(password)) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  // Join inventory_items with models + colors
  const { data, error } = await supabase
    .from("inventory_items")
    .select(
      `
      id,
      model_id,
      color_id,
      size,
      price_mxn,
      status,
      customer_name,
      customer_whatsapp,
      notes,
      created_at,
      updated_at,
      models ( name ),
      colors ( name_en )
    `
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching inventory:", error);
    return NextResponse.json(
      { error: "Error fetching inventory" },
      { status: 500 }
    );
  }

  // Map into the shape your frontend expects
  const items =
    data?.map((row: any) => ({
      id: row.id as string,
      model_id: row.model_id as string,
      color_id: row.color_id as string,
      model_name: row.models?.name as string,
      color: row.colors?.name_en as string,
      size: row.size as string,
      price_mxn: Number(row.price_mxn),
      status: row.status as any,
      customer_name: row.customer_name as string | null,
      customer_whatsapp: row.customer_whatsapp as string | null,
      notes: row.notes as string | null,
      created_at: row.created_at as string,
      updated_at: row.updated_at as string,
    })) ?? [];

  return NextResponse.json({ items });
}

/**
 * POST /api/admin/inventory
 * Body: { adminPassword, model_name, color, size, price_mxn, quantity }
 * - Ensures model exists in `models`
 * - Ensures color exists in `colors`
 * - Inserts N inventory_items rows with those IDs
 */
export async function POST(req: NextRequest) {
  const body = await req.json();

  const {
    adminPassword,
    model_name,
    color,
    size,
    price_mxn,
    quantity,
  } = body;

  if (!checkPassword(adminPassword)) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  if (!model_name || !color || !size || !price_mxn) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  const qty = Number(quantity) || 1;

  // 1) Ensure model exists (models.name)
  const normalizedModel = String(model_name).trim();
  let { data: existingModel, error: modelSelectError } = await supabase
    .from("models")
    .select("id")
    .eq("name", normalizedModel)
    .maybeSingle();

  if (modelSelectError) {
    console.error("Error selecting model:", modelSelectError);
    return NextResponse.json(
      { error: "Error checking model" },
      { status: 500 }
    );
  }

  if (!existingModel) {
    const { data: newModel, error: modelInsertError } = await supabase
      .from("models")
      .insert({ name: normalizedModel })
      .select("id")
      .single();

    if (modelInsertError || !newModel) {
      console.error("Error inserting model:", modelInsertError);
      return NextResponse.json(
        { error: "Error creating model" },
        { status: 500 }
      );
    }
    existingModel = newModel;
  }

  const model_id = existingModel.id as string;

  // 2) Ensure color exists (colors.name_en)
  const normalizedColor = String(color).trim();
  let { data: existingColor, error: colorSelectError } = await supabase
    .from("colors")
    .select("id")
    .eq("name_en", normalizedColor)
    .maybeSingle();

  if (colorSelectError) {
    console.error("Error selecting color:", colorSelectError);
    return NextResponse.json(
      { error: "Error checking color" },
      { status: 500 }
    );
  }

  if (!existingColor) {
    const { data: newColor, error: colorInsertError } = await supabase
      .from("colors")
      .insert({ name_en: normalizedColor })
      .select("id")
      .single();

    if (colorInsertError || !newColor) {
      console.error("Error inserting color:", colorInsertError);
      return NextResponse.json(
        { error: "Error creating color" },
        { status: 500 }
      );
    }
    existingColor = newColor;
  }

  const color_id = existingColor.id as string;

  // 3) Insert inventory rows (one per pair)
  const rows = Array.from({ length: qty }).map(() => ({
    model_id,
    color_id,
    size: String(size).trim(),
    price_mxn: Number(price_mxn),
    status: "available",
  }));

  const { error: insertError } = await supabase
    .from("inventory_items")
    .insert(rows);

  if (insertError) {
    console.error("Error inserting inventory:", insertError);
    return NextResponse.json(
      { error: "Error inserting inventory" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}

/**
 * PATCH /api/admin/inventory
 * Body: { adminPassword, id, ...fieldsToUpdate }
 * Only used for status / customer data / notes
 */
export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { adminPassword, id, ...rest } = body;

  if (!checkPassword(adminPassword)) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  if (!id) {
    return NextResponse.json(
      { error: "Missing item id" },
      { status: 400 }
    );
  }

  // Only allow certain fields to be updated from the admin UI
  const allowedFields = [
    "status",
    "customer_name",
    "customer_whatsapp",
    "notes",
  ] as const;

  const payload: Record<string, any> = {};
  for (const key of allowedFields) {
    if (key in rest) {
      payload[key] = rest[key];
    }
  }

  if (Object.keys(payload).length === 0) {
    return NextResponse.json(
      { error: "No valid fields to update" },
      { status: 400 }
    );
  }

  const { error } = await supabase
    .from("inventory_items")
    .update(payload)
    .eq("id", id);

  if (error) {
    console.error("Error updating inventory item:", error);
    return NextResponse.json(
      { error: "Error updating item" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
