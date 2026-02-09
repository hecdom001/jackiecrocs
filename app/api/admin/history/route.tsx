// app/api/admin/history/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

// Same helper as inventory route
function requireAdmin(req: NextRequest) {
  const session = req.cookies.get("admin_session")?.value;
  return !!session;
}

export async function GET(req: NextRequest) {
  try {
    if (!requireAdmin(req)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);

    // limit: default 90, hard cap 100
    const limitParam = searchParams.get("limit");
    const limit = Math.min(Number(limitParam) || 90, 100);

    // optional location filter
    const locationId = searchParams.get("locationId");

    let query = supabase
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
        notes,
        created_at,
        updated_at,

        models (
          name,
          categories (
            id,
            slug,
            name
          )
        ),

        colors ( name_en ),
        sizes ( label ),
        locations ( id, slug, name )
      `
        )
        .neq("status", "available")
        .order("updated_at", { ascending: false })
        .limit(limit);

    if (locationId && locationId !== "all") {
      query = query.eq("location_id", locationId);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching history:", error);
      return NextResponse.json(
          { error: "Error fetching history" },
          { status: 500 }
      );
    }

    const history = (data ?? []).map((row: any) => ({
      id: row.id,

      model_name: row.models?.name ?? null,

      // ✅ CATEGORY (for UI column after "Last update")
      category: row.models?.categories
          ? {
            id: row.models.categories.id,
            slug: row.models.categories.slug,
            name: row.models.categories.name,
          }
          : null,

      color: row.colors?.name_en ?? null,
      size: row.sizes?.label ?? "",

      price_mxn: Number(row.price_mxn),
      status: row.status,

      customer_name: row.customer_name ?? null,
      notes: row.notes ?? null,

      updated_at: row.updated_at,

      // location normalization
      location_id: row.location_id ?? null,
      location: row.locations
          ? {
            id: row.locations.id,
            slug: row.locations.slug,
            name: row.locations.name,
          }
          : null,
    }));

    return NextResponse.json({ history });
  } catch (err) {
    console.error("Unexpected error in /api/admin/history:", err);
    return NextResponse.json(
        { error: "Unexpected error" },
        { status: 500 }
    );
  }
}
