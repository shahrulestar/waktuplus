"use client"

import { useState, useRef, useCallback } from "react"
import { Sun, Sunrise, Sunset, Moon, CloudSun } from "lucide-react"
import { translations } from "@/lib/translations"
import { Skeleton } from "@/components/ui/skeleton"

interface PrayerTime {
  date?: string
  day?: string
  fajr?: string
  syuruk?: string
  dhuhr?: string
  asr?: string
  maghrib?: string
  isha?: string
}

interface PrayerTimeCardProps {
  prayerTime?: PrayerTime | null
  prayerTimes?: PrayerTime[]
  zoneName: string
  isLoading?: boolean
  language: "en" | "ms"
  isFriday?: boolean
}

function formatDateLabel(dateStr: string | undefined, dayOffset: number): string {
  // If we have a date string like "YYYY-MM-DD", parse it
  if (dateStr) {
    const parts = dateStr.split("-")
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`
    }
  }
  // Fallback: compute from today + offset
  const d = new Date()
  d.setDate(d.getDate() + dayOffset)
  const dd = String(d.getDate()).padStart(2, "0")
  const mm = String(d.getMonth() + 1).padStart(2, "0")
  const yyyy = d.getFullYear()
  return `${dd}/${mm}/${yyyy}`
}

export function PrayerTimeCard({ prayerTime, prayerTimes, zoneName, isLoading, language, isFriday = false }: PrayerTimeCardProps) {
  const t = translations[language]

  // Determine the list of days to display
  const days = prayerTimes && prayerTimes.length > 1 ? prayerTimes : prayerTime ? [prayerTime] : []
  const hasMultipleDays = days.length > 1

  const [currentDayIndex, setCurrentDayIndex] = useState(0)
  const touchStartX = useRef<number | null>(null)
  const touchStartY = useRef<number | null>(null)
  const mouseStartX = useRef<number | null>(null)
  const isDragging = useRef(false)

  const currentPrayer = days[currentDayIndex] || prayerTime

  // Check if the selected day is a Friday for Jumaah label
  const selectedDayIsFriday = currentDayIndex === 0
    ? isFriday
    : (() => {
        const dateStr = days[currentDayIndex]?.date
        if (!dateStr) return false
        try {
          return new Date(dateStr + "T00:00:00").getDay() === 5
        } catch {
          return false
        }
      })()

  const prayers = [
    { name: t.subuh, time: currentPrayer?.fajr || "--:--", icon: Moon },
    { name: t.syuruk, time: currentPrayer?.syuruk || "--:--", icon: Sunrise },
    { name: selectedDayIsFriday ? t.jumaah : t.zohor, time: currentPrayer?.dhuhr || "--:--", icon: Sun },
    { name: t.asar, time: currentPrayer?.asr || "--:--", icon: CloudSun },
    { name: t.maghrib, time: currentPrayer?.maghrib || "--:--", icon: Sunset },
    { name: t.isyak, time: currentPrayer?.isha || "--:--", icon: Moon },
  ]

  // Only highlight next prayer for today (index 0)
  const now = new Date()
  const currentMinutes = now.getHours() * 60 + now.getMinutes()

  let activeIndex = -1
  if (currentDayIndex === 0) {
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
  }

  const brandColor = "#3B82F6"

  // Navigate to a specific day
  const goToDay = useCallback((index: number) => {
    setCurrentDayIndex(Math.max(0, Math.min(index, days.length - 1)))
  }, [days.length])

  // Touch swipe handlers (mobile / tablet)
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
  }, [])

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return
    const deltaX = e.changedTouches[0].clientX - touchStartX.current
    const deltaY = e.changedTouches[0].clientY - touchStartY.current

    // Only register horizontal swipe if it's more horizontal than vertical
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
      if (deltaX < 0) {
        setCurrentDayIndex((prev) => Math.min(prev + 1, days.length - 1))
      } else {
        setCurrentDayIndex((prev) => Math.max(prev - 1, 0))
      }
    }
    touchStartX.current = null
    touchStartY.current = null
  }, [days.length])

  // Mouse drag handlers (desktop)
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    mouseStartX.current = e.clientX
    isDragging.current = true
  }, [])

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    if (!isDragging.current || mouseStartX.current === null) return
    const deltaX = e.clientX - mouseStartX.current

    if (Math.abs(deltaX) > 50) {
      if (deltaX < 0) {
        setCurrentDayIndex((prev) => Math.min(prev + 1, days.length - 1))
      } else {
        setCurrentDayIndex((prev) => Math.max(prev - 1, 0))
      }
    }
    mouseStartX.current = null
    isDragging.current = false
  }, [days.length])

  const handleMouseLeave = useCallback(() => {
    mouseStartX.current = null
    isDragging.current = false
  }, [])

  // Date label for the top right
  const dateLabel = currentDayIndex === 0
    ? t.today
    : formatDateLabel(days[currentDayIndex]?.date, currentDayIndex)

  if (isLoading) {
    return (
      <div style={{ backgroundColor: "#27272a", borderRadius: "8px", padding: "16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
          <Skeleton className="h-5 w-24 bg-muted" />
          <Skeleton className="h-4 w-12 bg-muted" />
        </div>
        <Skeleton className="h-4 w-48 bg-muted mb-4" />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
              <Skeleton className="h-5 w-5 rounded-full bg-muted" />
              <Skeleton className="h-4 w-12 bg-muted" />
              <Skeleton className="h-4 w-10 bg-muted" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div
      style={{ backgroundColor: "#27272a", borderRadius: "8px", padding: "16px", touchAction: hasMultipleDays ? "pan-y" : "auto", userSelect: "none", cursor: hasMultipleDays ? "grab" : "auto" }}
      onTouchStart={hasMultipleDays ? handleTouchStart : undefined}
      onTouchEnd={hasMultipleDays ? handleTouchEnd : undefined}
      onMouseDown={hasMultipleDays ? handleMouseDown : undefined}
      onMouseUp={hasMultipleDays ? handleMouseUp : undefined}
      onMouseLeave={hasMultipleDays ? handleMouseLeave : undefined}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
        <h2 style={{ fontSize: "16px", fontWeight: 600, color: "#ffffff" }}>{t.prayerTime}</h2>
        <span style={{ fontSize: "14px", color: currentDayIndex === 0 ? "#a1a1aa" : brandColor, fontWeight: currentDayIndex === 0 ? 400 : 500, transition: "color 0.2s" }}>{dateLabel}</span>
      </div>
      <p style={{ fontSize: "14px", color: "#a1a1aa", marginBottom: "16px" }}>{zoneName}</p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }} suppressHydrationWarning>
        {prayers.map((prayer, index) => {
          const Icon = prayer.icon
          const isActive = index === activeIndex
          return (
            <div
              key={prayer.name}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}
            >
              <Icon style={{ width: "20px", height: "20px", color: isActive ? brandColor : "#ffffff" }} />
              <span style={{ fontSize: "14px", color: isActive ? brandColor : "#ffffff" }}>{prayer.name}</span>
              <span className="metric-number" style={{ fontSize: "14px", color: isActive ? brandColor : "#ffffff" }}>
                {prayer.time}
              </span>
            </div>
          )
        })}
      </div>

      {/* Dot indicator — clickable */}
      {hasMultipleDays && (
        <div style={{ display: "flex", justifyContent: "center", gap: "6px", marginTop: "12px", padding: "4px 0" }}>
          {days.map((_, index) => (
            <button
              key={index}
              type="button"
              aria-label={index === 0 ? "Today" : `Day ${index + 1}`}
              onClick={() => goToDay(index)}
              style={{
                width: currentDayIndex === index ? "16px" : "6px",
                height: "6px",
                borderRadius: "3px",
                backgroundColor: currentDayIndex === index ? brandColor : "#52525b",
                transition: "all 0.2s ease",
                border: "none",
                padding: 0,
                cursor: "pointer",
                outline: "none",
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
