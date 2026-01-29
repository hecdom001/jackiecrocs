// app/api/admin/inventory/transfer/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

function requireAdmin(req: NextRequest) {
    const session = req.cookies.get("admin_session")?.value;
    return !!session;
}

export async function POST(req: NextRequest) {
    try {
        if (!requireAdmin(req)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const to_location_id = String(body?.to_location_id || "").trim();
        const item_ids: string[] = Array.isArray(body?.item_ids) ? body.item_ids : [];

        if (!to_location_id) {
            return NextResponse.json({ error: "Missing to_location_id" }, { status: 400 });
        }
        if (item_ids.length === 0) {
            return NextResponse.json({ error: "No items selected" }, { status: 400 });
        }

        // validate destination location exists
        const { data: loc, error: locErr } = await supabase
            .from("locations")
            .select("id")
            .eq("id", to_location_id)
            .maybeSingle();

        if (locErr) {
            console.error("Error checking destination location:", locErr);
            return NextResponse.json({ error: "Error checking location" }, { status: 500 });
        }
        if (!loc) {
            return NextResponse.json({ error: "Invalid to_location_id" }, { status: 400 });
        }

        // update only selected ids
        const { error: updErr } = await supabase
            .from("inventory_items")
            .update({ location_id: to_location_id })
            .in("id", item_ids);

        if (updErr) {
            console.error("Error transferring items:", updErr);
            return NextResponse.json({ error: "Error transferring items" }, { status: 500 });
        }

        return NextResponse.json({ success: true, transferred: item_ids.length });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: "Failed to transfer" }, { status: 500 });
    }
}
