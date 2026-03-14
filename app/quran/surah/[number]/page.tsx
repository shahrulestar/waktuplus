import { notFound } from "next/navigation"
import { SurahDetailScreen } from "@/components/screens/surah-detail-screen"
import { BottomNav } from "@/components/bottom-nav"
import type { Metadata } from "next"

interface SurahPageProps {
  params: Promise<{ number: string }>
}

export async function generateMetadata({ params }: SurahPageProps): Promise<Metadata> {
  const { number } = await params
  return {
    title: `Surah ${number}`,
    description: `Read Surah ${number} from the Holy Quran with Arabic text, transliteration, and translation in English and Bahasa Melayu.`,
    openGraph: {
      title: `Surah ${number} | Al-Quran | Waktu+`,
      description: `Read Surah ${number} with translations and transliteration`,
      url: `https://waktuplus.xyz/quran/surah/${number}`,
      images: [
        { url: "/main.png", width: 1200, height: 630, alt: `Surah ${number} | Waktu+` },
      ],
    },
    twitter: {
      card: "summary_large_image",
      images: ["/main.png"],
    },
  }
}

export default async function SurahPage({ params }: SurahPageProps) {
  const { number } = await params
  const surahNumber = Number.parseInt(number, 10)
  if (Number.isNaN(surahNumber) || surahNumber < 1 || surahNumber > 114) {
    notFound()
  }

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
        <SurahDetailScreen surahNumber={surahNumber} />
      </main>
      <BottomNav activeScreen="quran" />
    </div>
  )
}
