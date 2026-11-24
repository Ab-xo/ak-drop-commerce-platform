"use client";

import { motion } from "framer-motion";
import Hero from "@/components/layout/Hero";
import ProductCard from "@/components/ui/ProductCard";
import {
  ArrowRight, ChevronRight, ShieldCheck, ShoppingBag,
  Truck, Tag, Star, RefreshCw, Headphones,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { getCategories, getNewArrivals, getProducts } from "@/utils/supabaseFetch";
import { Product, Category } from "@/types";
import { formatDisplayCurrency } from "@/lib/currency";
import { useDisplayCurrency } from "@/store/currencyStore";

// ── Marquee ticker ────────────────────────────────────────────────────────────
// ── Category card ─────────────────────────────────────────────────────────────
const CATEGORY_FALLBACKS: Record<string, string> = {
  footwear:    "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=85",
  shirts:      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=85",
  pants:       "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=900&q=85",
  outerwear:   "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=900&q=85",
  bags:        "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=900&q=85",
  accessories: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=85",
  electronics: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=900&q=85",
  sports:      "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=900&q=85",
};

function CategoryCard({ cat, index }: { cat: Category; index: number }) {
  const img = cat.image_url || CATEGORY_FALLBACKS[cat.slug] || CATEGORY_FALLBACKS.footwear;
  return (
    <Link
      href={`/shop?category=${cat.slug}`}
      className="group relative overflow-hidden rounded-2xl border border-border bg-secondary/20"
      style={{ aspectRatio: index < 2 ? "4/3" : "1/1" }}
    >
      <Image
        src={img}
        alt={cat.name}
        fill
        sizes="(max-width: 640px) 100vw, 33vw"
        className="object-cover transition duration-700 group-hover:scale-110"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
      <div className="absolute inset-x-4 bottom-4">
        <p className="text-[10px] font-black uppercase tracking-widest text-primary">Explore</p>
        <h3 className="mt-0.5 text-xl font-black uppercase italic text-white">{cat.name}</h3>
        <span className="mt-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/20 transition group-hover:bg-primary group-hover:text-primary-foreground">
          <ChevronRight size={14} />
        </span>
      </div>
    </Link>
  );
}

// ── Deal card ─────────────────────────────────────────────────────────────────
function DealCard({ product }: { product: Product }) {
  const currency = useDisplayCurrency();
  const discount = product.compare_price
    ? Math.round(100 - (product.price / product.compare_price) * 100)
    : 0;
  return (
    <Link href={`/shop/${product.id}`} className="group flex gap-4 rounded-2xl border border-border bg-secondary/20 p-4 transition hover:border-primary/40 hover:bg-secondary/40">
      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-secondary">
        <Image src={product.main_image || "/placeholder.png"} alt={product.name} fill sizes="80px" className="object-cover transition group-hover:scale-105" />
        {discount > 0 && (
          <span className="absolute left-1 top-1 rounded-full bg-red-500 px-1.5 py-0.5 text-[9px] font-black text-white">
            -{discount}%
          </span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold group-hover:text-primary">{product.name}</p>
        <div className="mt-1 flex items-center gap-1 text-amber-500">
          {[1,2,3,4,5].map(s => <Star key={s} size={10} fill="currentColor" />)}
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="font-black text-primary text-sm">{formatDisplayCurrency(product.price, currency)}</span>
          {product.compare_price && (
            <span className="text-xs text-muted-foreground line-through">{formatDisplayCurrency(product.compare_price, currency)}</span>
          )}
        </div>
      </div>
    </Link>
  );
}

// ── Trust badges ──────────────────────────────────────────────────────────────
const TRUST = [
  { icon: ShieldCheck, label: "Secure checkout",        sub: "Server-validated every order" },
  { icon: RefreshCw,   label: "Live order tracking",    sub: "Real-time status updates" },
  { icon: Truck,       label: "Delivery details",       sub: "Country-aware shipping form" },
  { icon: Headphones,  label: "Customer support",       sub: "Direct email contact" },
];

// ── Main page ─────────────────────────────────────────────────────────────────
export default function Home() {
  const [featuredProducts, setFeaturedProducts]   = useState<Product[]>([]);
  const [newArrivals, setNewArrivals]             = useState<Product[]>([]);
  const [dealProducts, setDealProducts]           = useState<Product[]>([]);
  const [categories, setCategories]               = useState<Category[]>([]);
  const [loading, setLoading]                     = useState(true);
  const [loadError, setLoadError]                 = useState(false);

  useEffect(() => {
    Promise.all([
      getProducts(undefined, true, 8),
      getNewArrivals(8),
      getProducts(undefined, false, 20),
      getCategories(),
    ]).then(([featured, arrivals, all, cats]) => {
      setFeaturedProducts(featured);
      setNewArrivals(arrivals);
      // Deals = products that have a compare_price higher than price
      setDealProducts(
        all
          .filter((p) => p.compare_price && p.compare_price > p.price)
          .slice(0, 6)
      );
      setCategories(cats);
    }).catch((error) => {
      console.error("Failed to load storefront data:", error);
      setLoadError(true);
    }).finally(() => setLoading(false));
  }, []);

  const skeletonCards = (n: number) =>
    Array.from({ length: n }, (_, i) => (
      <div key={i} className="h-96 animate-pulse rounded-3xl bg-secondary/40 border border-border" />
    ));

  return (
    <div className="flex flex-col">

      {/* ── Hero ── */}
      <Hero />

      {loadError && (
        <p role="alert" className="bg-red-500/10 px-4 py-3 text-center text-sm text-red-400">
          Store products could not be loaded. Check the Supabase URL, public key, and database connection, then refresh.
        </p>
      )}

      {/* ── Shop by category ── */}
      <section className="bg-background py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <p className="mb-2 text-xs font-black uppercase tracking-[0.25em] text-primary">Everything in one place</p>
              <h2 className="text-3xl font-black uppercase italic sm:text-4xl">
                Shop by <span className="text-primary">Category</span>
              </h2>
            </div>
            <Link href="/categories" className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-primary hover:underline">
              All <ArrowRight size={15} />
            </Link>
          </div>

          {/* Bento-style grid */}
          {loading ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {Array.from({length:8},(_,i)=>(
                <div key={i} className={`animate-pulse rounded-2xl bg-secondary/40 border border-border ${i<2?"aspect-[4/3]":"aspect-square"}`} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {(categories.length ? categories : Object.entries(CATEGORY_FALLBACKS).map(([slug,image_url],i)=>({
                id: slug, name: slug.charAt(0).toUpperCase()+slug.slice(1), slug, image_url, sort_order: i
              }))).slice(0,8).map((cat, i) => (
                <CategoryCard key={cat.id} cat={cat as Category} index={i} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── New Arrivals ── */}
      <section className="border-t border-border bg-secondary/10 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <p className="mb-2 text-xs font-black uppercase tracking-[0.25em] text-primary">Just landed</p>
              <h2 className="text-3xl font-black uppercase italic sm:text-4xl">
                New <span className="text-primary">Arrivals</span>
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">Fresh products across every category.</p>
            </div>
            <Link href="/shop" className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-primary hover:underline">
              Shop all <ArrowRight size={15} />
            </Link>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {loading ? skeletonCards(4) : newArrivals.length ? newArrivals.slice(0,4).map(p => (
              <ProductCard key={p.id} product={p} />
            )) : (
              <div className="col-span-full rounded-2xl border border-border p-10 text-center text-sm text-muted-foreground">
                New arrivals coming soon.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── Featured + Deals split ── */}
      <section className="border-t border-border bg-background py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid gap-12 lg:grid-cols-3">

            {/* Featured products — 2/3 width */}
            <div className="lg:col-span-2">
              <div className="mb-8 flex items-end justify-between gap-4">
                <div>
                  <p className="mb-2 text-xs font-black uppercase tracking-[0.25em] text-primary">Staff picks</p>
                  <h2 className="text-3xl font-black uppercase italic sm:text-4xl">
                    Featured <span className="text-primary">Now</span>
                  </h2>
                </div>
                <Link href="/shop?featured=true" className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-primary hover:underline">
                  View all <ArrowRight size={15} />
                </Link>
              </div>
              <div className="grid gap-6 sm:grid-cols-2">
                {loading ? skeletonCards(4) : featuredProducts.length ? featuredProducts.slice(0,4).map(p => (
                  <ProductCard key={p.id} product={p} />
                )) : (
                  <div className="col-span-full rounded-2xl border border-border p-10 text-center text-sm text-muted-foreground">
                    Featured items will appear here soon.
                  </div>
                )}
              </div>
            </div>

            {/* Deals sidebar — 1/3 width */}
            <div>
              <div className="mb-8 flex items-end justify-between gap-4">
                <div>
                  <p className="mb-2 text-xs font-black uppercase tracking-[0.25em] text-red-500">Limited time</p>
                  <h2 className="text-3xl font-black uppercase italic">
                    Hot <span className="text-red-500">Deals</span>
                  </h2>
                </div>
                <Tag size={20} className="text-red-500" />
              </div>
              <div className="flex flex-col gap-3">
                {loading ? Array.from({length:4},(_,i)=>(
                  <div key={i} className="h-28 animate-pulse rounded-2xl bg-secondary/40 border border-border" />
                )) : dealProducts.length ? dealProducts.map(p => (
                  <DealCard key={p.id} product={p} />
                )) : (
                  <div className="rounded-2xl border border-border p-8 text-center text-sm text-muted-foreground">
                    Deals coming soon.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── More new arrivals row (extended) ── */}
      <section className="border-t border-border bg-secondary/10 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <p className="mb-2 text-xs font-black uppercase tracking-[0.25em] text-primary">Keep browsing</p>
              <h2 className="text-3xl font-black uppercase italic sm:text-4xl">
                More <span className="text-primary">to Explore</span>
              </h2>
            </div>
            <Link href="/shop" className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-primary hover:underline">
              Full catalog <ArrowRight size={15} />
            </Link>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {loading ? skeletonCards(4) : featuredProducts.length > 4 ? featuredProducts.slice(4,8).map(p => (
              <ProductCard key={p.id} product={p} />
            )) : newArrivals.slice(4,8).map(p => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Category quick links banner ── */}
      <section className="border-t border-border bg-background py-12">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex flex-wrap items-center justify-center gap-3">
            {(categories.length ? categories : Object.entries(CATEGORY_FALLBACKS).map(([slug])=>({
              id:slug, name:slug.charAt(0).toUpperCase()+slug.slice(1), slug, image_url:null
            }))).map(cat => (
              <Link
                key={cat.id}
                href={`/shop?category=${cat.slug}`}
                className="rounded-full border border-border px-5 py-2.5 text-sm font-bold transition hover:border-primary hover:bg-primary hover:text-primary-foreground"
              >
                {cat.name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Full-width CTA banner ── */}
      <section className="relative overflow-hidden border-t border-border">
        <div className="relative h-72 sm:h-96">
          <Image
            src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1600&q=85"
            alt="AK Ecommerce collection"
            fill
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent" />
          <div className="absolute inset-0 flex flex-col items-start justify-center px-8 sm:px-16">
            <p className="mb-3 text-xs font-black uppercase tracking-[0.25em] text-primary">One store, every style</p>
            <h2 className="max-w-xl text-4xl font-black uppercase italic leading-tight text-white sm:text-6xl">
              Shop the<br /><span className="text-primary">Full Drop</span>
            </h2>
            <p className="mt-4 max-w-md text-sm font-medium text-white/70">
              Footwear, shirts, pants, outerwear, bags, accessories, electronics, and sports gear — all in one place.
            </p>
            <Link
              href="/shop"
              className="mt-8 inline-flex items-center gap-3 rounded-xl bg-primary px-7 py-3.5 font-black uppercase italic tracking-wider text-primary-foreground shadow-xl shadow-primary/30 transition hover:opacity-90 active:scale-95"
            >
              Explore Everything <ShoppingBag size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Why AK Drop — animated trust strip ── */}
      <section className="border-t border-border bg-secondary/30 py-14 sm:py-16">
        <div className="mx-auto max-w-6xl px-4">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5 }}
            className="mb-10 text-center text-[10px] font-black uppercase tracking-[0.28em] text-muted-foreground"
          >
            Why AK Drop
          </motion.p>
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-4 sm:gap-6">
            {TRUST.map(({ icon: Icon, label, sub }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.5, delay: i * 0.1, ease: "easeOut" }}
                className="group flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-5 text-center shadow-sm transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md sm:p-6"
              >
                <span className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-transform duration-300 group-hover:scale-110">
                  <Icon size={22} />
                </span>
                <div>
                  <p className="text-sm font-bold">{label}</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{sub}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}
