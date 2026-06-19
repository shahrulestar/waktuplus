import { QuranScreen } from "@/components/screens/quran-screen"
import { BottomNav } from "@/components/bottom-nav"
import type { Metadata } from "next"
import { OG_IMAGE, SITE_URL } from "@/lib/site"

export const metadata: Metadata = {
  title: "Al-Quran",
  description:
    "Read the Holy Quran with translations in English and Bahasa Melayu. Browse by Surah or Juz with transliteration support.",
  openGraph: {
    title: "Al-Quran | Waktu+",
    description: "Read the Holy Quran with translations in English and Bahasa Melayu",
    url: `${SITE_URL}/quran`,
    images: [OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    images: [OG_IMAGE.url],
  },
}

export default function QuranPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#18181b",
        display: "flex",
        flexDirection: "column",
        maxWidth: "448px",
        margin: "0 auto",
        position: "relative",
        width: "100%",
      }}
    >
      <main style={{ flex: 1, overflowY: "auto", paddingBottom: "80px", width: "100%" }}>
        <QuranScreen />
      </main>
      <BottomNav activeScreen="quran" />
    </div>
  )
}
