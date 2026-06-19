import type { Metadata } from "next"
import { DisplayClient } from "@/app/display/display-client"
import { OG_IMAGE, SITE_DESCRIPTION, SITE_TITLE, SITE_NAME, SITE_URL } from "@/lib/site"

export const metadata: Metadata = {
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    siteName: SITE_NAME,
    images: [OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    images: [OG_IMAGE.url],
  },
}

export default function HomePage() {
  return <DisplayClient />
}
