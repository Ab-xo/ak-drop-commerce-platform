'use server';

import { createServerSupabaseClient } from '@/lib/supabase-server';

export async function toggleWishlist(
  productId: string,
): Promise<{ wishlisted: boolean; error?: string }> {
  const supabase = await createServerSupabaseClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { wishlisted: false, error: 'Not authenticated' };
  }

  // Check if already wishlisted
  const { data: existing } = await supabase
    .from('wishlist')
    .select('id')
    .eq('user_id', user.id)
    .eq('product_id', productId)
    .maybeSingle();

  if (existing) {
    // Remove from wishlist
    const { error } = await supabase
      .from('wishlist')
      .delete()
      .eq('user_id', user.id)
      .eq('product_id', productId);

    if (error) {
      return { wishlisted: true, error: error.message };
    }
    return { wishlisted: false };
  }

  // Add to wishlist
  const { error } = await supabase
    .from('wishlist')
    .insert({ user_id: user.id, product_id: productId });

  if (error) {
    return { wishlisted: false, error: error.message };
  }

  return { wishlisted: true };
}

export async function getWishlist(): Promise<{
  items: { product_id: string }[];
  error?: string;
}> {
  const supabase = await createServerSupabaseClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { items: [] };
  }

  const { data, error } = await supabase
    .from('wishlist')
    .select('product_id')
    .eq('user_id', user.id);

  if (error) {
    return { items: [], error: error.message };
  }

  return { items: data ?? [] };
}
