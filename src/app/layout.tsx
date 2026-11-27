import { Toaster as SonnerToaster } from "sonner";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import SiteFrame from "@/components/layout/SiteFrame";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  title: { default: "AK Drop | Premium Fashion & Everyday Style", template: "%s | AK Drop" },
  description: "Discover curated footwear, apparel, accessories, and everyday style. Shop the latest drops with secure checkout.",
  keywords: ["fashion", "footwear", "sneakers", "apparel", "accessories", "AK Drop", "streetwear"],
  authors: [{ name: "AK Drop" }],
  robots: "index, follow",
  icons: { icon: "/ak-drop-icon.svg", shortcut: "/ak-drop-icon.svg" },
  openGraph: {
    type: "website",
    siteName: "AK Drop",
    title: "AK Drop | Premium Fashion & Everyday Style",
    description: "Discover curated footwear, apparel, accessories, and everyday style.",
    images: [{ url: "/img/backgroundHD2.jpg", width: 1200, height: 630, alt: "AK Drop" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "AK Drop | Premium Fashion & Everyday Style",
    description: "Discover curated footwear, apparel, accessories, and everyday style.",
    images: ["/img/backgroundHD2.jpg"],
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          rel="dns-prefetch"
          href="https://osmhkzlkyvagdgrrlgyu.supabase.co"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}
        suppressHydrationWarning
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          storageKey="ak-drop-theme"
          disableTransitionOnChange={false}
        >
          <SonnerToaster
            position="bottom-right"
            theme="system"
            richColors
            closeButton
            toastOptions={{
              duration: 3500,
              classNames: {
                toast: "group !rounded-2xl !border !border-border !bg-card !text-foreground !shadow-xl !shadow-black/10 !backdrop-blur-xl",
                title: "!font-semibold !tracking-tight",
                description: "!text-muted-foreground",
                success: "!border-emerald-500/25 !bg-emerald-500/[0.08]",
                error: "!border-destructive/30 !bg-destructive/[0.08]",
                warning: "!border-amber-500/30 !bg-amber-500/[0.08]",
                info: "!border-primary/25 !bg-primary/[0.06]",
                closeButton: "!border-border !bg-background !text-muted-foreground hover:!text-foreground",
              },
            }}
          />

          <SiteFrame>{children}</SiteFrame>
        </ThemeProvider>
      </body>
    </html>
  );
}
