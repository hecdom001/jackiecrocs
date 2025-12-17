// app/api/admin/locations/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

function requireAdmin(req: NextRequest) {
  const session = req.cookies.get("admin_session")?.value;
  return !!session;
}

/**
 * GET /api/admin/locations
 * Returns: { locations: { id, slug, name }[] }
 */
export async function GET(req: NextRequest) {
  if (!requireAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("locations")
    .select("id, slug, name")
    .order("name", { ascending: true });

  if (error) {
    console.error("Error fetching locations:", error);
    return NextResponse.json(
      { error: "Error fetching locations" },
      { status: 500 }
    );
  }

  const locations =
    (data ?? []).map((row: any) => ({
      id: String(row.id),
      slug: String(row.slug),
      name: String(row.name),
    })) ?? [];

  return NextResponse.json({ locations });
}
