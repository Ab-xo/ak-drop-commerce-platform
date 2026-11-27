'use server';

import { z } from 'zod';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';

const preferencesSchema = z.object({
  email_notifications: z.boolean(),
  order_updates: z.boolean(),
  promotional_emails: z.boolean(),
});

export async function loadAccountSettings(): Promise<{
  preferences: { email_notifications: boolean; order_updates: boolean; promotional_emails: boolean } | null;
  error?: string;
}> {
  const supabase = await createServerSupabaseClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { preferences: null, error: 'Not authenticated' };
  }

  const { data: profile, error } = await supabase
    .from('user_profiles')
    .select('preferences')
    .eq('id', user.id)
    .maybeSingle();

  if (error) {
    return { preferences: null, error: error.message };
  }

  const prefs = profile?.preferences as Record<string, unknown> | null;

  return {
    preferences: {
      email_notifications: typeof prefs?.email_notifications === 'boolean' ? prefs.email_notifications : true,
      order_updates: typeof prefs?.order_updates === 'boolean' ? prefs.order_updates : true,
      promotional_emails: typeof prefs?.promotional_emails === 'boolean' ? prefs.promotional_emails : false,
    },
  };
}

export async function saveAccountSettings(
  formData: FormData,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createServerSupabaseClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: 'Not authenticated' };
  }

  const rawData = {
    email_notifications: formData.get('email_notifications') === 'true',
    order_updates: formData.get('order_updates') === 'true',
    promotional_emails: formData.get('promotional_emails') === 'true',
  };

  const parsed = preferencesSchema.safeParse(rawData);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  // Load current preferences to merge
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('preferences')
    .eq('id', user.id)
    .maybeSingle();

  const existing = (profile?.preferences as Record<string, unknown>) ?? {};

  const { error } = await createAdminClient()
    .from('user_profiles')
    .update({
      preferences: { ...existing, ...parsed.data },
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function checkUsernameAvailability(
  username: string,
): Promise<{ available: boolean; error?: string }> {
  if (!username || username.length < 3) {
    return { available: false };
  }

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('user_profiles')
    .select('id, username')
    .eq('username', username.trim().toLowerCase())
    .maybeSingle();

  if (error) {
    return { available: false, error: error.message };
  }

  // Available if no row found, or the row belongs to the current user
  if (!data) return { available: true };
  if (user && data.id === user.id) return { available: true };

  return { available: false };
}
