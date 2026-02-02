import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function slugify(input: string) {
    return input
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "");
}

function getAdminSupabase() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
    if (!serviceKey) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");

    return createClient(url, serviceKey, {
        auth: { persistSession: false, autoRefreshToken: false },
    });
}

export async function POST(req: Request) {
    try {
        const supabaseAdmin = getAdminSupabase();

        const form = await req.formData();

        const model = String(form.get("model") || "").trim();
        const color = String(form.get("color") || "").trim();
        const file = form.get("file") as File | null;

        if (!model || !color || !file) {
            return NextResponse.json({ error: "Missing model/color/file" }, { status: 400 });
        }

        // 1) Look up model_id
        const { data: mRow, error: mErr } = await supabaseAdmin
            .from("models")
            .select("id")
            .eq("name", model)
            .single();

        if (mErr || !mRow?.id) {
            return NextResponse.json({ error: "Model not found" }, { status: 400 });
        }

        // 2) Look up color_id
        const { data: cRow, error: cErr } = await supabaseAdmin
            .from("colors")
            .select("id")
            .eq("name_en", color)
            .single();

        if (cErr || !cRow?.id) {
            return NextResponse.json({ error: "Color not found" }, { status: 400 });
        }

        // 3) Build storage path
        const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
        const storage_path = `${slugify(model)}__${slugify(color)}.${ext}`;

        // 4) Upload to Storage (Node needs bytes, not File)
        const bytes = new Uint8Array(await file.arrayBuffer());

        const { error: upErr } = await supabaseAdmin.storage
            .from("product-images")
            .upload(storage_path, bytes, {
                upsert: true,
                contentType: file.type || "image/jpeg",
            });

        if (upErr) {
            return NextResponse.json({ error: upErr.message }, { status: 500 });
        }

        // 5) Upsert DB row
        const { error: dbErr } = await supabaseAdmin
            .from("product_images")
            .upsert(
                {
                    model_id: mRow.id,
                    color_id: cRow.id,
                    storage_path,
                    alt_text: `${model} - ${color}`,
                },
                { onConflict: "model_id,color_id" }
            );

        if (dbErr) {
            return NextResponse.json({ error: dbErr.message }, { status: 500 });
        }

        return NextResponse.json({ ok: true, storage_path });
    } catch (e: any) {
        return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
    }
}
