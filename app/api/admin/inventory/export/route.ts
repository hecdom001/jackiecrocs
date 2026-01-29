// app/api/admin/inventory/export/route.ts
import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { supabase } from "@/lib/supabaseClient";

type Lang = "es" | "en";
type InventoryStatus = "available" | "reserved" | "paid_complete" | "cancelled";

const statusLabel: Record<InventoryStatus, { es: string; en: string }> = {
    available: { es: "Disponible", en: "Available" },
    reserved: { es: "Apartado", en: "Reserved" },
    paid_complete: { es: "Pagado Completo", en: "Fully Paid" },
    cancelled: { es: "Cancelado", en: "Cancelled" },
};

function translateStatus(st: string | null | undefined, lang: Lang) {
    if (!st) return "";
    const key = st as InventoryStatus;
    return statusLabel[key]?.[lang] ?? st;
}

function translateColorLabel(colorEn: string | null | undefined, lang: Lang) {
    if (!colorEn) return "";
    if (lang === "en") return colorEn;
    const key = colorEn.trim().toLowerCase();
    switch (key) {
        case "black": return "Negro";
        case "white": return "Blanco";
        case "beige": return "Beige";
        case "purple": return "Morado";
        case "baby pink": return "Rosa Pastel";
        case "red": return "Rojo";
        case "lilac": return "Lila";
        case "arctic": return "Azul Ártico";
        case "camo": return "Camuflaje";
        case "light pink shimmer": return "Rosa Claro con Brillo";
        case "fuchsia": return "Fucsia";
        case "rust brown": return "Ladrillo";
        case "grey black": return "Gris / Negro";
        case "beige brown": return "Beige / Café";
        case "grey white": return "Gris / Blanco";
        case "rose sugar": return "Rosa Azúcar";
        case "crystal white": return "Blanco Cristal";

        case "barbie": return "Barbie";
        case "batman": return "Batman";
        case "buzz lightyear": return "Buzz Lightyear";
        case "dragon ball": return "Dragon Ball";
        case "hello kitty": return "Hello Kitty";
        case "simpsons": return "Los Simpson";
        case "stranger things": return "Stranger Things";
        case "superman": return "Superman";
        case "toy story": return "Toy Story";
        case "yoda": return "Yoda";
        case "egg": return "Huevito";
        default: return colorEn;
    }
}

function translateModelLabel(modelEn: string | null | undefined, lang: Lang) {
    if (!modelEn) return "";
    if (lang === "en") return modelEn;
    const key = modelEn.trim().toLowerCase();
    switch (key) {
        case "classic crocs": return "Crocs Clásico";
        case "classic platform crocs": return "Crocs Plataforma Clásica";
        case "classic shimmer gemstone crocs": return "Crocs Clásico Shimmer Gemstone";
        case "special edition crocs": return "Crocs Edición Especial";
        default: return modelEn;
    }
}


// Same helper as your inventory route
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
        const ids: string[] = Array.isArray(body?.ids) ? body.ids : [];
        const lang: "es" | "en" = body?.lang === "es" ? "es" : "en";

        if (ids.length === 0) {
            return NextResponse.json({ error: "No items to export" }, { status: 400 });
        }

        // Pull only the items requested (with the same joins as GET)
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
        sizes ( id, label ),
        locations ( id, slug, name )
      `
            )
            .in("id", ids);

        if (error) {
            console.error("Error exporting inventory:", error);
            return NextResponse.json(
                { error: "Error exporting inventory" },
                { status: 500 }
            );
        }

        const mapped =
            data?.map((row: any) => ({
                id: row.id as string,
                model_id: row.model_id as string,
                color_id: row.color_id as string,

                model_name: row.models?.name ?? null,
                color: row.colors?.name_en ?? null,

                size: row.sizes?.label ?? "",
                size_id: row.size_id as string,

                location_id: row.location_id ? String(row.location_id) : null,
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

        // Keep same order as UI (ids list)
        const mapById = new Map(mapped.map((it) => [it.id, it]));
        const items = ids.map((id) => mapById.get(id)).filter(Boolean) as typeof mapped;

        const wb = new ExcelJS.Workbook();
        const ws = wb.addWorksheet(lang === "es" ? "Inventario" : "Inventory");

        const headers =
            lang === "es"
                ? [
                    "ID",
                    "Modelo",
                    "Color",
                    "Talla",
                    "Ubicación",
                    "Precio (MXN)",
                    "Estatus",
                    "Cliente",
                    "WhatsApp",
                    "Notas",
                ]
                : [
                    "ID",
                    "Model",
                    "Color",
                    "Size",
                    "Location",
                    "Price (MXN)",
                    "Status",
                    "Customer",
                    "WhatsApp",
                    "Notes",
                ];

        ws.addRow(headers);

        ws.getRow(1).font = { bold: true };
        ws.views = [{ state: "frozen", ySplit: 1 }];

        for (const it of items) {
            ws.addRow([
                it.id ?? "",
                translateModelLabel(it.model_name ?? "", lang),
                translateColorLabel(it.color ?? "", lang),
                it.size ?? "",
                it.location?.name ?? it.location?.slug ?? "",
                Number(it.price_mxn ?? 0),
                translateStatus(it.status ?? "", lang),
                it.customer_name ?? "",
                it.customer_whatsapp ?? "",
                it.notes ?? "",
            ]);

        }

        // Auto width (TS-safe)
        (ws.columns || []).forEach((col) => {
            if (!col) return;

            let max = 10;

            if (typeof col.eachCell === "function") {
                col.eachCell({ includeEmpty: true }, (cell) => {
                    const v = cell.value ? String(cell.value) : "";
                    max = Math.max(max, Math.min(60, v.length + 2));
                });
            }

            col.width = max;
        });

        const buffer = await wb.xlsx.writeBuffer();

        return new NextResponse(buffer, {
            status: 200,
            headers: {
                "Content-Type":
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "Content-Disposition": `attachment; filename="inventory_${new Date()
                    .toISOString()
                    .slice(0, 10)}.xlsx"`,
                "Cache-Control": "no-store",
            },
        });
    } catch (e) {
        console.error(e);
        return NextResponse.json(
            { error: "Failed to export inventory" },
            { status: 500 }
        );
    }
}
