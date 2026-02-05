// app/layout.tsx or app/RootCartProvider.tsx
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { CartProvider } from "@/components/store/CartProvider";
import type { PublicItem } from "@/lib/jackieCatalogUtils";

type ProductImageMap = Record<string, { src: string; label: string }>;

// Shared data fetcher for the entire app
function useAppCartData() {
    const [items, setItems] = useState<PublicItem[]>([]);
    const [itemsLoading, setItemsLoading] = useState(true);
    const [productImageMap, setProductImageMap] = useState<ProductImageMap>({});

    useEffect(() => {
        let cancelled = false;

        async function loadData() {
            try {
                const [imagesRes, inventoryRes] = await Promise.all([
                    fetch("/api/product-images", { cache: "no-store" }),
                    supabase
                        .from("inventory_items")
                        .select(`
                            id, size_id, location_id, price_mxn, status, created_at,
                            models ( name, brand, uses_size, uses_color, category_id ),
                            colors ( name_en ),
                            sizes ( id, label ),
                            locations ( slug, name )
                        `)
                        .eq("status", "available")
                ]);

                if (cancelled) return;

                if (imagesRes.ok) {
                    const imagesData = await imagesRes.json();
                    if (Array.isArray(imagesData?.rows)) {
                        const imageMap = imagesData.rows.reduce((acc: ProductImageMap, r: any) => {
                            if (r?.key && r?.src) {
                                acc[String(r.key).toLowerCase()] = {
                                    src: r.src,
                                    label: r.alt || ""
                                };
                            }
                            return acc;
                        }, {});
                        setProductImageMap(imageMap);
                    }
                }

                const { data, error } = inventoryRes;
                if (error || !data || cancelled) {
                    setItemsLoading(false);
                    return;
                }

                const variantMap = new Map<string, PublicItem>();
                data.forEach((row: any) => {
                    const model_name = row.models?.name ?? "";
                    const brand = row.models?.brand ?? "";
                    const uses_size = !!row.models?.uses_size;
                    const uses_color = !!row.models?.uses_color;
                    const category_id = row.models?.category_id ? String(row.models.category_id) : null;
                    const color = row.colors?.name_en ?? "";
                    const size_id = row.size_id as string;
                    const sizeLabel = row.sizes?.label ?? "";
                    const locSlug = row.locations?.slug ?? "unknown";
                    const locName = row.locations?.name ?? "";
                    const price_mxn = Number(row.price_mxn);
                    const created_at = row.created_at ?? new Date(0).toISOString();

                    if (!size_id || !sizeLabel) return;

                    const stableId = `${model_name}__${color}__${size_id}__${price_mxn}__${locSlug}`.toLowerCase();
                    const existing = variantMap.get(stableId);

                    if (existing) {
                        existing.availableCount += 1;
                    } else {
                        variantMap.set(stableId, {
                            id: stableId,
                            model_name, brand, uses_size, uses_color, category_id,
                            color, size: sizeLabel, size_id,
                            location_slug: locSlug, location_name: locName,
                            price_mxn, availableCount: 1, created_at,
                        });
                    }
                });

                if (!cancelled) {
                    setItems(Array.from(variantMap.values()));
                    setItemsLoading(false);
                }
            } catch (err) {
                console.error('Failed to load app data:', err);
                if (!cancelled) setItemsLoading(false);
            }
        }

        loadData();
        return () => { cancelled = true; };
    }, []);

    return { items, itemsLoading, productImageMap };
}

// Root cart provider component
export function RootCartProvider({ children }: { children: React.ReactNode }) {
    const { items, itemsLoading, productImageMap } = useAppCartData();

    return (
        <CartProvider items={items} itemsLoading={itemsLoading} productImageMap={productImageMap}>
            {children}
        </CartProvider>
    );
}