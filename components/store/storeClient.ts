// /components/store/storeClient.ts
"use client";

import { LS_CART_KEY } from "./storeConstants";

export type CartQuantities = Record<string, number>;

/** Custom events (same-tab) */
const CART_EVENT = "aguuacatito:cart";
const OPEN_CART_EVENT = "aguuacatito:openCart";

/** sessionStorage keys (per-tab, clears on tab close) */
const OPEN_CART_KEY = "aguuacatito:openCartFlag";
const CART_RETURN_TO_KEY = "aguuacatito:cartReturnToHref";

/* ----------------------------- CART STORAGE ----------------------------- */

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
 * - Also fires for same-tab updates via notifyCartUpdated()
 */
export function subscribeCart(onChange: (cart: CartQuantities) => void) {
    if (typeof window === "undefined") return () => {};

    const emit = () => onChange(readCart());

    const onStorage = (e: StorageEvent) => {
        if (e.key === LS_CART_KEY) emit();
    };
    window.addEventListener("storage", onStorage);

    const onCustom = () => emit();
    window.addEventListener(CART_EVENT, onCustom as EventListener);

    // initial
    emit();

    return () => {
        window.removeEventListener("storage", onStorage);
        window.removeEventListener(CART_EVENT, onCustom as EventListener);
    };
}

export function notifyCartUpdated() {
    if (typeof window === "undefined") return;
    window.dispatchEvent(new Event(CART_EVENT));
}

/* ------------------------ OPEN CART + RETURN-TO ------------------------- */

/**
 * Call this from Help (or anywhere) to:
 * 1) tell Catalog to open the cart when it loads
 * 2) remember where to return after the cart is closed
 */
export function requestOpenCart(returnToHref?: string) {
    if (typeof window === "undefined") return;

    try {
        window.sessionStorage.setItem(OPEN_CART_KEY, "1");
        if (returnToHref) window.sessionStorage.setItem(CART_RETURN_TO_KEY, returnToHref);
    } catch {
        // ignore
    }

    // Also broadcast same-tab in case Catalog is already mounted
    window.dispatchEvent(new Event(OPEN_CART_EVENT));
}

/**
 * Catalog calls this ONCE on mount.
 * If true, it should open the cart.
 */
export function consumeOpenCartRequest(): boolean {
    if (typeof window === "undefined") return false;

    try {
        const v = window.sessionStorage.getItem(OPEN_CART_KEY);
        if (v === "1") {
            window.sessionStorage.removeItem(OPEN_CART_KEY);
            return true;
        }
    } catch {
        // ignore
    }
    return false;
}

/**
 * If the cart was opened from Help, this returns the href to go back to,
 * and clears it.
 */
export function popCartReturnTo(): string | null {
    if (typeof window === "undefined") return null;

    try {
        const href = window.sessionStorage.getItem(CART_RETURN_TO_KEY);
        if (href) {
            window.sessionStorage.removeItem(CART_RETURN_TO_KEY);
            return href;
        }
    } catch {
        // ignore
    }
    return null;
}

/**
 * Optional: if Catalog is already mounted, this lets it react immediately.
 */
export function subscribeOpenCart(onOpen: () => void) {
    if (typeof window === "undefined") return () => {};

    const handler = () => onOpen();
    window.addEventListener(OPEN_CART_EVENT, handler as EventListener);

    return () => {
        window.removeEventListener(OPEN_CART_EVENT, handler as EventListener);
    };
}
