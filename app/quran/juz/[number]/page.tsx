import { JuzDetailScreen } from "@/components/screens/juz-detail-screen"
import { BottomNav } from "@/components/bottom-nav"
import type { Metadata } from "next"

interface JuzPageProps {
  params: Promise<{ number: string }>
}

export async function generateMetadata({ params }: JuzPageProps): Promise<Metadata> {
  const { number } = await params
  return {
    title: `Juz ${number}`,
    description: `Read Juz ${number} from the Holy Quran with Arabic text, transliteration, and translation in English and Bahasa Melayu.`,
    openGraph: {
      title: `Juz ${number} | Al-Quran | Waktu+`,
      description: `Read Juz ${number} with translations and transliteration`,
      url: `https://waktuplus.xyz/quran/juz/${number}`,
      images: [
        { url: "/main.png", width: 1200, height: 630, alt: `Juz ${number} | Waktu+` },
      ],
    },
    twitter: {
      card: "summary_large_image",
      images: ["/main.png"],
    },
  }
}

export default async function JuzPage({ params }: JuzPageProps) {
  const { number } = await params
  const juzNumber = Number.parseInt(number, 10)

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
        <JuzDetailScreen juzNumber={juzNumber} />
      </main>
      <BottomNav activeScreen="quran" />
    </div>
  )
}
