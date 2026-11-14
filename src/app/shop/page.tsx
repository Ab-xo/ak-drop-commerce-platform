"use client";

import { useState, useEffect, useCallback } from "react";
import ProductCard from "@/components/ui/ProductCard";
import { Product, Category } from "@/types";
import {
  Search, ArrowLeft, ArrowRight, ChevronsLeft, ChevronsRight,
  ChevronDown, X, SlidersHorizontal, Tag, Banknote,
} from "lucide-react";
import { getCategories, getProductPage } from "@/utils/supabaseFetch";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { formatDisplayCurrency, ETB_PER_DISPLAY_UNIT } from "@/lib/currency";
import { useDisplayCurrency } from "@/store/currencyStore";
import type { DisplayCurrency } from "@/lib/currency";
import type { ProductSort } from "@/utils/supabaseFetch";
import CurrencySwitcher from "@/components/ui/CurrencySwitcher";

const SORT_OPTIONS = [
  { value: "newest", label: "Newest drops" },
  { value: "price-low", label: "Price: low → high" },
  { value: "price-high", label: "Price: high → low" },
];

function isProductSort(value: string): value is ProductSort {
  return SORT_OPTIONS.some((option) => option.value === value);
}

function parsePage(value: string | null): number {
  if (!value || !/^\d+$/.test(value)) return 1;
  const page = Number(value);
  return Number.isSafeInteger(page) && page > 0 ? page : 1;
}

function parseMaximumPrice(value: string | null): number | null {
  if (!value || !/^\d+(?:\.\d+)?$/.test(value)) return null;
  const price = Number(value);
  return Number.isFinite(price) && price >= 0 ? price : null;
}

const CURRENCY_OPTIONS: { value: DisplayCurrency; label: string; symbol: string }[] = [
  { value: "USD", label: "USD", symbol: "$" },
  { value: "ETB", label: "ETB", symbol: "ETB" },
  { value: "EUR", label: "EUR", symbol: "€" },
  { value: "GBP", label: "GBP", symbol: "£" },
  { value: "CAD", label: "CAD", symbol: "CA$" },
];
const ITEMS_PER_PAGE = 12;

// Convert ETB price to display currency for range label
function toDisplay(etbPrice: number, currency: DisplayCurrency): number {
  const rate = ETB_PER_DISPLAY_UNIT[currency] ?? 1;
  return etbPrice / rate;
}

const ShopPage = () => {
  const currency = useDisplayCurrency();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const activeCategory = searchParams.get("category") || "all";
  const searchParamValue = searchParams.get("q") ?? "";
  const requestedSort = searchParams.get("sort") ?? "";
  const sortBy = isProductSort(requestedSort) ? requestedSort : "newest";
  const currentPage = parsePage(searchParams.get("page"));
  const requestedMaxPrice = parseMaximumPrice(searchParams.get("maxPrice"));

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesError, setCategoriesError] = useState(false);
  const [searchQuery, setSearchQuery] = useState(searchParamValue);
  const [priceCeiling, setPriceCeiling] = useState(10000);
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(searchParamValue);
  const [totalCount, setTotalCount] = useState(0);
  const [loadedRequestKey, setLoadedRequestKey] = useState<string | null>(null);
  const [failedRequestKey, setFailedRequestKey] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const itemsPerPage = ITEMS_PER_PAGE;
  const maxPriceFilter =
    requestedMaxPrice !== null && requestedMaxPrice < priceCeiling
      ? requestedMaxPrice
      : null;
  const effectiveMaxPrice = maxPriceFilter ?? undefined;
  const requestKey = JSON.stringify([
    activeCategory,
    debouncedSearchQuery,
    effectiveMaxPrice ?? null,
    sortBy,
    currentPage,
  ]);
  const loading = loadedRequestKey !== requestKey;
  const loadError = failedRequestKey === requestKey;

  const updateQuery = useCallback((updates: Record<string, string | null>, resetPage = false) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value === null) params.delete(key);
      else params.set(key, value);
    }
    if (resetPage) params.delete("page");
    const query = params.toString();
    if (query !== searchParams.toString()) {
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    }
  }, [pathname, router, searchParams]);

  useEffect(() => {
    setSearchQuery(searchParamValue);
    setDebouncedSearchQuery(searchParamValue);
  }, [searchParamValue]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const query = searchQuery.trim();
      const params = new URLSearchParams(window.location.search);
      if ((params.get("q") ?? "") === query) {
        setDebouncedSearchQuery(query);
        return;
      }
      if (query) params.set("q", query);
      else params.delete("q");
      params.delete("page");
      const nextQuery = params.toString();
      router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false });
    }, 250);
    return () => window.clearTimeout(timer);
  }, [pathname, router, searchQuery]);

  useEffect(() => {
    getCategories()
      .then((cats) => {
        // deduplicate by slug in case DB has dupes
        const seen = new Set<string>();
        setCategories(cats.filter((c) => {
          if (seen.has(c.slug)) return false;
          seen.add(c.slug);
          return true;
        }));
      })
      .catch((error: unknown) => {
        console.error("Failed to load product categories:", error);
        setCategoriesError(true);
      });
  }, []);

  useEffect(() => {
    let isCurrent = true;
    getProductPage({
      categorySlug: activeCategory === "all" ? undefined : activeCategory,
      search: debouncedSearchQuery,
      maximumPrice: effectiveMaxPrice,
      sortBy,
      page: currentPage,
      pageSize: itemsPerPage,
    })
      .then((result) => {
        if (!isCurrent) return;
        setProducts(result.products);
        setTotalCount(result.totalCount);
        const max = Math.max(1000, Math.ceil(result.maxPrice / 100) * 100);
        setPriceCeiling(max);
        setFailedRequestKey(null);
      })
      .catch((error: unknown) => {
        console.error("Failed to load shop products:", error);
        if (isCurrent) setFailedRequestKey(requestKey);
      })
      .finally(() => {
        if (isCurrent) setLoadedRequestKey(requestKey);
      });
    return () => {
      isCurrent = false;
    };
  }, [
    activeCategory,
    debouncedSearchQuery,
    effectiveMaxPrice,
    sortBy,
    currentPage,
    itemsPerPage,
    requestKey,
  ]);

  const goToPage = useCallback((page: number) => {
    updateQuery({ page: page === 1 ? null : String(page) });
  }, [updateQuery]);

  const handleCategorySelect = useCallback((slug: string) => {
    updateQuery({
      category: slug === "all" ? null : slug,
      maxPrice: null,
    }, true);
    setSidebarOpen(false);
  }, [updateQuery]);

  const totalPages = Math.ceil(totalCount / itemsPerPage);
  useEffect(() => {
    if (loading || loadError) return;
    const lastPage = Math.max(totalPages, 1);
    if (currentPage > lastPage) goToPage(lastPage);
  }, [currentPage, goToPage, loadError, loading, totalPages]);

  const visiblePageCount = Math.min(totalPages, 5);
  const firstVisiblePage = Math.min(
    Math.max(currentPage - 2, 1),
    Math.max(totalPages - visiblePageCount + 1, 1)
  );
  const visiblePages = Array.from({ length: visiblePageCount }, (_, i) => firstVisiblePage + i);
  const paginatedProducts = products;

  const hasActiveFilters =
    activeCategory !== "all" ||
    searchQuery ||
    effectiveMaxPrice !== undefined ||
    sortBy !== "newest";

  function clearAll() {
    setSearchQuery("");
    setDebouncedSearchQuery("");
    updateQuery({
      category: null,
      q: null,
      maxPrice: null,
      sort: null,
      page: null,
    });
  }

  function clearSearch() {
    setSearchQuery("");
    setDebouncedSearchQuery("");
    updateQuery({ q: null }, true);
  }

  // Sidebar contents — shared between desktop sticky and mobile drawer
  const renderSidebarContent = () => (
    <div className="space-y-5">

      {/* Search */}
      <div className="space-y-1.5">
        <p className="px-0.5 text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">Search</p>
        <div className="relative">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            aria-label="Search products"
            placeholder="Search product names…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-11 w-full rounded-xl border border-input bg-background pl-10 pr-9 text-sm font-medium outline-none transition placeholder:text-muted-foreground/50 focus:border-primary focus:ring-2 focus:ring-primary/15"
          />
          {searchQuery && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 flex size-6 items-center justify-center rounded-full text-muted-foreground transition hover:bg-secondary hover:text-foreground"
            >
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Sort */}
      <div className="space-y-1.5">
        <p className="px-0.5 text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">Sort by</p>
        <div className="relative">
          <select
            value={sortBy}
            onChange={(e) => {
              if (!isProductSort(e.target.value)) return;
              updateQuery({ sort: e.target.value === "newest" ? null : e.target.value }, true);
            }}
            className="h-11 w-full appearance-none rounded-xl border border-input bg-background px-3.5 pr-9 text-sm font-semibold outline-none transition hover:border-primary/40 focus:border-primary focus:ring-2 focus:ring-primary/15 [color-scheme:light] dark:[color-scheme:dark]"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <ChevronDown size={14} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-border" />

      {/* Categories */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 px-0.5">
          <Tag size={13} className="text-muted-foreground" />
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">Categories</p>
        </div>
        <div className="space-y-1">
          {/* All */}
          <button
            type="button"
            onClick={() => handleCategorySelect("all")}
            className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-semibold transition
              ${activeCategory === "all"
                ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"}`}
          >
            All Collections
            {activeCategory === "all" && (
              <span className="rounded-full bg-primary-foreground/20 px-2 py-0.5 text-[10px] font-bold text-primary-foreground">
                {totalCount}
              </span>
            )}
          </button>

          {/* Per category */}
          {categories.map((cat) => {
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleCategorySelect(cat.slug)}
                className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-semibold transition
                  ${activeCategory === cat.slug
                    ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"}`}
              >
                {cat.name}
                <span className={`size-1.5 rounded-full ${activeCategory === cat.slug ? "bg-primary-foreground" : "bg-border"}`} />
              </button>
            );
          })}
          {categoriesError && (
            <p role="alert" className="px-3.5 py-2 text-xs text-destructive">
              Categories couldn&apos;t be loaded.
            </p>
          )}
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-border" />

      {/* Price range */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 px-0.5">
          <Banknote size={13} className="text-muted-foreground" />
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">Price range</p>
        </div>

        {/* Currency quick-select pills */}
        <div className="flex flex-wrap gap-1.5">
          {CURRENCY_OPTIONS.map((opt) => (
            <span
              key={opt.value}
              title={opt.label}
              className={`rounded-full border px-2.5 py-1 text-[11px] font-bold transition
                ${currency === opt.value
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-background text-muted-foreground"}`}
            >
              {opt.symbol}
            </span>
          ))}
          <span className="ml-auto text-[10px] text-muted-foreground self-center">via CurrencySwitcher →</span>
        </div>
        <CurrencySwitcher />

        {/* Range slider */}
        <div className="space-y-2 pt-1">
          <input
            type="range"
            min={0}
            max={priceCeiling}
            step={50}
            value={maxPriceFilter ?? priceCeiling}
            onChange={(e) => {
              const value = Number(e.target.value);
              updateQuery({ maxPrice: value < priceCeiling ? String(value) : null }, true);
            }}
            className="w-full cursor-pointer accent-primary"
            aria-label="Maximum price"
          />
          <div className="flex items-center justify-between">
            <span className="rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs font-bold tabular-nums">
              {formatDisplayCurrency(toDisplay(0, currency), currency)}
            </span>
            <span className="rounded-lg border border-primary/30 bg-primary/10 px-2.5 py-1.5 text-xs font-bold tabular-nums text-primary">
              ≤ {formatDisplayCurrency(toDisplay(maxPriceFilter ?? priceCeiling, currency), currency)}
            </span>
          </div>
        </div>
      </div>

      {/* Clear filters */}
      {hasActiveFilters && (
        <button
          type="button"
          onClick={clearAll}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-destructive/30 bg-destructive/[0.06] py-2.5 text-sm font-semibold text-destructive transition hover:bg-destructive/10"
        >
          <X size={14} /> Clear all filters
        </button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen py-28 sm:py-32">
      <div className="container mx-auto px-4">

        {/* Header */}
        <div className="mb-10 flex flex-col">
          <h1 className="text-5xl font-black tracking-tighter uppercase italic md:text-8xl">
            PREMIUM <span className="text-primary italic">CATALOG</span>
          </h1>
          <p className="mt-3 max-w-lg font-medium text-foreground/60">
            Engineered for performance, designed for the streets.
          </p>
        </div>

        {/* Mobile filter bar */}
        <div className="mb-5 flex items-center gap-3 lg:hidden">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              aria-label="Search product names"
              placeholder="Search product names…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-11 w-full rounded-xl border border-input bg-card pl-10 pr-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
            />
          </div>
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="flex h-11 items-center gap-2 rounded-xl border border-border bg-card px-4 text-sm font-semibold transition hover:border-primary/40"
          >
            <SlidersHorizontal size={15} />
            Filters
            {hasActiveFilters && <span className="size-2 rounded-full bg-primary" />}
          </button>
        </div>

        {/* Mobile drawer */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
            <div className="absolute inset-y-0 left-0 w-80 max-w-[90vw] overflow-y-auto bg-card p-5 shadow-2xl">
              <div className="mb-5 flex items-center justify-between">
                <p className="font-bold">Filters</p>
                <button type="button" onClick={() => setSidebarOpen(false)} className="rounded-lg p-1.5 hover:bg-secondary">
                  <X size={18} />
                </button>
              </div>
              {renderSidebarContent()}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-8 lg:flex-row lg:gap-8 xl:gap-10">

          {/* Desktop sidebar */}
          <aside className="hidden w-64 shrink-0 self-start lg:sticky lg:top-28 lg:block xl:w-72">
            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <div className="mb-5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal size={15} className="text-primary" />
                  <p className="font-bold">Filters</p>
                </div>
                {hasActiveFilters && (
                  <button type="button" onClick={clearAll} className="text-xs font-semibold text-primary hover:underline">
                    Clear all
                  </button>
                )}
              </div>
              {renderSidebarContent()}
            </div>
          </aside>

          {/* Product grid */}
          <div className="min-w-0 flex-1">

            {/* Results bar */}
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm font-semibold text-muted-foreground">
                {loading ? "Loading…" : (
                  <>
                    <span className="font-black text-foreground">{totalCount}</span> product{totalCount !== 1 ? "s" : ""}
                    {activeCategory !== "all" && (
                      <> in <span className="text-primary capitalize">{categories.find((c) => c.slug === activeCategory)?.name ?? activeCategory}</span></>
                    )}
                  </>
                )}
              </p>
              {/* Active filter chips */}
              <div className="flex flex-wrap gap-2">
                {activeCategory !== "all" && (
                  <span className="flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                    {categories.find((c) => c.slug === activeCategory)?.name ?? activeCategory}
                    <button type="button" onClick={() => handleCategorySelect("all")} className="hover:text-destructive"><X size={11} /></button>
                  </span>
                )}
                {searchQuery && (
                  <span className="flex items-center gap-1.5 rounded-full border border-border bg-secondary px-3 py-1 text-xs font-semibold text-muted-foreground">
                    &quot;{searchQuery}&quot;
                    <button type="button" onClick={clearSearch} className="hover:text-destructive"><X size={11} /></button>
                  </span>
                )}
                {effectiveMaxPrice !== undefined && (
                  <span className="flex items-center gap-1.5 rounded-full border border-border bg-secondary px-3 py-1 text-xs font-semibold text-muted-foreground">
                    ≤ {formatDisplayCurrency(toDisplay(effectiveMaxPrice, currency), currency)}
                    <button type="button" onClick={() => updateQuery({ maxPrice: null }, true)} className="hover:text-destructive"><X size={11} /></button>
                  </span>
                )}
              </div>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="h-96 animate-pulse rounded-3xl border border-border bg-secondary/40" />
                ))}
              </div>
            ) : loadError ? (
              <div role="alert" className="rounded-2xl border border-destructive/20 bg-destructive/[0.06] p-8 text-center text-sm text-destructive">
                Products could not be loaded. Check your Supabase configuration and refresh.
              </div>
            ) : paginatedProducts.length > 0 ? (
              <>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3 mb-14">
                  {paginatedProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex flex-col items-center gap-6 border-t border-border pt-12">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <button
                        disabled={currentPage === 1}
                        onClick={() => { goToPage(1); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                        className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition hover:border-primary/40 hover:text-primary disabled:opacity-30 sm:flex"
                      >
                        <ChevronsLeft size={18} />
                      </button>
                      <button
                        disabled={currentPage === 1}
                        onClick={() => { goToPage(currentPage - 1); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition hover:border-primary/40 hover:text-primary disabled:opacity-30"
                      >
                        <ArrowLeft size={16} />
                      </button>

                      <div className="flex items-center gap-1">
                        {visiblePages.map((page) => (
                          <button
                            key={page}
                            onClick={() => { goToPage(page); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold transition
                              ${currentPage === page
                                ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                                : "border border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"}`}
                          >
                            {page}
                          </button>
                        ))}
                      </div>

                      <button
                        disabled={currentPage === totalPages}
                        onClick={() => { goToPage(currentPage + 1); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition hover:border-primary/40 hover:text-primary disabled:opacity-30"
                      >
                        <ArrowRight size={16} />
                      </button>
                      <button
                        disabled={currentPage === totalPages}
                        onClick={() => { goToPage(totalPages); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                        className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition hover:border-primary/40 hover:text-primary disabled:opacity-30 sm:flex"
                      >
                        <ChevronsRight size={18} />
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Page <span className="font-bold text-foreground">{currentPage}</span> of {totalPages} ·{" "}
                      Showing                       {Math.min((currentPage - 1) * itemsPerPage + 1, totalCount)}–{Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount}
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center rounded-2xl border border-border bg-card py-20 text-center">
                <p className="text-2xl font-black uppercase italic">No products found</p>
                <p className="mt-2 text-sm text-muted-foreground">Try adjusting your filters.</p>
                {hasActiveFilters && (
                  <button type="button" onClick={clearAll} className="mt-5 text-sm font-semibold text-primary hover:underline">
                    Clear all filters
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShopPage;
