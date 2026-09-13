import type { Metadata } from "next";
// import localFont from "next/font/local";

import "./globals.css";
import "@rainbow-me/rainbowkit/styles.css";

import { siteConfig } from "@/lib/site";
import { ThemeProvider } from "next-themes";
import { Web3Provider } from "@/components/providers/web3";
import { Toaster } from "@/components/ui/toaster";
import { Navbar } from "@/components/navbar";
import { PageNavigation } from "@/components/page-navigation";
import { ParallaxBanner } from "@/components/parallax-banner";
import { Footer } from "@/components/footer";
import { Analytics } from "@vercel/analytics/react"

// const geistSans = localFont({
//   src: "./fonts/GeistVF.woff",
//   variable: "--font-geist-sans",
//   weight: "100 900",
// });
// const geistMono = localFont({
//   src: "./fonts/GeistMonoVF.woff",
//   variable: "--font-geist-mono",
//   weight: "100 900",
// });

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
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
  },
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
    <html lang="en" suppressHydrationWarning>
      <body
        className={`antialiased`}
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <Web3Provider>
            <div className="flex flex-col min-h-screen">
              <div className="bg relative overflow-hidden flex flex-col justify-between">
                <ParallaxBanner />
                <div className="relative z-10 flex flex-col justify-between flex-1 h-full">
                  <Toaster />
                  <Navbar />
                </div>
              </div>
              <main className="flex-1 -mt-4 sm:-mt-8 relative z-20 pb-16">
                <div className="w-full max-w-screen-lg mx-auto px-2.5 sm:px-4">
                  <div className="retro-shell overflow-hidden min-h-[650px] flex flex-col">
                    <PageNavigation />
                    <div className="p-2.5 sm:p-4 flex-1">
                      {children}
                    </div>
                  </div>
                </div>
              </main>
              <Footer />
            </div>
          </Web3Provider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
