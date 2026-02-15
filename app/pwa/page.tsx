import type { Metadata } from "next"
import PWAScreen from "@/components/screens/pwa-screen"

export const metadata: Metadata = {
  title: "PWA Installation Guide - Waktu+",
  description:
    "Learn how to install Waktu+ as a PWA on your Android or iOS device for offline access and quick app-like experience.",
  openGraph: {
    title: "PWA Installation Guide - Waktu+",
    description: "Learn how to install Waktu+ as a PWA for offline access",
    url: "https://waktuplus.xyz/pwa",
    images: [
      { url: "/main.png", width: 1200, height: 630, alt: "Waktu+ PWA" },
    ],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/main.png"],
  },
}

export default function PWAPage() {
  return <PWAScreen />
}
