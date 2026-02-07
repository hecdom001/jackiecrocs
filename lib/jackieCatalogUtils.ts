// lib/jackieCatalogUtils.ts
export type Lang = "es" | "en";
export type BuyerType = "all" | "men" | "women" | "kids" | "youth";

export type LocationOption = {
    slug: string;
    name: string;
};

export type PublicItem = {
    id: string;
    model_name: string;
    color: string;
    size: string;
    size_id: string;
    location_slug: string;
    location_name: string;
    price_mxn: number;
    availableCount: number;
    created_at: string;
    brand?: string;
    category_id?: string | null;

    // ✅ NEW
    uses_color?: boolean;
    uses_size?: boolean;
};


export type CartLine = {
    item: PublicItem;
    count: number;
};

export type ColorGroup = {
    key: string;
    model_name: string;
    color: string;
    location_slug: string;
    location_name: string;
    price_mxn_min: number;
    price_mxn_max: number;
    latest_created_at: string;
    variants: PublicItem[];
};

export const t = (lang: Lang, es: string, en: string) => (lang === "es" ? es : en);

// ---------------- translations ----------------

export function translateColor(colorEn: string, lang: Lang) {
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
        case "leopard": return "Leopardo";
        case "rust brown": return "Ladrillo";
        case "grey black": return "Gris / Negro";
        case "beige brown": return "Beige / Café";
        case "brown": return "Café";
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

export function translateModelLabel(modelEn: string | null | undefined, lang: Lang) {
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

export function colorLineClass(colorEn: string) {
    switch (colorEn.trim().toLowerCase()) {
        case "black": return "bg-slate-900";
        case "white": return "bg-slate-200";
        case "beige": return "bg-yellow-100";
        case "pink":
        case "baby pink":
        case "rosa pastel": return "bg-pink-200";
        case "red": return "bg-red-500";
        case "lilac":
        case "lila": return "bg-violet-200";
        case "arctic": return "bg-sky-100";
        case "camo":
        case "camuflaje": return "bg-emerald-200";
        case "light pink shimmer":
        case "pink shimmer":
        case "shimmer pink": return "bg-rose-200";
        case "fuchsia": return "bg-pink-200";
        case "rust brown": return "bg-orange-200";
        default: return "bg-slate-300";
    }
}

export function translateCategory(labelOrSlug: string, lang: Lang) {
    if (!labelOrSlug) return "";
    if (lang === "en") return labelOrSlug;

    const key = labelOrSlug.trim().toLowerCase();

    // You can match either the category name OR slug
    switch (key) {
        case "footwear":
        case "shoes":
        case "sneakers":
            return "Calzado";

        case "bags":
        case "handbags":
        case "backpacks":
            return "Bolsas";

        case "perfume":
        case "perfumes":
        case "fragrance":
        case "fragrances":
            return "Perfumes";

        case "accessories":
            return "Accesorios";

        // Drinkware
        case "drinkware":
            return "Bebidas";
        case "bottles":
            return "Botellas de agua";
        case "tumblers":
        case "tumbler":
        case "thermos":
        case "thermoses":
        case "vacuum-flask":
        case "water-bottles":
        case "water-bottle":
            return "Termos";

        // Apparel
        case "apparel":
        case "clothing":
            return "Ropa";
        case "t-shirts":
        case "shirts":
            return "Playeras";
        case "hoodies":
            return "Sudaderas";
        case "hats":
        case "caps":
            return "Gorras";

        // Electronics / misc
        case "electronics":
            return "Electrónicos";
        case "home":
        case "home-goods":
            return "Artículos para el hogar";
        case "sports":
        case "fitness":
            return "Deportes y fitness";

        default:
            // fallback: show as-is
            return labelOrSlug;
    }
}

// ---------------- size helpers ----------------

export function inferSizeCategory(size: string): "adult" | "kids" | "youth" | "cm" | "unknown" {
    const raw = size.trim();
    const s = raw.toUpperCase();
    if (/^M\d+-W\d+$/.test(s)) return "adult";
    if (/^C\d+$/.test(s)) return "kids";
    if (/^J\d+$/.test(s)) return "youth";

    const cmNormalized = raw.replace(/\s+/g, "").toLowerCase();
    if (/^\d+(\.\d+)?(cm)?$/.test(cmNormalized)) return "cm";

    return "unknown";
}

export function sizeRank(size: string): number {
    const cat = inferSizeCategory(size);
    const raw = size.trim();
    const s = raw.toUpperCase();

    if (cat === "kids") {
        const num = parseInt(s.slice(1), 10);
        return 100 + (Number.isNaN(num) ? 0 : num);
    }
    if (cat === "youth") {
        const num = parseInt(s.slice(1), 10);
        return 200 + (Number.isNaN(num) ? 0 : num);
    }
    if (cat === "adult") {
        const match = s.match(/^M(\d+)-W(\d+)$/);
        const men = match ? parseInt(match[1], 10) : 0;
        return 300 + (Number.isNaN(men) ? 0 : men);
    }
    if (cat === "cm") {
        const n = parseFloat(raw.toLowerCase().replace("cm", "").trim());
        return 400 + (Number.isNaN(n) ? 0 : Math.round(n * 10));
    }
    return 1000;
}

export function formatSizeLabel(size: string, lang: Lang, buyerType: BuyerType = "all") {
    const cat = inferSizeCategory(size);
    const raw = size.trim();

    if (cat === "cm") {
        const n = parseFloat(raw.toLowerCase().replace("cm", "").trim());
        const label = Number.isNaN(n) ? raw : `${n} cm`;
        return lang === "es" ? `Talla ${label}` : `Size ${label}`;
    }

    const isKids = raw.startsWith("C");
    const isYouth = raw.startsWith("J");

    if (isKids) return lang === "es" ? `Niños ${raw} (US)` : `Kids ${raw} (US)`;
    if (isYouth) return lang === "es" ? `Juvenil ${raw} (US)` : `Junior ${raw} (US)`;

    if (raw.includes("-")) {
        const [m, w] = raw.split("-");
        const men = m.replace(/M/i, "");
        const women = w.replace(/W/i, "");

        if (lang === "es") {
            if (buyerType === "men") return `Hombre ${men} (US)`;
            if (buyerType === "women") return `Mujer ${women} (US)`;
            return `Hombre ${men} / Mujer ${women} (US)`;
        }

        if (buyerType === "men") return `Men ${men} (US)`;
        if (buyerType === "women") return `Women ${women} (US)`;
        return `${raw} (US)`;
    }

    return `${raw} (US)`;
}

// ---------------- geo + maps ----------------

export const LS_LOCATION_KEY = "jackie_location_filter";

export function geoCityToLocationSlug(cityRaw: string | null): string | null {
    if (!cityRaw) return null;
    const city = cityRaw.trim().toLowerCase();
    if (city.includes("tijuana")) return "tijuana";
    if (city.includes("mexicali")) return "mexicali";
    if (city.includes("hermosillo")) return "hermosillo_sonora";
    return null;
}

export function googleMapsLink(place: string, city: string) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${place} ${city}`)}`;
}

// ---------------- WhatsApp helpers ----------------

export const WHATSAPP_NUMBER_TIJUANA = process.env.NEXT_PUBLIC_WHATSAPP_PHONE_TIJUANA || "";
export const WHATSAPP_NUMBER_MEXICALI = process.env.NEXT_PUBLIC_WHATSAPP_PHONE_MEXICALI || "";
export const WHATSAPP_NUMBER_MEXICALI_B = process.env.NEXT_PUBLIC_WHATSAPP_PHONE_MEXICALI_B || "";
export const WHATSAPP_NUMBER_HERMOSILLO = process.env.NEXT_PUBLIC_WHATSAPP_PHONE_HERMOSILLO || "";

export type CartLocationState = "empty" | "single" | "mixed";

export function getWhatsAppNumberForLocationSlug(slug: string | "all") {
    if (slug === "mexicali") return WHATSAPP_NUMBER_MEXICALI || WHATSAPP_NUMBER_TIJUANA;
    if (slug === "mexicali_b") return WHATSAPP_NUMBER_MEXICALI_B || WHATSAPP_NUMBER_TIJUANA;
    if (slug === "hermosillo_sonora") return WHATSAPP_NUMBER_HERMOSILLO || WHATSAPP_NUMBER_TIJUANA;
    if (slug === "tijuana" || slug === "all") return WHATSAPP_NUMBER_TIJUANA || WHATSAPP_NUMBER_MEXICALI;
    return WHATSAPP_NUMBER_TIJUANA || WHATSAPP_NUMBER_MEXICALI;
}

export function getCartLocationInfo(cart: CartLine[]): { state: CartLocationState; slug: string | null } {
    if (!cart.length) return { state: "empty", slug: null };
    const slugs = new Set(cart.map((line) => line.item.location_slug || "unknown"));
    if (slugs.size === 1) {
        const [slug] = Array.from(slugs);
        return { state: "single", slug };
    }
    return { state: "mixed", slug: null };
}

export function buildWhatsAppSupportLink(
    lang: Lang,
    locationSlug: string | "all"
) {
    const phone = getWhatsAppNumberForLocationSlug(locationSlug);
    if (!phone) return "#";

    const message =
        lang === "es"
            ? "Hola 👋 Vengo de aguuacatito.shop. ¿Me puedes ayudar con una pregunta sobre un producto o un pedido?"
            : "Hi 👋 I'm coming from aguuacatito.shop. Can you help me with a question about a product or an order?";

    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

export function availabilityText(count: number, lang: Lang) {
    if (lang === "es") {
        if (count <= 0) return "Sin stock";
        if (count === 1) return "Último par";
        if (count <= 3) return `Últimos ${count} pares`;
        if (count <= 9) return `Solo ${count} disponibles`;
        return `${count} disponibles`;
    }
    if (count <= 0) return "Out of stock";
    if (count === 1) return "Last pair";
    if (count <= 3) return `Last ${count} pairs`;
    if (count <= 9) return `Only ${count} available`;
    return `${count} available`;
}

export function buildWhatsAppMessage(cart: CartLine[], lang: Lang) {
    if (!cart.length) return "";

    const linesEs = cart.map(({ item, count }, idx) => {
        const colorEs = translateColor(item.color, "es");
        const modelEs =
            translateModelLabel(item.model_name || "Producto", "es") ||
            (item.model_name || "Producto");

        const qtyLine = `Cantidad: ${count} ${count === 1 ? "pieza" : "piezas"}`;
        const locLine = item.location_name ? `Ubicación: ${item.location_name}` : "";

        const colorLine = item.uses_color
            ? `Color: ${colorEs}${item.color ? ` (${item.color})` : ""}\n      `
            : "";

        const sizeLine = item.uses_size
            ? `Talla: ${formatSizeLabel(item.size, lang)}\n      `
            : "";

        return `• ${idx + 1}:
      ${locLine ? `${locLine}\n      ` : ""}Producto: ${modelEs}
      ${colorLine}${sizeLine}Precio: $${item.price_mxn.toFixed(0)} MXN
      ${qtyLine}`;
    });

    const linesEn = cart.map(({ item, count }, idx) => {
        const modelEn =
            translateModelLabel(item.model_name || "Item", "en") ||
            (item.model_name || "Item");

        const qtyLine = `Quantity: ${count} ${count === 1 ? "item" : "items"}`;
        const locLine = item.location_name ? `Location: ${item.location_name}` : "";

        const colorLine = item.uses_color ? `Color: ${item.color}\n      ` : "";
        const sizeLine = item.uses_size ? `Size: ${item.size}\n      ` : "";

        return `• ${idx + 1}:
      ${locLine ? `${locLine}\n      ` : ""}Item: ${modelEn}
      ${colorLine}${sizeLine}Price: $${item.price_mxn.toFixed(0)} MXN
      ${qtyLine}`;
    });

    if (lang === "es") {
        return `Hola 👋 Vengo de aguuacatito.shop y me interesan estos artículos:

${linesEs.join("\n\n")}

¿Siguen disponibles?`;
    }

    return `Hi 👋 I'm coming from aguuacatito.shop and I'm interested in these items:

${linesEn.join("\n\n")}

Are they still available?`;
}

export function buildWhatsAppLink(cart: CartLine[], lang: Lang) {
    const { state, slug } = getCartLocationInfo(cart);
    if (state !== "single" || !slug) return "#";

    const phone = getWhatsAppNumberForLocationSlug(slug);
    if (!phone) return "#";

    const message = buildWhatsAppMessage(cart, lang);
    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}
