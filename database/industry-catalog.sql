-- Industry-style AK Drop catalog seed.
-- Replaces generic category names and seeds structured, real-world product fields.
-- Run once in Supabase SQL Editor. Safe to rerun.

WITH category_seed(name, slug, description, image_url, sort_order) AS (
  VALUES
    ('Sneakers', 'footwear', 'Performance runners and street-ready silhouettes.', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=85', 10),
    ('Apparel', 'clothing', 'Elevated everyday shirts, trousers and outerwear.', 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=1200&q=85', 20),
    ('Bags', 'bags', 'Purpose-built bags and everyday carry essentials.', 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=1200&q=85', 30),
    ('Accessories', 'accessories', 'Finishing pieces for a complete modern wardrobe.', 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1200&q=85', 40),
    ('Sports', 'sports', 'Training and recovery gear for active routines.', 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=1200&q=85', 50)
)
INSERT INTO public.categories (name, slug, description, image_url, is_active, sort_order)
SELECT name, slug, description, image_url, TRUE, sort_order
FROM category_seed
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  image_url = EXCLUDED.image_url,
  is_active = TRUE,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();

-- Structured product seed for a complete recruiting-ready demo catalog.
-- Uses public Unsplash URLs and only inserts/updates known fields.
WITH catalog(name, slug, short_description, description, category_slug, price, compare_price, sku, image, is_featured, is_new_arrival, stock) AS (
  VALUES
  ('Nike Dunk Low Retro', 'nike-dunk-low-retro', 'Iconic low-profile court sneaker.', 'Premium everyday leather sneaker with a padded low-cut collar and durable rubber outsole.', 'footwear', 18900, 22000, 'AK-FW-001', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=85', TRUE, TRUE, 24),
  ('New Balance 990V6', 'new-balance-990v6', 'Modern everyday runner with premium cushioning.', 'Made-in-US-inspired running silhouette with FuelCell cushioning, suede overlays and all-day support.', 'footwear', 32600, 36500, 'AK-FW-002', '/products/NewBalancexAimeLeonDore996MadeInUSA front pic 10.jpg', TRUE, TRUE, 18),
  ('Adidas SL 72 OG', 'adidas-sl-72-og', 'Lightweight retro running sneaker.', 'A heritage track shoe revived with a breathable upper, EVA midsole and classic serrated three-stripe sole.', 'footwear', 15800, 19000, 'AK-FW-003', '/s-products/Wales-Bonner-x-Adidas-SL76-Ash-Blue-Core-Black-IH3262-RV-29.jpg', FALSE, TRUE, 31),
  ('Nike Air Zoom Vomero 5', 'nike-air-zoom-vomero-5', 'Technical runner for all-day comfort.', 'Layered mesh construction, visible Zoom Air and a molded heel deliver a supportive daily ride.', 'footwear', 27800, 31000, 'AK-FW-004', '/s-products/Zoom-Vomero-5-SE-SP---White-Racer-Blue-Black-CI1694-100-05-10-24-Feature-JP-4.jpg', TRUE, FALSE, 20),
  ('Essential Heavyweight Tee', 'essential-heavyweight-tee', 'Structured heavyweight everyday tee.', 'Compact cotton jersey with a relaxed fit, ribbed crew neck and double-stitched hems.', 'clothing', 3200, 4200, 'AK-AP-001', 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1200&q=85', TRUE, TRUE, 80),
  ('Modern Relaxed Overshirt', 'modern-relaxed-overshirt', 'Versatile outer layer in a relaxed cut.', 'Soft twill overshirt with utility pockets, corozo-effect buttons and a lightly washed finish.', 'clothing', 8400, 9800, 'AK-AP-002', 'https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?auto=format&fit=crop&w=1200&q=85', TRUE, FALSE, 34),
  ('Technical Cargo Trouser', 'technical-cargo-trouser', 'Functional tapered trouser.', 'Articulated everyday trouser with adjustable cuffs, four secure pockets and water-resistant stretch fabric.', 'clothing', 7600, 9200, 'AK-AP-003', 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=1200&q=85', FALSE, TRUE, 42),
  ('Urban Commuter Backpack', 'urban-commuter-backpack', 'Clean, organized daily carry.', 'Weather-resistant commuter backpack with padded 16-inch laptop compartment and internal organization.', 'bags', 1999, 2600, 'AK-BG-001', 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=1200&q=85', TRUE, FALSE, 55),
  ('Studio Crossbody Bag', 'studio-crossbody-bag', 'Compact bag for essentials.', 'Minimal crossbody with adjustable strap, zip closure and lightweight recycled shell.', 'bags', 3850, 4600, 'AK-BG-002', 'https://images.unsplash.com/photo-1547949003-9792a18a2601?auto=format&fit=crop&w=1200&q=85', FALSE, TRUE, 38),
  ('Classic Digital Watch', 'classic-digital-watch', 'Minimal watch for everyday timing.', 'Lightweight digital wrist watch with an easy-read display, alarm and water-resistant case.', 'accessories', 5600, 6800, 'AK-AC-001', 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=1200&q=85', TRUE, FALSE, 27),
  ('Studio Wireless Headphones', 'studio-wireless-headphones', 'Immersive over-ear wireless audio.', 'Comfortable over-ear headphones with active noise control, 30-hour battery life and USB-C charging.', 'accessories', 9400, 11200, 'AK-AC-002', 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1200&q=85', TRUE, TRUE, 22),
  ('Performance Training Mat', 'performance-training-mat', 'Stable mat for strength and mobility.', 'Dense high-grip training mat with aligned markings, easy-clean surface and integrated carry strap.', 'sports', 4700, 5600, 'AK-SP-001', 'https://images.unsplash.com/photo-1599058917212-d750089bc07e?auto=format&fit=crop&w=1200&q=85', FALSE, TRUE, 45)
)
INSERT INTO public.products (
  name, slug, short_description, description, category_id, price, compare_price, sku,
  images, is_featured, is_new_arrival, track_quantity, quantity, is_active,
  tags, attributes, created_at, updated_at
)
SELECT
  c.name, c.slug, c.short_description, c.description, cat.id, c.price, c.compare_price, c.sku,
  to_jsonb(ARRAY[c.image]),
  c.is_featured, c.is_new_arrival, TRUE, c.stock, TRUE,
  ARRAY['AK Drop', c.category_slug],
  jsonb_build_object(
    'brand', CASE c.category_slug
      WHEN 'footwear' THEN split_part(c.name, ' ', 1)
      ELSE 'AK Drop'
    END,
    'category', c.category_slug,
    'condition', 'New',
    'currency', 'ETB'
  ),
  NOW(), NOW()
FROM catalog c
JOIN public.categories cat ON cat.slug = c.category_slug
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  short_description = EXCLUDED.short_description,
  description = EXCLUDED.description,
  category_id = EXCLUDED.category_id,
  price = EXCLUDED.price,
  compare_price = EXCLUDED.compare_price,
  images = EXCLUDED.images,
  is_featured = EXCLUDED.is_featured,
  is_new_arrival = EXCLUDED.is_new_arrival,
  quantity = EXCLUDED.quantity,
  tags = EXCLUDED.tags,
  attributes = EXCLUDED.attributes,
  is_active = TRUE,
  updated_at = NOW();
