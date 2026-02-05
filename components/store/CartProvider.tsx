// components/store/CartProvider.tsx
"use client";

import React, { createContext, useContext, useEffect, useState, useMemo, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { PublicItem, CartLine } from "@/lib/jackieCatalogUtils";
import { getCartLocationInfo, buildWhatsAppLink } from "@/lib/jackieCatalogUtils";
import { LS_CART_KEY, PLACEHOLDER_IMAGE } from "./storeConstants";

type ProductImageMap = Record<string, { src: string; label: string }>;

interface CartContextValue {
    // Cart state
    quantities: Record<string, number>;
    cartLines: CartLine[];
    totalCartPairs: number;
    isMixedCart: boolean;
    waLinkForCart: string;
    hasCartWhatsApp: boolean;
    cartLocationSlug: string;

    // Items
    items: PublicItem[];
    itemsLoading: boolean;

    // Actions
    addToCart: (item: PublicItem) => void;
    removeFromCart: (itemId: string) => void;
    removeItem: (itemId: string) => void;
    clearCart: () => void;
    getPhotoForItem: (item: PublicItem) => { src: string; label: string };
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
    const [items, setItems] = useState<PublicItem[]>([]);
    const [itemsLoading, setItemsLoading] = useState(true);
    const [quantities, setQuantities] = useState<Record<string, number>>({});
    const [productImageMap, setProductImageMap] = useState<ProductImageMap>({});
    const cartHydratedRef = useRef(false);

    // Load items ONCE on mount
    useEffect(() => {
        let cancelled = false;

        async function loadData() {
            try {
                // Load images and inventory in parallel
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

                // Process images
                if (imagesRes.ok) {
                    const imagesData = await imagesRes.json();
                    if (Array.isArray(imagesData?.rows)) {
                        const imageMap: ProductImageMap = {};
                        for (const r of imagesData.rows) {
                            if (r?.key && r?.src) {
                                imageMap[String(r.key).toLowerCase()] = {
                                    src: r.src,
                                    label: r.alt || ""
                                };
                            }
                        }
                        setProductImageMap(imageMap);
                    }
                }

                // Process inventory
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
                console.error('Failed to load cart data:', err);
                if (!cancelled) setItemsLoading(false);
            }
        }

        loadData();
        return () => { cancelled = true; };
    }, []);

    // Hydrate cart from localStorage ONCE
    useEffect(() => {
        if (typeof window === "undefined") return;
        cartHydratedRef.current = false;

        try {
            const raw = window.localStorage.getItem(LS_CART_KEY);
            const parsed = raw ? JSON.parse(raw) : null;
            const next: Record<string, number> = {};

            if (parsed && typeof parsed === "object") {
                for (const [k, v] of Object.entries(parsed)) {
                    const n = Number(v);
                    if (Number.isFinite(n) && n > 0) next[k] = Math.floor(n);
                }
            }

            setQuantities(next);
        } catch {
            // Ignore parse errors
        } finally {
            cartHydratedRef.current = true;
        }
    }, []);

    // Write to localStorage when quantities change (after hydration)
    useEffect(() => {
        if (typeof window === "undefined") return;
        if (!cartHydratedRef.current) return;

        requestAnimationFrame(() => {
            try {
                window.localStorage.setItem(LS_CART_KEY, JSON.stringify(quantities));
            } catch {
                // Ignore write errors
            }
        });
    }, [quantities]);

    // Compute derived values
    const cartLines: CartLine[] = useMemo(() => {
        return items
            .map((item) => ({ item, count: quantities[item.id] ?? 0 }))
            .filter((line) => line.count > 0);
    }, [items, quantities]);

    const cartLocationInfo = useMemo(() => getCartLocationInfo(cartLines), [cartLines]);
    const isMixedCart = cartLocationInfo.state === "mixed";
    const totalCartPairs = useMemo(() =>
            cartLines.reduce((sum, l) => sum + l.count, 0),
        [cartLines]
    );

    const waLinkForCart = useMemo(() =>
            buildWhatsAppLink(cartLines, "es"),
        [cartLines]
    );

    const hasCartWhatsApp = !isMixedCart && waLinkForCart !== "#" && cartLines.length > 0;
    const cartLocationSlug = cartLocationInfo.slug ?? (isMixedCart ? "mixed" : "unknown");

    // Actions
    const addToCart = (item: PublicItem) => {
        setQuantities((prev) => ({
            ...prev,
            [item.id]: (prev[item.id] ?? 0) + 1
        }));
    };

    const removeFromCart = (itemId: string) => {
        setQuantities((prev) => {
            const current = prev[itemId] ?? 0;
            if (current <= 1) {
                const { [itemId]: _, ...rest } = prev;
                return rest;
            }
            return { ...prev, [itemId]: current - 1 };
        });
    };

    const removeItem = (itemId: string) => {
        setQuantities((prev) => {
            const { [itemId]: _, ...rest } = prev;
            return rest;
        });
    };

    const clearCart = () => {
        setQuantities({});
    };

    const getPhotoForItem = (item: PublicItem) => {
        const key = `${String(item.model_name || "").trim()}__${String(item.color || "").trim()}`.toLowerCase();
        const photo = productImageMap[key];
        return photo?.src ? photo : { src: PLACEHOLDER_IMAGE, label: item.model_name || "" };
    };

    const value: CartContextValue = {
        quantities,
        cartLines,
        totalCartPairs,
        isMixedCart,
        waLinkForCart,
        hasCartWhatsApp,
        cartLocationSlug,
        items,
        itemsLoading,
        addToCart,
        removeFromCart,
        removeItem,
        clearCart,
        getPhotoForItem,
    };

    return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error("useCart must be used within CartProvider");
    }
    return context;
}