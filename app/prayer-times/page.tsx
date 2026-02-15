import type { Metadata } from "next"
import { PrayerTimesClientPage } from "./prayer-times-client"

export const metadata: Metadata = {
  title: "Monthly Prayer Times",
  description:
    "View monthly prayer times schedule for all zones in Malaysia. Includes Imsak, Subuh, Syuruk, Zohor, Asar, Maghrib, and Isyak times.",
  openGraph: {
    title: "Monthly Prayer Times | Waktu+",
    description: "Monthly prayer times schedule for all zones in Malaysia",
    url: "https://waktuplus.xyz/prayer-times",
    images: [
      { url: "/main.png", width: 1200, height: 630, alt: "Waktu+ Prayer Times" },
    ],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/main.png"],
  },
}

export default function PrayerTimesPage() {
  return <PrayerTimesClientPage />
}
