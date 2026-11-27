-- =============================================================================
-- AK DROP MODERN — COMPREHENSIVE PRODUCT CATALOG SEED
-- =============================================================================
-- High-quality organized catalog across 9 categories.
-- Images sourced from Unsplash (free commercial use).
-- Each product has 4 distinct, non-repetitive images.
-- Prices in ETB. Run in Supabase SQL Editor.
-- =============================================================================

BEGIN;

-- Deactivate all existing products to start fresh
UPDATE public.products SET is_active = FALSE;

-- =============================================================================
-- CATEGORY IDs (from your database)
-- Footwear:    2aafc344-552e-46cb-a4df-6340ea9332e5
-- Shirts:      d1add61e-b393-4d71-9110-291629d80d37
-- Pants:       984a77f1-fbb4-4709-8177-cfd89bc232c3
-- Outerwear:   1f489f53-4559-49be-90c9-85fcc7da60ba
-- Bags:        1c7f3bfe-d1e2-4bee-ace8-9b5f613e8fe5
-- Accessories: 06c7e32b-65c5-429b-97fc-412abd9a39a8
-- Electronics: b39be28a-747c-48dd-bdaf-f8b8dafcbf52
-- Sports:      89ea5a0a-6fdc-40fe-831e-088212ccceb9
-- Apparel:     0a263f9c-3dee-4b92-b1aa-1a8d1e017772
-- =============================================================================

-- =============================================================================
-- FOOTWEAR (8 products)
-- =============================================================================

INSERT INTO public.products (name, slug, description, short_description, price, compare_price, sku, quantity, track_quantity, category_id, images, is_featured, is_new_arrival, is_active, tags, attributes)
VALUES
(
  'Nike Air Force 1 Low "Triple White"',
  'nike-air-force-1-low-triple-white',
  'The Nike Air Force 1 Low in a clean all-white colourway is the definitive everyday sneaker. Full-grain leather upper with perforated toe box for breathability, Nike Air cushioning unit in the heel, and a durable rubber cupsole. The low-profile silhouette pairs with everything from shorts to tailored trousers.',
  'The all-white AF1 — a timeless silhouette for every wardrobe.',
  4800,
  5500,
  'SNK-AF1-WHT-001',
  45,
  TRUE,
  '2aafc344-552e-46cb-a4df-6340ea9332e5',
  '["https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?w=800&q=85","https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=85","https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=800&q=85","https://images.unsplash.com/photo-1512374382149-233c42b6a83b?w=800&q=85"]'::jsonb,
  TRUE, FALSE, TRUE,
  ARRAY['nike','air force 1','white','low','classic'],
  '{"brand":"Nike","colorway":"Triple White","silhouette":"Air Force 1","closure":"Lace-up","sole":"Rubber cupsole"}'::jsonb
),
(
  'New Balance 550 "White Green"',
  'new-balance-550-white-green',
  'Revived from the archives, the New Balance 550 brings a basketball-inspired silhouette into streetwear. Premium leather upper with contrast suede overlays, New Balance cushioning midsole, and a classic court-ready outsole. The clean white base with sage green accents makes it one of the most versatile sneakers in the lineup.',
  'Archive basketball silhouette updated for the streets.',
  5200,
  6000,
  'SNK-NB550-WG-002',
  38,
  TRUE,
  '2aafc344-552e-46cb-a4df-6340ea9332e5',
  '["https://images.unsplash.com/photo-1515955656352-a1fa3ffcd111?w=800&q=85","https://images.unsplash.com/photo-1584735175315-9d5df23be620?w=800&q=85","https://images.unsplash.com/photo-1556906781-9a412961c28c?w=800&q=85","https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=800&q=85"]'::jsonb,
  FALSE, TRUE, TRUE,
  ARRAY['new balance','550','basketball','retro','green'],
  '{"brand":"New Balance","colorway":"White/Green","silhouette":"550","closure":"Lace-up","sole":"Court rubber"}'::jsonb
),
(
  'Adidas Samba OG "Black White"',
  'adidas-samba-og-black-white',
  'The Adidas Samba OG is a legendary football-inspired silhouette that has lived on the streets for decades. Low-profile suede and leather upper, gum rubber outsole, and the iconic T-toe overlay. The classic black and white colourway is the definitive version — clean, recognisable, and endlessly wearable.',
  'The original street shoe. Iconic for a reason.',
  4500,
  NULL,
  'SNK-SAMBA-BW-003',
  52,
  TRUE,
  '2aafc344-552e-46cb-a4df-6340ea9332e5',
  '["https://images.unsplash.com/photo-1587563871167-1ee9c731aefb?w=800&q=85","https://images.unsplash.com/photo-1562183241-b937e95585b6?w=800&q=85","https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=800&q=85","https://images.unsplash.com/photo-1626379616459-b2ce1d9decbc?w=800&q=85"]'::jsonb,
  TRUE, FALSE, TRUE,
  ARRAY['adidas','samba','football','classic','low'],
  '{"brand":"Adidas","colorway":"Black/White","silhouette":"Samba OG","closure":"Lace-up","sole":"Gum rubber"}'::jsonb
),
(
  'Jordan 1 Retro High OG "Chicago"',
  'jordan-1-retro-high-og-chicago',
  'The Air Jordan 1 High OG in the Chicago colorway is the most iconic sneaker ever made. Full-grain leather upper in red, white, and black, Nike Air cushioning, and a high-top collar for ankle support. This is the shoe that started everything — worn by Michael Jordan in his rookie season and banned by the NBA.',
  'The shoe that started it all. Banned by the NBA. Worn by legends.',
  12500,
  14000,
  'SNK-AJ1-CHI-004',
  18,
  TRUE,
  '2aafc344-552e-46cb-a4df-6340ea9332e5',
  '["https://images.unsplash.com/photo-1612030098041-32b87dbe6dd1?w=800&q=85","https://images.unsplash.com/photo-1556048219-bb6978360b84?w=800&q=85","https://images.unsplash.com/photo-1579338908476-3a3a1d71a706?w=800&q=85","https://images.unsplash.com/photo-1570051779696-244e9f680cf7?w=800&q=85"]'::jsonb,
  TRUE, FALSE, TRUE,
  ARRAY['jordan','air jordan 1','chicago','retro','high'],
  '{"brand":"Jordan","colorway":"Chicago","silhouette":"Air Jordan 1 High","closure":"Lace-up","sole":"Rubber cupsole"}'::jsonb
),
(
  'Nike Dunk Low "Panda"',
  'nike-dunk-low-panda',
  'The Nike Dunk Low Retro in the Panda colourway is the most popular Dunk of the modern era. Clean white leather upper with black overlays, padded ankle collar, and a rubber outsole. The two-tone simplicity makes it one of the most wearable sneakers ever produced. A permanent fixture in any serious rotation.',
  'The clean two-tone Dunk that never leaves the rotation.',
  5800,
  6500,
  'SNK-DUNK-PND-005',
  40,
  TRUE,
  '2aafc344-552e-46cb-a4df-6340ea9332e5',
  '["https://images.unsplash.com/photo-1614680376593-902f74cf0d41?w=800&q=85","https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=800&q=85","https://images.unsplash.com/photo-1584735175315-9d5df23be620?w=800&q=85","https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=800&q=85"]'::jsonb,
  FALSE, TRUE, TRUE,
  ARRAY['nike','dunk low','panda','black white','retro'],
  '{"brand":"Nike","colorway":"White/Black (Panda)","silhouette":"Dunk Low","closure":"Lace-up","sole":"Rubber"}'::jsonb
),
(
  'Asics Gel-Kayano 14 "Cream Red"',
  'asics-gel-kayano-14-cream-red',
  'The Asics Gel-Kayano 14 combines heritage running DNA with current streetwear sensibility. The technical mesh and synthetic upper houses Asics GEL cushioning technology in the rear and forefoot. The cream and red colourway has become a favourite of style-conscious consumers who value comfort and aesthetics equally.',
  'Heritage running technology with streetwear appeal.',
  6200,
  7200,
  'SNK-ASICS-CR-006',
  28,
  TRUE,
  '2aafc344-552e-46cb-a4df-6340ea9332e5',
  '["https://images.unsplash.com/photo-1539185441755-769473a23570?w=800&q=85","https://images.unsplash.com/photo-1512374382149-233c42b6a83b?w=800&q=85","https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=85","https://images.unsplash.com/photo-1515955656352-a1fa3ffcd111?w=800&q=85"]'::jsonb,
  FALSE, TRUE, TRUE,
  ARRAY['asics','gel-kayano','running','cream','heritage'],
  '{"brand":"Asics","colorway":"Cream/Red","silhouette":"Gel-Kayano 14","closure":"Lace-up","sole":"AHAR rubber"}'::jsonb
),
(
  'Puma Suede Classic "Royal Blue"',
  'puma-suede-classic-royal-blue',
  'The Puma Suede has been a street culture staple since 1968. Clean suede upper in royal blue, Formstrip branding on the side panel, and a lightweight cupsole. This is the shoe worn by B-boys, basketball players, and style icons across six decades. The royal blue colourway is among the most requested.',
  'Six decades of street culture in one silhouette.',
  3200,
  3800,
  'SNK-PUMA-RB-007',
  60,
  TRUE,
  '2aafc344-552e-46cb-a4df-6340ea9332e5',
  '["https://images.unsplash.com/photo-1512374382149-233c42b6a83b?w=800&q=85","https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=800&q=85","https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?w=800&q=85","https://images.unsplash.com/photo-1587563871167-1ee9c731aefb?w=800&q=85"]'::jsonb,
  FALSE, FALSE, TRUE,
  ARRAY['puma','suede','classic','blue','heritage'],
  '{"brand":"Puma","colorway":"Royal Blue/White","silhouette":"Suede Classic","closure":"Lace-up","sole":"Cupsole"}'::jsonb
),
(
  'Converse Chuck 70 High "Natural Ivory"',
  'converse-chuck-70-high-natural-ivory',
  'The Converse Chuck 70 elevates the classic All Star with premium canvas construction, ortholite cushioned footbed, and a higher rubber cupsole. The natural ivory colourway gives the timeless high-top silhouette a warmer, more elevated feel than the standard white. A foundation piece for any casual wardrobe.',
  'The elevated Chuck — premium canvas, better cushioning.',
  2800,
  3200,
  'SNK-CVS-NI-008',
  70,
  TRUE,
  '2aafc344-552e-46cb-a4df-6340ea9332e5',
  '["https://images.unsplash.com/photo-1463100099107-aa0980c362e6?w=800&q=85","https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=85","https://images.unsplash.com/photo-1562183241-b937e95585b6?w=800&q=85","https://images.unsplash.com/photo-1584735175315-9d5df23be620?w=800&q=85"]'::jsonb,
  FALSE, FALSE, TRUE,
  ARRAY['converse','chuck 70','high top','canvas','ivory'],
  '{"brand":"Converse","colorway":"Natural Ivory","silhouette":"Chuck 70 High","closure":"Lace-up","sole":"Rubber cupsole"}'::jsonb
),

-- =============================================================================
-- SHIRTS (6 products)
-- =============================================================================

(
  'Heavyweight Essential Tee "Washed Black"',
  'heavyweight-essential-tee-washed-black',
  'Cut from 320gsm ring-spun cotton, this heavyweight tee is built to outlast trends and cheap alternatives. Pre-washed for a lived-in softness that only gets better over time. Dropped shoulders, boxy silhouette, and reinforced rib collar. The washed black colourway has that faded vintage quality straight out of the bag.',
  '320gsm ring-spun cotton. Pre-washed. Built to last.',
  1850,
  2200,
  'SHT-HVY-WBK-001',
  85,
  TRUE,
  'd1add61e-b393-4d71-9110-291629d80d37',
  '["https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=85","https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=800&q=85","https://images.unsplash.com/photo-1562157873-818bc0726f68?w=800&q=85","https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800&q=85"]'::jsonb,
  TRUE, FALSE, TRUE,
  ARRAY['tee','heavyweight','cotton','washed','essential'],
  '{"fabric":"320gsm ring-spun cotton","fit":"Boxy/Oversized","care":"Machine wash cold"}'::jsonb
),
(
  'Relaxed Linen Shirt "Sand Beige"',
  'relaxed-linen-shirt-sand-beige',
  'A warm-weather essential woven from 100% European linen. The relaxed fit and slightly oversized silhouette allows air circulation without sacrificing structure. Camp collar, single chest pocket, and mother-of-pearl buttons. Sand beige is the most versatile of the season colourways — pairs with white, navy, and earth tones effortlessly.',
  '100% European linen. Camp collar. The summer staple.',
  3200,
  3800,
  'SHT-LIN-SND-002',
  40,
  TRUE,
  'd1add61e-b393-4d71-9110-291629d80d37',
  '["https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800&q=85","https://images.unsplash.com/photo-1620012253295-c15cc3e65df4?w=800&q=85","https://images.unsplash.com/photo-1598032895397-b9472444bf93?w=800&q=85","https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=85"]'::jsonb,
  FALSE, FALSE, TRUE,
  ARRAY['linen','shirt','camp collar','summer','beige'],
  '{"fabric":"100% European linen","fit":"Relaxed","collar":"Camp collar","care":"Hand wash or machine wash gentle"}'::jsonb
),
(
  'Oxford Button-Down "Classic White"',
  'oxford-button-down-classic-white',
  'The Oxford button-down shirt in classic white is the single most important piece in a functional wardrobe. Woven from 2-ply Oxford cotton for structure and durability, with a medium spread collar, chest pocket, and mother-of-pearl buttons. Tuck it in or wear it open over a tee — it works either way.',
  'The 2-ply Oxford cotton shirt every wardrobe needs.',
  2800,
  3200,
  'SHT-OXF-WHT-003',
  55,
  TRUE,
  'd1add61e-b393-4d71-9110-291629d80d37',
  '["https://images.unsplash.com/photo-1620012253295-c15cc3e65df4?w=800&q=85","https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800&q=85","https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=85","https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=85"]'::jsonb,
  FALSE, FALSE, TRUE,
  ARRAY['oxford','shirt','white','button-down','classic'],
  '{"fabric":"2-ply Oxford cotton","fit":"Regular","collar":"Medium spread","care":"Machine wash 30°C"}'::jsonb
),
(
  'Oversized Graphic Tee "Arch Logo"',
  'oversized-graphic-tee-arch-logo',
  'Dropped shoulders, extended length, and a heavy 280gsm cotton build. The arch logo graphic is printed using water-based inks directly onto the garment for a soft-hand feel that does not crack or peel over washing. Washed in charcoal grey. Sized for a true oversized fit — size down for a boxy look, stay true for extra length.',
  'Water-based print on 280gsm cotton. The statement tee.',
  2200,
  NULL,
  'SHT-GFX-ARC-004',
  65,
  TRUE,
  'd1add61e-b393-4d71-9110-291629d80d37',
  '["https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=800&q=85","https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=85","https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800&q=85","https://images.unsplash.com/photo-1562157873-818bc0726f68?w=800&q=85"]'::jsonb,
  FALSE, TRUE, TRUE,
  ARRAY['graphic tee','oversized','print','cotton','streetwear'],
  '{"fabric":"280gsm cotton","fit":"Oversized","print":"Water-based screen print","care":"Machine wash cold, inside out"}'::jsonb
),
(
  'Striped Rugby Shirt "Navy Cream"',
  'striped-rugby-shirt-navy-cream',
  'The rugby shirt is one of the most underrated wardrobe workhorses. Heavy cotton piqué fabric, ribbed collar and cuffs, rubberised buttons, and a woven chest patch. The navy and cream wide stripe is the most classic expression of the silhouette. Wear over a tee or under a jacket — it adapts to either.',
  'Heavy piqué rugby shirt with the most classic stripe.',
  3600,
  4200,
  'SHT-RUG-NC-005',
  35,
  TRUE,
  'd1add61e-b393-4d71-9110-291629d80d37',
  '["https://images.unsplash.com/photo-1562157873-818bc0726f68?w=800&q=85","https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800&q=85","https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800&q=85","https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=800&q=85"]'::jsonb,
  FALSE, FALSE, TRUE,
  ARRAY['rugby','stripe','navy','cotton','preppy'],
  '{"fabric":"100% cotton piqué","fit":"Regular","collar":"Ribbed polo collar","care":"Machine wash 40°C"}'::jsonb
),
(
  'Zip-Up Hoodie "Charcoal Marl"',
  'zip-up-hoodie-charcoal-marl',
  'The zip-up hoodie in charcoal marl is the utility layer you reach for without thinking. 400gsm 80/20 cotton-polyester fleece with a brushed interior, YKK zipper, kangaroo pocket, and ribbed cuffs and hem. The charcoal marl gives it a heathered texture that elevates it beyond the standard grey hoodie.',
  '400gsm fleece, YKK zipper. The layer you always reach for.',
  4200,
  4900,
  'SHT-ZHOD-CHR-006',
  48,
  TRUE,
  'd1add61e-b393-4d71-9110-291629d80d37',
  '["https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=800&q=85","https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=85","https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=800&q=85","https://images.unsplash.com/photo-1562157873-818bc0726f68?w=800&q=85"]'::jsonb,
  FALSE, FALSE, TRUE,
  ARRAY['hoodie','zip-up','fleece','charcoal','layering'],
  '{"fabric":"400gsm 80/20 cotton-polyester fleece","fit":"Regular","zipper":"YKK full-zip","care":"Machine wash 30°C"}'::jsonb
),

-- =============================================================================
-- PANTS (5 products)
-- =============================================================================

(
  'Slim Straight Denim "Indigo Raw"',
  'slim-straight-denim-indigo-raw',
  'Raw selvedge denim from a Japanese mill. The 12.5oz weight breaks in perfectly over time — developing unique fades, creases, and character based on how you wear them. Slim straight cut sits at the natural waist with a clean leg opening. No distressing, no treatment. Just honest denim that gets better with every wear.',
  'Japanese selvedge denim. Gets better with every wear.',
  6800,
  8000,
  'PNT-DEN-IND-001',
  30,
  TRUE,
  '984a77f1-fbb4-4709-8177-cfd89bc232c3',
  '["https://images.unsplash.com/photo-1542272604-787c3835535d?w=800&q=85","https://images.unsplash.com/photo-1555689502-c4b22d76c56f?w=800&q=85","https://images.unsplash.com/photo-1565084888279-aca607ecce0c?w=800&q=85","https://images.unsplash.com/photo-1604176354204-9268737828e4?w=800&q=85"]'::jsonb,
  FALSE, FALSE, TRUE,
  ARRAY['denim','jeans','selvedge','raw','japanese'],
  '{"fabric":"12.5oz Japanese selvedge denim","fit":"Slim straight","rise":"Natural waist","care":"Wash infrequently, cold, inside out"}'::jsonb
),
(
  'Relaxed Cargo Pant "Olive Ripstop"',
  'relaxed-cargo-pant-olive-ripstop',
  'Cut from durable 65/35 cotton-nylon ripstop, this cargo pant is built for movement. Relaxed fit through the thigh with a tapered leg opening. Six pockets including two side cargo pockets with YKK zipper closures, and a hammock-style back pocket. Cinch cords at the ankle let you adjust the silhouette. The olive ripstop has that utilitarian edge that works in both urban and outdoor settings.',
  'Ripstop cargo pants built for movement and function.',
  4500,
  5200,
  'PNT-CRG-OLV-002',
  42,
  TRUE,
  '984a77f1-fbb4-4709-8177-cfd89bc232c3',
  '["https://images.unsplash.com/photo-1604176354204-9268737828e4?w=800&q=85","https://images.unsplash.com/photo-1565084888279-aca607ecce0c?w=800&q=85","https://images.unsplash.com/photo-1542272604-787c3835535d?w=800&q=85","https://images.unsplash.com/photo-1555689502-c4b22d76c56f?w=800&q=85"]'::jsonb,
  FALSE, FALSE, TRUE,
  ARRAY['cargo','pants','ripstop','olive','utility'],
  '{"fabric":"65/35 cotton-nylon ripstop","fit":"Relaxed","pockets":"6 including 2 cargo","care":"Machine wash 30°C"}'::jsonb
),
(
  'Pleated Trousers "Stone Wool Blend"',
  'pleated-trousers-stone-wool-blend',
  'Double-pleated trousers cut from a 55% wool, 45% polyester blend for year-round wear. The stone colourway sits between beige and grey — the most versatile neutral in menswear. High-rise waist, forward pleats, and a full-length leg with a slight taper at the hem. Side adjusters for fit without a belt. These are the smart casual trousers that elevate any outfit.',
  'Double-pleated wool-blend trousers in the most versatile neutral.',
  5800,
  6800,
  'PNT-PLT-STN-003',
  25,
  TRUE,
  '984a77f1-fbb4-4709-8177-cfd89bc232c3',
  '["https://images.unsplash.com/photo-1555689502-c4b22d76c56f?w=800&q=85","https://images.unsplash.com/photo-1604176354204-9268737828e4?w=800&q=85","https://images.unsplash.com/photo-1542272604-787c3835535d?w=800&q=85","https://images.unsplash.com/photo-1565084888279-aca607ecce0c?w=800&q=85"]'::jsonb,
  FALSE, FALSE, TRUE,
  ARRAY['trousers','pleated','wool','smart casual','stone'],
  '{"fabric":"55% wool, 45% polyester","fit":"Relaxed high-rise","pleat":"Double forward pleat","care":"Dry clean recommended"}'::jsonb
),
(
  'Track Pant "Jet Black"',
  'track-pant-jet-black',
  'Technical track pants cut from a smooth 100% recycled polyester. Slim through the thigh with a tapered leg and ankle zip for easy on-and-off over footwear. Elasticated waist with a drawcord, two side pockets, and a rear zip pocket. The jet black version is the cleanest — no logos, no branding. Just functional, well-cut athleisure.',
  'Clean technical track pants in recycled polyester.',
  3200,
  3800,
  'PNT-TRK-JBK-004',
  55,
  TRUE,
  '984a77f1-fbb4-4709-8177-cfd89bc232c3',
  '["https://images.unsplash.com/photo-1565084888279-aca607ecce0c?w=800&q=85","https://images.unsplash.com/photo-1542272604-787c3835535d?w=800&q=85","https://images.unsplash.com/photo-1555689502-c4b22d76c56f?w=800&q=85","https://images.unsplash.com/photo-1604176354204-9268737828e4?w=800&q=85"]'::jsonb,
  FALSE, FALSE, TRUE,
  ARRAY['track pants','technical','athleisure','black','zip'],
  '{"fabric":"100% recycled polyester","fit":"Slim tapered","waist":"Elasticated with drawcord","care":"Machine wash 30°C"}'::jsonb
),
(
  'Wide Leg Chino "Khaki Sand"',
  'wide-leg-chino-khaki-sand',
  'Wide-leg chinos in a soft-washed khaki sand. Cut from 98% cotton, 2% elastane for a slight stretch that retains its shape. The wide leg opening gives it a relaxed, modern silhouette that sits well over chunky sneakers or loafers. Mid-rise with a clean, unpleated front and slant pockets. The sand colour is the most wearable option in the range.',
  'Wide-leg cotton chinos with a slight stretch — the relaxed weekend trouser.',
  3800,
  4400,
  'PNT-CHN-KHK-005',
  48,
  TRUE,
  '984a77f1-fbb4-4709-8177-cfd89bc232c3',
  '["https://images.unsplash.com/photo-1604176354204-9268737828e4?w=800&q=85","https://images.unsplash.com/photo-1565084888279-aca607ecce0c?w=800&q=85","https://images.unsplash.com/photo-1555689502-c4b22d76c56f?w=800&q=85","https://images.unsplash.com/photo-1542272604-787c3835535d?w=800&q=85"]'::jsonb,
  FALSE, TRUE, TRUE,
  ARRAY['chino','wide leg','khaki','cotton','stretch'],
  '{"fabric":"98% cotton, 2% elastane","fit":"Wide leg","rise":"Mid-rise","care":"Machine wash 30°C"}'::jsonb
),

-- =============================================================================
-- OUTERWEAR (4 products)
-- =============================================================================

(
  'Quilted Puffer Jacket "Midnight Navy"',
  'quilted-puffer-jacket-midnight-navy',
  'The quilted puffer is the season''s most practical investment. Filled with 90/10 down insulation rated to -10°C, with a DWR water-repellent outer shell. Channel quilting keeps the fill in place and gives the jacket its structured silhouette. Packable into the internal chest pocket. The midnight navy colourway is the most versatile — sharp enough to wear over tailoring, relaxed enough with jeans.',
  '90/10 down fill. Packs into its own pocket. Rated to -10°C.',
  8500,
  10000,
  'OWT-PUF-NVY-001',
  22,
  TRUE,
  '1f489f53-4559-49be-90c9-85fcc7da60ba',
  '["https://images.unsplash.com/photo-1548889189-b8dc68c38a3f?w=800&q=85","https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800&q=85","https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=800&q=85","https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=85"]'::jsonb,
  TRUE, FALSE, TRUE,
  ARRAY['puffer','jacket','down','winter','navy'],
  '{"fill":"90/10 down","outer":"DWR nylon shell","temperature_rating":"-10°C","packable":true,"care":"Machine wash gentle, low tumble dry"}'::jsonb
),
(
  'Wool Overcoat "Camel"',
  'wool-overcoat-camel',
  'A single-breasted overcoat cut from a 70% wool, 30% cashmere blend in the classic camel colourway. Mid-length silhouette hits just above the knee. Notch lapel, two flap pockets, single-button closure, and a full lining in smooth viscose for easy layering over suits or knitwear. This is a generational purchase — a coat that looks better as it ages.',
  '70% wool, 30% cashmere. The coat you wear for a decade.',
  18500,
  22000,
  'OWT-OVC-CML-002',
  12,
  TRUE,
  '1f489f53-4559-49be-90c9-85fcc7da60ba',
  '["https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=800&q=85","https://images.unsplash.com/photo-1548889189-b8dc68c38a3f?w=800&q=85","https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800&q=85","https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=85"]'::jsonb,
  FALSE, FALSE, TRUE,
  ARRAY['overcoat','wool','cashmere','camel','classic'],
  '{"fabric":"70% wool, 30% cashmere","length":"Mid-length (above knee)","lining":"100% viscose","care":"Dry clean only"}'::jsonb
),
(
  'Technical Shell Jacket "Olive Green"',
  'technical-shell-jacket-olive-green',
  'A 3-layer waterproof-breathable shell jacket built for unpredictable weather. Taped seams, YKK waterproof zippers, adjustable hood with a one-hand tightening system, and two hand pockets with chest dump pocket. The olive green colourway has a low-key utilitarian aesthetic that works in the city and on the trail.',
  '3-layer waterproof shell. Taped seams. Ready for anything.',
  12000,
  14500,
  'OWT-SHL-OLV-003',
  18,
  TRUE,
  '1f489f53-4559-49be-90c9-85fcc7da60ba',
  '["https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800&q=85","https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=800&q=85","https://images.unsplash.com/photo-1548889189-b8dc68c38a3f?w=800&q=85","https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=85"]'::jsonb,
  FALSE, TRUE, TRUE,
  ARRAY['shell','jacket','waterproof','technical','olive'],
  '{"construction":"3-layer laminate","waterproof":"10,000mm","breathability":"10,000g/m²/24h","seams":"Fully taped","care":"Machine wash 30°C, re-proof regularly"}'::jsonb
),
(
  'Denim Trucker Jacket "Dark Indigo"',
  'denim-trucker-jacket-dark-indigo',
  'The trucker jacket in dark indigo denim is one of the most enduring pieces in modern fashion. Cut from 12oz cotton denim with a classic point collar, two chest pockets, side adjustment tabs, and a straight hem. The dark indigo wash makes it sharper than the standard medium wash — pairs with both light denim and darker trousers without clashing.',
  '12oz dark indigo denim. The trucker that pairs with everything.',
  5500,
  6500,
  'OWT-TRK-IND-004',
  32,
  TRUE,
  '1f489f53-4559-49be-90c9-85fcc7da60ba',
  '["https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=85","https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800&q=85","https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=800&q=85","https://images.unsplash.com/photo-1548889189-b8dc68c38a3f?w=800&q=85"]'::jsonb,
  FALSE, FALSE, TRUE,
  ARRAY['denim','trucker','jacket','indigo','classic'],
  '{"fabric":"12oz 100% cotton denim","fit":"Regular","wash":"Dark indigo","care":"Machine wash cold, inside out"}'::jsonb
),

-- =============================================================================
-- BAGS (5 products)
-- =============================================================================

(
  'Roll-Top Backpack 20L "All Black"',
  'roll-top-backpack-20l-all-black',
  'A 20-litre roll-top daypack in 500D Cordura nylon. The roll-top closure seals with two side buckles for a waterproof seal without a zip. Padded 15-inch laptop sleeve, internal organizer panel, hidden back pocket with RFID-blocking lining, and padded shoulder straps with sternum strap. The all-black colourway is the most discreet and versatile option.',
  '20L Cordura nylon. Roll-top waterproof seal. Fits 15" laptop.',
  5500,
  6500,
  'BAG-RTP-ABK-001',
  28,
  TRUE,
  '1c7f3bfe-d1e2-4bee-ace8-9b5f613e8fe5',
  '["https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=85","https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=800&q=85","https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&q=85","https://images.unsplash.com/photo-1622560480654-d96214fdc887?w=800&q=85"]'::jsonb,
  TRUE, FALSE, TRUE,
  ARRAY['backpack','roll-top','cordura','laptop','daypack'],
  '{"capacity":"20L","material":"500D Cordura nylon","laptop_sleeve":"15 inch","water_resistant":true,"rfid_blocking":true}'::jsonb
),
(
  'Leather Tote "Tan Pebbled"',
  'leather-tote-tan-pebbled',
  'A structured leather tote in pebbled tan. Full-grain vegetable-tanned leather with a natural dye finish that develops a rich patina over time. Internally lined in cotton canvas with two slip pockets and a zip pocket. Reinforced base corners with solid brass feet. Magnetic snap closure. Shoulder strap and top handles. This bag gets better with every year of use.',
  'Full-grain vegetable-tanned leather. Gets better with age.',
  9800,
  11500,
  'BAG-TOT-TAN-002',
  15,
  TRUE,
  '1c7f3bfe-d1e2-4bee-ace8-9b5f613e8fe5',
  '["https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&q=85","https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=85","https://images.unsplash.com/photo-1622560480654-d96214fdc887?w=800&q=85","https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=800&q=85"]'::jsonb,
  FALSE, FALSE, TRUE,
  ARRAY['tote','leather','tan','structured','patina'],
  '{"material":"Full-grain vegetable-tanned leather","lining":"Cotton canvas","hardware":"Solid brass","base_feet":true,"care":"Condition regularly with leather balm"}'::jsonb
),
(
  'Canvas Messenger Bag "Waxed Olive"',
  'canvas-messenger-bag-waxed-olive',
  'A single-shoulder messenger bag in waxed cotton canvas. The wax coating provides water resistance and develops a unique finish as it ages. Main compartment fits a 13-inch laptop, with a quick-access front pocket, two internal slip pockets, and a pen loop. Adjustable webbing shoulder strap with pad. The olive waxed canvas is the classic field bag colourway.',
  'Waxed cotton canvas. Ages beautifully. Fits 13" laptop.',
  4200,
  5000,
  'BAG-MSG-OLV-003',
  22,
  TRUE,
  '1c7f3bfe-d1e2-4bee-ace8-9b5f613e8fe5',
  '["https://images.unsplash.com/photo-1622560480654-d96214fdc887?w=800&q=85","https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&q=85","https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=85","https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=800&q=85"]'::jsonb,
  FALSE, FALSE, TRUE,
  ARRAY['messenger','canvas','waxed','olive','laptop'],
  '{"material":"Waxed cotton canvas","laptop_sleeve":"13 inch","strap":"Adjustable webbing","water_resistant":true}'::jsonb
),
(
  'Mini Crossbody "Black Smooth Leather"',
  'mini-crossbody-black-smooth-leather',
  'A compact crossbody in smooth black full-grain leather. Main zip compartment, external front slip pocket, and an internal card slot. Adjustable brass-hardware chain strap that converts to a wrist clutch. The dimensions hit the sweet spot between utility and minimalism — holds your phone, wallet, keys, and earbuds without bulk.',
  'Compact smooth leather crossbody. Converts to wrist clutch.',
  3800,
  4500,
  'BAG-CRS-BLK-004',
  35,
  TRUE,
  '1c7f3bfe-d1e2-4bee-ace8-9b5f613e8fe5',
  '["https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=800&q=85","https://images.unsplash.com/photo-1622560480654-d96214fdc887?w=800&q=85","https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&q=85","https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=85"]'::jsonb,
  FALSE, TRUE, TRUE,
  ARRAY['crossbody','mini','leather','black','chain strap'],
  '{"material":"Full-grain smooth leather","hardware":"Brass","strap":"Chain, adjustable, converts to clutch","closure":"YKK zip"}'::jsonb
),
(
  'Weekender Duffel 40L "Natural Canvas"',
  'weekender-duffel-40l-natural-canvas',
  'A 40-litre weekender duffel in heavyweight waxed canvas with full-grain leather handles and base panel. The main compartment fits two to three days of clothing, with an external zip pocket and internal shoe bag compartment. Zip closure across the top. Can be carried by the top handles, shoulder strap, or converted to backpack straps.',
  '40L waxed canvas and full-grain leather. The perfect weekend bag.',
  11500,
  13500,
  'BAG-WKD-NAT-005',
  18,
  TRUE,
  '1c7f3bfe-d1e2-4bee-ace8-9b5f613e8fe5',
  '["https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=85","https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&q=85","https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=800&q=85","https://images.unsplash.com/photo-1622560480654-d96214fdc887?w=800&q=85"]'::jsonb,
  FALSE, FALSE, TRUE,
  ARRAY['duffel','weekender','canvas','leather','travel'],
  '{"capacity":"40L","material":"Waxed canvas with full-grain leather","carry_options":"Top handles, shoulder strap, backpack straps","shoe_compartment":true}'::jsonb
),

-- =============================================================================
-- ACCESSORIES (5 products)
-- =============================================================================

(
  'Six-Panel Cap "Stone Washed"',
  'six-panel-cap-stone-washed',
  'A classic six-panel structured cap in stone-washed cotton twill. Mid-height crown, pre-curved bill, and an adjustable metal buckle strap at the rear. The stone wash finish gives it a soft, broken-in texture from day one. No embroidery, no logo — just a clean, well-made cap in the most wearable colourway.',
  'Stone-washed cotton twill cap. Clean, no-logo design.',
  1200,
  1500,
  'ACC-CAP-STN-001',
  80,
  TRUE,
  '06c7e32b-65c5-429b-97fc-412abd9a39a8',
  '["https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=800&q=85","https://images.unsplash.com/photo-1534215754734-18e55d13e346?w=800&q=85","https://images.unsplash.com/photo-1521369909029-2afed882baee?w=800&q=85","https://images.unsplash.com/photo-1575428652377-a2d80e2277fc?w=800&q=85"]'::jsonb,
  FALSE, FALSE, TRUE,
  ARRAY['cap','six-panel','cotton','stone washed','hat'],
  '{"fabric":"100% cotton twill","crown":"Structured mid-height","bill":"Pre-curved","closure":"Metal buckle strap"}'::jsonb
),
(
  'Stainless Steel Watch "Silver Black Dial"',
  'stainless-steel-watch-silver-black-dial',
  'A minimalist field watch on a 316L stainless steel case with a matte black dial, luminous hour markers, and a date window at 3 o''clock. Japanese Miyota quartz movement. Sapphire crystal glass. 100m water resistance. Comes on a black silicone strap with a stainless buckle. Clean, legible, and built to last — no complications, just the time.',
  'Miyota quartz, sapphire crystal, 100m water resistance.',
  8500,
  10000,
  'ACC-WTC-SVB-002',
  20,
  TRUE,
  '06c7e32b-65c5-429b-97fc-412abd9a39a8',
  '["https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=85","https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=800&q=85","https://images.unsplash.com/photo-1612817159949-195b6eb9e31a?w=800&q=85","https://images.unsplash.com/photo-1587836374828-4dbafa94cf0e?w=800&q=85"]'::jsonb,
  TRUE, FALSE, TRUE,
  ARRAY['watch','stainless steel','minimalist','quartz','field watch'],
  '{"movement":"Miyota quartz","case":"316L stainless steel","crystal":"Sapphire","water_resistance":"100m","strap":"Silicone"}'::jsonb
),
(
  'Leather Belt "Tan Smooth"',
  'leather-belt-tan-smooth',
  'A 35mm belt cut from a single piece of full-grain leather in smooth tan. Solid brass roller buckle. Vegetable-tanned leather stiffens correctly and develops a patina aligned to your natural crease point. Comes in waist sizes 28 to 40. The tan colourway complements chinos, denim, and lighter suiting equally well.',
  'Single-piece full-grain leather, solid brass roller buckle.',
  2200,
  NULL,
  'ACC-BLT-TAN-003',
  50,
  TRUE,
  '06c7e32b-65c5-429b-97fc-412abd9a39a8',
  '["https://images.unsplash.com/photo-1575428652377-a2d80e2277fc?w=800&q=85","https://images.unsplash.com/photo-1521369909029-2afed882baee?w=800&q=85","https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=800&q=85","https://images.unsplash.com/photo-1534215754734-18e55d13e346?w=800&q=85"]'::jsonb,
  FALSE, FALSE, TRUE,
  ARRAY['belt','leather','tan','brass','full-grain'],
  '{"material":"Full-grain vegetable-tanned leather","width":"35mm","buckle":"Solid brass roller","care":"Condition with leather balm"}'::jsonb
),
(
  'Wool Scarf "Houndstooth Charcoal"',
  'wool-scarf-houndstooth-charcoal',
  'A reversible wool scarf woven in a classic houndstooth pattern in charcoal and off-white. 100% Merino wool, 190cm in length and 32cm wide. The reverse side is a clean charcoal plain for a tonal look. Finished with hand-knotted fringe. The houndstooth side works for a more dressy occasion; the plain side is the casual everyday option.',
  'Merino wool houndstooth. Reversible. Hand-knotted fringe.',
  2800,
  3400,
  'ACC-SCF-HTH-004',
  30,
  TRUE,
  '06c7e32b-65c5-429b-97fc-412abd9a39a8',
  '["https://images.unsplash.com/photo-1521369909029-2afed882baee?w=800&q=85","https://images.unsplash.com/photo-1575428652377-a2d80e2277fc?w=800&q=85","https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=800&q=85","https://images.unsplash.com/photo-1534215754734-18e55d13e346?w=800&q=85"]'::jsonb,
  FALSE, FALSE, TRUE,
  ARRAY['scarf','wool','merino','houndstooth','winter'],
  '{"fabric":"100% merino wool","dimensions":"190cm x 32cm","pattern":"Houndstooth / reversible plain","fringe":"Hand-knotted","care":"Hand wash cold"}'::jsonb
),
(
  'Bifold Wallet "Matte Black Leather"',
  'bifold-wallet-matte-black-leather',
  'A slim bifold wallet in full-grain matte black leather. Interior: 6 card slots, two note compartments, and an ID window. Slim profile sits at under 10mm when empty. The matte black leather has a dry, sophisticated finish — it does not show fingerprints or wear as visibly as glossy leathers. RFID-blocking lining on card slots.',
  'Full-grain leather, 6 card slots, RFID blocking, 10mm slim.',
  2500,
  3000,
  'ACC-WLT-BLK-005',
  60,
  TRUE,
  '06c7e32b-65c5-429b-97fc-412abd9a39a8',
  '["https://images.unsplash.com/photo-1612817159949-195b6eb9e31a?w=800&q=85","https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=85","https://images.unsplash.com/photo-1587836374828-4dbafa94cf0e?w=800&q=85","https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=800&q=85"]'::jsonb,
  FALSE, FALSE, TRUE,
  ARRAY['wallet','bifold','leather','black','rfid'],
  '{"material":"Full-grain matte leather","card_slots":6,"rfid_blocking":true,"profile":"Under 10mm empty","care":"Wipe clean with dry cloth"}'::jsonb
),

-- =============================================================================
-- ELECTRONICS (4 products)
-- =============================================================================

(
  'True Wireless Earbuds "Active Noise Cancellation"',
  'true-wireless-earbuds-anc',
  'High-performance true wireless earbuds with hybrid active noise cancellation, 30-hour total battery life (8 in buds + 22 in case), wireless charging case, IPX5 water resistance, and multipoint Bluetooth 5.3 connection for two devices simultaneously. 10mm dynamic drivers tuned for clear highs and controlled bass. The USB-C charging case reaches 50% in 15 minutes.',
  'Hybrid ANC, 30hr battery, multipoint BT5.3, wireless charging.',
  5800,
  7000,
  'ELC-EBD-ANC-001',
  35,
  TRUE,
  'b39be28a-747c-48dd-bdaf-f8b8dafcbf52',
  '["https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&q=85","https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=800&q=85","https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800&q=85","https://images.unsplash.com/photo-1649164158186-cc4c7b77ce0f?w=800&q=85"]'::jsonb,
  TRUE, FALSE, TRUE,
  ARRAY['earbuds','wireless','anc','bluetooth','audio'],
  '{"driver":"10mm dynamic","noise_cancellation":"Hybrid ANC","battery_buds":"8 hours","battery_total":"30 hours","water_resistance":"IPX5","bluetooth":"5.3","charging":"USB-C + wireless"}'::jsonb
),
(
  'Slim Power Bank 10,000mAh "Space Grey"',
  'slim-power-bank-10000mah-space-grey',
  'A 10,000mAh power bank in an anodized aluminium chassis — slim enough to fit in a jeans pocket. Dual USB-A outputs, one USB-C input/output with 20W PD fast charging. LED indicator shows exact percentage. Charges an iPhone 15 2.5 times or any Android flagship twice. The space grey aluminium finish aligns it with the devices it charges.',
  '10,000mAh, 20W USB-C PD, aluminium chassis, pocket-slim.',
  3200,
  3800,
  'ELC-PWB-SGR-002',
  45,
  TRUE,
  'b39be28a-747c-48dd-bdaf-f8b8dafcbf52',
  '["https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=800&q=85","https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&q=85","https://images.unsplash.com/photo-1649164158186-cc4c7b77ce0f?w=800&q=85","https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800&q=85"]'::jsonb,
  FALSE, FALSE, TRUE,
  ARRAY['power bank','battery','usb-c','fast charge','portable'],
  '{"capacity":"10,000mAh","usb_c_pd":"20W","outputs":"2x USB-A + 1x USB-C","material":"Anodized aluminium","indicator":"LED percentage"}'::jsonb
),
(
  'Mechanical Keyboard "Compact TKL"',
  'mechanical-keyboard-compact-tkl',
  'A tenkeyless mechanical keyboard with hot-swappable switches, PBT double-shot keycaps, per-key RGB backlighting, and a CNC-machined aluminium top case. Compatible with all MX-style switches. Gasket-mounted PCB for a softer, more cushioned typing feel. USB-C connectivity. The compact TKL layout removes the numpad while keeping all function keys and arrows — the preferred layout for desk setups with limited space.',
  'Hot-swap TKL, aluminium case, gasket mount, per-key RGB.',
  7500,
  9000,
  'ELC-KBD-TKL-003',
  20,
  TRUE,
  'b39be28a-747c-48dd-bdaf-f8b8dafcbf52',
  '["https://images.unsplash.com/photo-1649164158186-cc4c7b77ce0f?w=800&q=85","https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800&q=85","https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&q=85","https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=800&q=85"]'::jsonb,
  FALSE, TRUE, TRUE,
  ARRAY['keyboard','mechanical','tkl','rgb','hot-swap'],
  '{"layout":"Tenkeyless (TKL)","switch_mount":"Hot-swappable MX","case":"CNC aluminium","backlighting":"Per-key RGB","mount":"Gasket","connectivity":"USB-C detachable"}'::jsonb
),
(
  'Wireless Charging Pad "15W Duo"',
  'wireless-charging-pad-15w-duo',
  'A dual wireless charging pad supporting Qi and MagSafe-compatible 15W fast charging on both pads simultaneously. Charges iPhone, AirPods, Samsung Galaxy, and any Qi device. Soft silicone surface with LED indicator. USB-C cable included. The slim profile sits flat on any surface and handles two devices without interference or heat buildup.',
  '15W dual Qi/MagSafe charging. Two devices simultaneously.',
  2200,
  2800,
  'ELC-CHG-DUO-004',
  55,
  TRUE,
  'b39be28a-747c-48dd-bdaf-f8b8dafcbf52',
  '["https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800&q=85","https://images.unsplash.com/photo-1649164158186-cc4c7b77ce0f?w=800&q=85","https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=800&q=85","https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&q=85"]'::jsonb,
  FALSE, FALSE, TRUE,
  ARRAY['charging','wireless','qi','magsafe','dual'],
  '{"output":"15W per pad","standard":"Qi + MagSafe compatible","pads":2,"surface":"Silicone","cable":"USB-C included"}'::jsonb
),

-- =============================================================================
-- SPORTS (4 products)
-- =============================================================================

(
  'Performance Running Shorts "7-Inch"',
  'performance-running-shorts-7-inch',
  'Lightweight 7-inch running shorts built from a 4-way stretch recycled polyester. Inner brief liner with drawcord waist. Two side hand pockets with zip closure and a rear zip pocket. Reflective details for low-light visibility. The technical mesh construction provides maximum ventilation without compromising coverage. Available in black, navy, and grey.',
  '7-inch recycled polyester. Inner brief. Two zip pockets.',
  2200,
  2600,
  'SPT-RNS-7IN-001',
  65,
  TRUE,
  '89ea5a0a-6fdc-40fe-831e-088212ccceb9',
  '["https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=85","https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&q=85","https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=85","https://images.unsplash.com/photo-1475403614135-5f1aa0eb5015?w=800&q=85"]'::jsonb,
  FALSE, FALSE, TRUE,
  ARRAY['running','shorts','performance','recycled','7-inch'],
  '{"fabric":"4-way stretch recycled polyester","length":"7-inch","liner":"Inner brief","pockets":"2 zip side + 1 rear zip","reflective":true}'::jsonb
),
(
  'Compression Training Tights "Full Length"',
  'compression-training-tights-full-length',
  'Full-length compression tights providing graduated 20-30 mmHg compression for enhanced blood flow and faster muscle recovery. Moisture-wicking fabric with UPF 50+ sun protection. Wide waistband, inner key pocket, and flatlock seams for zero irritation. The black colourway is the most versatile for gym, track, and recovery.',
  '20-30mmHg graduated compression. UPF 50+. Recovery-focused.',
  3500,
  4200,
  'SPT-CPT-FUL-002',
  40,
  TRUE,
  '89ea5a0a-6fdc-40fe-831e-088212ccceb9',
  '["https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&q=85","https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=85","https://images.unsplash.com/photo-1475403614135-5f1aa0eb5015?w=800&q=85","https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=85"]'::jsonb,
  FALSE, FALSE, TRUE,
  ARRAY['compression','tights','training','recovery','running'],
  '{"compression":"20-30 mmHg graduated","fabric":"Moisture-wicking stretch","upf":"50+","seams":"Flatlock","waistband":"Wide"}'::jsonb
),
(
  'Training Gym Bag "Duffel 25L"',
  'training-gym-bag-duffel-25l',
  'A 25-litre gym duffel in 600D polyester with a ventilated shoe compartment at the base, main compartment with wet/dry divider, internal zip pocket, front zip pocket, and side water bottle holder. Padded grab handles and a detachable shoulder strap. The design is clean, organized, and sized correctly for a full kit: shoes, change of clothes, and training gear.',
  '25L duffel. Ventilated shoe compartment. Wet/dry divider.',
  3800,
  4500,
  'SPT-GYM-D25-003',
  38,
  TRUE,
  '89ea5a0a-6fdc-40fe-831e-088212ccceb9',
  '["https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=85","https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=85","https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&q=85","https://images.unsplash.com/photo-1475403614135-5f1aa0eb5015?w=800&q=85"]'::jsonb,
  FALSE, FALSE, TRUE,
  ARRAY['gym bag','duffel','training','shoe compartment','sports'],
  '{"capacity":"25L","material":"600D polyester","shoe_compartment":"Ventilated base","wet_dry_divider":true,"bottle_holder":true}'::jsonb
),
(
  'Athletic Crew Socks "6-Pack"',
  'athletic-crew-socks-6-pack',
  'A six-pack of crew-length athletic socks in 80% combed cotton. Arch compression band, reinforced heel and toe, cushioned footbed, and moisture-wicking yarns. The ribbed cuff stays up without leaving a mark. Available in white, black, or mixed. Sized in three ranges: S/M (UK 4-7), M/L (UK 8-11), L/XL (UK 12-14). These are the socks you buy once and always reorder.',
  '80% combed cotton. Arch compression. The socks you reorder.',
  1200,
  NULL,
  'SPT-SCK-ATH-004',
  120,
  TRUE,
  '89ea5a0a-6fdc-40fe-831e-088212ccceb9',
  '["https://images.unsplash.com/photo-1475403614135-5f1aa0eb5015?w=800&q=85","https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=85","https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=85","https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&q=85"]'::jsonb,
  FALSE, FALSE, TRUE,
  ARRAY['socks','athletic','crew','cotton','6-pack'],
  '{"fabric":"80% combed cotton, 15% nylon, 5% elastane","pack":"6 pairs","length":"Crew","arch_support":true,"cushioning":"Medium footbed"}'::jsonb
);

-- Mark selected products as featured and new arrivals
UPDATE public.products SET is_featured = TRUE
WHERE slug IN (
  'nike-air-force-1-low-triple-white','adidas-samba-og-black-white',
  'jordan-1-retro-high-og-chicago','roll-top-backpack-20l-all-black',
  'true-wireless-earbuds-anc','stainless-steel-watch-silver-black-dial',
  'quilted-puffer-jacket-midnight-navy','heavyweight-essential-tee-washed-black'
);

UPDATE public.products SET is_new_arrival = TRUE
WHERE slug IN (
  'new-balance-550-white-green','nike-dunk-low-panda',
  'asics-gel-kayano-14-cream-red','wide-leg-chino-khaki-sand',
  'technical-shell-jacket-olive-green','mini-crossbody-black-smooth-leather',
  'mechanical-keyboard-compact-tkl','oversized-graphic-tee-arch-logo'
);

-- Update category image URLs for the shop/categories pages
UPDATE public.categories SET image_url = 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80' WHERE slug = 'footwear';
UPDATE public.categories SET image_url = 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&q=80' WHERE slug = 'shirts';
UPDATE public.categories SET image_url = 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=600&q=80' WHERE slug = 'pants';
UPDATE public.categories SET image_url = 'https://images.unsplash.com/photo-1548889189-b8dc68c38a3f?w=600&q=80' WHERE slug = 'outerwear';
UPDATE public.categories SET image_url = 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&q=80' WHERE slug = 'bags';
UPDATE public.categories SET image_url = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80' WHERE slug = 'accessories';
UPDATE public.categories SET image_url = 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600&q=80' WHERE slug = 'electronics';
UPDATE public.categories SET image_url = 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=600&q=80' WHERE slug = 'sports';
UPDATE public.categories SET image_url = 'https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=600&q=80' WHERE slug = 'clothing';

COMMIT;

-- =============================================================================
-- VERIFICATION QUERY — run after the seed to confirm
-- =============================================================================
-- SELECT c.name as category, count(p.id) as products
-- FROM public.products p
-- JOIN public.categories c ON c.id = p.category_id
-- WHERE p.is_active = TRUE
-- GROUP BY c.name ORDER BY c.name;
