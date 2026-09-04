import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/react";

import "./globals.css";
import "@rainbow-me/rainbowkit/styles.css";

import { siteConfig } from "@/lib/site";
import { AppProviders } from "@/components/providers/app-providers";
import { Toaster } from "@/components/ui/toaster";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { AppHeader } from "@/components/app/app-header";
import { BottomNav } from "@/components/app/bottom-nav";
import { ServiceWorker } from "@/components/app/service-worker";
import { InstallPrompt } from "@/components/app/install-prompt";
import { ComposeButton } from "@/components/app/compose-button";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url.base),
  title: { default: siteConfig.name, template: `%s | ${siteConfig.name}` },
  description: siteConfig.description,
  keywords: siteConfig.keywords,
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteConfig.url.base,
    title: siteConfig.name,
    description: siteConfig.description,
    siteName: siteConfig.name,
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.name,
    description: siteConfig.description,
  },
  manifest: "/manifest.webmanifest",
  applicationName: siteConfig.name,
  appleWebApp: {
    capable: true,
    title: siteConfig.name,
    // Content runs under the status bar, which is what makes an installed PWA
    // look like an app rather than a page with a white bar on top.
    statusBarStyle: "black-translucent",
  },
  formatDetection: { telephone: false },
  icons: {
    icon: "/favicon.ico",
    apple: "/icons/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // `viewportFit: cover` is what lets the safe-area insets resolve to real
  // values on a notched iPhone; without it they are all zero.
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#e6f0f5" },
    { media: "(prefers-color-scheme: dark)", color: "#1a1a1a" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background antialiased">
        <AppProviders>
          <div className="flex min-h-screen flex-col">
            <AppHeader />

            {/* The full illustration stays on desktop, where there is room. */}
            <div className="bg hidden flex-col justify-end border-b-4 border-zinc-300 dark:border-zinc-700 md:flex">
              <Navbar />
            </div>
            <main className="pb-nav flex-1 md:pb-0">{children}</main>
            <div className="hidden md:block">
              <Footer />
            </div>
            <BottomNav />
            <ComposeButton />
            <InstallPrompt />
          </div>
          <Toaster />
        </AppProviders>
        <ServiceWorker />
        <Analytics />
      </body>
    </html>
  );
}
