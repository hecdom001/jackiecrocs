// components/jackie/storeConstants.ts

export const VISIBLE_LOCATION_SLUGS = ["tijuana", "mexicali", "hermosillo_sonora"] as const;

export type LocationSlug = (typeof VISIBLE_LOCATION_SLUGS)[number];

export function isLocationSlug(v: string): v is LocationSlug {
    return (VISIBLE_LOCATION_SLUGS as readonly string[]).includes(v);
}
export type PickupSpot = {
    name: string;
    addressHint?: string;
};

export const PICKUP_SPOTS_BY_LOCATION: Record<LocationSlug, PickupSpot[]> = {
    tijuana: [{ name: "Colectivo Paseo del Rio", addressHint: "Tijuana" }],
    mexicali: [{ name: "Oaxaca 1820", addressHint: "Mexicali" }],
    hermosillo_sonora: [{ name: "Villa Bonita", addressHint: "Hermosillo" }],
};

export const MEX_BANK_INFO = {
    bankName: "Santander",
    accountName: "Jackeline Monge",
    accountNumber: "0140 2026 0401 0725 79",
} as const;

export const MOBILE_INITIAL_VISIBLE = 8;
export const TABLET_INITIAL_VISIBLE = 9;
export const DESKTOP_INITIAL_VISIBLE = 20;

export const SUPABASE_IMAGE_BASE =
    "https://axrfkuupjoddsoswowac.supabase.co/storage/v1/object/public/product-images";

export const PLACEHOLDER_IMAGE = `${SUPABASE_IMAGE_BASE}/placeholderCominSoon.png`;
