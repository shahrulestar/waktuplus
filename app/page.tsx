import { HomeScreen } from "@/components/screens/home-screen"
import { BottomNav } from "@/components/bottom-nav"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Waktu+ - Prayer Times & Al-Quran",
  description:
    "Waktu+ is your complete Islamic companion app featuring accurate prayer times for Malaysia, Al-Quran with translations, and Islamic calendar.",
  openGraph: {
    title: "Waktu+ - Prayer Times & Al-Quran",
    description: "Your complete Islamic companion app with accurate prayer times and Al-Quran",
    url: "https://waktuplus.xyz",
    images: [
      { url: "/main.png", width: 1200, height: 630, alt: "Waktu+ - Prayer Times & Al-Quran" },
    ],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/main.png"],
  },
}

export default function HomePage() {
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
        <HomeScreen />
      </main>
      <BottomNav activeScreen="home" />
    </div>
  )
}
