import type { Metadata } from "next"
import { LinksScreen } from "@/components/screens/links-screen"
import { OG_IMAGE, SITE_URL } from "@/lib/site"

export const metadata: Metadata = {
  title: "Waktu+ Links",
  description: "Quick access to all Waktu+ features",
  openGraph: {
    title: "Waktu+ Links",
    description: "Quick access to all Waktu+ features",
    url: `${SITE_URL}/links`,
    images: [OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    images: [OG_IMAGE.url],
  },
}

export default function LinksPage() {
  return <LinksScreen />
}
