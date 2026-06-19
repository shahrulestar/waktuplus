import type React from "react"
import type { Metadata, Viewport } from "next"
import Script from "next/script"
import { Inter, Inter_Tight } from "next/font/google"
import { JsonLd, getSiteJsonLd } from "@/components/json-ld"
import { AppProvider } from "@/lib/store"
import { OG_IMAGE, SITE_DESCRIPTION, SITE_NAME, SITE_TITLE, SITE_URL } from "@/lib/site"
import { UpdateBanner } from "@/components/UpdateBanner"
import { ViewportInit } from "@/components/viewport-init"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-geist-sans",
  display: "swap",
})

const interTight = Inter_Tight({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
})

export const metadata: Metadata = {
  title: {
    default: SITE_TITLE,
    template: "%s | Waktu+",
  },
  description: SITE_DESCRIPTION,
  keywords: [
    "prayer times",
    "waktu solat",
    "mosque display",
    "surau display",
    "masjid display",
    "malaysia prayer times",
    "jadual solat",
    "waktu solat malaysia",
    "azan alert",
    "iqamah countdown",
  ],
  authors: [{ name: "Waktu+" }],
  creator: "Waktu+",
  publisher: "Waktu+",
  metadataBase: new URL(SITE_URL),
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Waktu+",
  },
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    siteName: SITE_NAME,
    type: "website",
    locale: "en_US",
    images: [OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [OG_IMAGE.url],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: SITE_URL,
  },
  category: "religion",
  generator: "Waktu+",
}

export const viewport: Viewport = {
  themeColor: "#18181b",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${interTight.variable}`} suppressHydrationWarning>
      <head>
        <ViewportInit />
        <Script async src="https://www.googletagmanager.com/gtag/js?id=G-VGEYXEF9L0" strategy="afterInteractive" />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-VGEYXEF9L0');
          `}
        </Script>
        <link
          href="https://fonts.googleapis.com/css2?family=Alyamama:wght@300..900&family=Google+Sans:ital,opsz,wght@0,17..18,400..700;1,17..18,400..700&display=swap"
          rel="stylesheet"
        />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon-16x16.png" sizes="16x16" type="image/png" />
        <link rel="icon" href="/favicon-32x32.png" sizes="32x32" type="image/png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body
        suppressHydrationWarning
        style={{
          backgroundColor: "#18181b",
          color: "#ffffff",
          margin: 0,
          padding: 0,
          minHeight: "100vh",
        }}
      >
        <JsonLd data={getSiteJsonLd()} />
        <UpdateBanner />
        <AppProvider>{children}</AppProvider>
        {process.env.NEXT_PUBLIC_CF_BEACON_TOKEN && (
          <Script
            defer
            src="https://static.cloudflareinsights.com/beacon.min.js"
            data-cf-beacon={JSON.stringify({
              token: process.env.NEXT_PUBLIC_CF_BEACON_TOKEN,
            })}
            strategy="afterInteractive"
          />
        )}
      </body>
    </html>
  )
}
