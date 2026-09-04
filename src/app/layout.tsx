import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/react";

import "./globals.css";
import "@rainbow-me/rainbowkit/styles.css";

import { siteConfig } from "@/lib/site";
import { AppProviders } from "@/components/providers/app-providers";
import { Toaster } from "@/components/ui/toaster";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

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
  icons: { icon: "/favicon.ico" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background antialiased">
        <AppProviders>
          <div className="flex min-h-screen flex-col">
            {/* `.bg` supplies the polar bear illustration behind the header. */}
            <div className="bg border-b-4 border-zinc-300 dark:border-zinc-700">
              <Navbar />
            </div>
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
          <Toaster />
        </AppProviders>
        <Analytics />
      </body>
    </html>
  );
}
