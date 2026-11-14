'use server';

import { z } from 'zod';
import { confirmNewsletterSubscription, beginNewsletterSubscription, unsubscribeWithToken } from '@/lib/newsletter';
import { createClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';
import { allowPublicSubmission, getRequestFingerprint } from '@/lib/public-submissions';

const emailSchema = z.string().trim().toLowerCase().email().max(254);
const tokenSchema = z.string().regex(/^[a-f0-9]{64}$/);

export async function subscribeToNewsletter(formData: FormData) {
  const parsed = emailSchema.safeParse(formData.get('email'));
  if (!parsed.success) return { error: 'Enter a valid email address.' };
  if (String(formData.get('website') ?? '').trim()) return { success: true };

  try {
    const ipFingerprint = await getRequestFingerprint('newsletter');
    const emailFingerprint = await getRequestFingerprint('newsletter-email', parsed.data);
    if (
      !(await allowPublicSubmission(ipFingerprint, 10, 24 * 60 * 60))
      || !(await allowPublicSubmission(emailFingerprint, 1, 10 * 60))
    ) {
      return { error: 'Please wait a few minutes before requesting another confirmation email.' };
    }

    const result = await beginNewsletterSubscription(parsed.data, 'website');
    return result === 'already-subscribed'
      ? { success: true, message: 'This email is already subscribed.' }
      : { success: true, message: 'Check your inbox to confirm your subscription.' };
  } catch (error) {
    console.error('Newsletter subscription request failed:', error instanceof Error ? error.message : 'Unknown error.');
    return { error: error instanceof Error ? error.message : 'Could not start your subscription.' };
  }
}

export async function confirmNewsletter(token: string) {
  const parsed = tokenSchema.safeParse(token);
  if (!parsed.success) return { error: 'This confirmation link is invalid or expired.' };
  try {
    const confirmed = await confirmNewsletterSubscription(parsed.data);
    return confirmed
      ? { success: true, message: 'Your newsletter subscription is confirmed.' }
      : { error: 'This confirmation link is invalid or expired. Request a new one to subscribe.' };
  } catch (error) {
    console.error('Newsletter confirmation failed:', error instanceof Error ? error.message : 'Unknown error.');
    return { error: error instanceof Error ? error.message : 'Could not confirm your subscription.' };
  }
}

export async function unsubscribeFromNewsletter(token: string) {
  const parsed = tokenSchema.safeParse(token);
  if (!parsed.success) return { error: 'This unsubscribe link is invalid or expired.' };
  try {
    const unsubscribed = await unsubscribeWithToken(parsed.data);
    return unsubscribed
      ? { success: true, message: 'You have been unsubscribed.' }
      : { error: 'This unsubscribe link is invalid or has already been used.' };
  } catch (error) {
    console.error('Newsletter unsubscribe failed:', error instanceof Error ? error.message : 'Unknown error.');
    return { error: error instanceof Error ? error.message : 'Could not update your subscription.' };
  }
}

export async function updateAccountNewsletterSubscription(enabled: boolean) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user?.email) return { error: 'Sign in with an email address to manage your subscription.' };

  const email = emailSchema.safeParse(user.email);
  if (!email.success) return { error: 'Your account email address is invalid.' };

  const admin = createAdminClient();
  if (!enabled) {
    const { error } = await admin
      .from('newsletter_subscribers')
      .update({
        is_active: false,
        is_verified: false,
        verification_token_hash: null,
        verification_expires_at: null,
        unsubscribe_token_hash: null,
        unsubscribed_at: new Date().toISOString(),
      })
      .eq('email', email.data);
    if (error) {
      console.error('Account newsletter unsubscribe failed:', error.message);
      return { error: 'Could not update your subscription. Please try again.' };
    }
    return { success: true, message: 'Newsletter emails are turned off.' };
  }

  if (!user.email_confirmed_at) {
    return { error: 'Verify your account email before subscribing to the newsletter.' };
  }

  try {
    const ipFingerprint = await getRequestFingerprint('newsletter-account', user.id);
    const userFingerprint = await getRequestFingerprint('newsletter-account-user', user.id);
    if (
      !(await allowPublicSubmission(ipFingerprint, 10, 24 * 60 * 60))
      || !(await allowPublicSubmission(userFingerprint, 1, 10 * 60))
    ) {
      return { error: 'Please wait a few minutes before requesting another confirmation email.' };
    }

    const result = await beginNewsletterSubscription(email.data, 'account');
    return {
      success: true,
      message: result === 'already-subscribed'
        ? 'Your newsletter subscription is already active.'
        : 'Check your inbox to confirm your newsletter subscription.',
    };
  } catch (error) {
    console.error('Account newsletter subscribe failed:', error instanceof Error ? error.message : 'Unknown error.');
    return { error: error instanceof Error ? error.message : 'Could not update your subscription.' };
  }
}

export async function getNewsletterStatus() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { error: 'Sign in to view newsletter preferences.' };

  const { data, error } = await supabase.rpc('get_own_newsletter_status');
  if (error) {
    console.error('Account newsletter status lookup failed:', error.message);
    return { error: 'Newsletter preferences are unavailable until the latest database setup is applied.' };
  }
  const status = Array.isArray(data) ? data[0] : data;
  return {
    isActive: status?.is_active === true,
    isVerified: status?.is_verified === true,
  };
}
