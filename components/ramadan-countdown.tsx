"use client"

import { useEffect, useState } from "react"
import { Moon } from "lucide-react"
import { translations } from "@/lib/translations"
import { getNextIslamicEvent, type IslamicDate } from "@/lib/islamic-dates"
import { formatIslamicEventCountdown } from "@/lib/countdown-utils"

interface IslamicEventCountdownProps {
  language: "en" | "ms"
}

export function RamadanCountdown({ language }: IslamicEventCountdownProps) {
  const t = translations[language]
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0 })
  const [nextEvent, setNextEvent] = useState<IslamicDate | null>(null)

  const countdownLabels = {
    days: t.days,
    hours: t.hours,
    minutes: t.minutes,
    seconds: t.seconds,
  }

  useEffect(() => {
    const event = getNextIslamicEvent()
    setNextEvent(event)
  }, [])

  useEffect(() => {
    if (!nextEvent) return

    const timer = setInterval(() => {
      const now = new Date()
      const diff = nextEvent.gregorianDate.getTime() - now.getTime()

      if (diff > 0) {
        setCountdown({
          days: Math.floor(diff / (1000 * 60 * 60 * 24)),
          hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        })
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [nextEvent])

  if (!nextEvent) return null

  const countdownStr = formatIslamicEventCountdown(countdown.days, countdown.hours, countdown.minutes, countdownLabels)

  const celebrationName = language === "ms" ? nextEvent.celebrationMs : nextEvent.celebrationEn
  const gregorianDate = language === "ms" ? nextEvent.gregorianDateMs : nextEvent.gregorianDateEn
  const hijriDate = language === "ms" ? nextEvent.hijriDateMs : nextEvent.hijriDate

  return (
    <div
      style={{
        background: "linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)",
        borderRadius: "8px",
        padding: "16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
        <p style={{ fontSize: "14px", color: "#ffffff", fontWeight: 500 }}>{celebrationName}</p>
        <p style={{ fontSize: "14px", color: "#ffffff" }}>{countdownStr}</p>
        <h3 style={{ fontSize: "16px", fontWeight: 600, marginTop: "4px", color: "#ffffff" }}>{hijriDate}</h3>
        <p style={{ fontSize: "14px", color: "#ffffff" }}>{gregorianDate}</p>
      </div>
      <Moon style={{ width: "80px", height: "80px", color: "#ffffff" }} />
    </div>
  )
}
