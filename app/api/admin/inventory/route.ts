// app/api/admin/inventory/route.tsx
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient"; // <- same client you already use

// Simple helper: check for admin_session cookie
function requireAdmin(req: NextRequest) {
  const session = req.cookies.get("admin_session")?.value;
  return !!session;
}

/**
 * GET /api/admin/inventory
 * Returns: { items: InventoryItemDTO[] }
 * Uses size_id + sizes.label
 * NOW includes location info.
 */
export async function GET(req: NextRequest) {
  if (!requireAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Join inventory_items with models + colors + sizes + locations
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
      sizes (
        id,
        label
      ),
      locations (
        id,
        slug,
        name
      )
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

      model_name: row.models?.name ?? null,
      color: row.colors?.name_en ?? null,

      size: row.sizes?.label ?? "",
      size_id: row.size_id as string,

      // ✅ NEW
      location_id: row.location_id as string,
      location: row.locations
        ? {
            id: row.locations.id as string,
            slug: row.locations.slug as string,
            name: row.locations.name as string,
          }
        : null,

      price_mxn: Number(row.price_mxn),
      status: row.status as any,
      customer_name: (row.customer_name as string) ?? null,
      customer_whatsapp: (row.customer_whatsapp as string) ?? null,
      notes: (row.notes as string) ?? null,
      created_at: row.created_at as string,
      updated_at: row.updated_at as string,
    })) ?? [];

  return NextResponse.json({ items });
}

/**
 * POST /api/admin/inventory
 * Body: { model_name, color, size_id, price_mxn, quantity, location_id }
 * - Ensures model exists in `models`
 * - Ensures color exists in `colors`
 * - Ensures size exists in `sizes`
 * - Ensures location exists in `locations`
 * - Inserts N inventory_items rows with those IDs
 * - Uses size_id as source of truth, but ALSO fills legacy `size` text column
 *   so the NOT NULL constraint is satisfied.
 */
export async function POST(req: NextRequest) {
  if (!requireAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { model_name, color, size_id, price_mxn, quantity, location_id } = body;

  if (!model_name || !color || !size_id || !price_mxn || !location_id) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  const qty = Number(quantity) || 1;

  // 0) Ensure size exists and get its label (for legacy `size` column)
  const { data: sizeRow, error: sizeError } = await supabase
    .from("sizes")
    .select("id, label")
    .eq("id", size_id)
    .maybeSingle();

  if (sizeError) {
    console.error("Error selecting size:", sizeError);
    return NextResponse.json({ error: "Error checking size" }, { status: 500 });
  }

  if (!sizeRow) {
    return NextResponse.json({ error: "Invalid size_id" }, { status: 400 });
  }

  const legacySizeLabel = sizeRow.label as string;

  // ✅ 0b) Ensure location exists
  const normalizedLocationId = String(location_id).trim();
  const { data: locationRow, error: locationError } = await supabase
    .from("locations")
    .select("id")
    .eq("id", normalizedLocationId)
    .maybeSingle();

  if (locationError) {
    console.error("Error selecting location:", locationError);
    return NextResponse.json(
      { error: "Error checking location" },
      { status: 500 }
    );
  }

  if (!locationRow) {
    return NextResponse.json(
      { error: "Invalid location_id" },
      { status: 400 }
    );
  }

  // 1) Ensure model exists (models.name)
  const normalizedModel = String(model_name).trim();
  let { data: existingModel, error: modelSelectError } = await supabase
    .from("models")
    .select("id")
    .eq("name", normalizedModel)
    .maybeSingle();

  if (modelSelectError) {
    console.error("Error selecting model:", modelSelectError);
    return NextResponse.json({ error: "Error checking model" }, { status: 500 });
  }

  if (!existingModel) {
    const { data: newModel, error: modelInsertError } = await supabase
      .from("models")
      .insert({ name: normalizedModel })
      .select("id")
      .single();

    if (modelInsertError || !newModel) {
      console.error("Error inserting model:", modelInsertError);
      return NextResponse.json({ error: "Error creating model" }, { status: 500 });
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
    return NextResponse.json({ error: "Error checking color" }, { status: 500 });
  }

  if (!existingColor) {
    const { data: newColor, error: colorInsertError } = await supabase
      .from("colors")
      .insert({ name_en: normalizedColor })
      .select("id")
      .single();

    if (colorInsertError || !newColor) {
      console.error("Error inserting color:", colorInsertError);
      return NextResponse.json({ error: "Error creating color" }, { status: 500 });
    }
    existingColor = newColor;
  }

  const color_id = existingColor.id as string;

  // 3) Insert inventory rows (one per pair)
  //    -> use size_id as FK + keep legacy `size` text column in sync
  //    -> ✅ include location_id
  const rows = Array.from({ length: qty }).map(() => ({
    model_id,
    color_id,
    size_id: String(size_id),
    size: legacySizeLabel, // keeps NOT NULL column happy
    location_id: normalizedLocationId, // ✅ NEW
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
 * Body: { id, ...fieldsToUpdate }
 * Only used for status / customer data / notes
 * NOW optionally allows location_id too (useful for corrections).
 */
export async function PATCH(req: NextRequest) {
  if (!requireAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { id, ...rest } = body;

  if (!id) {
    return NextResponse.json({ error: "Missing item id" }, { status: 400 });
  }

  // Only allow certain fields to be updated from the admin UI
  const allowedFields = [
    "status",
    "customer_name",
    "customer_whatsapp",
    "notes",
    "location_id", // ✅ NEW (optional)
  ] as const;

  const payload: Record<string, any> = {};
  for (const key of allowedFields) {
    if (key in rest) {
      payload[key] = rest[key];
    }
  }

  if (Object.keys(payload).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  // If location_id is being updated, validate it exists
  if (payload.location_id) {
    const { data: loc, error: locErr } = await supabase
      .from("locations")
      .select("id")
      .eq("id", String(payload.location_id))
      .maybeSingle();

    if (locErr) {
      console.error("Error checking location:", locErr);
      return NextResponse.json(
        { error: "Error checking location" },
        { status: 500 }
      );
    }

    if (!loc) {
      return NextResponse.json({ error: "Invalid location_id" }, { status: 400 });
    }
  }

  const { error } = await supabase
    .from("inventory_items")
    .update(payload)
    .eq("id", id);

  if (error) {
    console.error("Error updating inventory item:", error);
    return NextResponse.json({ error: "Error updating item" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
