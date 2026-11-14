import 'server-only';

import { createHmac } from 'node:crypto';
import { headers } from 'next/headers';
import { createAdminClient } from '@/lib/supabase-admin';

export async function getRequestFingerprint(purpose: string, value?: string) {
  const requestHeaders = await headers();
  const forwardedFor = requestHeaders.get('x-forwarded-for')?.split(',')[0]?.trim();
  const address = requestHeaders.get('x-real-ip')?.trim() || forwardedFor || 'unknown';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!key) throw new Error('Server-side submission protection is not configured.');

  return createHmac('sha256', key)
    .update(`${purpose}:${value ?? address}`)
    .digest('hex');
}

export async function allowPublicSubmission(
  fingerprint: string,
  maximumRequests: number,
  windowSeconds: number,
) {
  const admin = createAdminClient();
  const { data, error } = await admin.rpc('check_public_submission_rate_limit', {
    p_bucket_key: fingerprint,
    p_max_requests: maximumRequests,
    p_window_seconds: windowSeconds,
  });
  if (error) {
    console.error('Public submission rate check failed:', error.message);
    throw new Error('Submission protection is temporarily unavailable.');
  }
  return data === true;
}
