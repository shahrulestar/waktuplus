import type React from "react"
import type { Metadata, Viewport } from "next"
import Script from "next/script"
import { Geist } from "next/font/google"
import { AppProvider } from "@/lib/store"
import { UpdateBanner } from "@/components/UpdateBanner"
import "./globals.css"

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
  display: "swap",
})

export const metadata: Metadata = {
  title: {
    default: "Waktu+ - Prayer Times & Al-Quran",
    template: "%s | Waktu+",
  },
  description:
    "Prayer times, Al-Quran & Islamic calendar for Malaysia. Free, no ads, no signup.",
  keywords: [
    "prayer times",
    "waktu solat",
    "al-quran",
    "islamic app",
    "muslim app",
    "quran translation",
    "malaysia prayer times",
    "jadual solat",
    "quran online",
    "waktu solat malaysia",
    "mosque display",
    "surau",
  ],
  authors: [{ name: "Waktu+" }],
  creator: "Waktu+",
  publisher: "Waktu+",
  metadataBase: new URL("https://waktuplus.xyz"),
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
    title: "Waktu+ - Prayer Times & Al-Quran",
    description:
      "Prayer times, Al-Quran & Islamic calendar for Malaysia. Free, no ads, no signup.",
    url: "https://waktuplus.xyz",
    siteName: "Waktu+",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: "/main.png",
        width: 1200,
        height: 630,
        alt: "Waktu+ - Prayer Times & Al-Quran",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Waktu+ - Prayer Times & Al-Quran",
    description:
      "Prayer times, Al-Quran & Islamic calendar for Malaysia. Free, no ads, no signup.",
    images: ["/main.png"],
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
  verification: {
    google: "verification_token",
  },
  alternates: {
    canonical: "https://waktuplus.xyz",
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
    <html lang="en" className={geistSans.variable}>
      <head>
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
          href="https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Scheherazade+New:wght@400;700&display=swap"
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
        style={{
          backgroundColor: "#18181b",
          color: "#ffffff",
          margin: 0,
          padding: 0,
          minHeight: "100vh",
        }}
      >
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
