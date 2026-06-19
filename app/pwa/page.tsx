import type { Metadata } from "next"
import PWAScreen from "@/components/screens/pwa-screen"
import { OG_IMAGE, SITE_URL } from "@/lib/site"

export const metadata: Metadata = {
  title: "PWA Installation Guide - Waktu+",
  description:
    "Learn how to install Waktu+ as a PWA on your Android or iOS device for offline access and quick app-like experience.",
  openGraph: {
    title: "PWA Installation Guide - Waktu+",
    description: "Learn how to install Waktu+ as a PWA for offline access",
    url: `${SITE_URL}/pwa`,
    images: [OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    images: [OG_IMAGE.url],
  },
}

export default function PWAPage() {
  return <PWAScreen />
}
