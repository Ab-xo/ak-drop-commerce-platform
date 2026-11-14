-- AK DROP MODERN — CANONICAL SUPABASE SETUP
-- Apply in the Supabase SQL Editor as a project owner.
-- This file defines profiles/orders, catalog, and commerce tables. It does not
-- insert sample products or categories; populate the catalog with store data.
-- Client roles can read active catalog data and their own records. Order creation,
-- payment state, moderation, inventory writes, and staff operations stay server-side.

BEGIN;
-- AK ECOMM User Authentication Schema for Supabase
-- Profile and order tables used by AK Drop Modern

-- Enable Row Level Security

-- Create users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    full_name TEXT,
    username TEXT UNIQUE,
    email TEXT UNIQUE,
    avatar_url TEXT,
    phone TEXT,
    date_of_birth DATE,
    gender TEXT CHECK (gender IN ('male', 'female', 'other')),
    address JSONB DEFAULT '{}',
    preferences JSONB DEFAULT '{}',
    is_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Convert catalogs created by the older text-array schema before seeding JSON images.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'products'
      AND column_name = 'images' AND data_type = 'ARRAY'
  ) THEN
    ALTER TABLE public.products ALTER COLUMN images DROP DEFAULT;
    ALTER TABLE public.products ALTER COLUMN images TYPE JSONB USING to_jsonb(images);
    ALTER TABLE public.products ALTER COLUMN images SET DEFAULT '[]'::jsonb;
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_username ON public.user_profiles(username);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_created_at ON public.user_profiles(created_at);

-- Enable Row Level Security
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Username availability is public; profile identifiers and personal fields are not.
DROP POLICY IF EXISTS "Anyone can check username availability" ON public.user_profiles;
CREATE POLICY "Anyone can check username availability" ON public.user_profiles
    FOR SELECT TO anon USING (true);

-- Create policies for user_profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_profiles;
CREATE POLICY "Users can view their own profile" ON public.user_profiles
    FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles;
CREATE POLICY "Users can update their own profile" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.user_profiles;
CREATE POLICY "Users can insert their own profile" ON public.user_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Create function to handle user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (id, full_name, email, username)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
        NEW.email,
        NULLIF(NEW.raw_user_meta_data->>'username', '')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to automatically create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update updated_at on profile changes
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create orders table for customer order history
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    order_number TEXT UNIQUE NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),
    total_amount DECIMAL(10,2) NOT NULL,
    subtotal_amount DECIMAL(10,2) NOT NULL,
    delivery_fee_amount DECIMAL(10,2),
    total_is_final BOOLEAN NOT NULL DEFAULT FALSE,
    idempotency_key UUID,
    request_fingerprint TEXT,
    currency TEXT DEFAULT 'ETB',
    shipping_address JSONB,
    billing_address JSONB,
    payment_method TEXT,
    payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Keep existing order totals as historical subtotals while making new orders
-- explicitly provisional until the delivery fee is confirmed.
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS subtotal_amount DECIMAL(10,2);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_fee_amount DECIMAL(10,2);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS total_is_final BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS idempotency_key UUID;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS request_fingerprint TEXT;
UPDATE public.orders SET subtotal_amount = total_amount WHERE subtotal_amount IS NULL;
UPDATE public.orders
SET total_is_final = FALSE
WHERE delivery_fee_amount IS NULL AND total_is_final = TRUE;
ALTER TABLE public.orders ALTER COLUMN subtotal_amount SET NOT NULL;
ALTER TABLE public.orders ALTER COLUMN total_is_final SET DEFAULT FALSE;
CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_user_idempotency
    ON public.orders(user_id, idempotency_key)
    WHERE idempotency_key IS NOT NULL;

-- Enable RLS for orders
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Create policies for orders
DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;
CREATE POLICY "Users can view their own orders" ON public.orders
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own orders" ON public.orders;

-- Create indexes for orders
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at);

CREATE TABLE IF NOT EXISTS public.order_status_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    actor_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    previous_status TEXT NOT NULL,
    new_status TEXT NOT NULL,
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_status_history_order_created
    ON public.order_status_history(order_id, created_at DESC);

ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.order_status_history FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE public.order_status_history TO service_role;

CREATE OR REPLACE FUNCTION public.admin_transition_order_status(
    p_order_id UUID,
    p_actor_user_id UUID,
    p_expected_status TEXT,
    p_new_status TEXT,
    p_reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_order RECORD;
    v_reason TEXT := NULLIF(BTRIM(p_reason), '');
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM auth.users
        WHERE id = p_actor_user_id
          AND raw_app_meta_data->>'role' = 'admin'
    ) THEN
        RAISE EXCEPTION USING MESSAGE = 'ADMIN_REQUIRED', ERRCODE = '42501';
    END IF;

    IF p_order_id IS NULL
       OR p_actor_user_id IS NULL
       OR p_expected_status IS NULL
       OR p_new_status IS NULL
       OR p_new_status NOT IN ('shipped', 'delivered')
       OR (v_reason IS NOT NULL AND LENGTH(v_reason) > 500) THEN
        RAISE EXCEPTION USING MESSAGE = 'ORDER_INVALID_TRANSITION', ERRCODE = '22023';
    END IF;

    SELECT id, status, payment_status
    INTO v_order
    FROM public.orders
    WHERE id = p_order_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION USING MESSAGE = 'ORDER_NOT_FOUND', ERRCODE = 'P0002';
    END IF;
    IF v_order.status IS DISTINCT FROM p_expected_status THEN
        RAISE EXCEPTION USING MESSAGE = 'ORDER_STATUS_CHANGED', ERRCODE = '40001';
    END IF;
    IF v_order.payment_status IS DISTINCT FROM 'paid'
       OR NOT COALESCE(
           (v_order.status = 'processing' AND p_new_status = 'shipped')
           OR (v_order.status = 'shipped' AND p_new_status = 'delivered'),
           FALSE
       ) THEN
        RAISE EXCEPTION USING MESSAGE = 'ORDER_INVALID_TRANSITION', ERRCODE = '22023';
    END IF;

    UPDATE public.orders
    SET status = p_new_status, updated_at = NOW()
    WHERE id = p_order_id;

    INSERT INTO public.order_status_history (
        order_id, actor_user_id, previous_status, new_status, reason
    )
    VALUES (
        p_order_id, p_actor_user_id, v_order.status, p_new_status, v_reason
    );

    RETURN TRUE;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_transition_order_status(UUID, UUID, TEXT, TEXT, TEXT)
    FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_transition_order_status(UUID, UUID, TEXT, TEXT, TEXT)
    TO service_role;

-- Create trigger for orders updated_at
DROP TRIGGER IF EXISTS update_orders_updated_at ON public.orders;
CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON public.orders
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Customer profile fields are editable; order creation and fulfillment stay server-controlled.
REVOKE ALL ON TABLE public.user_profiles FROM anon, authenticated;
REVOKE ALL ON TABLE public.orders FROM anon, authenticated;
GRANT SELECT ON TABLE public.user_profiles TO authenticated;
GRANT SELECT (username) ON TABLE public.user_profiles TO anon;
GRANT INSERT (id, email, full_name, username, phone, date_of_birth, gender, avatar_url, address, preferences, updated_at)
  ON TABLE public.user_profiles TO authenticated;
GRANT UPDATE (id, email, full_name, username, phone, date_of_birth, gender, avatar_url, address, preferences, updated_at)
  ON TABLE public.user_profiles TO authenticated;
GRANT SELECT ON TABLE public.orders TO authenticated;

-- AK ECOMM Product and Category Tables
-- Catalog tables used by AK Drop Modern

-- Create categories table
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    image_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create products table
CREATE TABLE IF NOT EXISTS public.products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    short_description TEXT,
    price DECIMAL(10,2) NOT NULL,
    compare_price DECIMAL(10,2),
    cost_price DECIMAL(10,2),
    sku TEXT UNIQUE,
    barcode TEXT,
    track_quantity BOOLEAN DEFAULT TRUE,
    quantity INTEGER DEFAULT 0,
    weight DECIMAL(8,2),
    dimensions JSONB DEFAULT '{}',
    category_id UUID REFERENCES public.categories(id),
    images JSONB DEFAULT '[]',
    is_featured BOOLEAN DEFAULT FALSE,
    is_new_arrival BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    seo_title TEXT,
    seo_description TEXT,
    tags TEXT[],
    attributes JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Convert catalogs created by the older text-array schema before seeding JSON images.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'products'
      AND column_name = 'images' AND data_type = 'ARRAY'
  ) THEN
    ALTER TABLE public.products ALTER COLUMN images DROP DEFAULT;
    ALTER TABLE public.products ALTER COLUMN images TYPE JSONB USING to_jsonb(images);
    ALTER TABLE public.products ALTER COLUMN images SET DEFAULT '[]'::jsonb;
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_categories_slug ON public.categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_active ON public.categories(is_active);
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_featured ON public.products(is_featured);
CREATE INDEX IF NOT EXISTS idx_products_new_arrival ON public.products(is_new_arrival);
CREATE INDEX IF NOT EXISTS idx_products_active ON public.products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_price ON public.products(price);

-- Enable Row Level Security
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Remove unconditional catalog policies created by earlier fix scripts.
DROP POLICY IF EXISTS "Public can view categories" ON public.categories;
DROP POLICY IF EXISTS "Public can view products" ON public.products;
-- Create policies for categories (public read access)
DROP POLICY IF EXISTS "Anyone can view active categories" ON public.categories;
CREATE POLICY "Anyone can view active categories" ON public.categories
    FOR SELECT USING (is_active = true);

-- Create policies for products (public read access)
DROP POLICY IF EXISTS "Anyone can view active products" ON public.products;
CREATE POLICY "Anyone can view active products" ON public.products
    FOR SELECT USING (is_active = true);

-- Create trigger for categories updated_at
DROP TRIGGER IF EXISTS update_categories_updated_at ON public.categories;
CREATE TRIGGER update_categories_updated_at
    BEFORE UPDATE ON public.categories
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for products updated_at
DROP TRIGGER IF EXISTS update_products_updated_at ON public.products;
CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON public.products
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Grant permissions
REVOKE ALL ON TABLE public.categories, public.products FROM anon, authenticated;
GRANT SELECT ON public.categories TO anon, authenticated;
GRANT SELECT ON public.products TO anon, authenticated;



-- Commerce extension tables

-- =============================================================================
-- MISSING TABLES FROM PHP VERSION
-- =============================================================================

-- 1. ORDER ITEMS TABLE
-- Stores individual items within each order (replaces PHP orders_items table)
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    product_slug TEXT,
    product_image TEXT,
    product_sku TEXT,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10,2) NOT NULL CHECK (unit_price >= 0),
    total_price DECIMAL(10,2) NOT NULL CHECK (total_price >= 0),
    size TEXT,
    color TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.order_items
    ADD COLUMN IF NOT EXISTS variant_attributes JSONB NOT NULL DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product ON public.order_items(product_id);

-- Customer-visible order notifications; inserts are created by trusted
-- database functions/triggers, while customers may manage read/delete state.
CREATE TABLE IF NOT EXISTS public.user_notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    type TEXT NOT NULL DEFAULT 'order' CHECK (type IN ('order', 'promo', 'system')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_notifications_unread
    ON public.user_notifications(user_id, is_read, created_at DESC);

ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own notifications" ON public.user_notifications;
CREATE POLICY "Users can view their own notifications" ON public.user_notifications
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own notification read state" ON public.user_notifications;
CREATE POLICY "Users can update their own notification read state" ON public.user_notifications
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own notifications" ON public.user_notifications;
CREATE POLICY "Users can delete their own notifications" ON public.user_notifications
    FOR DELETE USING (auth.uid() = user_id);

REVOKE ALL ON TABLE public.user_notifications FROM anon, authenticated;
GRANT SELECT, DELETE ON TABLE public.user_notifications TO authenticated;
GRANT UPDATE (is_read) ON TABLE public.user_notifications TO authenticated;

INSERT INTO public.user_notifications (user_id, order_id, type, title, message, created_at)
SELECT orders.user_id,
       orders.id,
       'order',
       'Order received',
       'Your order #' || orders.order_number || ' has been placed and is awaiting confirmation.',
       orders.created_at
FROM public.orders AS orders
WHERE orders.user_id IS NOT NULL
  AND NOT EXISTS (
      SELECT 1
      FROM public.user_notifications AS notifications
      WHERE notifications.order_id = orders.id
        AND notifications.title = 'Order received'
  );

-- Create an authenticated order and decrement tracked inventory atomically.
CREATE OR REPLACE FUNCTION public.create_customer_order(
    p_idempotency_key UUID,
    p_items JSONB,
    p_shipping_address JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_fingerprint TEXT;
    v_existing_fingerprint TEXT;
    v_existing_subtotal DECIMAL(10,2);
    v_existing_status TEXT;
    v_existing_payment_status TEXT;
    v_order_id UUID;
    v_order_number TEXT;
    v_subtotal DECIMAL(10,2) := 0;
    v_product RECORD;
    v_variant RECORD;
    v_item RECORD;
    v_unit_price DECIMAL(10,2);
    v_has_variants BOOLEAN;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION USING MESSAGE = 'ORDER_AUTH_REQUIRED', ERRCODE = '28000';
    END IF;
    INSERT INTO public.user_profiles (id, full_name, email)
    SELECT id,
           COALESCE(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name'),
           email
    FROM auth.users
    WHERE id = v_user_id
    ON CONFLICT (id) DO NOTHING;
    IF p_idempotency_key IS NULL
       OR p_items IS NULL
       OR jsonb_typeof(p_items) <> 'array' THEN
        RAISE EXCEPTION USING MESSAGE = 'ORDER_INVALID_ITEMS', ERRCODE = '22023';
    END IF;
    IF jsonb_array_length(p_items) < 1 OR jsonb_array_length(p_items) > 30 THEN
        RAISE EXCEPTION USING MESSAGE = 'ORDER_INVALID_ITEMS', ERRCODE = '22023';
    END IF;
    IF p_shipping_address IS NULL
       OR jsonb_typeof(p_shipping_address) <> 'object'
       OR length(trim(COALESCE(p_shipping_address->>'full_name', ''))) NOT BETWEEN 2 AND 100
       OR length(trim(COALESCE(p_shipping_address->>'email', ''))) NOT BETWEEN 3 AND 254
       OR length(trim(COALESCE(p_shipping_address->>'phone', ''))) NOT BETWEEN 7 AND 30
       OR length(trim(COALESCE(p_shipping_address->>'country', ''))) NOT BETWEEN 2 AND 80
       OR length(trim(COALESCE(p_shipping_address->>'address', ''))) NOT BETWEEN 5 AND 300
       OR length(trim(COALESCE(p_shipping_address->>'city', ''))) NOT BETWEEN 2 AND 80
       OR length(COALESCE(p_shipping_address->>'region', '')) > 80
       OR length(COALESCE(p_shipping_address->>'postal_code', '')) > 20
       OR length(COALESCE(p_shipping_address->>'delivery_instructions', '')) > 500 THEN
        RAISE EXCEPTION USING MESSAGE = 'ORDER_INVALID_ADDRESS', ERRCODE = '22023';
    END IF;
    IF EXISTS (
        SELECT 1
        FROM jsonb_array_elements(p_items) AS line(value)
        WHERE jsonb_typeof(line.value) <> 'object'
           OR COALESCE(line.value->>'product_id', '') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
           OR COALESCE(line.value->>'variant_id', '') !~* '^$|^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
           OR COALESCE(line.value->>'quantity', '') !~ '^[1-9][0-9]{0,2}$'
           OR COALESCE(line.value->>'expected_unit_price', '') !~ '^[0-9]+(\.[0-9]{1,2})?$'
    ) THEN
        RAISE EXCEPTION USING MESSAGE = 'ORDER_INVALID_ITEMS', ERRCODE = '22023';
    END IF;
    IF (
        SELECT count(*) <> count(DISTINCT (
            (line.value->>'product_id') || ':' || COALESCE(NULLIF(line.value->>'variant_id', ''), 'default')
        ))
        FROM jsonb_array_elements(p_items) AS line(value)
    ) THEN
        RAISE EXCEPTION USING MESSAGE = 'ORDER_INVALID_ITEMS', ERRCODE = '22023';
    END IF;
    IF length(trim(COALESCE(p_shipping_address->>'email', ''))) > 254
       OR trim(p_shipping_address->>'email') !~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'
       OR trim(p_shipping_address->>'phone') !~ '^\+?[0-9 ()-]{7,30}$' THEN
        RAISE EXCEPTION USING MESSAGE = 'ORDER_INVALID_ADDRESS', ERRCODE = '22023';
    END IF;

    v_fingerprint := md5(p_items::TEXT || '|' || p_shipping_address::TEXT);

    SELECT id, order_number, request_fingerprint, subtotal_amount, status, payment_status
    INTO v_order_id, v_order_number, v_existing_fingerprint, v_existing_subtotal,
         v_existing_status, v_existing_payment_status
    FROM public.orders
    WHERE user_id = v_user_id AND idempotency_key = p_idempotency_key;
    IF v_order_id IS NOT NULL THEN
        IF v_existing_fingerprint IS DISTINCT FROM v_fingerprint THEN
            RAISE EXCEPTION USING MESSAGE = 'ORDER_IDEMPOTENCY_CONFLICT', ERRCODE = '22023';
        END IF;
        RETURN jsonb_build_object(
            'id', v_order_id,
            'order_number', v_order_number,
            'subtotal_amount', v_existing_subtotal,
            'total_is_final', FALSE,
            'status', v_existing_status,
            'payment_status', v_existing_payment_status
        );
    END IF;

    -- Lock products and variants in a stable order before validating stock.
    FOR v_item IN
        SELECT DISTINCT (line.value->>'product_id')::UUID AS product_id
        FROM jsonb_array_elements(p_items) AS line(value)
        ORDER BY product_id
    LOOP
        SELECT id INTO v_product
        FROM public.products
        WHERE id = v_item.product_id
        FOR UPDATE;
    END LOOP;
    FOR v_item IN
        SELECT DISTINCT NULLIF(line.value->>'variant_id', '')::UUID AS variant_id
        FROM jsonb_array_elements(p_items) AS line(value)
        WHERE NULLIF(line.value->>'variant_id', '') IS NOT NULL
        ORDER BY variant_id
    LOOP
        PERFORM id
        FROM public.product_variants
        WHERE id = v_item.variant_id
        FOR UPDATE;
    END LOOP;

    SELECT id, order_number, request_fingerprint, subtotal_amount, status, payment_status
    INTO v_order_id, v_order_number, v_existing_fingerprint, v_existing_subtotal,
         v_existing_status, v_existing_payment_status
    FROM public.orders
    WHERE user_id = v_user_id AND idempotency_key = p_idempotency_key;
    IF v_order_id IS NOT NULL THEN
        IF v_existing_fingerprint IS DISTINCT FROM v_fingerprint THEN
            RAISE EXCEPTION USING MESSAGE = 'ORDER_IDEMPOTENCY_CONFLICT', ERRCODE = '22023';
        END IF;
        RETURN jsonb_build_object(
            'id', v_order_id,
            'order_number', v_order_number,
            'subtotal_amount', v_existing_subtotal,
            'total_is_final', FALSE,
            'status', v_existing_status,
            'payment_status', v_existing_payment_status
        );
    END IF;

    FOR v_item IN
        SELECT (line.value->>'product_id')::UUID AS product_id,
               NULLIF(line.value->>'variant_id', '')::UUID AS variant_id,
               (line.value->>'quantity')::INTEGER AS quantity,
               (line.value->>'expected_unit_price')::DECIMAL(10,2) AS expected_unit_price
        FROM jsonb_array_elements(p_items) AS line(value)
        ORDER BY (line.value->>'product_id'), COALESCE(line.value->>'variant_id', '')
    LOOP
        SELECT id, name, slug, price, sku, quantity, track_quantity, images, is_active
        INTO v_product
        FROM public.products
        WHERE id = v_item.product_id;

        IF NOT FOUND OR v_product.is_active IS DISTINCT FROM TRUE THEN
            RAISE EXCEPTION USING MESSAGE = 'ORDER_PRODUCT_UNAVAILABLE', ERRCODE = '22023';
        END IF;
        IF v_product.price IS NULL OR v_product.price < 0 THEN
            RAISE EXCEPTION USING MESSAGE = 'ORDER_PRODUCT_UNAVAILABLE', ERRCODE = '22023';
        END IF;

        SELECT EXISTS (
            SELECT 1 FROM public.product_variants
            WHERE product_id = v_item.product_id
        ) INTO v_has_variants;

        IF v_item.variant_id IS NULL AND v_has_variants THEN
            RAISE EXCEPTION USING MESSAGE = 'ORDER_VARIANT_REQUIRED', ERRCODE = '22023';
        ELSIF v_item.variant_id IS NOT NULL THEN
            SELECT id, product_id, sku, size, color, attributes, price_adjustment,
                   price_override, stock_quantity, is_active, image_url
            INTO v_variant
            FROM public.product_variants
            WHERE id = v_item.variant_id
              AND product_id = v_item.product_id
              AND is_active = TRUE;
            IF NOT FOUND THEN
                RAISE EXCEPTION USING MESSAGE = 'ORDER_VARIANT_UNAVAILABLE', ERRCODE = '22023';
            END IF;
            v_unit_price := COALESCE(
                v_variant.price_override,
                v_product.price + COALESCE(v_variant.price_adjustment, 0)
            );
            IF COALESCE(v_variant.stock_quantity, 0) < v_item.quantity THEN
                RAISE EXCEPTION USING MESSAGE = 'ORDER_STOCK_CHANGED', ERRCODE = '22023';
            END IF;
        ELSE
            v_unit_price := v_product.price;
            IF COALESCE(v_product.track_quantity, TRUE)
               AND COALESCE(v_product.quantity, 0) < v_item.quantity THEN
                RAISE EXCEPTION USING MESSAGE = 'ORDER_STOCK_CHANGED', ERRCODE = '22023';
            END IF;
        END IF;
        IF v_unit_price IS NULL OR v_unit_price < 0 THEN
            RAISE EXCEPTION USING MESSAGE = 'ORDER_PRODUCT_UNAVAILABLE', ERRCODE = '22023';
        END IF;
        IF v_unit_price <> v_item.expected_unit_price THEN
            RAISE EXCEPTION USING MESSAGE = 'ORDER_PRICE_CHANGED', ERRCODE = '22023';
        END IF;
        IF v_unit_price > (99999999.99 - v_subtotal) / v_item.quantity THEN
            RAISE EXCEPTION USING MESSAGE = 'ORDER_TOTAL_LIMIT', ERRCODE = '22023';
        END IF;
        v_subtotal := v_subtotal + (v_unit_price * v_item.quantity);
    END LOOP;

    INSERT INTO public.orders (
        user_id, order_number, status, total_amount, subtotal_amount,
        delivery_fee_amount, total_is_final, idempotency_key, request_fingerprint,
        currency, shipping_address, payment_method, payment_status
    )
    VALUES (
        v_user_id,
        'AKD-' || upper(substr(replace(gen_random_uuid()::TEXT, '-', ''), 1, 12)),
        'pending',
        v_subtotal,
        v_subtotal,
        NULL,
        FALSE,
        p_idempotency_key,
        v_fingerprint,
        'ETB',
        p_shipping_address,
        'stripe',
        'pending'
    )
    ON CONFLICT (user_id, idempotency_key)
        WHERE idempotency_key IS NOT NULL
        DO NOTHING
    RETURNING id, order_number INTO v_order_id, v_order_number;

    IF v_order_id IS NULL THEN
        SELECT id, order_number, request_fingerprint, subtotal_amount, status, payment_status
        INTO v_order_id, v_order_number, v_existing_fingerprint, v_existing_subtotal,
             v_existing_status, v_existing_payment_status
        FROM public.orders
        WHERE user_id = v_user_id AND idempotency_key = p_idempotency_key;
        IF v_existing_fingerprint IS DISTINCT FROM v_fingerprint THEN
            RAISE EXCEPTION USING MESSAGE = 'ORDER_IDEMPOTENCY_CONFLICT', ERRCODE = '22023';
        END IF;
        RETURN jsonb_build_object(
            'id', v_order_id,
            'order_number', v_order_number,
            'subtotal_amount', v_existing_subtotal,
            'total_is_final', FALSE,
            'status', v_existing_status,
            'payment_status', v_existing_payment_status
        );
    END IF;

    FOR v_item IN
        SELECT (line.value->>'product_id')::UUID AS product_id,
               NULLIF(line.value->>'variant_id', '')::UUID AS variant_id,
               (line.value->>'quantity')::INTEGER AS quantity
        FROM jsonb_array_elements(p_items) AS line(value)
        ORDER BY (line.value->>'product_id'), COALESCE(line.value->>'variant_id', '')
    LOOP
        SELECT id, name, slug, price, sku, images
        INTO v_product
        FROM public.products
        WHERE id = v_item.product_id;
        SELECT sku, size, color, attributes, price_adjustment, price_override, image_url
        INTO v_variant
        FROM public.product_variants
        WHERE id = v_item.variant_id AND product_id = v_item.product_id;
        IF v_item.variant_id IS NOT NULL THEN
            v_unit_price := COALESCE(
                v_variant.price_override,
                v_product.price + COALESCE(v_variant.price_adjustment, 0)
            );
            UPDATE public.product_variants
            SET stock_quantity = stock_quantity - v_item.quantity
            WHERE id = v_item.variant_id
              AND stock_quantity >= v_item.quantity;
        ELSE
            v_unit_price := v_product.price;
            UPDATE public.products
            SET quantity = quantity - v_item.quantity
            WHERE id = v_item.product_id
              AND COALESCE(track_quantity, TRUE)
              AND quantity >= v_item.quantity;
        END IF;

        INSERT INTO public.order_items (
            order_id, product_id, product_name, product_slug, product_image,
            product_sku, quantity, unit_price, total_price, variant_id,
            variant_attributes, size, color
        )
        VALUES (
            v_order_id, v_item.product_id, v_product.name, v_product.slug,
            COALESCE(v_variant.image_url, v_product.images->>0),
            COALESCE(v_variant.sku, v_product.sku), v_item.quantity,
            v_unit_price, v_unit_price * v_item.quantity, v_item.variant_id,
            COALESCE(v_variant.attributes, '{}'::jsonb), v_variant.size, v_variant.color
        );
    END LOOP;

    INSERT INTO public.user_notifications (user_id, order_id, type, title, message)
    VALUES (
        v_user_id,
        v_order_id,
        'order',
        'Payment pending',
        'Your order #' || v_order_number || ' is awaiting Stripe payment.'
    );

    RETURN jsonb_build_object(
        'id', v_order_id,
        'order_number', v_order_number,
        'subtotal_amount', v_subtotal,
        'total_is_final', FALSE,
        'status', 'pending',
        'payment_status', 'pending'
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_customer_order_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    IF NEW.status IS DISTINCT FROM OLD.status THEN
        INSERT INTO public.user_notifications (user_id, order_id, type, title, message)
        VALUES (
            NEW.user_id,
            NEW.id,
            'order',
            'Order ' || replace(NEW.status, '_', ' '),
            'Your order #' || NEW.order_number || ' is now ' || replace(NEW.status, '_', ' ') || '.'
        );
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS notify_customer_order_status ON public.orders;
CREATE TRIGGER notify_customer_order_status
    AFTER UPDATE OF status ON public.orders
    FOR EACH ROW
    WHEN (OLD.status IS DISTINCT FROM NEW.status)
    EXECUTE FUNCTION public.notify_customer_order_status();

REVOKE ALL ON FUNCTION public.create_customer_order(UUID, JSONB, JSONB) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.notify_customer_order_status() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_customer_order(UUID, JSONB, JSONB) TO authenticated;

-- 2. PAYMENTS TABLE
-- Stores payment transactions (replaces PHP payments table)
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    stripe_payment_intent_id TEXT UNIQUE,
    stripe_checkout_session_id TEXT UNIQUE,
    stripe_charge_id TEXT,
    amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
    currency TEXT DEFAULT 'ETB' NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'succeeded', 'failed', 'cancelled', 'refunded')),
    payment_method TEXT,
    payment_method_details JSONB DEFAULT '{}',
    failure_message TEXT,
    receipt_url TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_order ON public.payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_user ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_stripe_intent ON public.payments(stripe_payment_intent_id);
ALTER TABLE public.payments
    ADD COLUMN IF NOT EXISTS stripe_checkout_session_id TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_stripe_checkout_session
    ON public.payments(stripe_checkout_session_id)
    WHERE stripe_checkout_session_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.cancel_unpaid_stripe_order(p_order_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_order RECORD;
BEGIN
    SELECT status, payment_status, order_number
    INTO v_order
    FROM public.orders
    WHERE id = p_order_id AND payment_method = 'stripe'
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    IF v_order.status <> 'pending' OR v_order.payment_status <> 'pending' THEN
        RETURN FALSE;
    END IF;
    IF EXISTS (
        SELECT 1 FROM public.payments
        WHERE order_id = p_order_id AND status = 'pending'
    ) THEN
        RETURN FALSE;
    END IF;

    UPDATE public.orders
    SET status = 'cancelled', payment_status = 'failed', updated_at = NOW()
    WHERE id = p_order_id;
    DELETE FROM public.user_notifications
    WHERE order_id = p_order_id AND title = 'Payment pending';
    UPDATE public.payments
    SET status = 'cancelled',
        failure_message = 'Stripe Checkout could not be started',
        updated_at = NOW()
    WHERE order_id = p_order_id AND status = 'pending';
    UPDATE public.product_variants AS variant
    SET stock_quantity = COALESCE(variant.stock_quantity, 0) + order_item.quantity
    FROM public.order_items AS order_item
    WHERE order_item.order_id = p_order_id
      AND order_item.variant_id = variant.id;
    UPDATE public.products AS product
    SET quantity = COALESCE(product.quantity, 0) + order_item.quantity
    FROM public.order_items AS order_item
    WHERE order_item.order_id = p_order_id
      AND order_item.product_id = product.id
      AND order_item.variant_id IS NULL
      AND COALESCE(product.track_quantity, TRUE);

    RETURN TRUE;
END;
$$;

DROP FUNCTION IF EXISTS public.resolve_stripe_checkout(TEXT, TEXT, TEXT, JSONB);
CREATE OR REPLACE FUNCTION public.resolve_stripe_checkout(
    p_checkout_session_id TEXT,
    p_payment_intent_id TEXT,
    p_outcome TEXT,
    p_billing_address JSONB,
    p_amount_total BIGINT,
    p_currency TEXT,
    p_metadata_order_id UUID,
    p_metadata_user_id UUID,
    p_client_reference_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_order_id UUID;
    v_order RECORD;
BEGIN
    IF p_outcome IS NULL OR p_outcome NOT IN ('paid', 'cancelled')
       OR p_checkout_session_id IS NULL
       OR p_currency IS NULL
       OR p_metadata_order_id IS NULL
       OR p_metadata_user_id IS NULL
       OR p_client_reference_id IS NULL THEN
        RAISE EXCEPTION USING MESSAGE = 'STRIPE_INVALID_OUTCOME', ERRCODE = '22023';
    END IF;

    SELECT payments.order_id, payments.amount, payments.currency,
           orders.user_id, orders.status, orders.payment_status, orders.order_number
    INTO v_order
    FROM public.payments AS payments
    JOIN public.orders AS orders ON orders.id = payments.order_id
    WHERE payments.stripe_checkout_session_id = p_checkout_session_id
    FOR UPDATE OF orders, payments;
    IF NOT FOUND THEN
        RAISE EXCEPTION USING MESSAGE = 'STRIPE_CHECKOUT_NOT_FOUND', ERRCODE = 'P0002';
    END IF;
    v_order_id := v_order.order_id;

    IF p_metadata_order_id IS DISTINCT FROM v_order_id
       OR p_metadata_user_id IS DISTINCT FROM v_order.user_id
       OR p_client_reference_id IS DISTINCT FROM v_order.user_id
       OR lower(p_currency) IS DISTINCT FROM lower(v_order.currency)
       OR p_amount_total IS NULL
       OR p_amount_total <> round(v_order.amount * 100)::BIGINT THEN
        RAISE EXCEPTION USING MESSAGE = 'STRIPE_PAYMENT_MISMATCH', ERRCODE = '22023';
    END IF;

    IF p_outcome = 'paid' THEN
        IF v_order.status = 'cancelled' OR v_order.payment_status IN ('failed', 'refunded') THEN
            RAISE EXCEPTION USING MESSAGE = 'STRIPE_ORDER_NOT_PAYABLE', ERRCODE = '22023';
        END IF;

        UPDATE public.payments
        SET stripe_payment_intent_id = COALESCE(p_payment_intent_id, stripe_payment_intent_id),
            status = 'succeeded',
            failure_message = NULL,
            updated_at = NOW()
        WHERE stripe_checkout_session_id = p_checkout_session_id;

        UPDATE public.orders
        SET payment_method = 'stripe',
            payment_status = 'paid',
            billing_address = COALESCE(p_billing_address, billing_address),
            status = CASE WHEN status = 'pending' THEN 'processing' ELSE status END,
            updated_at = NOW()
        WHERE id = v_order_id;
        UPDATE public.user_notifications
        SET title = 'Payment confirmed',
            message = 'Your payment for order #' || v_order.order_number || ' was confirmed.',
            is_read = FALSE
        WHERE order_id = v_order_id AND title = 'Payment pending';
        RETURN;
    END IF;

    UPDATE public.payments
    SET status = 'cancelled', updated_at = NOW()
    WHERE stripe_checkout_session_id = p_checkout_session_id
      AND status = 'pending';

    IF v_order.payment_status = 'paid' OR v_order.status <> 'pending'
       OR EXISTS (
           SELECT 1 FROM public.payments
           WHERE order_id = v_order_id AND status = 'pending'
       ) THEN
        RETURN;
    END IF;

    UPDATE public.orders
    SET status = 'cancelled', payment_status = 'failed', updated_at = NOW()
    WHERE id = v_order_id;
    DELETE FROM public.user_notifications
    WHERE order_id = v_order_id AND title = 'Payment pending';
    UPDATE public.product_variants AS variant
    SET stock_quantity = COALESCE(variant.stock_quantity, 0) + order_item.quantity
    FROM public.order_items AS order_item
    WHERE order_item.order_id = v_order_id
      AND order_item.variant_id = variant.id;
    UPDATE public.products AS product
    SET quantity = COALESCE(product.quantity, 0) + order_item.quantity
    FROM public.order_items AS order_item
    WHERE order_item.order_id = v_order_id
      AND order_item.product_id = product.id
      AND order_item.variant_id IS NULL
      AND COALESCE(product.track_quantity, TRUE);
END;
$$;

REVOKE ALL ON FUNCTION public.cancel_unpaid_stripe_order(UUID)
    FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_unpaid_stripe_order(UUID) TO service_role;
REVOKE ALL ON FUNCTION public.resolve_stripe_checkout(TEXT, TEXT, TEXT, JSONB, BIGINT, TEXT, UUID, UUID, UUID)
    FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.resolve_stripe_checkout(TEXT, TEXT, TEXT, JSONB, BIGINT, TEXT, UUID, UUID, UUID)
    TO service_role;

-- 3. NEWSLETTER SUBSCRIBERS TABLE
-- Stores email subscribers (replaces PHP newsletter_subscribers table)
CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    verification_token TEXT UNIQUE,
    is_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    verified_at TIMESTAMP WITH TIME ZONE,
    unsubscribed_at TIMESTAMP WITH TIME ZONE,
    source TEXT DEFAULT 'website',
    metadata JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_newsletter_email ON public.newsletter_subscribers(email);
CREATE INDEX IF NOT EXISTS idx_newsletter_verified ON public.newsletter_subscribers(is_verified);
CREATE INDEX IF NOT EXISTS idx_newsletter_active ON public.newsletter_subscribers(is_active);

-- 4. BLOG POSTS TABLE
-- Stores blog content (new feature)
CREATE TABLE IF NOT EXISTS public.blog_posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    content TEXT NOT NULL,
    excerpt TEXT,
    featured_image TEXT,
    author_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    category TEXT,
    tags TEXT[] DEFAULT '{}',
    is_published BOOLEAN DEFAULT FALSE,
    published_at TIMESTAMP WITH TIME ZONE,
    views INTEGER DEFAULT 0,
    reading_time INTEGER,
    seo_title TEXT,
    seo_description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_blog_slug ON public.blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_author ON public.blog_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_blog_published ON public.blog_posts(is_published, published_at);
CREATE INDEX IF NOT EXISTS idx_blog_category ON public.blog_posts(category);

-- 5. PRODUCT REVIEWS TABLE
-- Stores customer reviews and ratings
CREATE TABLE IF NOT EXISTS public.product_reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title TEXT,
    comment TEXT NOT NULL,
    is_verified_purchase BOOLEAN DEFAULT FALSE,
    is_approved BOOLEAN DEFAULT FALSE,
    helpful_count INTEGER DEFAULT 0,
    unhelpful_count INTEGER DEFAULT 0,
    images TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(product_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_reviews_product ON public.product_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user ON public.product_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_approved ON public.product_reviews(is_approved);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON public.product_reviews(rating);

-- 6. CONTACT SUBMISSIONS TABLE
-- Stores contact form submissions
CREATE TABLE IF NOT EXISTS public.contact_submissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    subject TEXT,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'resolved', 'spam')),
    admin_notes TEXT,
    replied_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contact_status ON public.contact_submissions(status);
CREATE INDEX IF NOT EXISTS idx_contact_email ON public.contact_submissions(email);
CREATE INDEX IF NOT EXISTS idx_contact_created ON public.contact_submissions(created_at);

-- 7. PRODUCT VARIANTS TABLE
-- Stores product variations (sizes, colors, etc.)
CREATE TABLE IF NOT EXISTS public.product_variants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    sku TEXT UNIQUE,
    size TEXT,
    color TEXT,
    price_adjustment DECIMAL(10,2) DEFAULT 0,
    stock_quantity INTEGER DEFAULT 0 CHECK (stock_quantity >= 0),
    is_active BOOLEAN DEFAULT TRUE,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.product_variants
    ADD COLUMN IF NOT EXISTS attributes JSONB NOT NULL DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS price_override DECIMAL(10,2)
        CHECK (price_override IS NULL OR price_override >= 0);

ALTER TABLE public.order_items
    ADD COLUMN IF NOT EXISTS variant_id UUID REFERENCES public.product_variants(id) ON DELETE RESTRICT;

CREATE INDEX IF NOT EXISTS idx_variants_product ON public.product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_variants_sku ON public.product_variants(sku);
CREATE INDEX IF NOT EXISTS idx_order_items_variant ON public.order_items(variant_id);

-- 8. WISHLIST TABLE
-- Stores user wishlists
CREATE TABLE IF NOT EXISTS public.wishlist (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_wishlist_user ON public.wishlist(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_product ON public.wishlist(product_id);

-- 9. COUPONS TABLE
-- Stores discount coupons
CREATE TABLE IF NOT EXISTS public.coupons (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    description TEXT,
    discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed_amount')),
    discount_value DECIMAL(10,2) NOT NULL CHECK (discount_value > 0),
    minimum_order_value DECIMAL(10,2),
    maximum_discount DECIMAL(10,2),
    usage_limit INTEGER,
    usage_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    valid_from TIMESTAMP WITH TIME ZONE,
    valid_until TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_coupons_code ON public.coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_active ON public.coupons(is_active);

-- 10. COUPON USAGE TABLE
-- Tracks coupon usage per user
CREATE TABLE IF NOT EXISTS public.coupon_usage (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    coupon_id UUID REFERENCES public.coupons(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    discount_amount DECIMAL(10,2) NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_coupon_usage_coupon ON public.coupon_usage(coupon_id);
CREATE INDEX IF NOT EXISTS idx_coupon_usage_user ON public.coupon_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_coupon_usage_order ON public.coupon_usage(order_id);

-- =============================================================================
-- UPDATES TO EXISTING TABLES
-- =============================================================================

-- Add stock management fields to products
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS low_stock_threshold INTEGER DEFAULT 10,
ADD COLUMN IF NOT EXISTS out_of_stock_threshold INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS sales_count INTEGER DEFAULT 0;

-- Add order tracking fields
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS tracking_number TEXT,
ADD COLUMN IF NOT EXISTS carrier TEXT,
ADD COLUMN IF NOT EXISTS estimated_delivery DATE,
ADD COLUMN IF NOT EXISTS coupon_code TEXT,
ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10,2) DEFAULT 0;

-- =============================================================================
-- ROW LEVEL SECURITY POLICIES
-- =============================================================================

-- ORDER ITEMS
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their order items" ON public.order_items;
CREATE POLICY "Users can view their order items" ON public.order_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.orders
            WHERE orders.id = order_items.order_id
            AND orders.user_id = auth.uid()
        )
    );

-- PAYMENTS
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their payments" ON public.payments;
CREATE POLICY "Users can view their payments" ON public.payments
    FOR SELECT USING (user_id = auth.uid());

-- NEWSLETTER SUBSCRIBERS
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can subscribe" ON public.newsletter_subscribers;
CREATE POLICY "Anyone can subscribe" ON public.newsletter_subscribers
    FOR INSERT WITH CHECK (true);

-- BLOG POSTS (public read for published posts)
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view published posts" ON public.blog_posts;
CREATE POLICY "Anyone can view published posts" ON public.blog_posts
    FOR SELECT USING (is_published = true);

-- PRODUCT REVIEWS (authenticated users can create, public can read approved)
ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view approved reviews" ON public.product_reviews;
CREATE POLICY "Anyone can view approved reviews" ON public.product_reviews
    FOR SELECT USING (is_approved = true);

DROP POLICY IF EXISTS "Authenticated users can create reviews" ON public.product_reviews;
CREATE POLICY "Authenticated users can create reviews" ON public.product_reviews
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their reviews" ON public.product_reviews;
CREATE POLICY "Users can update their reviews" ON public.product_reviews
    FOR UPDATE USING (auth.uid() = user_id);

-- CONTACT SUBMISSIONS (anyone can submit)
ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can submit contact form" ON public.contact_submissions;
CREATE POLICY "Anyone can submit contact form" ON public.contact_submissions
    FOR INSERT WITH CHECK (true);

-- PRODUCT VARIANTS (public read)
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active variants" ON public.product_variants;
CREATE POLICY "Anyone can view active variants" ON public.product_variants
    FOR SELECT USING (
        is_active = true
        AND EXISTS (
            SELECT 1
            FROM public.products AS product
            WHERE product.id = product_variants.product_id
              AND product.is_active = true
        )
    );

-- WISHLIST
ALTER TABLE public.wishlist ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their wishlist" ON public.wishlist;
CREATE POLICY "Users can manage their wishlist" ON public.wishlist
    FOR ALL USING (auth.uid() = user_id);

-- COUPONS (public read for active coupons)
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active coupons" ON public.coupons;
CREATE POLICY "Anyone can view active coupons" ON public.coupons
    FOR SELECT USING (is_active = true AND valid_until > NOW());

-- COUPON USAGE
ALTER TABLE public.coupon_usage ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their coupon usage" ON public.coupon_usage;
CREATE POLICY "Users can view their coupon usage" ON public.coupon_usage
    FOR SELECT USING (auth.uid() = user_id);

-- =============================================================================
-- TRIGGERS FOR UPDATED_AT TIMESTAMPS
-- =============================================================================

DROP TRIGGER IF EXISTS update_payments_updated_at ON public.payments;
CREATE TRIGGER update_payments_updated_at
    BEFORE UPDATE ON public.payments
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_blog_posts_updated_at ON public.blog_posts;
CREATE TRIGGER update_blog_posts_updated_at
    BEFORE UPDATE ON public.blog_posts
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_product_reviews_updated_at ON public.product_reviews;
CREATE TRIGGER update_product_reviews_updated_at
    BEFORE UPDATE ON public.product_reviews
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_product_variants_updated_at ON public.product_variants;
CREATE TRIGGER update_product_variants_updated_at
    BEFORE UPDATE ON public.product_variants
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_coupons_updated_at ON public.coupons;
CREATE TRIGGER update_coupons_updated_at
    BEFORE UPDATE ON public.coupons
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================================================
-- GRANT PERMISSIONS
-- =============================================================================

REVOKE ALL ON TABLE public.order_items, public.payments, public.newsletter_subscribers,
  public.blog_posts, public.product_reviews, public.contact_submissions,
  public.product_variants, public.wishlist, public.coupons, public.coupon_usage
  FROM anon, authenticated;
GRANT SELECT ON TABLE public.order_items TO authenticated;
GRANT SELECT ON TABLE public.payments TO authenticated;
GRANT INSERT (email) ON TABLE public.newsletter_subscribers TO anon, authenticated;
GRANT SELECT ON TABLE public.blog_posts TO anon, authenticated;
GRANT SELECT ON TABLE public.product_reviews TO anon, authenticated;
GRANT INSERT (product_id, user_id, rating, title, comment, images)
  ON TABLE public.product_reviews TO authenticated;
GRANT UPDATE (rating, title, comment, images)
  ON TABLE public.product_reviews TO authenticated;
GRANT INSERT (name, email, phone, subject, message)
  ON TABLE public.contact_submissions TO anon, authenticated;
GRANT SELECT ON TABLE public.product_variants TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.wishlist TO authenticated;
GRANT SELECT ON TABLE public.coupons TO anon, authenticated;
GRANT SELECT ON TABLE public.coupon_usage TO authenticated;
-- =============================================================================

-- Remove SECURITY DEFINER analytics helpers from earlier setup scripts. Their
-- default public execute permission exposed store-wide order and stock data.
DROP TRIGGER IF EXISTS update_product_sales_count ON public.orders;
DROP FUNCTION IF EXISTS public.increment_product_sales();
DROP FUNCTION IF EXISTS public.get_order_stats(TIMESTAMPTZ, TIMESTAMPTZ);
DROP FUNCTION IF EXISTS public.get_low_stock_products();
-- NOTES
-- =============================================================================

-- 1. Remember to set up Supabase Storage bucket for images:
--    - product-images (public reads; uploads are performed only by the
--      server-side admin action after checking app_metadata.role = 'admin')
--    - blog-images (public)
--    - user-avatars (private with user access)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'product-images',
    'product-images',
    TRUE,
    6291456,
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
ON CONFLICT (id) DO UPDATE
SET public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. Configure the Stripe webhook endpoint:
--    - /api/stripe/webhook
--    - Event: checkout.session.completed
--    - Event: checkout.session.expired

-- 3. Configure Resend for transactional emails:
--    - Order confirmations
--    - Newsletter verification
--    - Password resets
--    Contact form delivery uses the EmailJS credentials documented in README.md.

-- 4. Admin product changes and image uploads are allowed only through
--    server actions that verify the Supabase Auth app_metadata role claim.
--    Never grant product write or storage upload access directly to shoppers.
--
-- 5. Provision an admin account:
--    - Create the staff user (or reset/set their password) in Supabase
--      Dashboard > Authentication > Users. Do not insert auth.users manually.
--    - To grant the role from this SQL Editor, replace the email below with
--      that existing user's email and rerun this setup file. The placeholder
--      is deliberately a no-op, so a normal setup run does not grant access.
--    - The update merges app_metadata and preserves existing claims. The user
--      must sign out and back in after this runs so the new JWT includes role.
--    - To revoke access, remove the "role" key from app_metadata in the
--      Supabase Dashboard, or use the revocation statement in README.md.
--
-- Replace only the value below with the exact email of an existing staff user.
-- Never add a password, service-role key, or client-editable user_metadata here.
DO $$
DECLARE
    v_admin_email TEXT := 'REPLACE_WITH_ADMIN_EMAIL';
    v_user_id UUID;
BEGIN
    IF lower(trim(v_admin_email)) = 'replace_with_admin_email' THEN
        RAISE NOTICE 'Admin provisioning skipped; replace REPLACE_WITH_ADMIN_EMAIL to grant the admin role.';
    ELSE
        SELECT id
        INTO v_user_id
        FROM auth.users
        WHERE lower(email) = lower(trim(v_admin_email))
        LIMIT 1;

        IF v_user_id IS NULL THEN
            RAISE NOTICE 'Admin provisioning skipped; no Supabase Auth user exists for the configured email. Create the user, then rerun setup.sql.';
        ELSE
            UPDATE auth.users
            SET raw_app_meta_data =
                    COALESCE(raw_app_meta_data, '{}'::jsonb)
                    || jsonb_build_object('role', 'admin'),
                updated_at = NOW()
            WHERE id = v_user_id;

            RAISE NOTICE 'Admin role granted to the configured existing Supabase Auth user. Sign out and back in to refresh the JWT.';
        END IF;
    END IF;
END $$;

-- 6. Create indexes on frequently queried columns as the database grows

-- =============================================================================
-- COMPLETED
-- =============================================================================

-- Make newly created or updated RPCs available to PostgREST immediately.
CREATE TABLE IF NOT EXISTS public.public_submission_rate_limits (
    bucket_key TEXT PRIMARY KEY,
    window_started_at TIMESTAMPTZ NOT NULL,
    request_count INTEGER NOT NULL CHECK (request_count > 0)
);

CREATE INDEX IF NOT EXISTS idx_public_submission_rate_limits_window
    ON public.public_submission_rate_limits(window_started_at);

ALTER TABLE public.public_submission_rate_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.public_submission_rate_limits FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE public.public_submission_rate_limits TO service_role;

CREATE OR REPLACE FUNCTION public.check_public_submission_rate_limit(
    p_bucket_key TEXT,
    p_max_requests INTEGER,
    p_window_seconds INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_now TIMESTAMPTZ := clock_timestamp();
    v_request_count INTEGER;
BEGIN
    IF p_bucket_key IS NULL OR length(p_bucket_key) = 0 OR length(p_bucket_key) > 256
       OR p_max_requests IS NULL OR p_max_requests < 1 OR p_max_requests > 1000
       OR p_window_seconds IS NULL OR p_window_seconds < 1 OR p_window_seconds > 86400 THEN
        RAISE EXCEPTION 'Invalid public submission rate limit parameters.';
    END IF;

    DELETE FROM public.public_submission_rate_limits
    WHERE window_started_at < v_now - INTERVAL '1 day';

    INSERT INTO public.public_submission_rate_limits AS limits (
        bucket_key,
        window_started_at,
        request_count
    )
    VALUES (p_bucket_key, v_now, 1)
    ON CONFLICT (bucket_key) DO UPDATE
    SET window_started_at = CASE
            WHEN limits.window_started_at <= v_now - make_interval(secs => p_window_seconds)
                THEN v_now
            ELSE limits.window_started_at
        END,
        request_count = CASE
            WHEN limits.window_started_at <= v_now - make_interval(secs => p_window_seconds)
                THEN 1
            ELSE limits.request_count + 1
        END
    RETURNING request_count INTO v_request_count;

    RETURN v_request_count <= p_max_requests;
END;
$$;

REVOKE ALL ON FUNCTION public.check_public_submission_rate_limit(TEXT, INTEGER, INTEGER)
    FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_public_submission_rate_limit(TEXT, INTEGER, INTEGER)
    TO service_role;

NOTIFY pgrst, 'reload schema';

COMMIT;
