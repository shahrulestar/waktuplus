import type { Metadata } from "next"
import { IslamicCalendarClient } from "./islamic-calendar-client"
import { OG_IMAGE, SITE_URL } from "@/lib/site"

export const metadata: Metadata = {
  title: "Islamic Calendar 2026 | Waktu+",
  description:
    "Important Islamic dates and holidays in Malaysia for 2026 - Isra Mi'raj, Ramadan, Eid al-Fitr, Eid al-Adha, and more.",
  openGraph: {
    title: "Islamic Calendar 2026 | Waktu+",
    description: "Important Islamic dates and holidays in Malaysia for 2026",
    url: `${SITE_URL}/islamic-calendar`,
    images: [OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    images: [OG_IMAGE.url],
  },
}

export default function IslamicCalendarPage() {
  return <IslamicCalendarClient />
}
