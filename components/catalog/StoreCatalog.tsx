// components/catalog/StoreCatalog.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useSearchParams, useRouter } from "next/navigation";
import { CartProvider, useCart } from "@/components/store/CartProvider";

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
    type PublicItem, translateCategory, translateColor,
} from "@/lib/jackieCatalogUtils";

import {
    LS_CART_KEY,
    MOBILE_INITIAL_VISIBLE,
    TABLET_INITIAL_VISIBLE,
    DESKTOP_INITIAL_VISIBLE,
    PLACEHOLDER_IMAGE,
    VISIBLE_LOCATION_SLUGS,
    pickupSpotsByLocation,
} from "@/components/store/storeConstants";

import { StoreHeader } from "@/components/layout/StoreHeader";
import { StoreFooter } from "@/components/layout/StoreFooter";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";

import { FiltersBar } from "./FiltersBar";
import { ProductGrid } from "./ProductGrid";
import { QuickView } from "./QuickView";
import { CartDrawer } from "./CartDrawer";
import { HomeSections } from "./HomeSections";

import {
    subscribeOpenCart,
    consumeOpenCartRequest,
    popCartReturnTo,
} from "@/components/store/storeClient";

const FILTERED_DELIVERY_SPOTS = Object.fromEntries(
    Object.entries(pickupSpotsByLocation).filter(([slug]) =>
        (VISIBLE_LOCATION_SLUGS as readonly string[]).includes(slug)
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

type ProductImageMap = Record<string, { src: string; label: string }>;

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

// ✅ OPTIMIZATION: Create lookup map for O(1) color matching instead of multiple includes() calls
const COLOR_KEYWORDS = new Map<string, string>([
    ['black', '#111827'],
    ['negro', '#111827'],
    ['white', '#ffffff'],
    ['blanco', '#ffffff'],
    ['grey', '#9ca3af'],
    ['gray', '#9ca3af'],
    ['gris', '#9ca3af'],
    ['beige', '#e7d7b8'],
    ['brown', '#6b4f3a'],
    ['cafe', '#6b4f3a'],
    ['café', '#6b4f3a'],
    ['tan', '#d2b48c'],
    ['camel', '#c19a6b'],
    ['red', '#ef4444'],
    ['rojo', '#ef4444'],
    ['blue', '#3b82f6'],
    ['azul', '#3b82f6'],
    ['green', '#22c55e'],
    ['verde', '#22c55e'],
    ['yellow', '#f59e0b'],
    ['amarillo', '#f59e0b'],
    ['orange', '#fb923c'],
    ['naranja', '#fb923c'],
    ['purple', '#a855f7'],
    ['morado', '#a855f7'],
    ['lila', '#a855f7'],
    ['pink', '#ec4899'],
    ['rosa', '#ec4899'],
    ['barbie', '#ec4899'],
    ['fuchsia', '#d946ef'],
    ['camo', '#556b2f'],
    ['arctic', '#7dd3fc'],
    ['crystal', '#e5e7eb'],
    ['gold', '#d4af37'],
    ['dorado', '#d4af37'],
]);

// ✅ OPTIMIZATION: Memoized color function with cache
function createColorSwatchFn() {
    const cache = new Map<string, string>();

    return (c: string): string => {
        const key = (c || "").toLowerCase();

        // Check cache first
        if (cache.has(key)) {
            return cache.get(key)!;
        }

        // Try exact matches first
        if (COLOR_KEYWORDS.has(key)) {
            const result = COLOR_KEYWORDS.get(key)!;
            cache.set(key, result);
            return result;
        }

        // Then try partial matches
        for (const [keyword, hex] of COLOR_KEYWORDS.entries()) {
            if (key.includes(keyword)) {
                cache.set(key, hex);
                return hex;
            }
        }

        // Default
        const defaultColor = '#e5e7eb';
        cache.set(key, defaultColor);
        return defaultColor;
    };
}

const colorToSwatch = createColorSwatchFn();

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

// ✅ stable id generator
function makeVariantId(args: {
    model_name: string;
    color: string;
    size_id: string;
    price_mxn: number;
    locSlug: string;
}) {
    const { model_name, color, size_id, price_mxn, locSlug } = args;
    return `${model_name}__${color}__${size_id}__${price_mxn}__${locSlug}`.toLowerCase();
}

// Main component wrapped in data provider
function StoreCatalogInner() {
    const router = useRouter();
    const sp = useSearchParams();

    // ✅ Get cart data and item data from provider
    const {
        items,
        itemsLoading: loading,
        cartLines,
        totalCartPairs,
        isMixedCart,
        waLinkForCart,
        hasCartWhatsApp,
        cartLocationSlug,
        quantities,
        productImageMap,
        addToCart: handleAddToCart,
        removeFromCart: handleRemoveFromCart,
        removeItem: removeItemFromCart,
        clearCart,
        getPhotoForItem,
    } = useCart();

    const [lang, setLang] = useState<Lang>("es");
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

    const [pageSize, setPageSize] = useState<number>(MOBILE_INITIAL_VISIBLE);
    const [visibleCount, setVisibleCount] = useState<number>(MOBILE_INITIAL_VISIBLE);

    const [view, setView] = useState<"home" | "catalog">("home");
    const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

    const [sortBy, setSortBy] = useState<"newest" | "price_low" | "price_high" | "name">("newest");

    // Initialize from URL params
    useEffect(() => {
        const v = sp.get("view");
        const l = sp.get("lang");
        const loc = sp.get("loc");

        if (l === "es" || l === "en") setLang(l);
        if (loc && (loc === "all" || (VISIBLE_LOCATION_SLUGS as readonly string[]).includes(loc))) {
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

    // ✅ OPTIMIZATION: Memoized photo lookup
    const getPhotoByKey = useCallback((keyInput: string): { src: string; label: string } => {
        const key = String(keyInput || "").trim().toLowerCase();
        if (!key) return { src: PLACEHOLDER_IMAGE, label: "" };
        const hit = productImageMap[key];
        if (hit?.src) return { src: hit.src, label: "" };
        return { src: PLACEHOLDER_IMAGE, label: "" };
    }, [productImageMap]);

    const getPhotoForGroup = useCallback((modelName: string, colorEn: string) => {
        const key = `${String(modelName || "").trim()}__${String(colorEn || "").trim()}`.toLowerCase();
        return getPhotoByKey(key);
    }, [getPhotoByKey]);

    // Responsive page size
    useEffect(() => {
        if (typeof window === "undefined") return;

        const compute = () => {
            const w = window.innerWidth;
            let next: number;
            if (w >= 1024) next = DESKTOP_INITIAL_VISIBLE;
            else if (w >= 768) next = TABLET_INITIAL_VISIBLE;
            else next = MOBILE_INITIAL_VISIBLE;
            setPageSize(next);
        };

        compute();
        window.addEventListener("resize", compute);
        return () => window.removeEventListener("resize", compute);
    }, []);

    // Load location from localStorage or geo
    useEffect(() => {
        if (typeof window === "undefined") return;

        const saved = window.localStorage.getItem(LS_LOCATION_KEY);
        if (saved && (saved === "all" || (VISIBLE_LOCATION_SLUGS as readonly string[]).includes(saved))) {
            setLocationFilter(saved);
            return;
        }

        (async () => {
            try {
                const res = await fetch("/api/geo", { cache: "no-store" });
                if (!res.ok) return;

                const geo = await res.json();
                const slug = geoCityToLocationSlug(geo?.city ?? null);
                const next = slug && (VISIBLE_LOCATION_SLUGS as readonly string[]).includes(slug) ? slug : "all";

                setLocationFilter(next);
                window.localStorage.setItem(LS_LOCATION_KEY, next);
            } catch {
                setLocationFilter("all");
                window.localStorage.setItem(LS_LOCATION_KEY, "all");
            }
        })();
    }, []);

    // Subscribe to cart open events
    useEffect(() => {
        return subscribeOpenCart(() => {
            setCartOpen(true);
        });
    }, []);

    useEffect(() => {
        return subscribeOpenCart(() => {
            setView("catalog");
            setCartOpen(true);
        });
    }, []);

    useEffect(() => {
        if (consumeOpenCartRequest()) {
            setView("catalog");
            setCartOpen(true);
        }
    }, []);

    const persistLocation = useCallback((next: string) => {
        if (typeof window === "undefined") return;
        window.localStorage.setItem(LS_LOCATION_KEY, next);
    }, []);

    async function loadLocations() {
        const { data, error } = await supabase.from("locations").select("slug, name").order("name", { ascending: true });
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
        const { data, error } = await supabase.from("categories").select("id, slug, name").order("name", { ascending: true });
        if (error) return;

        setCategories(
            (data ?? []).map((c: any) => ({
                id: String(c.id),
                slug: String(c.slug),
                name: String(c.name),
            }))
        );
    }

    useEffect(() => {
        loadLocations();
        loadCategories();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ✅ OPTIMIZATION: Memoize category lookup
    const categoryById = useMemo(() => {
        const m = new Map<string, CategoryOption>();
        for (const c of categories) m.set(c.id, c);
        return m;
    }, [categories]);

    // ✅ OPTIMIZATION: Memoize scoped items for filters
    const scopedForOptions = useMemo(() => {
        return items.filter((it) => {
            const byLoc = locationFilter === "all" || it.location_slug === locationFilter;
            const byCategory = categoryFilter === "all" || String(it.category_id ?? "") === categoryFilter;
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

    // ✅ OPTIMIZATION: Memoize filter options
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

    // ✅ OPTIMIZATION: Memoize inventory scoping
    const inventoryScoped = useMemo(() => {
        return items.filter((item) => {
            const byLoc = locationFilter === "all" || item.location_slug === locationFilter;
            const byCategory = categoryFilter === "all" || String(item.category_id ?? "") === categoryFilter;
            const byBrand = brandFilter === "all" || (item.brand ?? "") === brandFilter;
            const byColor = !showColor || colorFilter === "all" || item.color === colorFilter;
            return byLoc && byCategory && byBrand && byColor;
        });
    }, [items, locationFilter, categoryFilter, brandFilter, colorFilter, showColor]);

    // Auto-reset filters when they become invalid
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
        if (typeof window === "undefined") return;
        if (window.innerWidth >= 1024) return;
        setMobileFiltersOpen(false);
    }, [locationFilter, categoryFilter, brandFilter, sizeFilter, colorFilter]);

    useEffect(() => {
        if (typeof document === "undefined") return;
        document.body.style.overflow = mobileFiltersOpen ? "hidden" : "";
        return () => {
            document.body.style.overflow = "";
        };
    }, [mobileFiltersOpen]);

    useEffect(() => {
        if (typeof window === "undefined") return;
        const shouldOpen = consumeOpenCartRequest();
        if (!shouldOpen) return;

        setView("catalog");
        setCartOpen(true);

        requestAnimationFrame(() =>
            document.getElementById("product-grid")?.scrollIntoView({ behavior: "smooth", block: "start" })
        );
    }, []);

    const selectedLocationName = useMemo(() => {
        if (locationFilter === "all") return lang === "es" ? "Todas" : "All";
        return locations.find((l) => l.slug === locationFilter)?.name || locationFilter;
    }, [locationFilter, locations, lang]);

    // ✅ OPTIMIZATION: Memoize groups computation (the expensive part)
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
            list = list.filter((g) => g.variants.some((v: any) => v.uses_size && v.size === sizeFilter));
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

    // ✅ OPTIMIZATION: Memoize pagination
    const limitedGroups = useMemo(() => groupsFiltered.slice(0, visibleCount), [groupsFiltered, visibleCount]);
    const showingCount = Math.min(visibleCount, groupsFiltered.length);

    const supportWaLink = useMemo(() => buildWhatsAppSupportLink(lang, locationFilter), [lang, locationFilter]);

    const formattedLastUpdated =
        lastUpdated?.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) ?? null;

    const pickupGroupedSpots: Record<string, string[]> =
        locationFilter === "all"
            ? FILTERED_DELIVERY_SPOTS
            : { [locationFilter]: FILTERED_DELIVERY_SPOTS[locationFilter] ?? [] };

    const hasAnyPickupSpots = Object.values(pickupGroupedSpots).some((list) => list.length > 0);

    const featuredGroups = useMemo(() => groupsFiltered.slice(0, 30), [groupsFiltered]);
    const quickColorChips = useMemo(() => allColors.slice(0, 10), [allColors]);

    // ✅ OPTIMIZATION: Wrap callbacks in useCallback
    const clearAllFilters = useCallback(() => {
        setLocationFilter("all");
        persistLocation("all");
        setCategoryFilter("all");
        setBrandFilter("all");
        setSizeFilter("all");
        setColorFilter("all");
        setQuery("");
    }, [persistLocation]);

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

    // ✅ OPTIMIZATION: Memoize filter chips
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
            const catName = categoryOptions.find((c) => c.id === categoryFilter)?.name ?? categoryFilter;
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
        persistLocation,
    ]);

    // ✅ OPTIMIZATION: Memoize callbacks passed to child components
    const handleQuickView = useCallback((g: ColorGroup) => {
        setQuickView(g);
    }, []);

    const handleShowMore = useCallback(() => {
        setVisibleCount((p) => p + pageSize);
    }, [pageSize]);

    const handleCartOpen = useCallback(() => {
        setCartOpen(true);
    }, []);

    const handleCartClose = useCallback(() => {
        setCartOpen(false);
        const ret = popCartReturnTo();
        if (ret) router.push(ret);
    }, [router]);

    const handleQuickViewClose = useCallback(() => {
        setQuickView(null);
    }, []);

    const handleHomeClick = useCallback(() => {
        setView("home");
        window.scrollTo({ top: 0, behavior: "smooth" });
    }, []);

    const handleCatalogClick = useCallback(() => {
        setView("catalog");
        requestAnimationFrame(() =>
            document.getElementById("product-grid")?.scrollIntoView({ behavior: "smooth", block: "start" })
        );
    }, []);

    const handleHelpClick = useCallback(() => {
        router.push(`/help?lang=${lang}&loc=${locationFilter}`);
    }, [router, lang, locationFilter]);

    return (
        <div className="min-h-screen bg-white text-slate-900">
            <div className="mx-auto w-full max-w-none px-3 sm:px-6 lg:px-10 2xl:px-14">
                <StoreHeader
                    lang={lang}
                    setLang={setLang}
                    query={query}
                    setQuery={setQuery}
                    totalCartPairs={totalCartPairs}
                    onCartClick={handleCartOpen}
                    onHomeClick={handleHomeClick}
                    view={view}
                    locationSlug={locationFilter}
                />

                {view === "home" && (
                    <HomeSections
                        lang={lang}
                        locations={locations}
                        pickupGroupedSpots={pickupGroupedSpots}
                        hasAnyPickupSpots={hasAnyPickupSpots}
                        supportWaLink={supportWaLink}
                        hasSupportWhatsApp={supportWaLink !== "#"}
                        featuredGroups={featuredGroups}
                        quickColorChips={quickColorChips}
                        getPhotoForGroup={getPhotoForGroup}
                        locationFilter={locationFilter}
                        onSelectLocation={(slug) => {
                            setLocationFilter(slug);
                            persistLocation(slug);
                        }}
                        visibleLocationSlugs={VISIBLE_LOCATION_SLUGS as any}
                        onBrowseCatalog={handleCatalogClick}
                        onSelectColor={(c) => {
                            setColorFilter(c);
                            handleCatalogClick();
                        }}
                        totalCartPairs={totalCartPairs}
                        onOpenCart={handleCartOpen}
                        isMixedCart={isMixedCart}
                        categoryNameById={categoryNameById}
                    />
                )}

                {view === "catalog" && (
                    <div className="pb-10">
                        {/* Mobile controls */}
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

                            {mobileFiltersOpen && (
                                <div className="fixed inset-0 z-[70] lg:hidden">
                                    <button
                                        type="button"
                                        className="absolute inset-0 bg-black/40"
                                        onClick={() => setMobileFiltersOpen(false)}
                                        aria-label={t(lang, "Cerrar", "Close")}
                                    />

                                    <div className="absolute inset-x-0 bottom-0">
                                        <div className="mx-auto w-full max-w-md md:max-w-2xl max-h-[85vh] overflow-auto rounded-t-3xl bg-white border border-slate-200 shadow-2xl">
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

                                            <div className="p-4">
                                                <FiltersBar
                                                    lang={lang}
                                                    loading={loading}
                                                    locationFilter={locationFilter}
                                                    setLocationFilter={setLocationFilter}
                                                    onPersistLocation={persistLocation}
                                                    locations={locations}
                                                    visibleLocationSlugs={VISIBLE_LOCATION_SLUGS as any}
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
                                                    onRefresh={() => {}}
                                                />
                                            </div>

                                            <div className="p-4 border-t border-slate-100">
                                                <button
                                                    type="button"
                                                    onClick={() => setMobileFiltersOpen(false)}
                                                    className="w-full rounded-full bg-slate-900 text-white py-3 text-sm font-extrabold hover:bg-black transition"
                                                >
                                                    {t(lang, "Ver productos", "View products")}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="mt-6 lg:grid lg:grid-cols-[280px_1fr] lg:gap-8">
                            {/* LEFT SIDEBAR - Desktop Only */}
                            <aside className="hidden lg:block">
                                <div className="sticky top-24 space-y-4">
                                    {/* Location Filter */}
                                    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                                        <div className="mb-3 text-xs font-extrabold tracking-wide uppercase text-slate-500">
                                            {t(lang, "Ubicación", "Location")}
                                        </div>

                                        <select
                                            value={locationFilter}
                                            onChange={(e) => {
                                                setLocationFilter(e.target.value);
                                                persistLocation(e.target.value);
                                            }}
                                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-200"
                                        >
                                            <option value="all">{t(lang, "Todas las ubicaciones", "All locations")}</option>
                                            {locations
                                                .filter((loc) => (VISIBLE_LOCATION_SLUGS as readonly string[]).includes(loc.slug))
                                                .map((loc) => (
                                                    <option key={loc.slug} value={loc.slug}>
                                                        {loc.name}
                                                    </option>
                                                ))}
                                        </select>
                                    </div>

                                    {/* Category Filter */}
                                    {categoryOptions.length > 0 && (
                                        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                                            <details className="group" open>
                                                <summary className="flex cursor-pointer list-none items-center justify-between">
                                                    <div className="text-xs font-extrabold tracking-wide uppercase text-slate-500">
                                                        {t(lang, "Categoría", "Category")}
                                                    </div>
                                                    <div className="text-xs text-slate-500 group-open:hidden">+</div>
                                                    <div className="text-xs text-slate-500 hidden group-open:block">–</div>
                                                </summary>

                                                <div className="mt-3 space-y-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => setCategoryFilter("all")}
                                                        className={`w-full text-left rounded-lg px-3 py-2 text-xs font-semibold transition ${
                                                            categoryFilter === "all"
                                                                ? "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200"
                                                                : "text-slate-700 hover:bg-slate-50"
                                                        }`}
                                                    >
                                                        {t(lang, "Todas", "All")}
                                                    </button>

                                                    {categoryOptions.map((cat) => (
                                                        <button
                                                            key={cat.id}
                                                            type="button"
                                                            onClick={() => setCategoryFilter(cat.id)}
                                                            className={`w-full text-left rounded-lg px-3 py-2 text-xs font-semibold transition ${
                                                                categoryFilter === cat.id
                                                                    ? "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200"
                                                                    : "text-slate-700 hover:bg-slate-50"
                                                            }`}
                                                        >
                                                            {translateCategory(cat.name || cat.slug, lang)}
                                                        </button>
                                                    ))}
                                                </div>
                                            </details>
                                        </div>
                                    )}

                                    {/* Brand Filter */}
                                    {allBrands.length > 0 && (
                                        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                                            <details className="group">
                                                <summary className="flex cursor-pointer list-none items-center justify-between">
                                                    <div className="text-xs font-extrabold tracking-wide uppercase text-slate-500">
                                                        {t(lang, "Marca", "Brand")}
                                                    </div>
                                                    <div className="text-xs text-slate-500 group-open:hidden">+</div>
                                                    <div className="text-xs text-slate-500 hidden group-open:block">–</div>
                                                </summary>

                                                <div className="mt-3 space-y-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => setBrandFilter("all")}
                                                        className={`w-full text-left rounded-lg px-3 py-2 text-xs font-semibold transition ${
                                                            brandFilter === "all"
                                                                ? "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200"
                                                                : "text-slate-700 hover:bg-slate-50"
                                                        }`}
                                                    >
                                                        {t(lang, "Todas", "All")}
                                                    </button>

                                                    {allBrands.slice(0, 12).map((b) => (
                                                        <button
                                                            key={b}
                                                            type="button"
                                                            onClick={() => setBrandFilter(b)}
                                                            className={`w-full text-left rounded-lg px-3 py-2 text-xs font-semibold transition truncate ${
                                                                brandFilter === b
                                                                    ? "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200"
                                                                    : "text-slate-700 hover:bg-slate-50"
                                                            }`}
                                                        >
                                                            {b}
                                                        </button>
                                                    ))}
                                                </div>

                                                {brandFilter !== "all" && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setBrandFilter("all")}
                                                        className="mt-3 inline-flex text-xs font-semibold text-emerald-700 hover:underline"
                                                    >
                                                        {t(lang, "Quitar marca", "Remove brand")}
                                                    </button>
                                                )}
                                            </details>
                                        </div>
                                    )}

                                    {/* Size Filter */}
                                    {showSize && allSizes.length > 0 && (
                                        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                                            <details className="group">
                                                <summary className="flex cursor-pointer list-none items-center justify-between">
                                                    <div className="text-xs font-extrabold tracking-wide uppercase text-slate-500">
                                                        {t(lang, "Talla", "Size")}
                                                    </div>
                                                    <div className="text-xs text-slate-500 group-open:hidden">+</div>
                                                    <div className="text-xs text-slate-500 hidden group-open:block">–</div>
                                                </summary>

                                                <div className="mt-3 flex flex-wrap gap-2">
                                                    {allSizes.map((sz) => {
                                                        const active = sizeFilter === sz;
                                                        return (
                                                            <button
                                                                key={sz}
                                                                type="button"
                                                                onClick={() => setSizeFilter(active ? "all" : sz)}
                                                                className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                                                                    active
                                                                        ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                                                                        : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
                                                                }`}
                                                            >
                                                                {sz}
                                                            </button>
                                                        );
                                                    })}
                                                </div>

                                                {sizeFilter !== "all" && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setSizeFilter("all")}
                                                        className="mt-3 inline-flex text-xs font-semibold text-emerald-700 hover:underline"
                                                    >
                                                        {t(lang, "Quitar talla", "Remove size")}
                                                    </button>
                                                )}
                                            </details>
                                        </div>
                                    )}

                                    {/* Color Filter */}
                                    {showColor && allColors.length > 0 && (
                                        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                                            <details className="group">
                                                <summary className="flex cursor-pointer list-none items-center justify-between">
                                                    <div className="text-xs font-extrabold tracking-wide uppercase text-slate-500">
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
                                                                key={translateColor(c, lang)}
                                                                type="button"
                                                                onClick={() => setColorFilter(active ? "all" : c)}
                                                                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold transition ${
                                                                    active
                                                                        ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                                                                        : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
                                                                }`}
                                                                title={translateColor(c, lang)}
                                                            >
                                                                <SwatchDot color={translateColor(c, lang)} active={active} />
                                                                <span className="truncate max-w-[160px]">{translateColor(c, lang)}</span>
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
                            </aside>

                            <main className="min-w-0">
                                <div className="flex flex-wrap items-center justify-between gap-3">
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
                                        onShowMore={handleShowMore}
                                        getPhotoForColor={(key) => getPhotoByKey(key)}
                                        onQuickView={handleQuickView}
                                    />
                                </div>
                            </main>
                        </div>
                    </div>
                )}

                <StoreFooter lang={lang} supportWaLink={supportWaLink} />

                <MobileBottomNav
                    show={!cartOpen && !quickView}
                    view={view}
                    lang={lang}
                    cartCount={totalCartPairs}
                    onHome={handleHomeClick}
                    onCatalog={handleCatalogClick}
                    onCart={handleCartOpen}
                    onHelp={handleHelpClick}
                />

                <QuickView
                    open={!!quickView}
                    group={quickView}
                    lang={lang}
                    onClose={handleQuickViewClose}
                    quantities={quantities}
                    sizeFilter={sizeFilter}
                    onAdd={handleAddToCart}
                    onRemove={handleRemoveFromCart}
                    showSize={showSize}
                    showColor={showColor}
                />

                <CartDrawer
                    open={cartOpen}
                    onClose={handleCartClose}
                    lang={lang}
                    cartLines={cartLines}
                    totalCartPairs={totalCartPairs}
                    isMixedCart={isMixedCart}
                    waLinkForCart={waLinkForCart}
                    hasCartWhatsApp={hasCartWhatsApp}
                    clearCart={clearCart}
                    onAdd={handleAddToCart}
                    onRemove={handleRemoveFromCart}
                    onRemoveItem={removeItemFromCart}
                    cartLocationSlug={cartLocationSlug}
                    getPhotoForCartItem={getPhotoForItem}
                />
            </div>
        </div>
    );
}

// ✅ OPTIMIZATION: Main catalog component (no longer wraps with CartProvider - that's at root)
export function StoreCatalog() {
    return <StoreCatalogInner />;
}