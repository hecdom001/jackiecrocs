// /components/store/storeClient.ts
"use client";

import { LS_CART_KEY } from "./storeConstants";

export type CartQuantities = Record<string, number>;

export function safeParseCart(raw: string | null): CartQuantities {
    if (!raw) return {};
    try {
        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== "object") return {};
        const out: CartQuantities = {};
        for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
            const n = Number(v);
            if (Number.isFinite(n) && n > 0) out[String(k)] = Math.floor(n);
        }
        return out;
    } catch {
        return {};
    }
}

export function readCart(): CartQuantities {
    if (typeof window === "undefined") return {};
    return safeParseCart(window.localStorage.getItem(LS_CART_KEY));
}

export function writeCart(next: CartQuantities) {
    if (typeof window === "undefined") return;
    try {
        window.localStorage.setItem(LS_CART_KEY, JSON.stringify(next));
    } catch {
        // ignore
    }
}

export function clearCartStorage() {
    if (typeof window === "undefined") return;
    try {
        window.localStorage.removeItem(LS_CART_KEY);
    } catch {
        // ignore
    }
}

export function countCartPairs(cart: CartQuantities): number {
    return Object.values(cart).reduce((sum, n) => sum + (Number(n) || 0), 0);
}

/**
 * Subscribe to cart changes.
 * - Fires when localStorage changes in another tab (storage event)
 * - Also exposes a manual "notifyCartUpdated" helper for same-tab updates later
 */
export function subscribeCart(onChange: (cart: CartQuantities) => void) {
    if (typeof window === "undefined") return () => {};

    const emit = () => onChange(readCart());

    // Other tabs/windows
    const onStorage = (e: StorageEvent) => {
        if (e.key === LS_CART_KEY) emit();
    };

    window.addEventListener("storage", onStorage);

    // Optional custom event for same-tab updates (we’ll use this in Catalog next step)
    const onCustom = () => emit();
    window.addEventListener("jackywear:cart", onCustom as EventListener);

    // initial
    emit();

    return () => {
        window.removeEventListener("storage", onStorage);
        window.removeEventListener("jackywear:cart", onCustom as EventListener);
    };
}

export function notifyCartUpdated() {
    if (typeof window === "undefined") return;
    window.dispatchEvent(new Event("jackywear:cart"));
}
