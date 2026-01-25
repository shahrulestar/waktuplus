import type { Metadata } from "next"
import { IslamicCalendarClient } from "./islamic-calendar-client"

export const metadata: Metadata = {
  title: "Islamic Calendar 2026 | Waktu+",
  description:
    "Important Islamic dates and holidays in Malaysia for 2026 - Isra Mi'raj, Ramadan, Eid al-Fitr, Eid al-Adha, and more.",
  openGraph: {
    title: "Islamic Calendar 2026 | Waktu+",
    description: "Important Islamic dates and holidays in Malaysia for 2026",
    images: ["/og-image.png"],
  },
}

export default function IslamicCalendarPage() {
  return <IslamicCalendarClient />
}
