// components/store/CartProvider.tsx
"use client";

import React, { createContext, useContext, useEffect, useState, useMemo, useRef, useCallback } from "react";
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

    // Items (passed from parent, not fetched here)
    items: PublicItem[];
    itemsLoading: boolean;
    productImageMap: ProductImageMap;

    // Actions
    addToCart: (item: PublicItem) => void;
    removeFromCart: (itemId: string) => void;
    removeItem: (itemId: string) => void;
    clearCart: () => void;
    getPhotoForItem: (item: PublicItem) => { src: string; label: string };
}

const CartContext = createContext<CartContextValue | null>(null);

interface CartProviderProps {
    children: React.ReactNode;
    items?: PublicItem[];
    itemsLoading?: boolean;
    productImageMap?: ProductImageMap;
}

export function CartProvider({
                                 children,
                                 items = [],
                                 itemsLoading = false,
                                 productImageMap = {}
                             }: CartProviderProps) {
    const [quantities, setQuantities] = useState<Record<string, number>>({});
    const cartHydratedRef = useRef(false);

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

    // ✅ OPTIMIZATION: Debounce localStorage writes to avoid excessive writes
    const debouncedQuantitiesRef = useRef(quantities);
    const writeTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

    useEffect(() => {
        if (typeof window === "undefined") return;
        if (!cartHydratedRef.current) return;

        // Clear previous timeout
        if (writeTimeoutRef.current) {
            clearTimeout(writeTimeoutRef.current);
        }

        // Debounce writes by 300ms
        writeTimeoutRef.current = setTimeout(() => {
            try {
                window.localStorage.setItem(LS_CART_KEY, JSON.stringify(quantities));
                debouncedQuantitiesRef.current = quantities;
            } catch {
                // Ignore write errors
            }
        }, 300);

        return () => {
            if (writeTimeoutRef.current) {
                clearTimeout(writeTimeoutRef.current);
            }
        };
    }, [quantities]);

    // ✅ OPTIMIZATION: Memoize cart lines computation
    const cartLines: CartLine[] = useMemo(() => {
        return items
            .map((item) => ({ item, count: quantities[item.id] ?? 0 }))
            .filter((line) => line.count > 0);
    }, [items, quantities]);

    // ✅ OPTIMIZATION: Memoize all derived values
    const cartLocationInfo = useMemo(() => getCartLocationInfo(cartLines), [cartLines]);

    const isMixedCart = useMemo(() =>
            cartLocationInfo.state === "mixed",
        [cartLocationInfo.state]
    );

    const totalCartPairs = useMemo(() =>
            cartLines.reduce((sum, l) => sum + l.count, 0),
        [cartLines]
    );

    const waLinkForCart = useMemo(() =>
            buildWhatsAppLink(cartLines, "es"),
        [cartLines]
    );

    const hasCartWhatsApp = useMemo(() =>
            !isMixedCart && waLinkForCart !== "#" && cartLines.length > 0,
        [isMixedCart, waLinkForCart, cartLines.length]
    );

    const cartLocationSlug = useMemo(() =>
            cartLocationInfo.slug ?? (isMixedCart ? "mixed" : "unknown"),
        [cartLocationInfo.slug, isMixedCart]
    );

    // ✅ OPTIMIZATION: Wrap actions in useCallback to prevent unnecessary re-renders
    const addToCart = useCallback((item: PublicItem) => {
        setQuantities((prev) => ({
            ...prev,
            [item.id]: (prev[item.id] ?? 0) + 1
        }));
    }, []);

    const removeFromCart = useCallback((itemId: string) => {
        setQuantities((prev) => {
            const current = prev[itemId] ?? 0;
            if (current <= 1) {
                const { [itemId]: _, ...rest } = prev;
                return rest;
            }
            return { ...prev, [itemId]: current - 1 };
        });
    }, []);

    const removeItem = useCallback((itemId: string) => {
        setQuantities((prev) => {
            const { [itemId]: _, ...rest } = prev;
            return rest;
        });
    }, []);

    const clearCart = useCallback(() => {
        setQuantities({});
    }, []);

    // ✅ OPTIMIZATION: Memoize photo lookup function
    const getPhotoForItem = useCallback((item: PublicItem) => {
        const key = `${String(item.model_name || "").trim()}__${String(item.color || "").trim()}`.toLowerCase();
        const photo = productImageMap[key];
        return photo?.src ? photo : { src: PLACEHOLDER_IMAGE, label: item.model_name || "" };
    }, [productImageMap]);

    // ✅ OPTIMIZATION: Memoize context value to prevent unnecessary re-renders
    const value: CartContextValue = useMemo(() => ({
        quantities,
        cartLines,
        totalCartPairs,
        isMixedCart,
        waLinkForCart,
        hasCartWhatsApp,
        cartLocationSlug,
        items,
        itemsLoading,
        productImageMap,
        addToCart,
        removeFromCart,
        removeItem,
        clearCart,
        getPhotoForItem,
    }), [
        quantities,
        cartLines,
        totalCartPairs,
        isMixedCart,
        waLinkForCart,
        hasCartWhatsApp,
        cartLocationSlug,
        items,
        itemsLoading,
        productImageMap,
        addToCart,
        removeFromCart,
        removeItem,
        clearCart,
        getPhotoForItem,
    ]);

    return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error("useCart must be used within CartProvider");
    }
    return context;
}