import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
import ProductCard from '@/components/ui/ProductCard';
import type { Product } from '@/types';
import { Heart } from 'lucide-react';

export const metadata = { title: 'Your Wishlist — AK Drop' };

export default async function WishlistPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/signin?redirect=/wishlist');
  }

  const { data: wishlistItems, error } = await supabase
    .from('wishlist')
    .select('product_id, products(*)')
    .eq('user_id', user.id)
    .order('added_at', { ascending: false });

  if (error) {
    console.error('Wishlist fetch error:', error.message);
  }

  const products: Product[] = (wishlistItems ?? [])
    .map((item) => {
      const p = item.products;
      if (!p || typeof p !== 'object' || Array.isArray(p)) return null;
      return p as unknown as Product;
    })
    .filter((p): p is Product => p !== null);

  return (
    <main className="min-h-screen pt-24 pb-16">
      <div className="container mx-auto px-4 md:px-8">
        {/* Header */}
        <div className="mb-10">
          <h1 className="flex items-center gap-3 text-3xl font-black tracking-tight">
            <Heart className="text-red-500 fill-red-500" size={30} />
            Your Wishlist
          </h1>
          <p className="mt-2 text-muted-foreground">
            {products.length > 0
              ? `${products.length} saved item${products.length !== 1 ? 's' : ''}`
              : 'No saved items yet. Heart a product to save it here.'}
          </p>
        </div>

        {products.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
            <div className="rounded-full bg-secondary/50 p-6">
              <Heart size={40} className="text-muted-foreground" />
            </div>
            <p className="text-lg font-semibold text-foreground">No saved items yet</p>
            <p className="max-w-xs text-sm text-muted-foreground">
              Heart a product to save it here and find it easily later.
            </p>
            <a
              href="/shop"
              className="mt-2 inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground transition hover:opacity-90"
            >
              Browse the shop
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
