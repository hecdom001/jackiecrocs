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

        const from_location_id = String(body?.from_location_id || "").trim();
        const to_location_id = String(body?.to_location_id || "").trim();
        const model_name = String(body?.model_name || "").trim();
        const color_name_en = String(body?.color || "").trim();
        const size_id = String(body?.size_id || "").trim();
        const quantity = Math.max(1, Number(body?.quantity) || 1);

        if (!from_location_id || !to_location_id || !model_name || !color_name_en || !size_id) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        if (from_location_id === to_location_id) {
            return NextResponse.json({ error: "from_location_id and to_location_id cannot match" }, { status: 400 });
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

        // resolve model id
        const { data: modelRow, error: modelErr } = await supabase
            .from("models")
            .select("id")
            .eq("name", model_name)
            .maybeSingle();

        if (modelErr) {
            console.error("Error resolving model:", modelErr);
            return NextResponse.json({ error: "Error resolving model" }, { status: 500 });
        }
        if (!modelRow?.id) {
            return NextResponse.json({ error: "Invalid model_name" }, { status: 400 });
        }

        // resolve color id
        const { data: colorRow, error: colorErr } = await supabase
            .from("colors")
            .select("id")
            .eq("name_en", color_name_en)
            .maybeSingle();

        if (colorErr) {
            console.error("Error resolving color:", colorErr);
            return NextResponse.json({ error: "Error resolving color" }, { status: 500 });
        }
        if (!colorRow?.id) {
            return NextResponse.json({ error: "Invalid color" }, { status: 400 });
        }

        // pick N items to move (row-level inventory)
        const { data: items, error: itemsErr } = await supabase
            .from("inventory_items")
            .select("id")
            .eq("location_id", from_location_id)
            .eq("model_id", modelRow.id)
            .eq("color_id", colorRow.id)
            .eq("size_id", size_id)
            .limit(quantity);

        if (itemsErr) {
            console.error("Error selecting inventory items:", itemsErr);
            return NextResponse.json({ error: "Error selecting items" }, { status: 500 });
        }

        const item_ids = (items ?? []).map((x: any) => String(x.id)).filter(Boolean);

        if (item_ids.length < quantity) {
            return NextResponse.json({ error: "Not enough inventory to transfer" }, { status: 400 });
        }

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
