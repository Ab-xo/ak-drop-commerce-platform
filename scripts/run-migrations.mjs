import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function readLocalEnvironment() {
  const envPath = resolve(process.cwd(), '.env.local');
  const values = {};

  try {
    for (const line of readFileSync(envPath, 'utf8').split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;

      const separator = trimmed.indexOf('=');
      if (separator < 0) continue;

      const key = trimmed.slice(0, separator).trim();
      const value = trimmed.slice(separator + 1).trim().replace(/^['"]|['"]$/g, '');
      values[key] = value;
    }
  } catch {
    throw new Error('Could not read .env.local. Create it from .env.example and retry.');
  }

  return values;
}

/**
 * Runs a SQL statement using the Supabase postgres-meta API endpoint.
 * Hosted Supabase projects expose this at <project-url>/pg/query.
 * Falls back to creating a temporary RPC if the pg endpoint is unavailable.
 */
async function runStatement(supabaseUrl, serviceRoleKey, sql, label) {
  const headers = {
    Authorization: `Bearer ${serviceRoleKey}`,
    apikey: serviceRoleKey,
    'Content-Type': 'application/json',
  };

  // Attempt 1: Supabase postgres-meta endpoint (hosted projects)
  const pgQueryUrl = `${supabaseUrl}/pg/query`;
  let response = await fetch(pgQueryUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query: sql }),
  });

  if (!response.ok && response.status !== 404) {
    const body = await response.text();
    // Some ALTER TABLE errors like "column already exists" are benign
    let parsed;
    try { parsed = JSON.parse(body); } catch { parsed = null; }
    const msg = parsed?.message ?? body;
    if (
      msg.toLowerCase().includes('already exists') ||
      msg.toLowerCase().includes('does not exist')
    ) {
      console.log(`  ✓ ${label} (already applied)`);
      return;
    }
    throw new Error(`${label} failed (HTTP ${response.status}): ${msg}`);
  }

  if (response.ok) {
    console.log(`  ✓ ${label}`);
    return;
  }

  // Attempt 2: Supabase REST v1 SQL endpoint (newer feature-flagged versions)
  const restSqlUrl = `${supabaseUrl}/rest/v1/sql`;
  response = await fetch(restSqlUrl, {
    method: 'POST',
    headers: { ...headers, Prefer: 'return=minimal' },
    body: JSON.stringify({ query: sql }),
  });

  if (!response.ok) {
    const body = await response.text();
    let parsed;
    try { parsed = JSON.parse(body); } catch { parsed = null; }
    const msg = parsed?.message ?? parsed?.error ?? body;
    if (
      typeof msg === 'string' && (
        msg.toLowerCase().includes('already exists') ||
        msg.toLowerCase().includes('does not exist')
      )
    ) {
      console.log(`  ✓ ${label} (already applied)`);
      return;
    }
    throw new Error(`${label} failed (HTTP ${response.status}): ${msg}`);
  }

  console.log(`  ✓ ${label}`);
}

const MIGRATIONS = [
  {
    label: 'Add attributes to product_variants',
    sql: `ALTER TABLE public.product_variants ADD COLUMN IF NOT EXISTS attributes JSONB NOT NULL DEFAULT '{}'::jsonb`,
  },
  {
    label: 'Add price_override to product_variants',
    sql: `ALTER TABLE public.product_variants ADD COLUMN IF NOT EXISTS price_override DECIMAL(10,2) CHECK (price_override IS NULL OR price_override >= 0)`,
  },
  {
    label: 'Add variant_attributes to order_items',
    sql: `ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS variant_attributes JSONB NOT NULL DEFAULT '{}'::jsonb`,
  },
  {
    label: 'Add variant_id to order_items',
    sql: `ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS variant_id UUID REFERENCES public.product_variants(id) ON DELETE RESTRICT`,
  },
  {
    label: 'Add tracking_number to orders',
    sql: `ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS tracking_number TEXT`,
  },
  {
    label: 'Add carrier to orders',
    sql: `ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS carrier TEXT`,
  },
  {
    label: 'Add estimated_delivery to orders',
    sql: `ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS estimated_delivery DATE`,
  },
  {
    label: 'Create contact_submissions table',
    sql: `CREATE TABLE IF NOT EXISTS public.contact_submissions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      subject TEXT NOT NULL,
      message TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'new',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )`,
  },
  {
    label: 'Create product_reviews table',
    sql: `CREATE TABLE IF NOT EXISTS public.product_reviews (
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
    )`,
  },
  {
    label: 'Enable RLS on product_reviews',
    sql: `ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY`,
  },
  {
    label: 'Drop old submit reviews policy',
    sql: `DROP POLICY IF EXISTS "Users can submit reviews" ON public.product_reviews`,
  },
  {
    label: 'Create submit reviews policy',
    sql: `CREATE POLICY "Users can submit reviews" ON public.product_reviews FOR INSERT WITH CHECK (auth.uid() = user_id)`,
  },
  {
    label: 'Drop old view approved reviews policy',
    sql: `DROP POLICY IF EXISTS "Users can view approved reviews" ON public.product_reviews`,
  },
  {
    label: 'Create view approved reviews policy',
    sql: `CREATE POLICY "Users can view approved reviews" ON public.product_reviews FOR SELECT USING (is_approved = TRUE OR auth.uid() = user_id)`,
  },
  {
    label: 'Create wishlist_items table',
    sql: `CREATE TABLE IF NOT EXISTS public.wishlist_items (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      UNIQUE(user_id, product_id)
    )`,
  },
  {
    label: 'Enable RLS on wishlist_items',
    sql: `ALTER TABLE public.wishlist_items ENABLE ROW LEVEL SECURITY`,
  },
  {
    label: 'Drop old wishlist policy',
    sql: `DROP POLICY IF EXISTS "Users can manage own wishlist" ON public.wishlist_items`,
  },
  {
    label: 'Create wishlist management policy',
    sql: `CREATE POLICY "Users can manage own wishlist" ON public.wishlist_items FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)`,
  },
  {
    label: 'Grant wishlist_items to authenticated',
    sql: `GRANT ALL ON TABLE public.wishlist_items TO authenticated`,
  },
  {
    label: 'Grant product_reviews to authenticated',
    sql: `GRANT ALL ON TABLE public.product_reviews TO authenticated`,
  },
];

async function main() {
  const envVars = readLocalEnvironment();
  const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceRoleKey = envVars.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local.');
  }

  console.log('Running AK Drop migrations…');
  console.log(`Target: ${supabaseUrl}\n`);

  // Probe which SQL endpoint is available
  console.log('Probing available SQL endpoint…');
  const probeHeaders = {
    Authorization: `Bearer ${serviceRoleKey}`,
    apikey: serviceRoleKey,
    'Content-Type': 'application/json',
  };

  const pgProbe = await fetch(`${supabaseUrl}/pg/query`, {
    method: 'POST',
    headers: probeHeaders,
    body: JSON.stringify({ query: 'SELECT 1' }),
  });
  const restProbe = pgProbe.ok ? null : await fetch(`${supabaseUrl}/rest/v1/sql`, {
    method: 'POST',
    headers: { ...probeHeaders, Prefer: 'return=minimal' },
    body: JSON.stringify({ query: 'SELECT 1' }),
  });

  if (!pgProbe.ok && restProbe && !restProbe.ok) {
    console.error('\nNeither /pg/query nor /rest/v1/sql endpoints are available on this Supabase project.');
    console.error('Please apply the migrations manually via the Supabase SQL Editor:');
    console.error('  Dashboard -> SQL Editor -> paste the SQL from scripts/migrations.sql\n');

    // Write the SQL out to a file so the user can apply it manually
    const allSql = MIGRATIONS.map((m) => `-- ${m.label}\n${m.sql};\n`).join('\n');
    const { writeFileSync } = await import('node:fs');
    writeFileSync(resolve(process.cwd(), 'scripts', 'migrations.sql'), allSql, 'utf8');
    console.log('Migration SQL written to scripts/migrations.sql for manual application.');
    process.exitCode = 1;
    return;
  }

  if (pgProbe.ok) {
    console.log('Using /pg/query endpoint\n');
  } else {
    console.log('Using /rest/v1/sql endpoint\n');
  }

  let succeeded = 0;
  let failed = 0;

  for (const migration of MIGRATIONS) {
    try {
      await runStatement(supabaseUrl, serviceRoleKey, migration.sql, migration.label);
      succeeded++;
    } catch (error) {
      console.error(`  ✗ ${migration.label}:`, error instanceof Error ? error.message : String(error));
      failed++;
    }
  }

  console.log(`\nMigrations complete: ${succeeded} succeeded, ${failed} failed.`);

  if (failed > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error('Migration script failed:', error instanceof Error ? error.message : 'Unexpected error.');
  process.exitCode = 1;
});
