// components/jackie/JackieCatalog.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

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

import { StoreHeader } from "./StoreHeader";
import { FiltersBar } from "./FiltersBar";
import { ProductGrid } from "./ProductGrid";
import { QuickView } from "./QuickView";
import { CartDrawer } from "./CartDrawer";
import { HomeSections } from "./HomeSections";
import { SizeGuide } from "./SizeGuide";
import { FeedbackBox } from "./FeedbackBox";

const MOBILE_INITIAL_VISIBLE = 8;
const DESKTOP_INITIAL_VISIBLE = 12;

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

const SUPABASE_IMAGE_BASE =
    "https://axrfkuupjoddsoswowac.supabase.co/storage/v1/object/public/product-images";

const CROCS_PHOTOS = {
    black: { src: `${SUPABASE_IMAGE_BASE}/crocs-black.png`, label: "Crocs negros" },
    beige: { src: `${SUPABASE_IMAGE_BASE}/crocs-beige.png`, label: "Crocs beige" },
    white: { src: `${SUPABASE_IMAGE_BASE}/crocs-white.png`, label: "Crocs blancos" },
    lila: { src: `${SUPABASE_IMAGE_BASE}/crocs-lila.png`, label: "Crocs lila" },
    light_pink: { src: `${SUPABASE_IMAGE_BASE}/crocs-light-pink.png`, label: "Crocs rosa pastel" },
    red: { src: `${SUPABASE_IMAGE_BASE}/crocs-red.png`, label: "Crocs rojos" },
    arctic: { src: `${SUPABASE_IMAGE_BASE}/crocs-arctic.png`, label: "Crocs azul ártico" },
    camo: { src: `${SUPABASE_IMAGE_BASE}/crocs-camo.png`, label: "Crocs camuflaje" },
    fuchsia: { src: `${SUPABASE_IMAGE_BASE}/crocs-fuchsia.jpg`, label: "Crocs fucsia" },
    rust_brown: { src: `${SUPABASE_IMAGE_BASE}/crocs-rust-brown.jpg`, label: "Crocs café óxido" },
    leopard: { src: `${SUPABASE_IMAGE_BASE}/croc-leopard.JPG`, label: "Crocs de leopardo" },

    barbie: { src: `${SUPABASE_IMAGE_BASE}/croc-barbie.jpeg`, label: "Crocs Barbie" },
    batman: { src: `${SUPABASE_IMAGE_BASE}/croc-batman.jpeg`, label: "Crocs Batman" },
    buzz_lightyear: { src: `${SUPABASE_IMAGE_BASE}/croc-buzzlightyear.jpeg`, label: "Crocs Buzz Lightyear" },
    dragon_ball: { src: `${SUPABASE_IMAGE_BASE}/croc-dragonball.jpeg`, label: "Crocs Dragon Ball" },
    hello_kitty: { src: `${SUPABASE_IMAGE_BASE}/croc-hellokitty.jpeg`, label: "Crocs Hello Kitty" },
    huevitos: { src: `${SUPABASE_IMAGE_BASE}/croc-huevitos.jpeg`, label: "Crocs Huevitos" },
    simpson: { src: `${SUPABASE_IMAGE_BASE}/croc-simpson.jpeg`, label: "Crocs Los Simpson" },
    stranger_things: { src: `${SUPABASE_IMAGE_BASE}/croc-strangerthings.jpeg`, label: "Crocs Stranger Things" },
    superman: { src: `${SUPABASE_IMAGE_BASE}/croc-superman.jpeg`, label: "Crocs Superman" },
    toy_story: { src: `${SUPABASE_IMAGE_BASE}/croc-toystory.jpeg`, label: "Crocs Toy Story" },
    yoda: { src: `${SUPABASE_IMAGE_BASE}/croc-yoda.jpeg`, label: "Crocs Yoda" },

    light_pink_shimmer: { src: `${SUPABASE_IMAGE_BASE}/croc-light-pink-shimmer.png`, label: "Crocs rosa con brillo" },

    nb_1906r_grey_black: { src: `${SUPABASE_IMAGE_BASE}/nb-1906r-grey-black.jpeg`, label: "New Balance 1906R gris / negro" },
    nb_530_beige_brown: { src: `${SUPABASE_IMAGE_BASE}/nb-530-beige-brown.jpeg`, label: "New Balance 530 beige / café" },
    nb_740_grey_white: { src: `${SUPABASE_IMAGE_BASE}/nb_740_grey_white.jpeg`, label: "New Balance beige" },
    nb_740_rose_sugar: { src: `${SUPABASE_IMAGE_BASE}/nb_740_rose_sugar.jpeg`, label: "New Balance rosa" },

    adidas_samba_cristales: { src: `${SUPABASE_IMAGE_BASE}/Adidas-Samba-Cristales.jpeg`, label: "Adidas Samba Cristales" },
} as const;

type CrocsPhotoKey = keyof typeof CROCS_PHOTOS;

function getPhotoForColor(colorEn: string): (typeof CROCS_PHOTOS)[CrocsPhotoKey] | null {
    const key = colorEn.trim().toLowerCase();

    if (key === "black") return CROCS_PHOTOS.black;
    if (key === "white") return CROCS_PHOTOS.white;
    if (key === "beige") return CROCS_PHOTOS.beige;
    if (key === "lilac" || key === "lila") return CROCS_PHOTOS.lila;
    if (key === "red") return CROCS_PHOTOS.red;
    if (key === "arctic") return CROCS_PHOTOS.arctic;
    if (key === "camo" || key === "camuflaje") return CROCS_PHOTOS.camo;
    if (key === "baby pink" || key === "light pink") return CROCS_PHOTOS.light_pink;
    if (key === "fuchsia") return CROCS_PHOTOS.fuchsia;
    if (key === "rust brown") return CROCS_PHOTOS.rust_brown;
    if (key === "beige brown") return CROCS_PHOTOS.nb_530_beige_brown;
    if (key === "grey black") return CROCS_PHOTOS.nb_1906r_grey_black;
    if (key === "grey white") return CROCS_PHOTOS.nb_740_grey_white;
    if (key === "rose sugar") return CROCS_PHOTOS.nb_740_rose_sugar;
    if (key === "crystal white") return CROCS_PHOTOS.adidas_samba_cristales;
    if (key === "leopard") return CROCS_PHOTOS.leopard;
    if (key.includes("shimmer")) return CROCS_PHOTOS.light_pink_shimmer;

    if (key === "barbie") return CROCS_PHOTOS.barbie;
    if (key === "batman") return CROCS_PHOTOS.batman;
    if (key === "buzz lightyear") return CROCS_PHOTOS.buzz_lightyear;
    if (key === "dragon ball") return CROCS_PHOTOS.dragon_ball;
    if (key === "hello kitty") return CROCS_PHOTOS.hello_kitty;
    if (key === "simpsons") return CROCS_PHOTOS.simpson;
    if (key === "stranger things") return CROCS_PHOTOS.stranger_things;
    if (key === "superman") return CROCS_PHOTOS.superman;
    if (key === "toy story") return CROCS_PHOTOS.toy_story;
    if (key === "yoda") return CROCS_PHOTOS.yoda;
    if (key === "egg" || key === "huevito" || key === "huevitos") return CROCS_PHOTOS.huevitos;

    return null;
}

/** ✅ Mobile app-like bottom nav (only shows on mobile) */
// ✅ REPLACE your MobileBottomNav with this version (it can hide itself when modals are open)
function MobileBottomNav({
                             show,
                             view,
                             lang,
                             cartCount,
                             onHome,
                             onCatalog,
                             onCart,
                         }: {
    show: boolean;
    view: "home" | "catalog";
    lang: Lang;
    cartCount: number;
    onHome: () => void;
    onCatalog: () => void;
    onCart: () => void;
}) {
    if (!show) return null;

    const Item = ({
                      active,
                      label,
                      icon,
                      onClick,
                      badge,
                  }: {
        active: boolean;
        label: string;
        icon: React.ReactNode;
        onClick: () => void;
        badge?: number;
    }) => (
        <button
            type="button"
            onClick={onClick}
            className={`relative flex flex-1 flex-col items-center justify-center gap-1 py-2 text-[11px] font-semibold transition ${
                active ? "text-emerald-700" : "text-slate-500"
            }`}
            aria-current={active ? "page" : undefined}
        >
      <span
          className={`grid h-9 w-9 place-items-center rounded-2xl border transition ${
              active ? "bg-emerald-50 border-emerald-200" : "bg-white border-slate-200"
          }`}
      >
        <span className="text-lg leading-none">{icon}</span>
      </span>
            <span>{label}</span>

            {typeof badge === "number" && badge > 0 && (
                <span className="absolute top-1 right-6 min-w-[18px] h-[18px] px-1 rounded-full bg-emerald-600 text-white text-[10px] font-bold grid place-items-center">
          {badge > 99 ? "99+" : badge}
        </span>
            )}
        </button>
    );

    return (
        <>
            {/* ✅ spacer only when nav is visible */}
            <div className="h-24 lg:hidden" />

            {/* ✅ pinned bottom, safe-area aware */}
            <div className="fixed inset-x-0 bottom-0 z-[60] lg:hidden pb-[env(safe-area-inset-bottom)]">
                <div className="mx-auto max-w-md px-4">
                    <div className="rounded-t-3xl border border-slate-200 bg-white/95 backdrop-blur shadow-[0_-12px_40px_rgba(15,23,42,0.16)]">
                        <div className="flex items-stretch px-2 py-2">
                            <Item
                                active={view === "home"}
                                label={t(lang, "Inicio", "Home")}
                                icon="🏠"
                                onClick={onHome}
                            />
                            <Item
                                active={view === "catalog"}
                                label={t(lang, "Catálogo", "Catalog")}
                                icon="🛍️"
                                onClick={onCatalog}
                            />
                            <Item
                                active={false}
                                label={t(lang, "Carrito", "Cart")}
                                icon="🧺"
                                onClick={onCart}
                                badge={cartCount}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}


export function JackieCatalog() {
    const [lang, setLang] = useState<Lang>("es");

    const [items, setItems] = useState<PublicItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    const [locations, setLocations] = useState<LocationOption[]>([]);
    const [locationFilter, setLocationFilter] = useState<string>("all");

    const [sizeFilter, setSizeFilter] = useState<string>("all");
    const [colorFilter, setColorFilter] = useState<string>("all");

    const [query, setQuery] = useState("");
    const [cartOpen, setCartOpen] = useState(false);
    const [quickView, setQuickView] = useState<ColorGroup | null>(null);

    const [quantities, setQuantities] = useState<Record<string, number>>({});

    const [pageSize, setPageSize] = useState<number>(MOBILE_INITIAL_VISIBLE);
    const [visibleCount, setVisibleCount] = useState<number>(MOBILE_INITIAL_VISIBLE);

    const [view, setView] = useState<"home" | "catalog">("home");

    useEffect(() => {
        if (typeof window === "undefined") return;

        const compute = () => {
            const w = window.innerWidth;
            const next = w >= 1024 ? DESKTOP_INITIAL_VISIBLE : MOBILE_INITIAL_VISIBLE;
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
        models ( name ),
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
        loadInventory();
    }, []);

    useEffect(() => {
        const id = setInterval(() => loadInventory(), 3 * 60_000);
        return () => clearInterval(id);
    }, []);

    useEffect(() => {
        setVisibleCount(pageSize);
    }, [sizeFilter, colorFilter, locationFilter, items.length, pageSize, query]);

    useEffect(() => {
        setSizeFilter("all");
        setColorFilter("all");
    }, [locationFilter]);

    useEffect(() => {
        if (!query.trim()) return;
        setView("catalog");
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [query]);

    const selectedLocationName = useMemo(() => {
        if (locationFilter === "all") return lang === "es" ? "Todas" : "All";
        return locations.find((l) => l.slug === locationFilter)?.name || locationFilter;
    }, [locationFilter, locations, lang]);

    const scopedForOptions = useMemo(() => {
        return items.filter((i) => locationFilter === "all" || i.location_slug === locationFilter);
    }, [items, locationFilter]);

    const allSizes = useMemo(() => {
        return Array.from(new Set(scopedForOptions.map((i) => i.size))).sort((a, b) => sizeRank(a) - sizeRank(b));
    }, [scopedForOptions]);

    const allColors = useMemo(() => {
        return Array.from(new Set(scopedForOptions.map((i) => i.color))).filter(Boolean).sort((a, b) => a.localeCompare(b));
    }, [scopedForOptions]);

    const inventoryScoped = useMemo(() => {
        return items.filter((item) => {
            const byLoc = locationFilter === "all" || item.location_slug === locationFilter;
            const byColor = colorFilter === "all" || item.color === colorFilter;
            return byLoc && byColor;
        });
    }, [items, locationFilter, colorFilter]);

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

        if (sizeFilter !== "all") {
            list = list.filter((g) => g.variants.some((v) => v.size === sizeFilter));
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
            const tt = b.latest_created_at.localeCompare(a.latest_created_at);
            if (tt !== 0) return tt;
            const c = a.color.localeCompare(b.color);
            if (c !== 0) return c;
            const m = (a.model_name || "").localeCompare(b.model_name || "");
            if (m !== 0) return m;
            return a.price_mxn_min - b.price_mxn_min;
        });

        return list;
    }, [inventoryScoped, sizeFilter, query]);

    const totalPairsFiltered = useMemo(() => {
        return groupsFiltered.reduce((sum, g) => sum + g.variants.reduce((s, v) => s + v.availableCount, 0), 0);
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

    const formattedLastUpdated = lastUpdated?.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) ?? null;

    const handleAddToCart = (item: PublicItem) => {
        setQuantities((prev) => {
            const current = prev[item.id] ?? 0;
            if (current >= item.availableCount) return prev;
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
        locationFilter === "all" ? FILTERED_DELIVERY_SPOTS : { [locationFilter]: FILTERED_DELIVERY_SPOTS[locationFilter] ?? [] };

    const hasAnyPickupSpots = Object.values(pickupGroupedSpots).some((list) => list.length > 0);

    const featuredGroups = useMemo(() => groupsFiltered.slice(0, 4), [groupsFiltered]);
    const quickColorChips = useMemo(() => allColors.slice(0, 6), [allColors]);

    return (
        <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-white text-slate-900">
            <StoreHeader
                lang={lang}
                setLang={setLang}
                subtitle={selectedLocationName}
                query={query}
                setQuery={setQuery}
                totalCartPairs={totalCartPairs}
                onCartClick={() => setCartOpen(true)}
            />

            {/* ✅ REMOVED: top-right Inicio button completely */}

            {view === "home" && (
                <HomeSections
                    lang={lang}
                    locations={locations}
                    pickupGroupedSpots={pickupGroupedSpots}
                    hasAnyPickupSpots={hasAnyPickupSpots}
                    supportWaLink={supportWaLink}
                    hasSupportWhatsApp={hasSupportWhatsApp}
                    featuredGroups={featuredGroups}
                    quickColorChips={quickColorChips}
                    getPhotoForColor={getPhotoForColor}
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
                />
            )}

            {view === "catalog" && (
                <>
                    <FiltersBar
                        lang={lang}
                        loading={loading}
                        locationFilter={locationFilter}
                        setLocationFilter={setLocationFilter}
                        onPersistLocation={persistLocation}
                        locations={locations}
                        visibleLocationSlugs={VISIBLE_LOCATION_SLUGS}
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

                    <div id="product-grid" className="scroll-mt-24">
                        <ProductGrid
                            lang={lang}
                            loading={loading}
                            errorMsg={errorMsg}
                            groupsFiltered={groupsFiltered}
                            limitedGroups={limitedGroups}
                            showingCount={showingCount}
                            canShowMore={groupsFiltered.length > limitedGroups.length}
                            onShowMore={() => setVisibleCount((p) => p + pageSize)}
                            getPhotoForColor={getPhotoForColor}
                            onQuickView={(g) => setQuickView(g)}
                        />
                    </div>

                    <section className="mx-auto max-w-6xl px-4 pb-10 space-y-4">
                        <SizeGuide lang={lang} />
                        <FeedbackBox lang={lang} context="storefront" />
                    </section>
                </>
            )}
            
            <MobileBottomNav
                show={!cartOpen && !quickView} // ✅ hides behind/under modals
                view={view}
                lang={lang}
                cartCount={totalCartPairs}
                onHome={() => {
                    setView("home");
                    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                onCatalog={() => {
                    setView("catalog");
                    requestAnimationFrame(() => {
                        const el = document.getElementById("product-grid");
                        el?.scrollIntoView({ behavior: "smooth", block: "start" });
                    });
                }}
                onCart={() => setCartOpen(true)}
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
            />
        </div>
    );
}
