// app/api/admin/history/route.ts
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

// Optional: if you already have an admin auth helper, import + reuse it here
// import { requireAdmin } from "@/lib/adminAuth";

export async function GET(req: Request) {
  try {
    // ✅ If you have admin auth, enforce it here (copy from inventory route)
    // const authResult = await requireAdmin(req);
    // if (!authResult.ok) {
    //   return NextResponse.json(
    //     { error: "Unauthorized" },
    //     { status: 401 }
    //   );
    // }

    const { searchParams } = new URL(req.url);
    const limitParam = searchParams.get("limit");
    const limit = Math.min(Number(limitParam) || 20, 30); // cap at 30 just in case

    // ✅ Use size_id + join sizes(label). We DO NOT read inventory_items.size anymore.
    const { data, error } = await supabase
      .from("inventory_items")
      .select(
        `
        id,
        model_id,
        color_id,
        size_id,
        price_mxn,
        status,
        customer_name,
        customer_whatsapp,
        notes,
        created_at,
        updated_at,
        models ( name ),
        colors ( name_en ),
        sizes ( label )
      `
      )
      .order("updated_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Error fetching history:", error);
      return NextResponse.json(
        { error: "Error fetching history" },
        { status: 500 }
      );
    }

    // 🔁 Flatten sizes.label into a top-level `size` field
    // so the AdminHistoryPage keeps working without changes.
    const history = (data ?? []).map((row: any) => ({
      ...row,
      size: row.sizes?.label ?? "", // this is what the UI uses as entry.size
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
