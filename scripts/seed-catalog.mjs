/**
 * Run: node scripts/seed-catalog.mjs
 * Seeds the AK Drop product catalog into Supabase.
 */
import { readFileSync } from 'fs';

// Parse .env.local
const env = {};
readFileSync('.env.local','utf8').split('\n').forEach(line => {
  const t = line.trim();
  if (!t || t.startsWith('#')) return;
  const eq = t.indexOf('=');
  if (eq === -1) return;
  env[t.slice(0,eq).trim()] = t.slice(eq+1).trim();
});

const URL  = env.NEXT_PUBLIC_SUPABASE_URL;
const KEY  = env.SUPABASE_SERVICE_ROLE_KEY;
const H    = { 'apikey': KEY, 'Authorization': `Bearer ${KEY}`, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' };

async function post(path, body) {
  const r = await fetch(`${URL}/rest/v1/${path}`, { method: 'POST', headers: H, body: JSON.stringify(body) });
  if (!r.ok) { const t = await r.text(); throw new Error(`POST ${path} → ${r.status}: ${t.slice(0,200)}`); }
  return r;
}
async function patch(path, body) {
  const r = await fetch(`${URL}/rest/v1/${path}`, { method: 'PATCH', headers: { ...H, 'Prefer': 'return=minimal' }, body: JSON.stringify(body) });
  if (!r.ok) { const t = await r.text(); throw new Error(`PATCH ${path} → ${r.status}: ${t.slice(0,200)}`); }
  return r;
}

// Category IDs from the database
const CAT = {
  footwear:    '2aafc344-552e-46cb-a4df-6340ea9332e5',
  shirts:      'd1add61e-b393-4d71-9110-291629d80d37',
  pants:       '984a77f1-fbb4-4709-8177-cfd89bc232c3',
  outerwear:   '1f489f53-4559-49be-90c9-85fcc7da60ba',
  bags:        '1c7f3bfe-d1e2-4bee-ace8-9b5f613e8fe5',
  accessories: '06c7e32b-65c5-429b-97fc-412abd9a39a8',
  electronics: 'b39be28a-747c-48dd-bdaf-f8b8dafcbf52',
  sports:      '89ea5a0a-6fdc-40fe-831e-088212ccceb9',
  apparel:     '0a263f9c-3dee-4b92-b1aa-1a8d1e017772',
};

const products = [

// ── FOOTWEAR ──────────────────────────────────────────────────────────────────
{
  name: 'Nike Air Force 1 Low "Triple White"',
  slug: 'nike-air-force-1-low-triple-white',
  short_description: 'The all-white AF1 — a timeless silhouette for every wardrobe.',
  description: 'The Nike Air Force 1 Low in a clean all-white colourway is the definitive everyday sneaker. Full-grain leather upper with perforated toe box for breathability, Nike Air cushioning unit in the heel, and a durable rubber cupsole. The low-profile silhouette pairs with everything from shorts to tailored trousers.',
  price: 4800, compare_price: 5500, sku: 'SNK-AF1-WHT-001', quantity: 45,
  category_id: CAT.footwear, is_featured: true, is_new_arrival: false,
  images: [
    'https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?w=800&q=85',
    'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=85',
    'https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=800&q=85',
    'https://images.unsplash.com/photo-1512374382149-233c42b6a83b?w=800&q=85',
  ],
  tags: ['nike','air force 1','white','low','classic'],
  attributes: { brand:'Nike', colorway:'Triple White', silhouette:'Air Force 1', closure:'Lace-up' },
},
{
  name: 'New Balance 550 "White Green"',
  slug: 'new-balance-550-white-green',
  short_description: 'Archive basketball silhouette updated for the streets.',
  description: 'Revived from the archives, the New Balance 550 brings a basketball-inspired silhouette into streetwear. Premium leather upper with contrast suede overlays, New Balance cushioning midsole, and a classic court-ready outsole. The clean white base with sage green accents makes it one of the most versatile sneakers in the lineup.',
  price: 5200, compare_price: 6000, sku: 'SNK-NB550-WG-002', quantity: 38,
  category_id: CAT.footwear, is_featured: false, is_new_arrival: true,
  images: [
    'https://images.unsplash.com/photo-1515955656352-a1fa3ffcd111?w=800&q=85',
    'https://images.unsplash.com/photo-1584735175315-9d5df23be620?w=800&q=85',
    'https://images.unsplash.com/photo-1556906781-9a412961c28c?w=800&q=85',
    'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=800&q=85',
  ],
  tags: ['new balance','550','basketball','retro'],
  attributes: { brand:'New Balance', colorway:'White/Green', silhouette:'550' },
},
{
  name: 'Adidas Samba OG "Black White"',
  slug: 'adidas-samba-og-black-white',
  short_description: 'The original street shoe. Iconic for a reason.',
  description: 'The Adidas Samba OG is a legendary football-inspired silhouette that has lived on the streets for decades. Low-profile suede and leather upper, gum rubber outsole, and the iconic T-toe overlay. The classic black and white colourway is the definitive version — clean, recognisable, and endlessly wearable.',
  price: 4500, compare_price: null, sku: 'SNK-SAMBA-BW-003', quantity: 52,
  category_id: CAT.footwear, is_featured: true, is_new_arrival: false,
  images: [
    'https://images.unsplash.com/photo-1587563871167-1ee9c731aefb?w=800&q=85',
    'https://images.unsplash.com/photo-1562183241-b937e95585b6?w=800&q=85',
    'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=800&q=85',
    'https://images.unsplash.com/photo-1626379616459-b2ce1d9decbc?w=800&q=85',
  ],
  tags: ['adidas','samba','football','classic'],
  attributes: { brand:'Adidas', colorway:'Black/White', silhouette:'Samba OG' },
},
{
  name: 'Jordan 1 Retro High OG "Chicago"',
  slug: 'jordan-1-retro-high-og-chicago',
  short_description: 'The shoe that started it all. Banned by the NBA. Worn by legends.',
  description: 'The Air Jordan 1 High OG in the Chicago colorway is the most iconic sneaker ever made. Full-grain leather upper in red, white, and black, Nike Air cushioning, and a high-top collar for ankle support. This is the shoe that started everything — worn by Michael Jordan in his rookie season and banned by the NBA.',
  price: 12500, compare_price: 14000, sku: 'SNK-AJ1-CHI-004', quantity: 18,
  category_id: CAT.footwear, is_featured: true, is_new_arrival: false,
  images: [
    'https://images.unsplash.com/photo-1613240828683-7114c6a7c24a?w=800&q=85',
    'https://images.unsplash.com/photo-1556048219-bb6978360b84?w=800&q=85',
    'https://images.unsplash.com/photo-1579338908476-3a3a1d71a706?w=800&q=85',
    'https://images.unsplash.com/photo-1570051779696-244e9f680cf7?w=800&q=85',
  ],
  tags: ['jordan','air jordan 1','chicago','retro','high'],
  attributes: { brand:'Jordan', colorway:'Chicago', silhouette:'Air Jordan 1 High' },
},
{
  name: 'Nike Dunk Low "Panda"',
  slug: 'nike-dunk-low-panda',
  short_description: 'The clean two-tone Dunk that never leaves the rotation.',
  description: 'The Nike Dunk Low Retro in the Panda colourway is the most popular Dunk of the modern era. Clean white leather upper with black overlays, padded ankle collar, and a rubber outsole. The two-tone simplicity makes it one of the most wearable sneakers ever produced.',
  price: 5800, compare_price: 6500, sku: 'SNK-DUNK-PND-005', quantity: 40,
  category_id: CAT.footwear, is_featured: false, is_new_arrival: true,
  images: [
    'https://images.unsplash.com/photo-1589216532372-1c2a367900d9?w=800&q=85',
    'https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=800&q=85',
    'https://images.unsplash.com/photo-1515955656352-a1fa3ffcd111?w=800&q=85',
    'https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=800&q=85',
  ],
  tags: ['nike','dunk low','panda','retro'],
  attributes: { brand:'Nike', colorway:'White/Black (Panda)', silhouette:'Dunk Low' },
},
{
  name: 'Asics Gel-Kayano 14 "Cream Red"',
  slug: 'asics-gel-kayano-14-cream-red',
  short_description: 'Heritage running technology with streetwear appeal.',
  description: 'The Asics Gel-Kayano 14 combines heritage running DNA with current streetwear sensibility. The technical mesh and synthetic upper houses Asics GEL cushioning technology in the rear and forefoot. The cream and red colourway has become a favourite of style-conscious consumers who value comfort and aesthetics equally.',
  price: 6200, compare_price: 7200, sku: 'SNK-ASICS-CR-006', quantity: 28,
  category_id: CAT.footwear, is_featured: false, is_new_arrival: true,
  images: [
    'https://images.unsplash.com/photo-1539185441755-769473a23570?w=800&q=85',
    'https://images.unsplash.com/photo-1512374382149-233c42b6a83b?w=800&q=85',
    'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=85',
    'https://images.unsplash.com/photo-1515955656352-a1fa3ffcd111?w=800&q=85',
  ],
  tags: ['asics','gel-kayano','running','cream'],
  attributes: { brand:'Asics', colorway:'Cream/Red', silhouette:'Gel-Kayano 14' },
},
{
  name: 'Converse Chuck 70 High "Natural Ivory"',
  slug: 'converse-chuck-70-high-natural-ivory',
  short_description: 'The elevated Chuck — premium canvas, better cushioning.',
  description: 'The Converse Chuck 70 elevates the classic All Star with premium canvas construction, ortholite cushioned footbed, and a higher rubber cupsole. The natural ivory colourway gives the timeless high-top silhouette a warmer, more elevated feel than the standard white.',
  price: 2800, compare_price: 3200, sku: 'SNK-CVS-NI-007', quantity: 70,
  category_id: CAT.footwear, is_featured: false, is_new_arrival: false,
  images: [
    'https://images.unsplash.com/photo-1463100099107-aa0980c362e6?w=800&q=85',
    'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=85',
    'https://images.unsplash.com/photo-1562183241-b937e95585b6?w=800&q=85',
    'https://images.unsplash.com/photo-1584735175315-9d5df23be620?w=800&q=85',
  ],
  tags: ['converse','chuck 70','high top','canvas'],
  attributes: { brand:'Converse', colorway:'Natural Ivory', silhouette:'Chuck 70 High' },
},

// ── SHIRTS ────────────────────────────────────────────────────────────────────
{
  name: 'Heavyweight Essential Tee "Washed Black"',
  slug: 'heavyweight-essential-tee-washed-black',
  short_description: '320gsm ring-spun cotton. Pre-washed. Built to last.',
  description: 'Cut from 320gsm ring-spun cotton, this heavyweight tee is built to outlast trends. Pre-washed for a lived-in softness that only gets better over time. Dropped shoulders, boxy silhouette, and reinforced rib collar. The washed black colourway has that faded vintage quality straight out of the bag.',
  price: 1850, compare_price: 2200, sku: 'SHT-HVY-WBK-001', quantity: 85,
  category_id: CAT.shirts, is_featured: true, is_new_arrival: false,
  images: [
    'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=85',
    'https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=800&q=85',
    'https://images.unsplash.com/photo-1562157873-818bc0726f68?w=800&q=85',
    'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800&q=85',
  ],
  tags: ['tee','heavyweight','cotton','washed','essential'],
  attributes: { fabric:'320gsm ring-spun cotton', fit:'Boxy/Oversized' },
},
{
  name: 'Relaxed Linen Shirt "Sand Beige"',
  slug: 'relaxed-linen-shirt-sand-beige',
  short_description: '100% European linen. Camp collar. The summer staple.',
  description: 'A warm-weather essential woven from 100% European linen. The relaxed fit and slightly oversized silhouette allows air circulation without sacrificing structure. Camp collar, single chest pocket, and mother-of-pearl buttons. Sand beige pairs with white, navy, and earth tones effortlessly.',
  price: 3200, compare_price: 3800, sku: 'SHT-LIN-SND-002', quantity: 40,
  category_id: CAT.shirts, is_featured: false, is_new_arrival: false,
  images: [
    'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800&q=85',
    'https://images.unsplash.com/photo-1620012253295-c15cc3e65df4?w=800&q=85',
    'https://images.unsplash.com/photo-1598032895397-b9472444bf93?w=800&q=85',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=85',
  ],
  tags: ['linen','shirt','camp collar','summer','beige'],
  attributes: { fabric:'100% European linen', fit:'Relaxed', collar:'Camp collar' },
},
{
  name: 'Oxford Button-Down "Classic White"',
  slug: 'oxford-button-down-classic-white',
  short_description: 'The 2-ply Oxford cotton shirt every wardrobe needs.',
  description: 'The Oxford button-down shirt in classic white is the single most important piece in a functional wardrobe. Woven from 2-ply Oxford cotton for structure and durability, with a medium spread collar, chest pocket, and mother-of-pearl buttons.',
  price: 2800, compare_price: 3200, sku: 'SHT-OXF-WHT-003', quantity: 55,
  category_id: CAT.shirts, is_featured: false, is_new_arrival: false,
  images: [
    'https://images.unsplash.com/photo-1620012253295-c15cc3e65df4?w=800&q=85',
    'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800&q=85',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=85',
    'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=85',
  ],
  tags: ['oxford','shirt','white','button-down','classic'],
  attributes: { fabric:'2-ply Oxford cotton', fit:'Regular', collar:'Medium spread' },
},
{
  name: 'Oversized Graphic Tee "Arch Logo"',
  slug: 'oversized-graphic-tee-arch-logo',
  short_description: 'Water-based print on 280gsm cotton. The statement tee.',
  description: 'Dropped shoulders, extended length, and a heavy 280gsm cotton build. The arch logo graphic is printed using water-based inks directly onto the garment for a soft-hand feel that does not crack or peel over washing. Washed in charcoal grey.',
  price: 2200, compare_price: null, sku: 'SHT-GFX-ARC-004', quantity: 65,
  category_id: CAT.shirts, is_featured: false, is_new_arrival: true,
  images: [
    'https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=800&q=85',
    'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=85',
    'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800&q=85',
    'https://images.unsplash.com/photo-1562157873-818bc0726f68?w=800&q=85',
  ],
  tags: ['graphic tee','oversized','print','streetwear'],
  attributes: { fabric:'280gsm cotton', fit:'Oversized', print:'Water-based screen print' },
},
{
  name: 'Zip-Up Hoodie "Charcoal Marl"',
  slug: 'zip-up-hoodie-charcoal-marl',
  short_description: '400gsm fleece, YKK zipper. The layer you always reach for.',
  description: 'The zip-up hoodie in charcoal marl is the utility layer you reach for without thinking. 400gsm 80/20 cotton-polyester fleece with a brushed interior, YKK zipper, kangaroo pocket, and ribbed cuffs and hem.',
  price: 4200, compare_price: 4900, sku: 'SHT-ZHOD-CHR-005', quantity: 48,
  category_id: CAT.shirts, is_featured: false, is_new_arrival: false,
  images: [
    'https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=800&q=85',
    'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=85',
    'https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=800&q=85',
    'https://images.unsplash.com/photo-1562157873-818bc0726f68?w=800&q=85',
  ],
  tags: ['hoodie','zip-up','fleece','charcoal'],
  attributes: { fabric:'400gsm 80/20 cotton-polyester fleece', fit:'Regular', zipper:'YKK full-zip' },
},

// ── PANTS ─────────────────────────────────────────────────────────────────────
{
  name: 'Slim Straight Denim "Indigo Raw"',
  slug: 'slim-straight-denim-indigo-raw',
  short_description: 'Japanese selvedge denim. Gets better with every wear.',
  description: 'Raw selvedge denim from a Japanese mill. The 12.5oz weight breaks in perfectly over time — developing unique fades and character based on how you wear them. Slim straight cut sits at the natural waist with a clean leg opening.',
  price: 6800, compare_price: 8000, sku: 'PNT-DEN-IND-001', quantity: 30,
  category_id: CAT.pants, is_featured: false, is_new_arrival: false,
  images: [
    'https://images.unsplash.com/photo-1542272604-787c3835535d?w=800&q=85',
    'https://images.unsplash.com/photo-1555689502-c4b22d76c56f?w=800&q=85',
    'https://images.unsplash.com/photo-1565084888279-aca607ecce0c?w=800&q=85',
    'https://images.unsplash.com/photo-1604176354204-9268737828e4?w=800&q=85',
  ],
  tags: ['denim','jeans','selvedge','raw'],
  attributes: { fabric:'12.5oz Japanese selvedge denim', fit:'Slim straight', rise:'Natural waist' },
},
{
  name: 'Relaxed Cargo Pant "Olive Ripstop"',
  slug: 'relaxed-cargo-pant-olive-ripstop',
  short_description: 'Ripstop cargo pants built for movement and function.',
  description: 'Cut from durable 65/35 cotton-nylon ripstop, this cargo pant is built for movement. Relaxed fit through the thigh with a tapered leg opening. Six pockets including two side cargo pockets with YKK zipper closures.',
  price: 4500, compare_price: 5200, sku: 'PNT-CRG-OLV-002', quantity: 42,
  category_id: CAT.pants, is_featured: false, is_new_arrival: false,
  images: [
    'https://images.unsplash.com/photo-1604176354204-9268737828e4?w=800&q=85',
    'https://images.unsplash.com/photo-1565084888279-aca607ecce0c?w=800&q=85',
    'https://images.unsplash.com/photo-1542272604-787c3835535d?w=800&q=85',
    'https://images.unsplash.com/photo-1555689502-c4b22d76c56f?w=800&q=85',
  ],
  tags: ['cargo','pants','ripstop','olive','utility'],
  attributes: { fabric:'65/35 cotton-nylon ripstop', fit:'Relaxed', pockets:'6 including 2 cargo' },
},
{
  name: 'Wide Leg Chino "Khaki Sand"',
  slug: 'wide-leg-chino-khaki-sand',
  short_description: 'Wide-leg cotton chinos — the relaxed weekend trouser.',
  description: 'Wide-leg chinos in a soft-washed khaki sand. Cut from 98% cotton, 2% elastane for a slight stretch that retains its shape. The wide leg opening gives it a relaxed, modern silhouette that sits well over chunky sneakers or loafers.',
  price: 3800, compare_price: 4400, sku: 'PNT-CHN-KHK-003', quantity: 48,
  category_id: CAT.pants, is_featured: false, is_new_arrival: true,
  images: [
    'https://images.unsplash.com/photo-1555689502-c4b22d76c56f?w=800&q=85',
    'https://images.unsplash.com/photo-1604176354204-9268737828e4?w=800&q=85',
    'https://images.unsplash.com/photo-1542272604-787c3835535d?w=800&q=85',
    'https://images.unsplash.com/photo-1565084888279-aca607ecce0c?w=800&q=85',
  ],
  tags: ['chino','wide leg','khaki','cotton'],
  attributes: { fabric:'98% cotton, 2% elastane', fit:'Wide leg', rise:'Mid-rise' },
},

// ── OUTERWEAR ─────────────────────────────────────────────────────────────────
{
  name: 'Quilted Puffer Jacket "Midnight Navy"',
  slug: 'quilted-puffer-jacket-midnight-navy',
  short_description: '90/10 down fill. Packs into its own pocket. Rated to -10°C.',
  description: 'The quilted puffer is the season\'s most practical investment. Filled with 90/10 down insulation rated to -10°C, with a DWR water-repellent outer shell. Channel quilting keeps the fill in place. Packable into the internal chest pocket.',
  price: 8500, compare_price: 10000, sku: 'OWT-PUF-NVY-001', quantity: 22,
  category_id: CAT.outerwear, is_featured: true, is_new_arrival: false,
  images: [
    'https://images.unsplash.com/photo-1548889189-b8dc68c38a3f?w=800&q=85',
    'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800&q=85',
    'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=800&q=85',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=85',
  ],
  tags: ['puffer','jacket','down','winter','navy'],
  attributes: { fill:'90/10 down', temperature_rating:'-10°C', packable:true },
},
{
  name: 'Wool Overcoat "Camel"',
  slug: 'wool-overcoat-camel',
  short_description: '70% wool, 30% cashmere. The coat you wear for a decade.',
  description: 'A single-breasted overcoat cut from a 70% wool, 30% cashmere blend in the classic camel colourway. Mid-length silhouette hits just above the knee. Notch lapel, two flap pockets, and a full lining in smooth viscose.',
  price: 18500, compare_price: 22000, sku: 'OWT-OVC-CML-002', quantity: 12,
  category_id: CAT.outerwear, is_featured: false, is_new_arrival: false,
  images: [
    'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=800&q=85',
    'https://images.unsplash.com/photo-1548889189-b8dc68c38a3f?w=800&q=85',
    'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800&q=85',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=85',
  ],
  tags: ['overcoat','wool','cashmere','camel','classic'],
  attributes: { fabric:'70% wool, 30% cashmere', length:'Mid-length', lining:'100% viscose' },
},
{
  name: 'Technical Shell Jacket "Olive Green"',
  slug: 'technical-shell-jacket-olive-green',
  short_description: '3-layer waterproof shell. Taped seams. Ready for anything.',
  description: 'A 3-layer waterproof-breathable shell jacket built for unpredictable weather. Taped seams, YKK waterproof zippers, adjustable hood with a one-hand tightening system. The olive green colourway has a low-key utilitarian aesthetic.',
  price: 12000, compare_price: 14500, sku: 'OWT-SHL-OLV-003', quantity: 18,
  category_id: CAT.outerwear, is_featured: false, is_new_arrival: true,
  images: [
    'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800&q=85',
    'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=800&q=85',
    'https://images.unsplash.com/photo-1548889189-b8dc68c38a3f?w=800&q=85',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=85',
  ],
  tags: ['shell','jacket','waterproof','technical','olive'],
  attributes: { construction:'3-layer laminate', waterproof:'10,000mm', seams:'Fully taped' },
},

// ── BAGS ──────────────────────────────────────────────────────────────────────
{
  name: 'Roll-Top Backpack 20L "All Black"',
  slug: 'roll-top-backpack-20l-all-black',
  short_description: '20L Cordura nylon. Roll-top waterproof seal. Fits 15" laptop.',
  description: 'A 20-litre roll-top daypack in 500D Cordura nylon. The roll-top closure seals with two side buckles for a waterproof seal. Padded 15-inch laptop sleeve, internal organizer panel, and hidden back pocket with RFID-blocking lining.',
  price: 5500, compare_price: 6500, sku: 'BAG-RTP-ABK-001', quantity: 28,
  category_id: CAT.bags, is_featured: true, is_new_arrival: false,
  images: [
    'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=85',
    'https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=800&q=85',
    'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&q=85',
    'https://images.unsplash.com/photo-1622560480654-d96214fdc887?w=800&q=85',
  ],
  tags: ['backpack','roll-top','cordura','laptop'],
  attributes: { capacity:'20L', material:'500D Cordura nylon', laptop_sleeve:'15 inch', rfid_blocking:true },
},
{
  name: 'Leather Tote "Tan Pebbled"',
  slug: 'leather-tote-tan-pebbled',
  short_description: 'Full-grain vegetable-tanned leather. Gets better with age.',
  description: 'A structured leather tote in pebbled tan. Full-grain vegetable-tanned leather with a natural dye finish that develops a rich patina over time. Internally lined in cotton canvas with two slip pockets and a zip pocket. Reinforced base corners with solid brass feet.',
  price: 9800, compare_price: 11500, sku: 'BAG-TOT-TAN-002', quantity: 15,
  category_id: CAT.bags, is_featured: false, is_new_arrival: false,
  images: [
    'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&q=85',
    'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=85',
    'https://images.unsplash.com/photo-1622560480654-d96214fdc887?w=800&q=85',
    'https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=800&q=85',
  ],
  tags: ['tote','leather','tan','structured'],
  attributes: { material:'Full-grain vegetable-tanned leather', hardware:'Solid brass', base_feet:true },
},
{
  name: 'Mini Crossbody "Black Smooth Leather"',
  slug: 'mini-crossbody-black-smooth-leather',
  short_description: 'Compact smooth leather crossbody. Converts to wrist clutch.',
  description: 'A compact crossbody in smooth black full-grain leather. Main zip compartment, external front slip pocket, and an internal card slot. Adjustable brass-hardware chain strap that converts to a wrist clutch.',
  price: 3800, compare_price: 4500, sku: 'BAG-CRS-BLK-003', quantity: 35,
  category_id: CAT.bags, is_featured: false, is_new_arrival: true,
  images: [
    'https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=800&q=85',
    'https://images.unsplash.com/photo-1622560480654-d96214fdc887?w=800&q=85',
    'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&q=85',
    'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=85',
  ],
  tags: ['crossbody','mini','leather','black'],
  attributes: { material:'Full-grain smooth leather', hardware:'Brass', strap:'Chain, converts to clutch' },
},
{
  name: 'Weekender Duffel 40L "Natural Canvas"',
  slug: 'weekender-duffel-40l-natural-canvas',
  short_description: '40L waxed canvas and full-grain leather. The perfect weekend bag.',
  description: 'A 40-litre weekender duffel in heavyweight waxed canvas with full-grain leather handles and base panel. The main compartment fits two to three days of clothing, with an external zip pocket and internal shoe bag compartment.',
  price: 11500, compare_price: 13500, sku: 'BAG-WKD-NAT-004', quantity: 18,
  category_id: CAT.bags, is_featured: false, is_new_arrival: false,
  images: [
    'https://images.unsplash.com/photo-1622560480654-d96214fdc887?w=800&q=85',
    'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&q=85',
    'https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=800&q=85',
    'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=85',
  ],
  tags: ['duffel','weekender','canvas','leather','travel'],
  attributes: { capacity:'40L', material:'Waxed canvas + full-grain leather', shoe_compartment:true },
},

// ── ACCESSORIES ───────────────────────────────────────────────────────────────
{
  name: 'Stainless Steel Watch "Silver Black Dial"',
  slug: 'stainless-steel-watch-silver-black-dial',
  short_description: 'Miyota quartz, sapphire crystal, 100m water resistance.',
  description: 'A minimalist field watch on a 316L stainless steel case with a matte black dial, luminous hour markers, and a date window at 3 o\'clock. Japanese Miyota quartz movement. Sapphire crystal glass. 100m water resistance.',
  price: 8500, compare_price: 10000, sku: 'ACC-WTC-SVB-001', quantity: 20,
  category_id: CAT.accessories, is_featured: true, is_new_arrival: false,
  images: [
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=85',
    'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=800&q=85',
    'https://images.unsplash.com/photo-1612817159949-195b6eb9e31a?w=800&q=85',
    'https://images.unsplash.com/photo-1587836374828-4dbafa94cf0e?w=800&q=85',
  ],
  tags: ['watch','stainless steel','minimalist','quartz'],
  attributes: { movement:'Miyota quartz', crystal:'Sapphire', water_resistance:'100m', strap:'Silicone' },
},
{
  name: 'Six-Panel Cap "Stone Washed"',
  slug: 'six-panel-cap-stone-washed',
  short_description: 'Stone-washed cotton twill cap. Clean, no-logo design.',
  description: 'A classic six-panel structured cap in stone-washed cotton twill. Mid-height crown, pre-curved bill, and an adjustable metal buckle strap at the rear. No embroidery, no logo — just a clean, well-made cap.',
  price: 1200, compare_price: 1500, sku: 'ACC-CAP-STN-002', quantity: 80,
  category_id: CAT.accessories, is_featured: false, is_new_arrival: false,
  images: [
    'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=800&q=85',
    'https://images.unsplash.com/photo-1534215754734-18e55d13e346?w=800&q=85',
    'https://images.unsplash.com/photo-1521369909029-2afed882baee?w=800&q=85',
    'https://images.unsplash.com/photo-1575428652377-a2d80e2277fc?w=800&q=85',
  ],
  tags: ['cap','six-panel','cotton','stone washed'],
  attributes: { fabric:'100% cotton twill', crown:'Structured mid-height', bill:'Pre-curved' },
},
{
  name: 'Bifold Wallet "Matte Black Leather"',
  slug: 'bifold-wallet-matte-black-leather',
  short_description: 'Full-grain leather, 6 card slots, RFID blocking, 10mm slim.',
  description: 'A slim bifold wallet in full-grain matte black leather. Interior: 6 card slots, two note compartments, and an ID window. Slim profile sits at under 10mm when empty. RFID-blocking lining on card slots.',
  price: 2500, compare_price: 3000, sku: 'ACC-WLT-BLK-003', quantity: 60,
  category_id: CAT.accessories, is_featured: false, is_new_arrival: false,
  images: [
    'https://images.unsplash.com/photo-1612817159949-195b6eb9e31a?w=800&q=85',
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=85',
    'https://images.unsplash.com/photo-1587836374828-4dbafa94cf0e?w=800&q=85',
    'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=800&q=85',
  ],
  tags: ['wallet','bifold','leather','black','rfid'],
  attributes: { material:'Full-grain matte leather', card_slots:6, rfid_blocking:true },
},

// ── ELECTRONICS ───────────────────────────────────────────────────────────────
{
  name: 'True Wireless Earbuds "Active Noise Cancellation"',
  slug: 'true-wireless-earbuds-anc',
  short_description: 'Hybrid ANC, 30hr battery, multipoint BT5.3, wireless charging.',
  description: 'High-performance true wireless earbuds with hybrid active noise cancellation, 30-hour total battery life (8 in buds + 22 in case), wireless charging case, IPX5 water resistance, and multipoint Bluetooth 5.3.',
  price: 5800, compare_price: 7000, sku: 'ELC-EBD-ANC-001', quantity: 35,
  category_id: CAT.electronics, is_featured: true, is_new_arrival: false,
  images: [
    'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&q=85',
    'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=800&q=85',
    'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800&q=85',
    'https://images.unsplash.com/photo-1649164158186-cc4c7b77ce0f?w=800&q=85',
  ],
  tags: ['earbuds','wireless','anc','bluetooth'],
  attributes: { noise_cancellation:'Hybrid ANC', battery_total:'30 hours', water_resistance:'IPX5', bluetooth:'5.3' },
},
{
  name: 'Slim Power Bank 10,000mAh "Space Grey"',
  slug: 'slim-power-bank-10000mah-space-grey',
  short_description: '10,000mAh, 20W USB-C PD, aluminium chassis, pocket-slim.',
  description: 'A 10,000mAh power bank in an anodized aluminium chassis — slim enough to fit in a jeans pocket. Dual USB-A outputs, one USB-C input/output with 20W PD fast charging.',
  price: 3200, compare_price: 3800, sku: 'ELC-PWB-SGR-002', quantity: 45,
  category_id: CAT.electronics, is_featured: false, is_new_arrival: false,
  images: [
    'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=800&q=85',
    'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&q=85',
    'https://images.unsplash.com/photo-1649164158186-cc4c7b77ce0f?w=800&q=85',
    'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800&q=85',
  ],
  tags: ['power bank','battery','usb-c','fast charge'],
  attributes: { capacity:'10,000mAh', usb_c_pd:'20W', material:'Anodized aluminium' },
},

// ── SPORTS ────────────────────────────────────────────────────────────────────
{
  name: 'Performance Running Shorts "7-Inch"',
  slug: 'performance-running-shorts-7-inch',
  short_description: '7-inch recycled polyester. Inner brief. Two zip pockets.',
  description: 'Lightweight 7-inch running shorts built from a 4-way stretch recycled polyester. Inner brief liner with drawcord waist. Two side hand pockets with zip closure and a rear zip pocket. Reflective details for low-light visibility.',
  price: 2200, compare_price: 2600, sku: 'SPT-RNS-7IN-001', quantity: 65,
  category_id: CAT.sports, is_featured: false, is_new_arrival: false,
  images: [
    'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=85',
    'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&q=85',
    'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=85',
    'https://images.unsplash.com/photo-1475403614135-5f1aa0eb5015?w=800&q=85',
  ],
  tags: ['running','shorts','performance','recycled'],
  attributes: { fabric:'4-way stretch recycled polyester', length:'7-inch', liner:'Inner brief', reflective:true },
},
{
  name: 'Training Gym Bag "Duffel 25L"',
  slug: 'training-gym-bag-duffel-25l',
  short_description: '25L duffel. Ventilated shoe compartment. Wet/dry divider.',
  description: 'A 25-litre gym duffel in 600D polyester with a ventilated shoe compartment at the base, main compartment with wet/dry divider, internal zip pocket, front zip pocket, and side water bottle holder.',
  price: 3800, compare_price: 4500, sku: 'SPT-GYM-D25-002', quantity: 38,
  category_id: CAT.sports, is_featured: false, is_new_arrival: false,
  images: [
    'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=85',
    'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=85',
    'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&q=85',
    'https://images.unsplash.com/photo-1475403614135-5f1aa0eb5015?w=800&q=85',
  ],
  tags: ['gym bag','duffel','training','sports'],
  attributes: { capacity:'25L', material:'600D polyester', shoe_compartment:'Ventilated', wet_dry_divider:true },
},

];

console.log(`Seeding ${products.length} products...`);
let inserted = 0, skipped = 0;

for (const p of products) {
  const payload = {
    name:              p.name,
    slug:              p.slug,
    description:       p.description,
    short_description: p.short_description,
    price:             p.price,
    compare_price:     p.compare_price ?? null,
    sku:               p.sku,
    quantity:          p.quantity,
    track_quantity:    true,
    category_id:       p.category_id,
    images:            p.images,
    is_featured:       p.is_featured,
    is_new_arrival:    p.is_new_arrival,
    is_active:         true,
    tags:              p.tags,
    attributes:        p.attributes,
  };

  try {
    // Upsert by slug — safe to re-run
    const r = await fetch(`${URL}/rest/v1/products?slug=eq.${encodeURIComponent(p.slug)}`, {
      method: 'PATCH',
      headers: { ...H, 'Prefer': 'return=minimal' },
      body: JSON.stringify(payload),
    });
    if (r.status === 204) {
      // No existing row — insert fresh
      const ins = await fetch(`${URL}/rest/v1/products`, {
        method: 'POST',
        headers: { ...H, 'Prefer': 'return=minimal' },
        body: JSON.stringify(payload),
      });
      if (!ins.ok) throw new Error(await ins.text());
      inserted++;
      console.log(`  ✅ Inserted: ${p.name}`);
    } else {
      skipped++;
      console.log(`  🔄 Updated:  ${p.name}`);
    }
  } catch (e) {
    console.error(`  ❌ Failed:   ${p.name} — ${e.message}`);
  }
}

// Update category images
const catImages = [
  { slug:'footwear',    url:'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80' },
  { slug:'shirts',      url:'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&q=80' },
  { slug:'pants',       url:'https://images.unsplash.com/photo-1542272604-787c3835535d?w=600&q=80' },
  { slug:'outerwear',   url:'https://images.unsplash.com/photo-1548889189-b8dc68c38a3f?w=600&q=80' },
  { slug:'bags',        url:'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&q=80' },
  { slug:'accessories', url:'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80' },
  { slug:'electronics', url:'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600&q=80' },
  { slug:'sports',      url:'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=600&q=80' },
  { slug:'clothing',    url:'https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=600&q=80' },
];

console.log('\nUpdating category images...');
for (const { slug, url } of catImages) {
  const r = await fetch(`${URL}/rest/v1/categories?slug=eq.${slug}`, {
    method: 'PATCH',
    headers: { ...H, 'Prefer': 'return=minimal' },
    body: JSON.stringify({ image_url: url }),
  });
  console.log(`  ${r.ok ? '✅' : '❌'} ${slug}: ${r.status}`);
}

console.log(`\n✅ Done. Inserted: ${inserted}, Updated: ${skipped}`);
console.log('Total active products:', products.length);
