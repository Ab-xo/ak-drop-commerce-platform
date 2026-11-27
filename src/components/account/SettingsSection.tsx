'use client';

import { useState, useEffect, useTransition } from 'react';
import { motion } from 'framer-motion';
import {
  Lock, Shield, Bell, Globe, Trash2, Smartphone,
  Eye, ChevronRight, Zap, Moon, Sun
} from 'lucide-react';
import { User as SupabaseUser } from '@supabase/supabase-js';
import type { UserProfile } from '@/lib/supabase';
import { toast } from 'sonner';
import { useTheme } from 'next-themes';
import { DISPLAY_CURRENCIES } from '@/lib/currency';
import { useCurrencyStore, useDisplayCurrency } from '@/store/currencyStore';
import { loadAccountSettings, saveAccountSettings } from '@/lib/settings-actions';

interface SettingsSectionProps {
  user: SupabaseUser;
  profile: UserProfile | null;
}

export default function SettingsSection({ user, profile }: SettingsSectionProps) {
  const { theme, setTheme } = useTheme();
  const currency = useDisplayCurrency();
  const setCurrency = useCurrencyStore((state) => state.setCurrency);
  const [isPending, startTransition] = useTransition();
  const [settings, setSettings] = useState({
    orderNotifs: true,
    promoNotifs: false,
    productNotifs: false,
    newsletter: false,
    profileVisible: true,
    orderHistory: false,
    personalizedRecs: true,
  });

  // Load persisted preferences from DB on mount
  useEffect(() => {
    loadAccountSettings().then((result) => {
      if (result.preferences) {
        setSettings((prev) => ({
          ...prev,
          orderNotifs: result.preferences!.order_updates,
          promoNotifs: result.preferences!.promotional_emails,
          newsletter: result.preferences!.email_notifications,
        }));
      }
    });
  }, [user.id]);

  const toggleSetting = (key: keyof typeof settings) => {
    const nextSettings = { ...settings, [key]: !settings[key] };
    setSettings(nextSettings);

    // Map UI keys to DB preference keys
    const formData = new FormData();
    formData.set('email_notifications', String(nextSettings.newsletter));
    formData.set('order_updates', String(nextSettings.orderNotifs));
    formData.set('promotional_emails', String(nextSettings.promoNotifs));

    startTransition(async () => {
      const result = await saveAccountSettings(formData);
      if (result.success) {
        toast.success('Setting saved!');
      } else {
        // Revert on error
        setSettings(settings);
        toast.error(result.error ?? 'Failed to save setting');
      }
    });
  };

  const securityActions = [
    {
      icon: Lock,
      title: 'Change Password',
      description: 'Update your password regularly',
      action: () => toast('Password change feature coming soon!'),
      color: 'from-blue-500/20 to-blue-600/10',
      iconColor: 'text-blue-400 bg-blue-500/10',
    },
    {
      icon: Smartphone,
      title: 'Two-Factor Authentication',
      description: 'Add an extra layer of security',
      action: () => toast('2FA setup coming soon!'),
      color: 'from-green-500/20 to-green-600/10',
      iconColor: 'text-green-400 bg-green-500/10',
      badge: 'Recommended',
    },
    {
      icon: Eye,
      title: 'Login Activity',
      description: 'View your recent login history',
      action: () => toast('Login history coming soon!'),
      color: 'from-purple-500/20 to-purple-600/10',
      iconColor: 'text-purple-400 bg-purple-500/10',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
          <div className="p-2.5 bg-primary/10 rounded-xl">
            <Shield size={24} className="text-primary" />
          </div>
          Settings & Privacy
        </h2>
        <p className="text-sm text-muted-foreground mt-2 ml-12">
          Manage your account preferences and security
        </p>
      </div>

      {/* Theme Selector Card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card border-primary/20"
      >
        <div className="flex items-start gap-4 mb-5">
          <div className="p-3 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-xl">
            {theme === 'dark' ? (
              <Moon className="text-primary" size={20} />
            ) : (
              <Sun className="text-primary" size={20} />
            )}
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-foreground mb-1">
              Appearance
            </h3>
            <p className="text-sm text-muted-foreground">
              Customize how AK Drop looks on your device
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[
            { value: 'light', label: 'Light', icon: Sun },
            { value: 'dark', label: 'Dark', icon: Moon },
            { value: 'system', label: 'System', icon: Zap },
          ].map((mode) => {
            const Icon = mode.icon;
            const isActive = theme === mode.value;
            return (
              <button
                key={mode.value}
                onClick={() => setTheme(mode.value)}
                className={`p-4 rounded-xl border-2 transition-all ${
                  isActive
                    ? 'border-primary bg-primary/10 shadow-lg shadow-primary/25'
                    : 'border-border bg-secondary/30 hover:border-primary/50'
                }`}
              >
                <Icon
                  size={24}
                  className={`mx-auto mb-2 ${
                    isActive ? 'text-primary' : 'text-muted-foreground'
                  }`}
                />
                <p
                  className={`text-sm font-medium ${
                    isActive ? 'text-primary' : 'text-foreground'
                  }`}
                >
                  {mode.label}
                </p>
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* Notifications Card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card"
      >
        <div className="flex items-start gap-4 mb-5">
          <div className="p-3 bg-primary/10 rounded-xl">
            <Bell className="text-primary" size={20} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-1">
              Notifications
            </h3>
            <p className="text-sm text-muted-foreground">
              Choose what notifications you want to receive
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {[
            { key: 'orderNotifs', label: 'Order Updates', desc: 'Get notified about your order status' },
            { key: 'promoNotifs', label: 'Promotions & Offers', desc: 'Receive exclusive deals' },
            { key: 'productNotifs', label: 'Product Updates', desc: 'New arrivals and back in stock' },
            { key: 'newsletter', label: 'Email Notifications', desc: 'Email updates and content' },
          ].map((item, i) => (
            <motion.div
              key={item.key}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 + i * 0.05 }}
              className="flex items-center justify-between p-4 bg-secondary/30 rounded-xl hover:bg-secondary/50 transition-colors"
            >
              <div>
                <p className="font-medium text-foreground text-sm">{item.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
              </div>
              <button
                onClick={() => toggleSetting(item.key as keyof typeof settings)}
                disabled={isPending}
                className={`relative w-12 h-6 rounded-full transition-colors disabled:opacity-60 ${
                  settings[item.key as keyof typeof settings]
                    ? 'bg-primary'
                    : 'bg-muted'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                    settings[item.key as keyof typeof settings]
                      ? 'translate-x-6'
                      : 'translate-x-0'
                  }`}
                />
              </button>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Security Actions */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-3"
      >
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2 ml-1">
          <Lock size={20} className="text-primary" />
          Security
        </h3>

        {securityActions.map((action, i) => {
          const Icon = action.icon;
          return (
            <motion.button
              key={i}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.25 + i * 0.05 }}
              onClick={action.action}
              className="w-full group relative overflow-hidden rounded-2xl transition-all hover:shadow-lg"
            >
              {/* Gradient background */}
              <div className={`absolute inset-0 bg-gradient-to-r ${action.color} opacity-50`} />

              <div className="relative flex items-center gap-4 p-5 bg-secondary/30 hover:bg-secondary/50 transition-colors">
                <div className={`p-3 rounded-xl ${action.iconColor}`}>
                  <Icon size={22} />
                </div>

                <div className="flex-1 text-left">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-foreground">{action.title}</p>
                    {action.badge && (
                      <span className="px-2 py-0.5 bg-orange-500/10 text-orange-500 rounded-md text-xs font-medium">
                        {action.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{action.description}</p>
                </div>

                <ChevronRight
                  size={20}
                  className="text-muted-foreground group-hover:translate-x-1 group-hover:text-primary transition-all"
                />
              </div>
            </motion.button>
          );
        })}
      </motion.div>

      {/* Privacy Settings */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass-card"
      >
        <div className="flex items-start gap-4 mb-5">
          <div className="p-3 bg-primary/10 rounded-xl">
            <Shield className="text-primary" size={20} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-1">
              Privacy
            </h3>
            <p className="text-sm text-muted-foreground">
              Control your privacy and data sharing
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {[
            { key: 'profileVisible', label: 'Profile Visibility', desc: 'Make your profile visible to others' },
            { key: 'orderHistory', label: 'Order History', desc: 'Show your purchase history' },
            { key: 'personalizedRecs', label: 'Personalized Recommendations', desc: 'Use browsing data for suggestions' },
          ].map((item, i) => (
            <motion.div
              key={item.key}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.35 + i * 0.05 }}
              className="flex items-center justify-between p-4 bg-secondary/30 rounded-xl hover:bg-secondary/50 transition-colors"
            >
              <div>
                <p className="font-medium text-foreground text-sm">{item.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
              </div>
              <button
                onClick={() => toggleSetting(item.key as keyof typeof settings)}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  settings[item.key as keyof typeof settings]
                    ? 'bg-primary'
                    : 'bg-muted'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                    settings[item.key as keyof typeof settings]
                      ? 'translate-x-6'
                      : 'translate-x-0'
                  }`}
                />
              </button>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Preferences */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="glass-card"
      >
        <div className="flex items-start gap-4 mb-5">
          <div className="p-3 bg-primary/10 rounded-xl">
            <Globe className="text-primary" size={20} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-1">
              Preferences
            </h3>
            <p className="text-sm text-muted-foreground">
              Customize your shopping experience
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="p-4 bg-secondary/30 rounded-xl">
            <label htmlFor="account-currency" className="mb-2 block">
              <span className="font-medium text-foreground text-sm">Display currency</span>
            </label>
            <select
              id="account-currency"
              value={currency}
              onChange={(event) => {
                const selected = DISPLAY_CURRENCIES.find((option) => option === event.target.value);
                if (selected) setCurrency(selected);
              }}
              className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground transition-all focus:border-primary focus:ring-2 focus:ring-primary/50"
            >
              {DISPLAY_CURRENCIES.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
            <p className="mt-2 text-xs text-muted-foreground">Illustrative rates; order records remain in ETB.</p>
          </div>
          <div className="rounded-xl bg-secondary/30 p-4">
            <p className="mb-2 font-medium text-foreground text-sm">Language</p>
            <p className="rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground">English</p>
            <p className="mt-2 text-xs text-muted-foreground">Additional translations can be configured for a production storefront.</p>
          </div>
        </div>
      </motion.div>

      {/* Danger Zone */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="relative overflow-hidden rounded-2xl"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 via-red-500/5 to-transparent" />

        <div className="relative glass-card border-red-500/20">
          <div className="flex items-start gap-4 mb-4">
            <div className="p-3 bg-red-500/10 rounded-xl">
              <Trash2 className="text-red-500" size={20} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-1">
                Danger Zone
              </h3>
              <p className="text-sm text-muted-foreground">
                Irreversible actions - proceed with caution
              </p>
            </div>
          </div>

          <button
            onClick={() => toast.error('Account deletion requires verification')}
            className="w-full flex items-center justify-between p-4 bg-red-500/5 hover:bg-red-500/10 border border-red-500/20 hover:border-red-500/40 rounded-xl transition-all group"
          >
            <div className="text-left">
              <p className="font-semibold text-red-500 text-sm">Delete Account</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Permanently delete your account and all data
              </p>
            </div>
            <ChevronRight size={18} className="text-red-500 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </motion.div>
    </div>
  );
}
