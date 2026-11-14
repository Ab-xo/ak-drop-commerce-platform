import 'server-only';

import { createHash, randomBytes } from 'node:crypto';
import { escapeHtml, getPublicSiteUrl, sendEmail } from '@/lib/email';
import { createAdminClient } from '@/lib/supabase-admin';

function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

export async function beginNewsletterSubscription(email: string, source: string) {
  const admin = createAdminClient();
  const { data: existing, error: lookupError } = await admin
    .from('newsletter_subscribers')
    .select('id, is_active, is_verified')
    .eq('email', email)
    .maybeSingle();

  if (lookupError) {
    console.error('Newsletter subscription lookup failed:', lookupError.message);
    throw new Error('Could not check the subscription. Please try again.');
  }
  if (existing?.is_active && existing.is_verified) return 'already-subscribed' as const;

  const confirmationToken = randomBytes(32).toString('hex');
  const unsubscribeToken = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  const { error: saveError } = await admin
    .from('newsletter_subscribers')
    .upsert({
      email,
      is_active: true,
      is_verified: false,
      verification_token_hash: hashToken(confirmationToken),
      verification_expires_at: expiresAt,
      unsubscribe_token_hash: hashToken(unsubscribeToken),
      subscribed_at: new Date().toISOString(),
      verified_at: null,
      unsubscribed_at: null,
      source,
    }, { onConflict: 'email' });

  if (saveError) {
    console.error('Newsletter subscription save failed:', saveError.message);
    throw new Error('Could not save your subscription request. Please try again.');
  }

  const siteUrl = getPublicSiteUrl();
  const confirmUrl = new URL('/newsletter/confirm', siteUrl);
  confirmUrl.searchParams.set('token', confirmationToken);
  const unsubscribeUrl = new URL('/newsletter/unsubscribe', siteUrl);
  unsubscribeUrl.searchParams.set('token', unsubscribeToken);
  const safeEmail = escapeHtml(email);

  await sendEmail({
    to: email,
    subject: 'Confirm your AK Drop newsletter subscription',
    html: `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#18181b"><h1>Confirm your subscription</h1><p>Confirm that you want AK Drop updates sent to ${safeEmail}.</p><p><a href="${confirmUrl.toString()}" style="display:inline-block;padding:12px 20px;background:#111827;color:#fff;text-decoration:none;border-radius:8px">Confirm subscription</a></p><p>This link expires in 24 hours. If you did not request this, you can ignore this message.</p><hr><p style="font-size:12px;color:#71717a">Unsubscribe any time: <a href="${unsubscribeUrl.toString()}">unsubscribe</a></p></div>`,
  });

  return 'confirmation-sent' as const;
}

export async function confirmNewsletterSubscription(token: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('newsletter_subscribers')
    .select('id')
    .eq('verification_token_hash', hashToken(token))
    .eq('is_active', true)
    .gt('verification_expires_at', new Date().toISOString())
    .maybeSingle();

  if (error) {
    console.error('Newsletter confirmation lookup failed:', error.message);
    throw new Error('Could not confirm your subscription. Please try again.');
  }
  if (!data) return false;

  const { error: updateError } = await admin
    .from('newsletter_subscribers')
    .update({
      is_verified: true,
      verified_at: new Date().toISOString(),
      verification_token_hash: null,
      verification_expires_at: null,
    })
    .eq('id', data.id);

  if (updateError) {
    console.error('Newsletter confirmation update failed:', updateError.message);
    throw new Error('Could not confirm your subscription. Please try again.');
  }
  return true;
}

export async function unsubscribeWithToken(token: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('newsletter_subscribers')
    .select('id')
    .eq('unsubscribe_token_hash', hashToken(token))
    .eq('is_active', true)
    .maybeSingle();

  if (error) {
    console.error('Newsletter unsubscribe lookup failed:', error.message);
    throw new Error('Could not update your subscription. Please try again.');
  }
  if (!data) return false;

  const { error: updateError } = await admin
    .from('newsletter_subscribers')
    .update({
      is_active: false,
      is_verified: false,
      verification_token_hash: null,
      verification_expires_at: null,
      unsubscribe_token_hash: null,
      unsubscribed_at: new Date().toISOString(),
    })
    .eq('id', data.id);

  if (updateError) {
    console.error('Newsletter unsubscribe update failed:', updateError.message);
    throw new Error('Could not update your subscription. Please try again.');
  }
  return true;
}
