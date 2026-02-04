// components/jackie/JackieCatalog.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { StoreFooter } from "./StoreFooter";
import { MobileBottomNav } from "./MobileBottomNav";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";

import {
    LS_LOCATION_KEY,
    geoCityToLocationSlug,
    sizeRank,
    buildWhatsAppLink,
    buildWhatsAppSupportLink,
    getCartLocationInfo,
    t,
    type CartLine,
    type ColorGroup,
    type Lang,
    type LocationOption,
    type PublicItem,
} from "@/lib/jackieCatalogUtils";

import {
    MOBILE_INITIAL_VISIBLE,
    TABLET_INITIAL_VISIBLE,
    DESKTOP_INITIAL_VISIBLE,
    PLACEHOLDER_IMAGE
} from "@/components/jackie/storeConstants";

import { StoreHeader } from "./StoreHeader";
import { FiltersBar } from "./FiltersBar";
import { ProductGrid } from "./ProductGrid";
import { QuickView } from "./QuickView";
import { CartDrawer } from "./CartDrawer";
import { HomeSections } from "./HomeSections";

const VISIBLE_LOCATION_SLUGS = ["tijuana", "mexicali", "hermosillo_sonora"];

const DELIVERY_SPOTS_BY_LOCATION: Record<string, string[]> = {
    tijuana: ["Colectivo Paseo del Rio"],
    mexicali: ["Oaxaca 1820"],
    mexicali_b: ["Jardin Las Palmas"],
    hermosillo_sonora: ["Villa Bonita"],
};

const FILTERED_DELIVERY_SPOTS = Object.fromEntries(
    Object.entries(DELIVERY_SPOTS_BY_LOCATION).filter(([slug]) =>
        VISIBLE_LOCATION_SLUGS.includes(slug)
    )
);

type ProductImageRow = {
    key: string;
    src: string;
    alt: string | null;
    storage_path?: string;
    model?: string;
    color?: string;
};

type CategoryOption = { id: string; name: string; slug: string };

function Chip({
                  children,
                  onRemove,
                  title,
              }: {
    children: React.ReactNode;
    onRemove?: () => void;
    title?: string;
}) {
    return (
        <span
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm"
            title={title}
        >
      <span className="truncate max-w-[220px]">{children}</span>
            {onRemove && (
                <button
                    type="button"
                    onClick={onRemove}
                    className="grid h-5 w-5 place-items-center rounded-full border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    aria-label="Remove filter"
                >
                    ✕
                </button>
            )}
    </span>
    );
}

function colorToSwatch(c: string): string {
    const s = (c || "").toLowerCase();

    // common exact-ish matches
    if (s.includes("black") || s.includes("negro")) return "#111827";
    if (s.includes("white") || s.includes("blanco")) return "#ffffff";
    if (s.includes("grey") || s.includes("gray") || s.includes("gris")) return "#9ca3af";

    if (s.includes("beige")) return "#e7d7b8";
    if (s.includes("brown") || s.includes("cafe") || s.includes("café")) return "#6b4f3a";
    if (s.includes("tan")) return "#d2b48c";
    if (s.includes("camel")) return "#c19a6b";

    if (s.includes("red") || s.includes("rojo")) return "#ef4444";
    if (s.includes("blue") || s.includes("azul")) return "#3b82f6";
    if (s.includes("green") || s.includes("verde")) return "#22c55e";
    if (s.includes("yellow") || s.includes("amarillo")) return "#f59e0b";
    if (s.includes("orange") || s.includes("naranja")) return "#fb923c";
    if (s.includes("purple") || s.includes("morado") || s.includes("lila")) return "#a855f7";

    if (s.includes("pink") || s.includes("rosa") || s.includes("barbie")) return "#ec4899";
    if (s.includes("fuchsia")) return "#d946ef";

    // themed / special
    if (s.includes("camo")) return "#556b2f";
    if (s.includes("arctic")) return "#7dd3fc";
    if (s.includes("crystal")) return "#e5e7eb";
    if (s.includes("gold") || s.includes("dorado")) return "#d4af37";

    // fallback
    return "#e5e7eb";
}

function SwatchDot({ color, active }: { color: string; active?: boolean }) {
    const hex = colorToSwatch(color);
    const isWhite = hex.toLowerCase() === "#ffffff";

    return (
        <span
            className={`h-3.5 w-3.5 rounded-full border ${
                active ? "border-emerald-400" : "border-slate-300"
            } ${isWhite ? "bg-white" : ""}`}
            style={{ backgroundColor: hex }}
        />
    );
}

export function JackieCatalog() {
    const router = useRouter();
    const sp = useSearchParams();

    useEffect(() => {
        const v = sp.get("view");
        const l = sp.get("lang");
        const loc = sp.get("loc");

        if (l === "es" || l === "en") setLang(l);
        if (loc && (loc === "all" || ["tijuana", "mexicali", "hermosillo_sonora"].includes(loc))) {
            setLocationFilter(loc);
            persistLocation(loc);
        }

        if (v === "catalog" || v === "home") {
            setView(v);
            if (v === "catalog") {
                requestAnimationFrame(() =>
                    document.getElementById("product-grid")?.scrollIntoView({ behavior: "smooth", block: "start" })
                );
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);


    const [lang, setLang] = useState<Lang>("es");

    const [items, setItems] = useState<PublicItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    const [locations, setLocations] = useState<LocationOption[]>([]);
    const [locationFilter, setLocationFilter] = useState<string>("all");

    const [categories, setCategories] = useState<CategoryOption[]>([]);
    const [categoryFilter, setCategoryFilter] = useState<string>("all");
    const [brandFilter, setBrandFilter] = useState<string>("all");

    const [sizeFilter, setSizeFilter] = useState<string>("all");
    const [colorFilter, setColorFilter] = useState<string>("all");

    const [query, setQuery] = useState("");
    const [cartOpen, setCartOpen] = useState(false);
    const [quickView, setQuickView] = useState<ColorGroup | null>(null);

    const [quantities, setQuantities] = useState<Record<string, number>>({});

    const [pageSize, setPageSize] = useState<number>(MOBILE_INITIAL_VISIBLE);
    const [visibleCount, setVisibleCount] = useState<number>(MOBILE_INITIAL_VISIBLE);

    const [view, setView] = useState<"home" | "catalog">("home");

    const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

    const [productImageMap, setProductImageMap] = useState<
        Record<string, ProductImageRow>
    >({});

    const [sortBy, setSortBy] = useState<"newest" | "price_low" | "price_high" | "name">("newest");

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const res = await fetch("/api/product-images", { cache: "no-store" });
                if (!res.ok) return;
                const data = await res.json();
                if (!Array.isArray(data?.rows)) return;

                const next: Record<string, ProductImageRow> = {};
                for (const r of data.rows) {
                    if (r?.key && r?.src) next[String(r.key).toLowerCase()] = r;
                }

                if (!cancelled) setProductImageMap(next);
            } catch {
                // ignore
            }
        })();

        return () => {
            cancelled = true;
        };
    }, []);

    const getPhotoByKey = (keyInput: string): { src: string; label: string } => {
        const key = String(keyInput || "").trim().toLowerCase();
        if (!key) return { src: PLACEHOLDER_IMAGE, label: "" };
        const hit = productImageMap[key];
        if (hit?.src) return { src: hit.src, label: "" };
        return { src: PLACEHOLDER_IMAGE, label: "" };
    };

    const getPhotoForGroup = (modelName: string, colorEn: string): { src: string; label: string } => {
        const key = `${String(modelName || "").trim()}__${String(colorEn || "").trim()}`.toLowerCase();
        return getPhotoByKey(key);
    };

    useEffect(() => {
        if (typeof window === "undefined") return;

        const compute = () => {
            const w = window.innerWidth;

            let next: number;
            if (w >= 1024) {
                next = DESKTOP_INITIAL_VISIBLE; // desktop
            } else if (w >= 768) {
                next = TABLET_INITIAL_VISIBLE; // tablet / iPad
            } else {
                next = MOBILE_INITIAL_VISIBLE; // mobile
            }

            setPageSize(next);
        };

        compute();
        window.addEventListener("resize", compute);
        return () => window.removeEventListener("resize", compute);
    }, []);

    useEffect(() => {
        if (typeof window === "undefined") return;

        const saved = window.localStorage.getItem(LS_LOCATION_KEY);
        if (saved && (saved === "all" || VISIBLE_LOCATION_SLUGS.includes(saved))) {
            setLocationFilter(saved);
            return;
        }

        (async () => {
            try {
                const res = await fetch("/api/geo", { cache: "no-store" });
                if (!res.ok) return;

                const geo = await res.json();
                const slug = geoCityToLocationSlug(geo?.city ?? null);
                const next = slug && VISIBLE_LOCATION_SLUGS.includes(slug) ? slug : "all";

                setLocationFilter(next);
                window.localStorage.setItem(LS_LOCATION_KEY, next);
            } catch {
                setLocationFilter("all");
                window.localStorage.setItem(LS_LOCATION_KEY, "all");
            }
        })();
    }, []);

    const persistLocation = (next: string) => {
        if (typeof window === "undefined") return;
        window.localStorage.setItem(LS_LOCATION_KEY, next);
    };

    async function loadLocations() {
        const { data, error } = await supabase
            .from("locations")
            .select("slug, name")
            .order("name", { ascending: true });

        if (error) return;

        const list: LocationOption[] = (data ?? [])
            .filter((r: any) => r?.slug && r?.name)
            .map((r: any) => ({ slug: String(r.slug), name: String(r.name) }));

        setLocations(list);

        setLocationFilter((prev) => {
            if (prev === "all") return prev;
            const ok = list.some((l) => l.slug === prev);
            return ok ? prev : "all";
        });
    }

    async function loadCategories() {
        const { data, error } = await supabase
            .from("categories")
            .select("id, slug, name")
            .order("name", { ascending: true });

        if (error) return;

        setCategories(
            (data ?? []).map((c: any) => ({
                id: String(c.id),
                slug: String(c.slug),
                name: String(c.name),
            }))
        );
    }

    async function loadInventory() {
        setLoading(true);
        setErrorMsg(null);

        const { data, error } = await supabase
            .from("inventory_items")
            .select(
                `
        id,
        size_id,
        location_id,
        price_mxn,
        status,
        created_at,
        models ( name, brand, uses_size, uses_color, category_id ),
        colors ( name_en ),
        sizes ( id, label ),
        locations ( slug, name )
      `
            )
            .eq("status", "available")
            .order("created_at", { ascending: false });

        if (error) {
            setErrorMsg("Error cargando inventario / Error loading inventory");
            setLoading(false);
            return;
        }

        const variantMap = new Map<string, PublicItem>();

        (data ?? []).forEach((row: any) => {
            const model_name: string = row.models?.name ?? "";
            const brand: string = row.models?.brand ?? "";

            const uses_size: boolean = !!row.models?.uses_size;
            const uses_color: boolean = !!row.models?.uses_color;

            const category_id: string | null = row.models?.category_id
                ? String(row.models.category_id)
                : null;

            const color: string = row.colors?.name_en ?? "";
            const size_id: string = row.size_id as string;
            const sizeLabel: string = row.sizes?.label ?? "";
            const locSlug: string = row.locations?.slug ?? "unknown";
            const locName: string = row.locations?.name ?? "";
            const price_mxn: number = Number(row.price_mxn);
            const created_at: string = row.created_at ?? new Date(0).toISOString();

            if (!size_id || !sizeLabel) return;

            const key = `${model_name}__${color}__${size_id}__${price_mxn}__${locSlug}`;
            const existing = variantMap.get(key);

            if (existing) {
                existing.availableCount += 1;
                if (created_at > existing.created_at) existing.created_at = created_at;
            } else {
                variantMap.set(key, {
                    id: row.id as string,
                    model_name,
                    brand,
                    uses_size,
                    uses_color,
                    category_id,
                    color,
                    size: sizeLabel,
                    size_id,
                    location_slug: locSlug,
                    location_name: locName,
                    price_mxn,
                    availableCount: 1,
                    created_at,
                });
            }
        });

        const mapped = Array.from(variantMap.values());
        setItems(mapped);

        setQuantities((prev) => {
            const next: Record<string, number> = {};
            for (const item of mapped) {
                const qty = prev[item.id] ?? 0;
                if (qty > 0) next[item.id] = Math.min(qty, item.availableCount);
            }
            return next;
        });

        setLastUpdated(new Date());
        setLoading(false);
    }

    useEffect(() => {
        loadLocations();
        loadCategories();
        loadInventory();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        const id = setInterval(() => loadInventory(), 3 * 60_000);
        return () => clearInterval(id);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const categoryById = useMemo(() => {
        const m = new Map<string, CategoryOption>();
        for (const c of categories) m.set(c.id, c);
        return m;
    }, [categories]);

    const scopedForOptions = useMemo(() => {
        return items.filter((it) => {
            const byLoc = locationFilter === "all" || it.location_slug === locationFilter;
            const byCategory =
                categoryFilter === "all" || String(it.category_id ?? "") === categoryFilter;
            return byLoc && byCategory;
        });
    }, [items, locationFilter, categoryFilter]);

    const scopedForSizeColor = useMemo(() => {
        return scopedForOptions.filter((it) => {
            const byBrand = brandFilter === "all" || (it.brand ?? "") === brandFilter;
            return byBrand;
        });
    }, [scopedForOptions, brandFilter]);

    const showSize = useMemo(() => scopedForSizeColor.some((it) => !!it.uses_size), [scopedForSizeColor]);
    const showColor = useMemo(() => scopedForSizeColor.some((it) => !!it.uses_color), [scopedForSizeColor]);

    const allBrands = useMemo(() => {
        return Array.from(new Set(scopedForOptions.map((i) => i.brand).filter(Boolean) as string[])).sort((a, b) =>
            a.localeCompare(b)
        );
    }, [scopedForOptions]);

    const categoryOptions = useMemo(() => {
        const ids = Array.from(new Set(items.map((i) => i.category_id).filter(Boolean) as string[]));
        return ids.map((id) => categoryById.get(id)).filter(Boolean) as CategoryOption[];
    }, [items, categoryById]);

    const allSizes = useMemo(() => {
        if (!showSize) return [];
        return Array.from(new Set(scopedForSizeColor.filter((i) => i.uses_size).map((i) => i.size)))
            .filter(Boolean)
            .sort((a, b) => sizeRank(a) - sizeRank(b));
    }, [scopedForSizeColor, showSize]);

    const allColors = useMemo(() => {
        if (!showColor) return [];
        return Array.from(new Set(scopedForSizeColor.filter((i) => i.uses_color).map((i) => i.color)))
            .filter(Boolean)
            .sort((a, b) => a.localeCompare(b));
    }, [scopedForSizeColor, showColor]);

    const inventoryScoped = useMemo(() => {
        return items.filter((item) => {
            const byLoc = locationFilter === "all" || item.location_slug === locationFilter;
            const byCategory =
                categoryFilter === "all" || String(item.category_id ?? "") === categoryFilter;
            const byBrand = brandFilter === "all" || (item.brand ?? "") === brandFilter;
            const byColor = !showColor || colorFilter === "all" || item.color === colorFilter;
            return byLoc && byCategory && byBrand && byColor;
        });
    }, [items, locationFilter, categoryFilter, brandFilter, colorFilter, showColor]);

    useEffect(() => {
        if (!showSize) setSizeFilter("all");
    }, [showSize]);

    useEffect(() => {
        if (brandFilter === "all") return;
        if (!allBrands.includes(brandFilter)) setBrandFilter("all");
    }, [allBrands, brandFilter]);

    useEffect(() => {
        if (!showColor) setColorFilter("all");
    }, [showColor]);

    useEffect(() => {
        setSizeFilter("all");
        setColorFilter("all");
    }, [locationFilter, categoryFilter, brandFilter]);

    useEffect(() => {
        setVisibleCount(pageSize);
    }, [pageSize, query, locationFilter, categoryFilter, brandFilter, sizeFilter, colorFilter, items.length]);

    useEffect(() => {
        if (!query.trim()) return;
        setView("catalog");
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [query]);

    useEffect(() => {
        // only close on mobile
        if (typeof window === "undefined") return;
        if (window.innerWidth >= 1024) return;
        setMobileFiltersOpen(false);
    }, [
        locationFilter,
        categoryFilter,
        brandFilter,
        sizeFilter,
        colorFilter,
    ]);

    useEffect(() => {
        if (typeof document === "undefined") return;
        document.body.style.overflow = mobileFiltersOpen ? "hidden" : "";
        return () => {
            document.body.style.overflow = "";
        };
    }, [mobileFiltersOpen]);

    const selectedLocationName = useMemo(() => {
        if (locationFilter === "all") return lang === "es" ? "Todas" : "All";
        return locations.find((l) => l.slug === locationFilter)?.name || locationFilter;
    }, [locationFilter, locations, lang]);

    const groupsFiltered = useMemo(() => {
        const map = new Map<string, ColorGroup>();

        for (const item of inventoryScoped) {
            const key = `${item.location_slug}__${item.model_name}__${item.color}`;
            const existing = map.get(key);

            if (!existing) {
                map.set(key, {
                    key,
                    model_name: item.model_name,
                    color: item.color,
                    location_slug: item.location_slug,
                    location_name: item.location_name,
                    price_mxn_min: item.price_mxn,
                    price_mxn_max: item.price_mxn,
                    latest_created_at: item.created_at,
                    variants: [item],
                });
            } else {
                existing.variants.push(item);
                existing.price_mxn_min = Math.min(existing.price_mxn_min, item.price_mxn);
                existing.price_mxn_max = Math.max(existing.price_mxn_max, item.price_mxn);
                if (item.created_at > existing.latest_created_at) existing.latest_created_at = item.created_at;
            }
        }

        let list = Array.from(map.values());

        if (showSize && sizeFilter !== "all") {
            list = list.filter((g) =>
                g.variants.some((v: any) => v.uses_size && v.size === sizeFilter)
            );
        }

        const q = query.trim().toLowerCase();
        if (q) {
            list = list.filter((g) => {
                const model = (g.model_name || "").toLowerCase();
                const color = (g.color || "").toLowerCase();
                const loc = (g.location_name || "").toLowerCase();
                return model.includes(q) || color.includes(q) || loc.includes(q);
            });
        }

        list.sort((a, b) => {
            if (sortBy === "price_low") return a.price_mxn_min - b.price_mxn_min;
            if (sortBy === "price_high") return b.price_mxn_min - a.price_mxn_min;
            if (sortBy === "name") return (a.model_name || "").localeCompare(b.model_name || "");
            // newest (default)
            const tt = b.latest_created_at.localeCompare(a.latest_created_at);
            if (tt !== 0) return tt;
            const c = a.color.localeCompare(b.color);
            if (c !== 0) return c;
            const m = (a.model_name || "").localeCompare(b.model_name || "");
            if (m !== 0) return m;
            return a.price_mxn_min - b.price_mxn_min;
        });


        return list;
    }, [inventoryScoped, showSize, sizeFilter, query, sortBy]);

    const totalPairsFiltered = useMemo(() => {
        return groupsFiltered.reduce(
            (sum, g) => sum + g.variants.reduce((s: number, v: any) => s + v.availableCount, 0),
            0
        );
    }, [groupsFiltered]);

    const limitedGroups = useMemo(() => groupsFiltered.slice(0, visibleCount), [groupsFiltered, visibleCount]);
    const showingCount = Math.min(visibleCount, groupsFiltered.length);

    const cartLines: CartLine[] = useMemo(() => {
        return items
            .map((item) => ({ item, count: quantities[item.id] ?? 0 }))
            .filter((line) => line.count > 0);
    }, [items, quantities]);

    const cartLocationInfo = getCartLocationInfo(cartLines);
    const isMixedCart = cartLocationInfo.state === "mixed";

    const waLinkForCart = buildWhatsAppLink(cartLines, lang);
    const hasCartWhatsApp = !isMixedCart && waLinkForCart !== "#" && cartLines.length > 0;

    const supportWaLink = buildWhatsAppSupportLink(lang, locationFilter);
    const hasSupportWhatsApp = supportWaLink !== "#";

    const totalCartPairs = cartLines.reduce((sum, l) => sum + l.count, 0);

    const formattedLastUpdated =
        lastUpdated?.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) ?? null;

    const handleAddToCart = (item: PublicItem) => {
        setQuantities((prev) => {
            const current = prev[item.id] ?? 0;
            // @ts-ignore - item has availableCount in runtime
            if (current >= (item as any).availableCount) return prev;
            return { ...prev, [item.id]: current + 1 };
        });
    };

    const handleRemoveFromCart = (itemId: string) => {
        setQuantities((prev) => {
            const current = prev[itemId] ?? 0;
            if (current <= 1) {
                const { [itemId]: _, ...rest } = prev;
                return rest;
            }
            return { ...prev, [itemId]: current - 1 };
        });
    };

    const removeItemFromCart = (itemId: string) => {
        setQuantities((prev) => {
            const { [itemId]: _, ...rest } = prev;
            return rest;
        });
    };

    const clearCart = () => setQuantities({});

    const pickupGroupedSpots: Record<string, string[]> =
        locationFilter === "all"
            ? FILTERED_DELIVERY_SPOTS
            : { [locationFilter]: FILTERED_DELIVERY_SPOTS[locationFilter] ?? [] };

    const hasAnyPickupSpots = Object.values(pickupGroupedSpots).some((list) => list.length > 0);

    const featuredGroups = useMemo(() => groupsFiltered.slice(0, 30), [groupsFiltered]);
    const quickColorChips = useMemo(() => allColors.slice(0, 10), [allColors]);

    const clearAllFilters = () => {
        setLocationFilter("all");
        persistLocation("all");
        setCategoryFilter("all");
        setBrandFilter("all");
        setSizeFilter("all");
        setColorFilter("all");
        setQuery("");
    };

    const anyActiveFilters =
        locationFilter !== "all" ||
        categoryFilter !== "all" ||
        brandFilter !== "all" ||
        (showSize && sizeFilter !== "all") ||
        (showColor && colorFilter !== "all") ||
        !!query.trim();

    const activeFiltersCount =
        (locationFilter !== "all" ? 1 : 0) +
        (categoryFilter !== "all" ? 1 : 0) +
        (brandFilter !== "all" ? 1 : 0) +
        (showSize && sizeFilter !== "all" ? 1 : 0) +
        (showColor && colorFilter !== "all" ? 1 : 0) +
        (query.trim() ? 1 : 0);


    const categoryNameById = useMemo(() => {
        const m: Record<string, string> = {};
        for (const c of categoryOptions) m[c.id] = c.name;
        return m;
    }, [categoryOptions]);

    const desktopFilterChips = useMemo(() => {
        const chips: { key: string; label: React.ReactNode; onRemove: () => void }[] = [];

        if (locationFilter !== "all") {
            chips.push({
                key: "loc",
                label: <>📍 {selectedLocationName}</>,
                onRemove: () => {
                    setLocationFilter("all");
                    persistLocation("all");
                },
            });
        }

        if (categoryFilter !== "all") {
            const catName =
                categoryOptions.find((c) => c.id === categoryFilter)?.name ?? categoryFilter;

            chips.push({
                key: "cat",
                label: <>🗂️ {catName}</>,
                onRemove: () => setCategoryFilter("all"),
            });
        }

        if (brandFilter !== "all") {
            chips.push({
                key: "brand",
                label: <>🏷️ {brandFilter}</>,
                onRemove: () => setBrandFilter("all"),
            });
        }

        if (showSize && sizeFilter !== "all") {
            chips.push({
                key: "size",
                label: <>📏 {sizeFilter}</>,
                onRemove: () => setSizeFilter("all"),
            });
        }

        if (showColor && colorFilter !== "all") {
            chips.push({
                key: "color",
                label: <>🎨 {colorFilter}</>,
                onRemove: () => setColorFilter("all"),
            });
        }

        if (query.trim()) {
            chips.push({
                key: "q",
                label: <>🔎 {query.trim()}</>,
                onRemove: () => setQuery(""),
            });
        }

        return chips;
    }, [
        locationFilter,
        categoryFilter,
        brandFilter,
        sizeFilter,
        colorFilter,
        query,
        showSize,
        showColor,
        selectedLocationName,
        categoryOptions,
    ]);


    return (
        <div className="min-h-screen bg-white text-slate-900">
            {/* wider desktop container */}
            <div className="mx-auto w-full max-w-none px-3 sm:px-6 lg:px-10 2xl:px-14">
            <StoreHeader
                    lang={lang}
                    setLang={setLang}
                    query={query}
                    setQuery={setQuery}
                    totalCartPairs={totalCartPairs}
                    onCartClick={() => setCartOpen(true)}
                    onHomeClick={() => {
                        setView("home");
                        if (typeof window !== "undefined") {
                            window.scrollTo({ top: 0, behavior: "smooth" });
                        }
                    }}
                    view={view}
                    categories={categoryOptions.map((c) => ({ id: c.id, name: c.name || c.slug }))}
                    categoryFilter={categoryFilter}
                    onSelectCategory={(id) => {
                        setCategoryFilter(id);
                        setView("catalog");
                        requestAnimationFrame(() => {
                            const el = document.getElementById("product-grid");
                            el?.scrollIntoView({ behavior: "smooth", block: "start" });
                        });
                    }}
                    locationSlug={locationFilter}   // ✅ add this
                />

                {view === "home" && (
                    <div className="pb-10">
                        {/* Full-bleed area (no max-w, no big outer card) */}
                        <div className="mt-4 w-full">
                            <HomeSections
                                lang={lang}
                                locations={locations}
                                pickupGroupedSpots={pickupGroupedSpots}
                                hasAnyPickupSpots={hasAnyPickupSpots}
                                supportWaLink={supportWaLink}
                                hasSupportWhatsApp={hasSupportWhatsApp}
                                featuredGroups={featuredGroups}
                                quickColorChips={quickColorChips}
                                getPhotoForGroup={getPhotoForGroup}
                                locationFilter={locationFilter}
                                onSelectLocation={(slug) => {
                                    setLocationFilter(slug);
                                    persistLocation(slug);
                                }}
                                visibleLocationSlugs={VISIBLE_LOCATION_SLUGS}
                                onBrowseCatalog={() => {
                                    setView("catalog");
                                    requestAnimationFrame(() => {
                                        const el = document.getElementById("product-grid");
                                        el?.scrollIntoView({ behavior: "smooth", block: "start" });
                                    });
                                }}
                                onSelectColor={(c) => {
                                    setColorFilter(c);
                                    setView("catalog");
                                    requestAnimationFrame(() => {
                                        const el = document.getElementById("product-grid");
                                        el?.scrollIntoView({ behavior: "smooth", block: "start" });
                                    });
                                }}
                                totalCartPairs={totalCartPairs}
                                onOpenCart={() => setCartOpen(true)}
                                isMixedCart={isMixedCart}
                                categoryNameById={categoryNameById}
                            />
                        </div>
                    </div>
                )}

                {view === "catalog" && (
                    <div className="pb-10">
                        {/* Mobile controls (collapsed filters) */}
                        <div className="lg:hidden mt-4">
                            <div className="flex items-center justify-between gap-2">
                                <button
                                    type="button"
                                    onClick={() => setMobileFiltersOpen(true)}
                                    className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-[12px] font-extrabold text-slate-800 shadow-sm"
                                >
                                    ⚙️ {t(lang, "Filtros", "Filters")}
                                    {activeFiltersCount > 0 ? (
                                        <span className="ml-1 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[11px] font-extrabold text-emerald-800">
                                        {activeFiltersCount}
                                      </span>
                                    ) : null}

                                </button>

                                {/* Sort stays visible */}
                                <div className="flex items-center gap-2">
                                      <span className="text-xs font-semibold text-slate-600 whitespace-nowrap">
                                        {t(lang, "Ordenar", "Sort")}
                                      </span>
                                    <select
                                        value={sortBy}
                                        onChange={(e) => setSortBy(e.target.value as any)}
                                        className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-[12px] font-semibold text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-200"
                                    >
                                        <option value="newest">{t(lang, "Más nuevo", "Newest")}</option>
                                        <option value="price_low">{t(lang, "Precio: menor", "Price: low")}</option>
                                        <option value="price_high">{t(lang, "Precio: mayor", "Price: high")}</option>
                                        <option value="name">{t(lang, "Nombre", "Name")}</option>
                                    </select>
                                </div>
                            </div>

                            {/* Bottom sheet modal */}
                            {mobileFiltersOpen && (
                                <div className="fixed inset-0 z-[70] lg:hidden">
                                    {/* Backdrop */}
                                    <button
                                        type="button"
                                        className="absolute inset-0 bg-black/40"
                                        onClick={() => setMobileFiltersOpen(false)}
                                        aria-label={t(lang, "Cerrar", "Close")}
                                    />

                                    {/* Bottom sheet */}
                                    <div className="absolute inset-x-0 bottom-0">
                                        <div className="mx-auto w-full max-w-md md:max-w-2xl max-h-[85vh] overflow-auto rounded-t-3xl bg-white border border-slate-200 shadow-2xl">
                                            {/* Header */}
                                            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                                                <p className="text-sm font-extrabold">{t(lang, "Filtros", "Filters")}</p>

                                                <div className="flex items-center gap-2">
                                                    {anyActiveFilters ? (
                                                        <button
                                                            type="button"
                                                            onClick={clearAllFilters}
                                                            className="text-xs font-extrabold text-emerald-700 hover:underline"
                                                        >
                                                            {t(lang, "Limpiar", "Clear")}
                                                        </button>
                                                    ) : null}

                                                    <button
                                                        type="button"
                                                        className="h-9 w-9 rounded-full border border-slate-200 bg-white"
                                                        onClick={() => setMobileFiltersOpen(false)}
                                                        aria-label={t(lang, "Cerrar", "Close")}
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Content */}
                                            <div className="p-4">
                                                <FiltersBar
                                                    lang={lang}
                                                    loading={loading}
                                                    locationFilter={locationFilter}
                                                    setLocationFilter={setLocationFilter}
                                                    onPersistLocation={persistLocation}
                                                    locations={locations}
                                                    visibleLocationSlugs={VISIBLE_LOCATION_SLUGS}
                                                    categoryFilter={categoryFilter}
                                                    setCategoryFilter={setCategoryFilter}
                                                    categories={categoryOptions}
                                                    brandFilter={brandFilter}
                                                    setBrandFilter={setBrandFilter}
                                                    brands={allBrands}
                                                    showSize={showSize}
                                                    showColor={showColor}
                                                    sizeFilter={sizeFilter}
                                                    setSizeFilter={setSizeFilter}
                                                    allSizes={allSizes}
                                                    colorFilter={colorFilter}
                                                    setColorFilter={setColorFilter}
                                                    allColors={allColors}
                                                    totalPairsFiltered={totalPairsFiltered}
                                                    formattedLastUpdated={formattedLastUpdated}
                                                    onRefresh={loadInventory}
                                                />

                                                {/* NOTE: Popular colors stays hidden on mobile because we removed that section */}
                                            </div>

                                            {/* Footer CTA */}
                                            <div className="p-4 border-t border-slate-100">
                                                <button
                                                    type="button"
                                                    onClick={() => setMobileFiltersOpen(false)}
                                                    className="w-full rounded-full bg-emerald-600 text-white py-3 text-sm font-extrabold hover:bg-emerald-700"
                                                >
                                                    ✅ {t(lang, "Ver resultados", "See results")}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                        </div>


                        {/* Desktop layout */}
                        <div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-[340px_minmax(0,1fr)]">
                            <aside className="hidden lg:block">
                                <div className="sticky top-24">
                                    <div className="rounded-[28px] border border-slate-200 bg-white p-4">
                                        {/* Header */}
                                        <div className="flex items-center justify-between">
                                            <div className="text-sm font-extrabold tracking-tight text-slate-900">
                                                {t(lang, "Filtros", "Filters")}
                                            </div>

                                            {anyActiveFilters ? (
                                                <button
                                                    type="button"
                                                    onClick={clearAllFilters}
                                                    className="text-xs font-semibold text-emerald-700 hover:underline"
                                                >
                                                    {t(lang, "Limpiar", "Clear")}
                                                </button>
                                            ) : null}
                                        </div>

                                        {/* Filters (hide the dropdown color on desktop to avoid duplication) */}
                                        <div className="mt-3">
                                            <FiltersBar
                                                variant="flat"
                                                lang={lang}
                                                loading={loading}
                                                locationFilter={locationFilter}
                                                setLocationFilter={(v) => {
                                                    setLocationFilter(v);
                                                    persistLocation(v);
                                                }}
                                                onPersistLocation={persistLocation}
                                                locations={locations}
                                                visibleLocationSlugs={VISIBLE_LOCATION_SLUGS}
                                                categoryFilter={categoryFilter}
                                                setCategoryFilter={setCategoryFilter}
                                                categories={categoryOptions}
                                                brandFilter={brandFilter}
                                                setBrandFilter={setBrandFilter}
                                                brands={allBrands}
                                                showSize={showSize}
                                                showColor={false} // ✅ desktop: we use chips/swatches below instead
                                                sizeFilter={sizeFilter}
                                                setSizeFilter={setSizeFilter}
                                                allSizes={allSizes}
                                                colorFilter={colorFilter}
                                                setColorFilter={setColorFilter}
                                                allColors={allColors}
                                                totalPairsFiltered={totalPairsFiltered}
                                                formattedLastUpdated={formattedLastUpdated}
                                                onRefresh={loadInventory}
                                            />
                                        </div>

                                        {/* Collapsible Colors */}
                                        {showColor && allColors.length > 0 && (
                                            <div className="mt-4 border-t border-slate-200 pt-4">
                                                <details className="group" open>
                                                    <summary className="flex cursor-pointer list-none items-center justify-between gap-2">
                                                        <div className="text-xs font-extrabold text-slate-900">
                                                            {t(lang, "Colores", "Colors")}
                                                        </div>
                                                        <div className="text-xs text-slate-500 group-open:hidden">+</div>
                                                        <div className="text-xs text-slate-500 hidden group-open:block">–</div>
                                                    </summary>

                                                    <div className="mt-3 flex flex-wrap gap-2">
                                                        {allColors.slice(0, 24).map((c) => {
                                                            const active = colorFilter === c;
                                                            return (
                                                                <button
                                                                    key={c}
                                                                    type="button"
                                                                    onClick={() => setColorFilter(active ? "all" : c)}
                                                                    className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold transition ${
                                                                        active
                                                                            ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                                                                            : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
                                                                    }`}
                                                                    title={c}
                                                                >
                                                                    <SwatchDot color={c} active={active} />
                                                                    <span className="truncate max-w-[160px]">{c}</span>
                                                                </button>
                                                            );
                                                        })}
                                                    </div>

                                                    {colorFilter !== "all" && (
                                                        <button
                                                            type="button"
                                                            onClick={() => setColorFilter("all")}
                                                            className="mt-3 inline-flex text-xs font-semibold text-emerald-700 hover:underline"
                                                        >
                                                            {t(lang, "Quitar color", "Remove color")}
                                                        </button>
                                                    )}
                                                </details>
                                            </div>
                                        )}

                                        {/* Support row (no extra card) */}
                                        <div className="mt-4 border-t border-slate-200 pt-4">
                                            <div className="flex items-center justify-between gap-3">
                                                <div className="text-xs text-slate-600">
                                                    {t(lang, "¿Necesitas ayuda?", "Need help?")}
                                                </div>
                                                <a
                                                    href={supportWaLink}
                                                    className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-4 py-2 text-xs font-extrabold text-white hover:bg-emerald-700"
                                                >
                                                    WhatsApp
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </aside>


                            <main className="min-w-0">
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    {/* Left: active chips */}
                                    <div className="hidden lg:flex flex-wrap items-center gap-2 min-w-0">
                                        {desktopFilterChips.map((c) => (
                                            <Chip key={c.key} onRemove={c.onRemove}>
                                                {c.label}
                                            </Chip>
                                        ))}

                                        {desktopFilterChips.length > 0 && (
                                            <button
                                                type="button"
                                                onClick={clearAllFilters}
                                                className="ml-1 inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-extrabold text-slate-700 hover:bg-slate-50"
                                            >
                                                {t(lang, "Limpiar todo", "Clear all")}
                                            </button>
                                        )}
                                    </div>

                                    {/* Right: sort */}
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-semibold text-slate-600 whitespace-nowrap">
                                          {t(lang, "Ordenar por", "Sort by")}
                                        </span>

                                        <select
                                            value={sortBy}
                                            onChange={(e) => setSortBy(e.target.value as any)}
                                            className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-[12px] font-semibold text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-200"
                                        >
                                            <option value="newest">{t(lang, "Más nuevo", "Newest")}</option>
                                            <option value="price_low">{t(lang, "Precio: menor", "Price: low")}</option>
                                            <option value="price_high">{t(lang, "Precio: mayor", "Price: high")}</option>
                                            <option value="name">{t(lang, "Nombre", "Name")}</option>
                                        </select>
                                    </div>
                                </div>




                                <div id="product-grid" className="scroll-mt-24 mt-4">
                                    <ProductGrid
                                        lang={lang}
                                        loading={loading}
                                        errorMsg={errorMsg}
                                        groupsFiltered={groupsFiltered}
                                        limitedGroups={limitedGroups}
                                        showingCount={showingCount}
                                        canShowMore={groupsFiltered.length > limitedGroups.length}
                                        onShowMore={() => setVisibleCount((p) => p + pageSize)}
                                        getPhotoForColor={(key) => getPhotoByKey(key)}
                                        onQuickView={(g) => setQuickView(g)}
                                    />
                                </div>
                            </main>
                        </div>
                    </div>
                )}

                <StoreFooter
                    lang={lang}
                    supportWaLink={supportWaLink}
                />

                <MobileBottomNav
                    show={!cartOpen && !quickView}
                    view={view}
                    lang={lang}
                    cartCount={totalCartPairs}
                    onHome={() => {
                        setView("home");
                        window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    onCatalog={() => {
                        setView("catalog");
                        requestAnimationFrame(() =>
                            document.getElementById("product-grid")?.scrollIntoView({ behavior: "smooth", block: "start" })
                        );
                    }}
                    onCart={() => setCartOpen(true)}
                    onHelp={() => router.push(`/help?lang=${lang}&loc=${locationFilter}`)}
                />


                <QuickView
                    open={!!quickView}
                    group={quickView}
                    lang={lang}
                    onClose={() => setQuickView(null)}
                    quantities={quantities}
                    sizeFilter={sizeFilter}
                    onAdd={handleAddToCart}
                    onRemove={handleRemoveFromCart}
                    showSize={showSize}
                    showColor={showColor}
                />

                <CartDrawer
                    open={cartOpen}
                    onClose={() => setCartOpen(false)}
                    lang={lang}
                    cartLines={cartLines}
                    totalCartPairs={totalCartPairs}
                    isMixedCart={isMixedCart}
                    waLinkForCart={buildWhatsAppLink(cartLines, lang)}
                    hasCartWhatsApp={hasCartWhatsApp}
                    clearCart={clearCart}
                    onAdd={handleAddToCart}
                    onRemove={handleRemoveFromCart}
                    onRemoveItem={removeItemFromCart}
                    cartLocationSlug={cartLocationInfo.slug ?? (isMixedCart ? "mixed" : "unknown")}

                    getPhotoForCartItem={(item) => {
                        const key = `${String(item.model_name || "").trim()}__${String(item.color || "").trim()}`.toLowerCase();
                        return getPhotoByKey(key); // uses your DB-first image map + placeholder fallback
                    }}
                />
            </div>
        </div>
    );
}
