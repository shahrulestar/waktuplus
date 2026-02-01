"use client"

import Link from "next/link"
import { Home, BookOpen, Clock, Calendar, Monitor } from "lucide-react"
import { useAppStore } from "@/lib/store"
import { translations } from "@/lib/translations"

export function LinksScreen() {
  const { language } = useAppStore()
  const t = translations[language]

  const links = [
    {
      href: "/",
      icon: Home,
      label: t.home,
      description: "Prayer times & daily info",
      color: "#3b82f6",
    },
    {
      href: "/quran",
      icon: BookOpen,
      label: t.quran,
      description: t.readHolyQuran,
      color: "#8b5cf6",
    },
    {
      href: "/prayer-times",
      icon: Clock,
      label: t.prayerTimes,
      description: t.dailyPrayerSchedule,
      color: "#f59e0b",
    },
    {
      href: "/islamic-calendar",
      icon: Calendar,
      label: t.islamicCalendar,
      description: t.importantIslamicDates,
      color: "#06b6d4",
    },
    {
      href: "/display",
      icon: Monitor,
      label: t.waktuDisplay,
      description: t.displayDescription,
      color: "#ec4899",
    },
  ]

  return (
    <main
      style={{
        minHeight: "100vh",
        backgroundColor: "#18181b",
        paddingTop: "24px",
        paddingBottom: "120px",
        paddingLeft: "24px",
        paddingRight: "24px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <div style={{ maxWidth: "448px", width: "100%", margin: "0 auto" }}>
        <h1 style={{ fontSize: "28px", fontWeight: 700, color: "#ffffff", margin: "0 0 8px 0", textAlign: "center", fontFamily: '"Satoshi", system-ui, sans-serif' }}>
          Waktu+
        </h1>
        <p style={{ fontSize: "14px", color: "#a1a1aa", margin: "0 0 24px 0", textAlign: "center" }}>
          A modern web-based prayer time display for mosques, with Quran and more accessible on mobile. No ads, no
          signup.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {links.map((link) => {
            const IconComponent = link.icon
            return (
              <Link
                key={link.href}
                href={link.href}
                style={{
                  display: "flex",
                  gap: "16px",
                  padding: "16px",
                  backgroundColor: "#27272a",
                  borderRadius: "8px",
                  textDecoration: "none",
                  transition: "all 0.2s",
                  border: "1px solid #3f3f46",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#3f3f46"
                  e.currentTarget.style.borderColor = link.color
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "#27272a"
                  e.currentTarget.style.borderColor = "#3f3f46"
                }}
              >
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "8px",
                    backgroundColor: link.color,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <IconComponent style={{ width: "24px", height: "24px", color: "#ffffff" }} />
                </div>
                <div style={{ flex: 1 }}>
                  <h2 style={{ fontSize: "16px", fontWeight: 600, color: "#ffffff", margin: "0 0 4px 0", fontFamily: '"Satoshi", system-ui, sans-serif' }}>
                    {link.label}
                  </h2>
                  <p style={{ fontSize: "14px", color: "#a1a1aa", margin: 0 }}>{link.description}</p>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </main>
  )
}
