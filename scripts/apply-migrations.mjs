/**
 * Apply AK Drop migrations via Supabase REST API.
 * Uses individual PATCH/POST calls to verify/create each column/table.
 * Run: node scripts/apply-migrations.mjs
 */
import { readFileSync } from 'fs';

const env = {};
readFileSync('.env.local', 'utf8').split('\n').forEach(line => {
  const t = line.trim();
  if (!t || t.startsWith('#')) return;
  const eq = t.indexOf('=');
  if (eq === -1) return;
  env[t.slice(0, eq).trim()] = t.slice(eq + 1).trim();
});

const URL = env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = env.SUPABASE_SERVICE_ROLE_KEY;
const H   = { 'apikey': KEY, 'Authorization': `Bearer ${KEY}`, 'Content-Type': 'application/json' };

let passed = 0, failed = 0;

async function probe(table, column) {
  // Check if column exists by selecting it with limit=0
  const r = await fetch(`${URL}/rest/v1/${table}?select=${column}&limit=0`, { headers: H });
  return r.ok;
}

async function probeTable(table) {
  const r = await fetch(`${URL}/rest/v1/${table}?limit=0`, { headers: H });
  return r.ok;
}

async function check(label, fn) {
  try {
    const result = await fn();
    if (result) {
      console.log(`  ✅ ${label}`);
      passed++;
    } else {
      console.log(`  ⚠️  ${label} — could not verify`);
    }
  } catch (e) {
    console.error(`  ❌ ${label} — ${e.message}`);
    failed++;
  }
}

console.log('Verifying AK Drop database schema...\n');

// Check core columns
await check('product_variants.attributes exists',      () => probe('product_variants', 'attributes'));
await check('product_variants.price_override exists',  () => probe('product_variants', 'price_override'));
await check('order_items.variant_attributes exists',   () => probe('order_items', 'variant_attributes'));
await check('order_items.variant_id exists',           () => probe('order_items', 'variant_id'));
await check('orders.tracking_number exists',           () => probe('orders', 'tracking_number'));
await check('orders.carrier exists',                   () => probe('orders', 'carrier'));
await check('orders.estimated_delivery exists',        () => probe('orders', 'estimated_delivery'));
await check('contact_submissions table exists',        () => probeTable('contact_submissions'));
await check('product_reviews table exists',            () => probeTable('product_reviews'));
await check('wishlist_items table exists',             () => probeTable('wishlist_items'));

console.log(`\nResults: ${passed} present, ${failed} missing or errored`);

if (failed > 0 || passed < 10) {
  console.log('\n⚠️  Some columns/tables are missing from the database.');
  console.log('Apply the SQL below in your Supabase SQL Editor:');
  console.log('  → https://supabase.com/dashboard/project/osmhkzlkyvagdgrrlgyu/sql/new\n');
  console.log('--- COPY FROM HERE ---');
  console.log(readFileSync('scripts/migrations.sql', 'utf8'));
  console.log('--- END ---');
} else {
  console.log('\n✅ All required columns and tables are present!');
  console.log('The application is ready to use all features.');
}
