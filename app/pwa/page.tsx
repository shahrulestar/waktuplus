import type { Metadata } from "next"
import PWAScreen from "@/components/screens/pwa-screen"

export const metadata: Metadata = {
  title: "PWA Installation Guide - Waktu+",
  description:
    "Learn how to install Waktu+ as a PWA on your Android or iOS device for offline access and quick app-like experience.",
}

export default function PWAPage() {
  return <PWAScreen />
}
