"use client"

import Link from "next/link"
import { Home, BookOpen, Grid2X2, Settings } from "lucide-react"
import { useAppStore } from "@/lib/store"
import { translations } from "@/lib/translations"

interface BottomNavProps {
  activeScreen: string
}

export function BottomNav({ activeScreen }: BottomNavProps) {
  const { language } = useAppStore()
  const t = translations[language]

  const navItems = [
    { id: "home", label: t.home, icon: Home, href: "/" },
    { id: "quran", label: "Al-Quran", icon: BookOpen, href: "/quran" },
    { id: "menu", label: "Menu", icon: Grid2X2, href: "/menu" },
    { id: "settings", label: t.settings, icon: Settings, href: "/settings" },
  ]

  return (
    <nav
      style={{
        position: "fixed",
        bottom: 0,
        left: "50%",
        transform: "translateX(-50%)",
        width: "100%",
        maxWidth: "448px",
        backgroundColor: "#18181b",
        borderTop: "1px solid #27272a",
        zIndex: 50,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-around", padding: "12px 0" }}>
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = activeScreen === item.id
          const activeColor = "#3B82F6"
          const inactiveColor = "#71717a"

          return (
            <Link
              key={item.id}
              href={item.href}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "4px",
                padding: "4px 16px",
                background: "none",
                border: "none",
                cursor: "pointer",
                color: isActive ? activeColor : inactiveColor,
                transition: "color 0.2s",
                textDecoration: "none",
              }}
            >
              <Icon style={{ width: "24px", height: "24px", color: isActive ? activeColor : inactiveColor }} />
              <span style={{ fontSize: "12px", fontWeight: 500, color: isActive ? activeColor : inactiveColor }}>
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
