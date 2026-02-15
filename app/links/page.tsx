import type { Metadata } from "next"
import { LinksScreen } from "@/components/screens/links-screen"

export const metadata: Metadata = {
  title: "Waktu+ Links",
  description: "Quick access to all Waktu+ features",
  openGraph: {
    title: "Waktu+ Links",
    description: "Quick access to all Waktu+ features",
    url: "https://waktuplus.xyz/links",
    images: [
      { url: "/main.png", width: 1200, height: 630, alt: "Waktu+ Links" },
    ],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/main.png"],
  },
}

export default function LinksPage() {
  return <LinksScreen />
}
