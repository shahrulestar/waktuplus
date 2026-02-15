import type { Metadata } from "next"
import { DisplayClient } from "./display-client"

export const metadata: Metadata = {
  title: "Waktu+ Display - Live Prayer Times",
  description: "Full-screen live prayer times display for mosques and suraus",
  openGraph: {
    title: "Waktu+ Display - Live Prayer Times",
    description: "Full-screen live prayer times display for mosques and suraus",
    url: "https://waktuplus.xyz/display",
    siteName: "Waktu+",
    images: [
      { url: "/display.png", width: 1200, height: 630, alt: "Waktu+ Display - Live Prayer Times" },
    ],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/display.png"],
  },
}

export default function DisplayPage() {
  return <DisplayClient />
}
