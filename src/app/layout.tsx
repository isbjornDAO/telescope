import type { Metadata } from "next";
import localFont from "next/font/local";

import "./globals.css";
import "@rainbow-me/rainbowkit/styles.css";

import { siteConfig } from "@/lib/site";
import { ThemeProvider } from "next-themes";
import { Web3Provider } from "@/components/providers/web3";
import { Toaster } from "@/components/ui/toaster";
import { FAQ } from "@/components/faq";
import { ConnectButton } from "@/components/connect-button";
import { BackButton } from "@/components/back-button";
import Link from "next/link";
import { Newspaper } from "lucide-react";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url.base),
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: siteConfig.keywords,
  authors: [
    {
      name: siteConfig.author,
      url: siteConfig.url.author,
    },
  ],
  creator: siteConfig.author,
  appleWebApp: {
    title: siteConfig.name,
    capable: true,
    statusBarStyle: "black-translucent",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteConfig.url.base,
    title: siteConfig.name,
    description: siteConfig.description,
    siteName: siteConfig.name,
    images: "/opengraph-image",
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.name,
    description: siteConfig.description,
    images: "/opengraph-image",
    creator: "@gabrielrvita",
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider attribute="class" defaultTheme="light">
          <Web3Provider>
            <Toaster />
            <header className="w-full bg-white dark:bg-zinc-900 bg border-b-4 border-zinc-100 dark:border-zinc-700">
              <div className="w-full relative h-64 md:h-auto max-w-screen-lg mx-auto pt-24 px-8 flex items-start justify-end md:justify-between md:flex-row">
                <div className="flex items-center gap-4 absolute left-8 z-10">
                  <BackButton />
                </div>
                <img
                  src="/logo.png"
                  alt="Telescope"
                  className="w-56 md:w-80 flex items-end absolute md:relative left-0 bottom-0"
                />
                <div className="flex items-center relative z-10 justify-center gap-4 md:self-auto">
                  <div className="flex items-center gap-2">
                    <Link
                      href="/news"
                      className="flex items-center gap-2 bg-white rounded-lg px-4 py-2 h-9 shadow"
                    >
                      <Newspaper className="h-4 w-4" />
                      News
                    </Link>
                  </div>
                  <FAQ />
                  <ConnectButton />
                </div>
              </div>
            </header>
            {children}
          </Web3Provider>
        </ThemeProvider>
      </body>
    </html>
  );
}
