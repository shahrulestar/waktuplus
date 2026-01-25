import { SettingsScreen } from "@/components/screens/settings-screen"
import { BottomNav } from "@/components/bottom-nav"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Settings",
  description:
    "Customize your Waktu+ experience. Set your prayer zone, choose your preferred language, and configure app settings.",
  openGraph: {
    title: "Settings | Waktu+",
    description: "Customize your Waktu+ prayer times and app settings",
    url: "https://waktuplus.xyz/settings",
    images: ["/og-image.png"],
  },
}

export default function SettingsPage() {
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
        <SettingsScreen />
      </main>
      <BottomNav activeScreen="settings" />
    </div>
  )
}
