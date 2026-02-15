import type { Metadata } from "next"
import { IslamicCalendarClient } from "./islamic-calendar-client"

export const metadata: Metadata = {
  title: "Islamic Calendar 2026 | Waktu+",
  description:
    "Important Islamic dates and holidays in Malaysia for 2026 - Isra Mi'raj, Ramadan, Eid al-Fitr, Eid al-Adha, and more.",
  openGraph: {
    title: "Islamic Calendar 2026 | Waktu+",
    description: "Important Islamic dates and holidays in Malaysia for 2026",
    url: "https://waktuplus.xyz/islamic-calendar",
    images: [
      { url: "/main.png", width: 1200, height: 630, alt: "Waktu+ Islamic Calendar" },
    ],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/main.png"],
  },
}

export default function IslamicCalendarPage() {
  return <IslamicCalendarClient />
}
