import type { Metadata } from "next"
import { LinksScreen } from "@/components/screens/links-screen"

export const metadata: Metadata = {
  title: "Waktu+ Links",
  description: "Quick access to all Waktu+ features",
}

export default function LinksPage() {
  return <LinksScreen />
}
