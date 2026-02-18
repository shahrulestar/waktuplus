"use client"

import { useEffect, useState, useRef } from "react"
import { Moon, Sun, Sunrise, Sunset, CloudSun } from "lucide-react"
import { PrayerTimeCard } from "@/components/prayer-time-card"
import { RamadanCountdown } from "@/components/ramadan-countdown"
import { VerseOfDay } from "@/components/verse-of-day"
import { Skeleton } from "@/components/ui/skeleton"
import { useAppStore } from "@/lib/store"
import { prayerZones } from "@/lib/prayer-zones"
import { translations } from "@/lib/translations"
import { formatSmartCountdown } from "@/lib/countdown-utils"
import { getCachedData } from "@/lib/api-cache"

interface PrayerData {
  hijri?: string
  date?: string
  day?: string
  imsak?: string
  fajr: string
  syuruk: string
  dhuhr: string
  asr: string
  maghrib: string
  isha: string
}

function formatHijriDate(hijriStr: string | undefined, language: "en" | "ms"): string {
  if (!hijriStr) return ""

  const parts = hijriStr.split("-")
  if (parts.length !== 3) return hijriStr

  const year = parts[0]
  const month = Number.parseInt(parts[1], 10)
  const day = Number.parseInt(parts[2], 10)

  const monthNamesMs = [
    "Muh", "Saf", "RAb", "RAk", "JAw", "JAk", "Rej", "Sya", "Ram", "Syw", "Zul", "Zhj",
  ]

  const monthNamesEn = [
    "Muh", "Saf", "Rab", "Rak", "Jul", "Jak", "Raj", "Sha", "Ram", "Shw", "Dha", "Dhj",
  ]

  const monthNames = language === "ms" ? monthNamesMs : monthNamesEn
  const monthName = monthNames[month - 1] || ""

  return `${day} ${monthName} ${year}H`
}

function formatGregorianDate(language: "en" | "ms"): string {
  const locale = language === "ms" ? "ms-MY" : "en-GB"
  return new Date().toLocaleDateString(locale, {
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

const prayerIcons = {
  subuh: Moon,
  syuruk: Sunrise,
  zohor: Sun,
  asar: CloudSun,
  maghrib: Sunset,
  isyak: Moon,
}

function getPrayerName(key: string, language: "en" | "ms", isFriday: boolean): string {
  const t = translations[language]
  if (key === "zohor" && isFriday) {
    return t.jumaah
  }
  return t[key as keyof typeof t] as string
}

export function HomeScreen() {
  const { selectedZone, language } = useAppStore()
  const t = translations[language]
  const [currentTime, setCurrentTime] = useState(new Date())
  const [nextPrayer, setNextPrayer] = useState<{ name: string; key: string; time: string; diff: string } | null>(null)
  const [todayPrayer, setTodayPrayer] = useState<PrayerData | null>(null)
  const [weekPrayers, setWeekPrayers] = useState<PrayerData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAzanTime, setIsAzanTime] = useState(false)
  const [azanPrayer, setAzanPrayer] = useState<{ name: string; key: string } | null>(null)
  const azanTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [fadeState, setFadeState] = useState<"visible" | "fadeOut" | "fadeIn">("visible")
  const [hijriDate, setHijriDate] = useState<string>("")

  const zoneInfo = prayerZones.find((z) => z.code === selectedZone)
  const zoneName = zoneInfo ? `${zoneInfo.code} - ${zoneInfo.name}` : "WLY01 - Kuala Lumpur, Putrajaya"

  const isFriday = currentTime.getDay() === 5

  useEffect(() => {
    const fetchPrayer = async () => {
      setIsLoading(true)
      try {
        const cacheKey = `prayer_${selectedZone}`
        const data = await getCachedData(
          cacheKey,
          async () => {
            const res = await fetch(`/api/prayer?zone=${selectedZone}`)
            if (!res.ok) throw new Error("Failed to fetch")
            return res.json()
          },
          24 * 60 * 60 * 1000, // 24 jam
        )
        
        if (data.prayers && Array.isArray(data.prayers) && data.prayers.length > 0) {
          const todayDate = new Date().toISOString().split("T")[0]
          let todayIdx = data.prayers.findIndex((p: PrayerData) => p.date === todayDate)
          if (todayIdx < 0) {
            todayIdx = new Date().getDate() - 1
          }
          const prayer = data.prayers[todayIdx] || data.prayers[0]
          if (prayer) {
            setTodayPrayer(prayer)
          }
          // Extract up to 7 days starting from today
          const week = data.prayers.slice(todayIdx, todayIdx + 7)
          setWeekPrayers(week)
        }
        setIsLoading(false)
      } catch (error) {
        console.error("Failed to fetch prayer times:", error)
        setIsLoading(false)
      }
    }
    fetchPrayer()
    const interval = setInterval(fetchPrayer, 300000)
    return () => clearInterval(interval)
  }, [selectedZone, language])

  // Hijri day starts at Maghrib; use next day's hijri when Maghrib has passed
  useEffect(() => {
    if (!todayPrayer?.hijri || weekPrayers.length === 0) return

    const maghribStr = todayPrayer.maghrib
    if (!maghribStr || !maghribStr.includes(":")) {
      setHijriDate(formatHijriDate(todayPrayer.hijri, language))
      return
    }

    const [maghribH, maghribM] = maghribStr.split(":").map(Number)
    const maghribMinutes = (maghribH ?? 0) * 60 + (maghribM ?? 0)
    const now = currentTime
    const currentMinutes = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60

    const isAfterMaghrib = currentMinutes >= maghribMinutes
    const prayerForHijri = isAfterMaghrib && weekPrayers[1]?.hijri
      ? weekPrayers[1]
      : todayPrayer

    if (prayerForHijri?.hijri) {
      setHijriDate(formatHijriDate(prayerForHijri.hijri, language))
    }
  }, [currentTime, todayPrayer, weekPrayers, language])

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!todayPrayer) return

    const prayerKeysForAzan = ["subuh", "zohor", "asar", "maghrib", "isyak"]
    const prayerTimesForAzan = [
      todayPrayer.fajr,
      todayPrayer.dhuhr,
      todayPrayer.asr,
      todayPrayer.maghrib,
      todayPrayer.isha,
    ]

    const allPrayerKeys = ["subuh", "syuruk", "zohor", "asar", "maghrib", "isyak"]
    const allPrayerTimes = [
      todayPrayer.fajr,
      todayPrayer.syuruk,
      todayPrayer.dhuhr,
      todayPrayer.asr,
      todayPrayer.maghrib,
      todayPrayer.isha,
    ]

    const now = currentTime
    const currentMinutes = now.getHours() * 60 + now.getMinutes()
    const currentSeconds = now.getSeconds()

    for (let i = 0; i < prayerKeysForAzan.length; i++) {
      const time = prayerTimesForAzan[i]
      if (!time || typeof time !== "string" || !time.includes(":")) continue
      const timeParts = time.split(":")
      if (timeParts.length < 2) continue
      const hours = Number.parseInt(timeParts[0], 10)
      const minutes = Number.parseInt(timeParts[1], 10)
      if (isNaN(hours) || isNaN(minutes)) continue
      const prayerMinutes = hours * 60 + minutes

      const diffMinutes = currentMinutes - prayerMinutes
      if (diffMinutes >= 0 && diffMinutes < 3) {
        if (!isAzanTime || azanPrayer?.key !== prayerKeysForAzan[i]) {
          setFadeState("fadeOut")
          setTimeout(() => {
            setIsAzanTime(true)
            setAzanPrayer({ name: getPrayerName(prayerKeysForAzan[i], language, isFriday), key: prayerKeysForAzan[i] })
            setFadeState("fadeIn")
            setTimeout(() => setFadeState("visible"), 300)
          }, 300)
        }
        return
      }
    }

    if (isAzanTime) {
      setFadeState("fadeOut")
      setTimeout(() => {
        setIsAzanTime(false)
        setAzanPrayer(null)
        setFadeState("fadeIn")
        setTimeout(() => setFadeState("visible"), 300)
      }, 300)
    }

    for (let i = 0; i < allPrayerKeys.length; i++) {
      const time = allPrayerTimes[i]
      if (!time || typeof time !== "string" || !time.includes(":")) continue
      const timeParts = time.split(":")
      if (timeParts.length < 2) continue
      const hours = Number.parseInt(timeParts[0], 10)
      const minutes = Number.parseInt(timeParts[1], 10)
      if (isNaN(hours) || isNaN(minutes)) continue
      const prayerMinutes = hours * 60 + minutes

      if (prayerMinutes > currentMinutes) {
        const totalSeconds = (prayerMinutes - currentMinutes) * 60 - currentSeconds
        const name = getPrayerName(allPrayerKeys[i], language, isFriday)
        const countdownStr = formatSmartCountdown(totalSeconds, {
          days: t.days,
          hours: t.hours,
          minutes: t.minutes,
          seconds: t.seconds,
        })
        setNextPrayer({ name, key: allPrayerKeys[i], time, diff: countdownStr })
        return
      }
    }

    const fajrTime = todayPrayer.fajr
    if (fajrTime && typeof fajrTime === "string" && fajrTime.includes(":")) {
      const [fajrHours, fajrMinutes] = fajrTime.split(":").map(Number)
      if (!isNaN(fajrHours) && !isNaN(fajrMinutes)) {
        const fajrTotalMinutes = fajrHours * 60 + fajrMinutes
        const minutesUntilMidnight = 24 * 60 - currentMinutes
        const totalMinutesUntilFajr = minutesUntilMidnight + fajrTotalMinutes
        const totalSeconds = totalMinutesUntilFajr * 60 - currentSeconds
        const name = getPrayerName("subuh", language, false)
        const countdownStr = formatSmartCountdown(totalSeconds, {
          days: t.days,
          hours: t.hours,
          minutes: t.minutes,
          seconds: t.seconds,
        })
        setNextPrayer({ name, key: "subuh", time: fajrTime, diff: countdownStr })
        return
      }
    }

    const name = getPrayerName("subuh", language, false)
    setNextPrayer({ name, key: "subuh", time: allPrayerTimes[0] || "05:30", diff: t.tomorrow })
  }, [todayPrayer, currentTime, language, t, isAzanTime, azanPrayer, isFriday])

  useEffect(() => {
    return () => {
      if (azanTimeoutRef.current) clearTimeout(azanTimeoutRef.current)
    }
  }, [])

  const getNextPrayerIcon = () => {
    const key = isAzanTime ? azanPrayer?.key : nextPrayer?.key
    if (!key) return Moon
    return prayerIcons[key as keyof typeof prayerIcons] || Moon
  }

  const NextPrayerIcon = getNextPrayerIcon()

  const fadeStyle = {
    transition: "opacity 0.3s ease-in-out",
    opacity: fadeState === "fadeOut" ? 0 : 1,
  }

  const getCountdownText = () => {
    if (!nextPrayer) return t.loading
    if (nextPrayer.key === "syuruk") {
      return `${t.sunriseIn} ${nextPrayer.diff}`
    }
    return `${nextPrayer.name} ${t.startsIn} ${nextPrayer.diff}`
  }

  return (
    <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "16px" }}>
      <div
        style={{
          background: "linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)",
          borderRadius: "8px",
          padding: "16px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          {isLoading ? (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px" }}>
              <Skeleton className="h-4 w-24 bg-white/20" />
              <Skeleton className="h-12 w-32 bg-white/20" />
              <Skeleton className="h-4 w-40 bg-white/20" />
              <Skeleton className="h-4 w-36 bg-white/20" />
            </div>
          ) : (
          <div style={fadeStyle}>
            {isAzanTime && azanPrayer ? (
              <>
                <p style={{ fontSize: "14px", color: "#ffffff", fontWeight: 500 }}>{t.nowAzan}</p>
                <h1
                  style={{
                    fontSize: "32px",
                    fontWeight: 700,
                    marginTop: "8px",
                    color: "#ffffff",
                    lineHeight: 1,
                    fontFamily: '"Satoshi", system-ui, sans-serif',
                  }}
                >
                  {azanPrayer.name}
                </h1>
              </>
            ) : (
              <>
                <p style={{ fontSize: "14px", color: "#ffffff", fontWeight: 500 }}>{getCountdownText()}</p>
                <h1 style={{ fontSize: "48px", fontWeight: 700, marginTop: "8px", color: "#ffffff", lineHeight: 1, fontFamily: '"Satoshi", system-ui, sans-serif' }}>
                  {currentTime.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                </h1>
              </>
            )}
            <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.8)", marginTop: "4px" }}>
              {formatGregorianDate(language)}
            </p>
            <p style={{ fontSize: "14px", color: "#ffffff" }}>{hijriDate}</p>
          </div>
          )}
          {!isLoading && <NextPrayerIcon style={{ width: "80px", height: "80px", color: "#ffffff" }} />}
        </div>
      </div>

      <PrayerTimeCard
        prayerTime={todayPrayer}
        prayerTimes={weekPrayers}
        zoneName={zoneName}
        isLoading={isLoading}
        language={language}
        isFriday={isFriday}
      />
      <RamadanCountdown language={language} />
      <VerseOfDay language={language} />
    </div>
  )
}
