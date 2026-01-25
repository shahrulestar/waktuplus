"use client"

import { Sun, Sunrise, SunDim, Sunset, Moon, CloudSun } from "lucide-react"
import { translations } from "@/lib/translations"

interface PrayerTime {
  fajr?: string
  syuruk?: string
  dhuhr?: string
  asr?: string
  maghrib?: string
  isha?: string
}

interface PrayerTimeCardProps {
  prayerTime?: PrayerTime | null
  zoneName: string
  isLoading?: boolean
  language: "en" | "ms"
  isFriday?: boolean
}

export function PrayerTimeCard({ prayerTime, zoneName, isLoading, language, isFriday = false }: PrayerTimeCardProps) {
  const t = translations[language]

  const prayers = [
    { name: t.subuh, time: prayerTime?.fajr || "--:--", icon: Moon },
    { name: t.syuruk, time: prayerTime?.syuruk || "--:--", icon: Sunrise },
    { name: isFriday ? t.jumaah : t.zohor, time: prayerTime?.dhuhr || "--:--", icon: Sun },
    { name: t.asar, time: prayerTime?.asr || "--:--", icon: CloudSun },
    { name: t.maghrib, time: prayerTime?.maghrib || "--:--", icon: Sunset },
    { name: t.isyak, time: prayerTime?.isha || "--:--", icon: SunDim },
  ]

  const now = new Date()
  const currentMinutes = now.getHours() * 60 + now.getMinutes()

  let activeIndex = -1
  for (let i = 0; i < prayers.length; i++) {
    const time = prayers[i].time
    if (time && time !== "--:--" && typeof time === "string" && time.includes(":")) {
      const parts = time.split(":")
      if (parts.length >= 2) {
        const h = Number.parseInt(parts[0], 10)
        const m = Number.parseInt(parts[1], 10)
        if (!isNaN(h) && !isNaN(m) && currentMinutes < h * 60 + m) {
          activeIndex = i
          break
        }
      }
    }
  }

  const brandColor = "#3B82F6"

  return (
    <div style={{ backgroundColor: "#27272a", borderRadius: "8px", padding: "16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
        <h2 style={{ fontSize: "16px", fontWeight: 600, color: "#ffffff" }}>{t.prayerTime}</h2>
        <span style={{ fontSize: "14px", color: "#a1a1aa" }}>{t.today}</span>
      </div>
      <p style={{ fontSize: "14px", color: "#a1a1aa", marginBottom: "16px" }}>{zoneName}</p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
        {prayers.map((prayer, index) => {
          const Icon = prayer.icon
          const isActive = index === activeIndex && !isLoading
          return (
            <div
              key={prayer.name}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}
            >
              <Icon style={{ width: "20px", height: "20px", color: isActive ? brandColor : "#ffffff" }} />
              <span style={{ fontSize: "14px", color: isActive ? brandColor : "#ffffff" }}>{prayer.name}</span>
              <span style={{ fontSize: "14px", fontWeight: 500, color: isActive ? brandColor : "#ffffff" }}>
                {isLoading ? "--:--" : prayer.time}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
