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
  },
}

export default function DisplayPage() {
  return <DisplayClient />
}
