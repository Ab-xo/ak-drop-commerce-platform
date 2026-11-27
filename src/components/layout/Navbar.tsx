"use client";

import { useCartStore } from "@/store/cartStore";
import Link from "next/link";
import { ShoppingCart, User, Search, Menu, X, Bell, Heart } from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ThemeToggle from "@/components/ui/ThemeToggle";
import ClientOnly from "@/components/ui/ClientOnly";
import UserProfileDropdown from "./UserProfileDropdown";
import { createClient } from "@/lib/supabase";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { isNotificationsTableMissing } from "@/lib/notification-errors";

interface NavUser { email: string; name?: string; avatarUrl?: string; }

function resolveDisplayName(authUser: SupabaseUser, profileName?: string | null) {
  return profileName || authUser.user_metadata?.full_name || authUser.user_metadata?.name || undefined;
}

function resolveAvatarUrl(authUser: SupabaseUser, profileAvatar?: string | null) {
  return profileAvatar || authUser.user_metadata?.avatar_url || authUser.user_metadata?.picture || undefined;
}

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<NavUser | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [loading, setLoading] = useState(true);
  const totalItems = useCartStore((s) => s.getTotalItems());
  const setCartOpen = useCartStore((s) => s.setCartOpen);

  useEffect(() => {
    const supabase = createClient();
    let mounted = true;
    const loadUser = async (authUser: SupabaseUser) => {
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("full_name, avatar_url")
        .eq("id", authUser.id)
        .maybeSingle();
      if (!mounted) return;
      setUserId(authUser.id);
      setUser({
        email: authUser.email ?? "",
        name: resolveDisplayName(authUser, profile?.full_name),
        avatarUrl: resolveAvatarUrl(authUser, profile?.avatar_url),
      });
      setLoading(false);
    };
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) loadUser(session.user);
      else if (mounted) setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) loadUser(session.user);
      else if (mounted) { setUser(null); setUserId(null); setUnreadNotifications(0); setLoading(false); }
    });
    return () => { mounted = false; subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    if (!userId) return;

    let mounted = true;
    const refreshUnreadCount = async () => {
      const { count, error } = await createClient()
        .from("user_notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("is_read", false);
      if (error) {
        if (isNotificationsTableMissing(error)) {
          setUnreadNotifications(0);
          return;
        }
        console.error("Navbar notification count error:", error.message);
        return;
      }
      if (mounted) setUnreadNotifications(count ?? 0);
    };

    refreshUnreadCount();
    window.addEventListener("focus", refreshUnreadCount);
    window.addEventListener("akdrop:notifications-changed", refreshUnreadCount);
    return () => {
      mounted = false;
      window.removeEventListener("focus", refreshUnreadCount);
      window.removeEventListener("akdrop:notifications-changed", refreshUnreadCount);
    };
  }, [userId]);

  useEffect(() => {
    // Use scrollY > 10 so even a tiny scroll triggers the solid navbar.
    // Run immediately on mount so SSR/hydration doesn't cause a flash.
    const onScroll = () => setIsScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navLinks = [
    { name: "Home", href: "/" }, { name: "Shop", href: "/shop" },
    { name: "Categories", href: "/categories" }, { name: "About", href: "/about" },
    { name: "Contact", href: "/contact" },
  ];

  return (
    <nav
      className={`fixed top-0 w-full z-50 border-b transition-all duration-300 ${
        isScrolled
          ? "bg-background/95 backdrop-blur-xl border-border/80 shadow-sm"
          : "bg-background border-border/60"
      }`}
    >
      <div className="container mx-auto px-4 md:px-8 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group" aria-label="AK Drop home">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground font-black text-lg rotate-[-8deg] group-hover:rotate-0 transition-transform duration-300">AK</span>
          <span className="text-xl font-black tracking-[.18em] uppercase group-hover:text-primary transition-colors duration-200">DROP</span>
        </Link>
        <div className="hidden md:flex items-center gap-7">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className="text-sm hover:text-primary nav-link transition-colors"
            >
              {link.name}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <ClientOnly><ThemeToggle /></ClientOnly>
          <Link href="/shop" aria-label="Search products" className="p-2 hover:bg-foreground/10 rounded-full"><Search size={19} /></Link>
          {user && <Link
            href="/account?tab=notifications"
            aria-label={unreadNotifications ? `Notifications, ${unreadNotifications} unread` : "Notifications"}
            className="relative rounded-full p-2 transition hover:bg-foreground/10"
          >
            <Bell size={19} />
            {unreadNotifications > 0 && <span className="absolute -right-0.5 -top-0.5 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-black text-primary-foreground">{unreadNotifications > 9 ? "9+" : unreadNotifications}</span>}
          </Link>}
          {user && <Link
            href="/wishlist"
            aria-label="Wishlist"
            className="rounded-full p-2 transition hover:bg-foreground/10"
          >
            <Heart size={19} />
          </Link>}
          <button onClick={() => setCartOpen(true)} aria-label="Open shopping bag" className="p-2 hover:bg-foreground/10 rounded-full relative">
            <ShoppingCart size={19} />
            <ClientOnly>{totalItems > 0 && <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-black">{totalItems}</span>}</ClientOnly>
          </button>
          <ClientOnly>
            {loading ? <div className="w-9 h-9 rounded-full bg-muted animate-pulse" /> : user ? <UserProfileDropdown user={user} /> : <Link href="/auth/signin" aria-label="Sign in" className="p-2 hover:bg-foreground/10 rounded-full"><User size={19} /></Link>}
          </ClientOnly>
          <button className="md:hidden p-2" onClick={() => setMobileMenuOpen((open) => !open)} aria-label="Toggle menu" aria-expanded={mobileMenuOpen}>{mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}</button>
        </div>
      </div>
      <AnimatePresence>
        {mobileMenuOpen && <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="md:hidden bg-background/95 backdrop-blur-2xl border-b border-border"><div className="flex flex-col p-6 gap-4">{navLinks.map((link) => <Link key={link.name} href={link.href} className="text-lg border-b border-border/50 pb-3" onClick={() => setMobileMenuOpen(false)}>{link.name}</Link>)}</div></motion.div>}
      </AnimatePresence>
    </nav>
  );
}
