'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Award, Calendar, Camera, Mail, Phone, Save, ShieldCheck, UserRound, X } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import type { UserProfile } from '@/lib/supabase';
import { toast } from 'sonner';
import { checkUsernameAvailability } from '@/lib/settings-actions';

interface ProfileSectionProps { user: SupabaseUser; profile: UserProfile | null; }
type FormState = { full_name: string; username: string; phone: string; date_of_birth: string; gender: string };

function memberDate(value?: string | null) {
  if (!value) return 'Date unavailable';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Date unavailable' : date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function generateUploadPath(userId: string, file: File) {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
  const unique = Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  return `${userId}/${unique}.${ext}`;
}

export default function ProfileSection({ user, profile }: ProfileSectionProps) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [currentAvatarUrl, setCurrentAvatarUrl] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<FormState>({ full_name: '', username: '', phone: '', date_of_birth: '', gender: '' });

  useEffect(() => {
    setForm({
      full_name: profile?.full_name || user.user_metadata?.full_name || user.user_metadata?.name || '',
      username: profile?.username || user.user_metadata?.username || '',
      phone: profile?.phone || '', date_of_birth: profile?.date_of_birth || '', gender: profile?.gender || '',
    });
    setCurrentAvatarUrl(profile?.avatar_url || user.user_metadata?.avatar_url || user.user_metadata?.picture || null);
  }, [profile, user]);

  const displayName = form.full_name || user.email?.split('@')[0] || 'Member';
  const avatarUrl = currentAvatarUrl || '';
  const verified = Boolean(user.email_confirmed_at || profile?.is_verified);
  const initials = displayName.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'AK';
  const completion = useMemo(() => Math.round(([form.full_name, form.username, user.email, form.phone, form.date_of_birth, form.gender].filter(Boolean).length / 6) * 100), [form, user.email]);
  const setField = (key: keyof FormState, value: string) => setForm((current) => ({ ...current, [key]: value }));

  async function handleAvatarFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please select a JPEG, PNG, or WebP image.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5 MB.');
      return;
    }

    setAvatarUploading(true);
    try {
      const supabase = createClient();
      const path = generateUploadPath(user.id, file);

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true, contentType: file.type });

      if (uploadError) {
        toast.error('Upload failed: ' + uploadError.message);
        return;
      }

      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path);
      const publicUrl = urlData.publicUrl;

      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) {
        toast.error('Could not update avatar: ' + updateError.message);
        return;
      }

      setCurrentAvatarUrl(publicUrl);
      setImageError(false);
      window.dispatchEvent(new CustomEvent('profileUpdated', { detail: { avatar_url: publicUrl } }));
      toast.success('Avatar updated!');
    } finally {
      setAvatarUploading(false);
      // Reset input so the same file can be re-selected if needed
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function handleUsernameBlur() {
    const username = form.username.trim().toLowerCase();
    if (!username || username.length < 3) {
      setUsernameStatus('idle');
      return;
    }
    setUsernameStatus('checking');
    const result = await checkUsernameAvailability(username);
    setUsernameStatus(result.available ? 'available' : 'taken');
  }

  async function saveProfile() {
    if (form.full_name.trim().length < 2) return toast.error('Please enter your full name.');
    if (form.username && !/^[a-zA-Z0-9_]{3,16}$/.test(form.username)) return toast.error('Username must be 3–16 letters, numbers, or underscores.');
    setSaving(true);
    const { data, error } = await createClient().from('user_profiles').upsert({ id: user.id, email: user.email, full_name: form.full_name.trim(), username: form.username.trim().toLowerCase() || null, phone: form.phone.trim() || null, date_of_birth: form.date_of_birth || null, gender: form.gender || null }, { onConflict: 'id' }).select('*').single();
    if (error) toast.error(error.message.toLowerCase().includes('username') ? 'That username is already in use.' : 'Unable to save your profile.');
    else { window.dispatchEvent(new CustomEvent('profileUpdated', { detail: data })); setEditing(false); toast.success('Profile updated successfully.'); }
    setSaving(false);
  }

  const details = [
    ['Full name', form.full_name || 'Not set', UserRound, 'text-purple-400'], ['Username', form.username ? `@${form.username}` : 'Not set', UserRound, 'text-blue-400'], ['Email address', user.email || 'Not set', Mail, 'text-cyan-400'], ['Phone number', form.phone || 'Not set', Phone, 'text-green-400'], ['Date of birth', form.date_of_birth ? new Date(form.date_of_birth).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Not set', Calendar, 'text-orange-400'], ['Gender', form.gender ? form.gender[0].toUpperCase() + form.gender.slice(1) : 'Not set', UserRound, 'text-pink-400'],
  ] as const;

  return <div className="space-y-6">
    {/* Hidden file input for avatar upload */}
    <input
      ref={fileInputRef}
      type="file"
      accept="image/jpeg,image/png,image/webp"
      className="hidden"
      onChange={handleAvatarFileChange}
      aria-label="Upload profile photo"
    />

    <div className="relative overflow-hidden rounded-2xl border border-border bg-background shadow-sm"><div className="h-1 bg-gradient-to-r from-primary via-purple-500 to-blue-500" /><div className="relative flex flex-col items-center gap-6 p-6 sm:flex-row sm:items-start sm:p-8"><div className="relative shrink-0">{avatarUrl && !imageError ? <img src={avatarUrl} alt={displayName} className="h-28 w-28 rounded-2xl object-cover shadow-lg ring-4 ring-primary/10" referrerPolicy="no-referrer" onError={() => setImageError(true)} /> : <div className="flex h-28 w-28 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-purple-600 text-3xl font-black text-white shadow-lg">{initials}</div>}<button
      type="button"
      onClick={() => fileInputRef.current?.click()}
      disabled={avatarUploading}
      aria-label="Upload profile photo"
      className="absolute -bottom-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-green-500 text-white hover:bg-green-600 transition-colors disabled:opacity-60"
    ><Camera size={14} /></button></div><div className="min-w-0 flex-1 text-center sm:text-left"><h2 className="text-2xl font-black tracking-tight">{displayName}</h2><p className="mt-1 truncate text-sm text-muted-foreground">{user.email}</p><div className="mt-4 flex flex-wrap justify-center gap-2 sm:justify-start"><span className="inline-flex items-center gap-1.5 rounded-full bg-green-500/10 px-3 py-1.5 text-xs font-semibold text-green-500 ring-1 ring-green-500/20"><ShieldCheck size={14} />{verified ? 'Verified account' : 'Email pending'}</span><span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary ring-1 ring-primary/20"><Award size={14} />AK Drop member</span></div></div><button type="button" onClick={() => setEditing((value) => !value)} className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 transition hover:opacity-90">{editing ? <X size={16} /> : <Camera size={16} />}{editing ? 'Close editor' : 'Edit profile'}</button></div></div>
    {editing && <div className="rounded-2xl border border-primary/20 bg-background p-5 shadow-sm sm:p-6"><div className="mb-5"><h3 className="text-lg font-bold">Update your personal info</h3><p className="text-sm text-muted-foreground">Changes are saved to your account profile.</p></div><div className="grid gap-4 md:grid-cols-2">{([['full_name','Full name','text'],['phone','Phone','tel'],['date_of_birth','Date of birth','date']] as const).map(([key,label,type]) => <label key={key} className="space-y-2 text-sm font-semibold">{label}<input value={form[key]} onChange={(event) => setField(key, event.target.value)} type={type} className="w-full rounded-xl border border-border bg-secondary/20 px-4 py-3 font-normal outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" /></label>)}
    <div className="space-y-2 text-sm font-semibold">
      Username
      <input
        value={form.username}
        onChange={(event) => { setField('username', event.target.value); setUsernameStatus('idle'); }}
        onBlur={handleUsernameBlur}
        type="text"
        placeholder="e.g. ak_drop"
        className="w-full rounded-xl border border-border bg-secondary/20 px-4 py-3 font-normal outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
      />
      {usernameStatus === 'checking' && <p className="text-xs text-muted-foreground mt-1">Checking…</p>}
      {usernameStatus === 'available' && <p className="text-xs text-green-500 mt-1">✓ Available</p>}
      {usernameStatus === 'taken' && <p className="text-xs text-red-500 mt-1">✗ Already taken</p>}
    </div>
    <label className="space-y-2 text-sm font-semibold">Gender<select value={form.gender} onChange={(event) => setField('gender', event.target.value)} className="w-full rounded-xl border border-border bg-secondary/20 px-4 py-3 font-normal outline-none focus:border-primary"><option value="">Prefer not to say</option><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option></select></label></div><div className="mt-5 flex justify-end"><button type="button" onClick={saveProfile} disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground disabled:opacity-50"><Save size={16} />{saving ? 'Saving…' : 'Save changes'}</button></div></div>}
    <div className="grid gap-4 md:grid-cols-2">{details.map(([label,value,Icon,color]) => <div key={label} className="rounded-2xl border border-border bg-background p-5 shadow-sm transition hover:border-primary/30"><div className="flex items-center gap-4"><div className={`rounded-xl bg-secondary/50 p-3 ${color}`}><Icon size={21} /></div><div className="min-w-0"><p className="text-xs font-medium text-muted-foreground">{label}</p><p className="truncate text-base font-semibold">{value}</p></div></div></div>)}</div>
    <div className="grid gap-4 sm:grid-cols-2"><div className="rounded-2xl border border-primary/20 bg-primary/5 p-5"><div className="flex items-center gap-3"><Calendar size={20} className="text-primary" /><div><p className="text-xs font-medium text-muted-foreground">Member since</p><p className="text-lg font-bold">{memberDate(profile?.created_at || user.created_at)}</p></div></div></div><div className="rounded-2xl border border-border bg-background p-5"><div className="mb-2 flex justify-between text-sm"><span className="font-semibold">Profile completion</span><span className="font-bold text-primary">{completion}%</span></div><div className="h-2 overflow-hidden rounded-full bg-secondary"><div className="h-full rounded-full bg-gradient-to-r from-primary to-purple-500" style={{ width: `${completion}%` }} /></div><p className="mt-2 text-xs text-muted-foreground">Complete your details for a better shopping experience.</p></div></div>
  </div>;
}
