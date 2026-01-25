import { MenuScreen } from "@/components/screens/menu-screen"
import { BottomNav } from "@/components/bottom-nav"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Menu",
  description: "Explore Waktu+ features including Al-Quran reading and monthly prayer times schedule for Malaysia.",
  openGraph: {
    title: "Menu | Waktu+",
    description: "Explore Waktu+ features - Al-Quran and Prayer Times",
    url: "https://waktuplus.xyz/menu",
    images: ["/og-image.png"],
  },
}

export default function MenuPage() {
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
        <MenuScreen />
      </main>
      <BottomNav activeScreen="menu" />
    </div>
  )
}
