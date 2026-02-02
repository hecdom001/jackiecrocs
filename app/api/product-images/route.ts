import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

const SUPABASE_IMAGE_BASE =
    "https://axrfkuupjoddsoswowac.supabase.co/storage/v1/object/public/product-images";

export async function GET() {
    const { data, error } = await supabase
        .from("product_images")
        .select(
            `
      storage_path,
      alt_text,
      models ( name ),
      colors ( name_en )
    `
        );

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Map key = "model__color" (lowercase) → { src, alt }
    const rows = (data ?? [])
        .map((r: any) => {
            const modelName = String(r.models?.name ?? "").trim();
            const colorEn = String(r.colors?.name_en ?? "").trim();
            const storagePath = String(r.storage_path ?? "").trim();
            if (!modelName || !colorEn || !storagePath) return null;

            return {
                key: `${modelName}__${colorEn}`.toLowerCase(),
                src: `${SUPABASE_IMAGE_BASE}/${storagePath}`,
                alt: r.alt_text ?? null,
                storage_path: storagePath,
                model: modelName,
                color: colorEn,
            };
        })
        .filter(Boolean);

    return NextResponse.json({ rows });
}
