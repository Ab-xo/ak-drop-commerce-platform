-- Add attributes to product_variants
ALTER TABLE public.product_variants ADD COLUMN IF NOT EXISTS attributes JSONB NOT NULL DEFAULT '{}'::jsonb;

-- Add price_override to product_variants
ALTER TABLE public.product_variants ADD COLUMN IF NOT EXISTS price_override DECIMAL(10,2) CHECK (price_override IS NULL OR price_override >= 0);

-- Add variant_attributes to order_items
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS variant_attributes JSONB NOT NULL DEFAULT '{}'::jsonb;

-- Add variant_id to order_items
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS variant_id UUID REFERENCES public.product_variants(id) ON DELETE RESTRICT;

-- Add tracking_number to orders
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS tracking_number TEXT;

-- Add carrier to orders
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS carrier TEXT;

-- Add estimated_delivery to orders
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS estimated_delivery DATE;

-- Create contact_submissions table
CREATE TABLE IF NOT EXISTS public.contact_submissions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      subject TEXT NOT NULL,
      message TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'new',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

-- Create product_reviews table
CREATE TABLE IF NOT EXISTS public.product_reviews (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
      rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
      title TEXT,
      body TEXT NOT NULL,
      is_approved BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      UNIQUE(product_id, user_id)
    );

-- Enable RLS on product_reviews
ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;

-- Drop old submit reviews policy
DROP POLICY IF EXISTS "Users can submit reviews" ON public.product_reviews;

-- Create submit reviews policy
CREATE POLICY "Users can submit reviews" ON public.product_reviews FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Drop old view approved reviews policy
DROP POLICY IF EXISTS "Users can view approved reviews" ON public.product_reviews;

-- Create view approved reviews policy
CREATE POLICY "Users can view approved reviews" ON public.product_reviews FOR SELECT USING (is_approved = TRUE OR auth.uid() = user_id);

-- Create wishlist_items table (uses existing 'wishlist' table in this project)
-- wishlist table already exists: user_id, product_id, UNIQUE(user_id, product_id)
-- Ensure RLS and grants are correct
ALTER TABLE public.wishlist ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own wishlist" ON public.wishlist;
CREATE POLICY "Users can manage own wishlist" ON public.wishlist
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

GRANT ALL ON TABLE public.wishlist TO authenticated;

-- Grant product_reviews to authenticated
GRANT ALL ON TABLE public.product_reviews TO authenticated;
