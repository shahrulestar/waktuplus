"use client"

import { useEffect, useLayoutEffect, useState } from "react"
import { translations } from "@/lib/translations"
import { getNextIslamicEvent, type IslamicDate } from "@/lib/islamic-dates"
import { formatIslamicEventCountdown } from "@/lib/countdown-utils"
import { Skeleton } from "@/components/ui/skeleton"

const STORAGE_KEY = "ramadan-next-event"

function serializeEvent(event: IslamicDate): string {
  return JSON.stringify({
    ...event,
    gregorianDate: event.gregorianDate.toISOString(),
  })
}

function deserializeEvent(json: string): IslamicDate | null {
  try {
    const parsed = JSON.parse(json) as Omit<IslamicDate, "gregorianDate"> & { gregorianDate: string }
    const event: IslamicDate = {
      ...parsed,
      gregorianDate: new Date(parsed.gregorianDate),
    }
    if (event.gregorianDate.getTime() > Date.now()) {
      return event
    }
  } catch {
    // Invalid cache
  }
  return null
}

function getCachedEvent(): IslamicDate | null {
  if (typeof window === "undefined") return null
  const cached = localStorage.getItem(STORAGE_KEY)
  return cached ? deserializeEvent(cached) : null
}

function saveEventToCache(event: IslamicDate): void {
  if (typeof window === "undefined") return
  localStorage.setItem(STORAGE_KEY, serializeEvent(event))
}

interface IslamicEventCountdownProps {
  language: "en" | "ms"
}

export function RamadanCountdown({ language }: IslamicEventCountdownProps) {
  const t = translations[language]
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0 })
  const [nextEvent, setNextEvent] = useState<IslamicDate | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const countdownLabels = {
    days: t.days,
    hours: t.hours,
    minutes: t.minutes,
    seconds: t.seconds,
  }

  useLayoutEffect(() => {
    const cached = getCachedEvent()
    if (cached) {
      setNextEvent(cached)
      setIsLoading(false)
      return
    }
    const event = getNextIslamicEvent()
    if (event) {
      saveEventToCache(event)
      setNextEvent(event)
    }
    setIsLoading(false)
  }, [])

  useEffect(() => {
    if (!nextEvent) return

    const updateCountdown = () => {
      const now = new Date()
      const diff = nextEvent.gregorianDate.getTime() - now.getTime()
      if (diff > 0) {
        setCountdown({
          days: Math.floor(diff / (1000 * 60 * 60 * 24)),
          hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        })
      } else {
        const freshEvent = getNextIslamicEvent()
        if (freshEvent && freshEvent.gregorianDate.getTime() !== nextEvent.gregorianDate.getTime()) {
          saveEventToCache(freshEvent)
          setNextEvent(freshEvent)
        }
      }
    }

    updateCountdown()
    const timer = setInterval(updateCountdown, 1000)
    return () => clearInterval(timer)
  }, [nextEvent])

  const countdownIsZero =
    countdown.days === 0 && countdown.hours === 0 && countdown.minutes === 0

  if (isLoading) {
    return (
      <div
        style={{
          background: "linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)",
          borderRadius: "8px",
          padding: "16px",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
        }}
      >
        <Skeleton className="h-4 w-32 bg-white/20" />
        <Skeleton className="h-4 w-24 bg-white/20" />
        <Skeleton className="h-5 w-28 bg-white/20" />
        <Skeleton className="h-4 w-36 bg-white/20" />
      </div>
    )
  }

  if (!nextEvent) return null

  const celebrationName = language === "ms" ? nextEvent.celebrationMs : nextEvent.celebrationEn
  const gregorianDate = language === "ms" ? nextEvent.gregorianDateMs : nextEvent.gregorianDateEn
  const hijriDate = language === "ms" ? nextEvent.hijriDateMs : nextEvent.hijriDate

  const countdownStr = countdownIsZero
    ? (language === "ms" ? "Hari ini!" : "Today!")
    : formatIslamicEventCountdown(countdown.days, countdown.hours, countdown.minutes, countdownLabels)

  return (
    <div
      style={{
        background: "linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)",
        borderRadius: "8px",
        padding: "16px",
        display: "flex",
        flexDirection: "column",
        gap: "4px",
      }}
    >
      <p style={{ fontSize: "14px", color: "#ffffff", fontWeight: 500 }}>{celebrationName}</p>
      <p className="metric-number" style={{ fontSize: "14px", color: "#ffffff" }}>{countdownStr}</p>
      <h3 style={{ fontSize: "16px", fontWeight: 600, marginTop: "4px", color: "#ffffff" }}>{hijriDate}</h3>
      <p style={{ fontSize: "14px", color: "#ffffff" }}>{gregorianDate}</p>
    </div>
  )
}
