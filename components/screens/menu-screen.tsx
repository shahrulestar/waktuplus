"use client"

import Link from "next/link"
import { BookOpen, Clock, Calendar, Monitor } from "lucide-react"
import { useAppStore } from "@/lib/store"
import { translations } from "@/lib/translations"

export function MenuScreen() {
  const { language } = useAppStore()
  const t = translations[language]

  const menuItems = [
    { icon: BookOpen, label: t.quran, description: t.readHolyQuran, href: "/quran" },
    { icon: Clock, label: t.prayerTimes, description: t.monthlyPrayerSchedule, href: "/prayer-times" },
    { icon: Calendar, label: t.importantDates, description: t.importantIslamicDates, href: "/islamic-calendar" },
    { icon: Monitor, label: t.waktuDisplay, description: t.displayDescription, href: "/display" },
  ]

  return (
    <div style={{ padding: "16px", backgroundColor: "#18181b", minHeight: "100%" }}>
      <h1 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "16px", color: "#ffffff" }}>{t.menu}</h1>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px" }}>
        {menuItems.map((item) => {
          const Icon = item.icon
          return (
            <Link
              key={item.label}
              href={item.href}
              style={{
                backgroundColor: "#27272a",
                borderRadius: "8px",
                padding: "16px",
                textAlign: "left",
                border: "none",
                cursor: "pointer",
                textDecoration: "none",
              }}
            >
              <Icon style={{ width: "24px", height: "24px", color: "#3b82f6", marginBottom: "8px" }} />
              <p style={{ fontSize: "14px", fontWeight: 500, color: "#ffffff", margin: 0 }}>{item.label}</p>
              <p style={{ fontSize: "12px", color: "#71717a", margin: "4px 0 0 0" }}>{item.description}</p>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
