import type { Metadata } from "next"
import { AboutScreen } from "@/components/screens/about-screen"
import { OG_IMAGE, SITE_URL } from "@/lib/site"

export const metadata: Metadata = {
  title: "About",
  description:
    "Learn about Waktu+ — a free full-screen prayer times display for mosques and suraus in Malaysia.",
  openGraph: {
    title: "About | Waktu+",
    description:
      "Learn about Waktu+ — a free full-screen prayer times display for mosques and suraus in Malaysia.",
    url: `${SITE_URL}/about`,
    images: [OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    images: [OG_IMAGE.url],
  },
}

export default function AboutPage() {
  return <AboutScreen />
}
