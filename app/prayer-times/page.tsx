import type { Metadata } from "next"
import { PrayerTimesClientPage } from "./prayer-times-client"
import { OG_IMAGE, SITE_URL } from "@/lib/site"

export const metadata: Metadata = {
  title: "Monthly Prayer Times",
  description:
    "View monthly prayer times schedule for all zones in Malaysia. Includes Imsak, Subuh, Syuruk, Zohor, Asar, Maghrib, and Isyak times.",
  openGraph: {
    title: "Monthly Prayer Times | Waktu+",
    description: "Monthly prayer times schedule for all zones in Malaysia",
    url: `${SITE_URL}/prayer-times`,
    images: [OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    images: [OG_IMAGE.url],
  },
}

export default function PrayerTimesPage() {
  return <PrayerTimesClientPage />
}
