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

    // limit: default 20, max 30 (same as MAX_HISTORY on UI)
    const limitParam = searchParams.get("limit");
    const limit = Math.min(Number(limitParam) || 20, 30);

    // optional location filter (by location_id) – safe even if UI doesn't send it yet
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
        customer_whatsapp,
        notes,
        created_at,
        updated_at,
        models ( name ),
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
      ...row,
      // UI uses entry.size
      size: row.sizes?.label ?? "",
      // normalized fields the UI code expects
      location_id: row.location_id ?? null,
      locations: row.locations ?? null,
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
