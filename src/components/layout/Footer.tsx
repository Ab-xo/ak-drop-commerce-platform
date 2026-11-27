"use client";

import Link from "next/link";
import { ArrowUpRight, LoaderCircle } from "lucide-react";
import { useActionState } from "react";
import { subscribeToNewsletter } from "@/app/newsletter/actions";

type NewsletterActionState = {
  success: boolean;
  message: string;
  error: string;
};

const initialNewsletterState: NewsletterActionState = {
  success: false,
  message: "",
  error: "",
};

const shopLinks = [
  { label: "All products",       href: "/shop" },
  { label: "Shoes",              href: "/shop?category=footwear" },
  { label: "Shirts & apparel",   href: "/shop?category=clothing" },
  { label: "Accessories",        href: "/shop?category=accessories" },
];

const supportLinks = [
  { label: "About AK Drop",   href: "/about" },
  { label: "Contact us",      href: "/contact" },
  { label: "Shopping bag",    href: "/cart" },
];

function FooterLink({
  href,
  label,
  external,
}: {
  href: string;
  label: string;
  external?: boolean;
}) {
  const cls =
    "group flex items-center gap-1 text-foreground/60 hover:text-primary transition-colors duration-200 w-fit";

  const inner = (
    <>
      <span className="relative">
        {label}
        {/* sliding underline */}
        <span className="absolute -bottom-0.5 left-0 h-px w-0 bg-primary transition-all duration-300 group-hover:w-full" />
      </span>
      <ArrowUpRight
        size={13}
        className="opacity-0 -translate-x-1 translate-y-1 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0 group-hover:translate-y-0"
      />
    </>
  );

  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>
        {inner}
      </a>
    );
  }

  return (
    <Link href={href} className={cls}>
      {inner}
    </Link>
  );
}

export default function Footer() {
  const year = new Date().getFullYear();
  const [newsletterState, newsletterAction, isSubscribing] = useActionState(
    async (
      _previous: NewsletterActionState,
      formData: FormData,
    ): Promise<NewsletterActionState> => {
      const result = await subscribeToNewsletter(formData);
      return "error" in result
        ? { success: false, message: "", error: result.error ?? "Could not subscribe." }
        : { success: true, message: result.message ?? "Subscription confirmed.", error: "" };
    },
    initialNewsletterState,
  );

  return (
    <footer className="bg-secondary/30 border-t border-border pt-16 pb-8 mt-auto">
      <div className="container mx-auto px-4 md:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[1.25fr_0.75fr_0.75fr_1.25fr] gap-12 mb-16">

          {/* Brand */}
          <div>
            <Link
              href="/"
              className="group flex items-center gap-3 mb-6 w-fit"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground font-black rotate-[-8deg] group-hover:rotate-0 transition-transform duration-300">
                AK
              </span>
              <span className="text-xl font-black tracking-[.18em] uppercase group-hover:text-primary transition-colors duration-200">
                DROP
              </span>
            </Link>
            <p className="text-foreground/70 text-sm leading-relaxed">
              Curated footwear, apparel, and everyday style. Discover pieces
              selected to bring confidence to every day.
            </p>
          </div>

          {/* Shop links */}
          <div>
            <h4 className="font-bold mb-6 text-sm uppercase tracking-widest">Shop</h4>
            <ul className="space-y-4 text-sm">
              {shopLinks.map((l) => (
                <li key={l.href}>
                  <FooterLink href={l.href} label={l.label} />
                </li>
              ))}
            </ul>
          </div>

          {/* Support links */}
          <div>
            <h4 className="font-bold mb-6 text-sm uppercase tracking-widest">Support</h4>
            <ul className="space-y-4 text-sm">
              {supportLinks.map((l) => (
                <li key={l.href}>
                  <FooterLink href={l.href} label={l.label} />
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="font-bold mb-6 text-sm uppercase tracking-widest">Drop updates</h4>
            <p className="text-foreground/70 text-sm leading-relaxed mb-5">
              Get launch alerts and limited-edition releases in your inbox.
            </p>
            <form action={newsletterAction} className="space-y-3">
              <input name="website" tabIndex={-1} autoComplete="off" className="sr-only" aria-label="Leave empty" />
              <div className="flex rounded-xl border border-input bg-background p-1 focus-within:border-primary">
                <input
                  name="email"
                  type="email"
                  required
                  maxLength={254}
                  placeholder="Email address"
                  aria-label="Email address"
                  className="min-w-0 flex-1 bg-transparent px-3 text-sm outline-none"
                />
                <button type="submit" disabled={isSubscribing} className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground disabled:opacity-60" aria-label="Subscribe">
                  {isSubscribing ? <LoaderCircle size={16} className="animate-spin" /> : <ArrowUpRight size={17} />}
                </button>
              </div>
              {newsletterState.message && <p role="status" className="text-xs text-primary">{newsletterState.message}</p>}
              {newsletterState.error && <p role="alert" className="text-xs text-destructive">{newsletterState.error}</p>}
            </form>
          </div>

        </div>

        {/* Bottom bar */}
        <div className="border-t border-border pt-8 flex flex-col md:flex-row justify-between text-xs text-foreground/40">
          <p>© {year} AK Drop. All rights reserved.</p>
          <p className="mt-3 md:mt-0">Orders are stored in ETB · display conversions are illustrative</p>
        </div>
      </div>
    </footer>
  );
}
