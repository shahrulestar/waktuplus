"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { Moon, Sun, Sunrise, Sunset, CloudSun, Settings, AlertTriangle, ChevronDown, Monitor, Expand, Shrink } from "lucide-react"
import { useAppStore } from "@/lib/store"
import { prayerZones } from "@/lib/prayer-zones"
import { ZoneSelector } from "@/components/zone-selector"
import { translations } from "@/lib/translations"
import { formatSmartCountdown } from "@/lib/countdown-utils"
import { getCachedData } from "@/lib/api-cache"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"

interface PrayerData {
  hijri?: string
  fajr: string
  syuruk: string
  dhuhr: string
  asr: string
  maghrib: string
  isha: string
}

type AlertState =
  | { type: "none" }
  | { type: "azan_countdown"; prayerName: string; minutes: number }
  | { type: "azan_now"; prayerName: string; prayerKey: string }
  | { type: "iqamah"; minutes: number }
  | { type: "khutbah_countdown"; minutes: number }
  | { type: "sunrise_countdown"; minutes: number }

type TestAlertType = "none" | "azan_countdown" | "azan_now" | "iqamah" | "khutbah_countdown"

type AlertType = "azan_countdown" | "azan_now" | "iqamah" | "khutbah_countdown"

const DEFAULT_ENABLED_ALERTS: Record<AlertType, boolean> = {
  azan_countdown: true,
  azan_now: true,
  iqamah: false,
  khutbah_countdown: false,
}

const ALERT_KEYS: AlertType[] = ["azan_countdown", "azan_now", "iqamah", "khutbah_countdown"]

const ALERT_DURATION_MINS: Record<AlertType, number> = {
  azan_countdown: 15,
  azan_now: 5,
  iqamah: 10,
  khutbah_countdown: 12,
}

/** Test mode durations in seconds (shorter for quick testing) */
const TEST_DURATION_SECONDS: Record<Exclude<TestAlertType, "none">, number> = {
  azan_countdown: 15,
  azan_now: 5,
  iqamah: 10,
  khutbah_countdown: 12,
}

const ALERT_STORAGE_KEY = "waktu-display-alerts"

function loadEnabledAlerts(): Record<AlertType, boolean> {
  try {
    const stored = localStorage.getItem(ALERT_STORAGE_KEY)
    if (!stored) return { ...DEFAULT_ENABLED_ALERTS }
    const parsed = JSON.parse(stored) as Record<string, boolean>
    return {
      ...DEFAULT_ENABLED_ALERTS,
      ...Object.fromEntries(
        ALERT_KEYS.filter((k) => typeof parsed[k] === "boolean").map((k) => [k, parsed[k]])
      ),
    }
  } catch {
    return { ...DEFAULT_ENABLED_ALERTS }
  }
}

type ThemeColor = "blue" | "indigo" | "pink" | "rose" | "emerald" | "yellow" | "orange"

const themeColorMap: Record<ThemeColor, { primary: string; gradient: string; label: string }> = {
  blue: { primary: "#3b82f6", gradient: "#2563eb", label: "Blue" },
  indigo: { primary: "#6366f1", gradient: "#4f46e5", label: "Indigo" },
  pink: { primary: "#ec4899", gradient: "#db2777", label: "Pink" },
  rose: { primary: "#f43f5e", gradient: "#e11d48", label: "Rose" },
  emerald: { primary: "#10b981", gradient: "#059669", label: "Emerald" },
  yellow: { primary: "#eab308", gradient: "#ca8a04", label: "Yellow" },
  orange: { primary: "#f97316", gradient: "#ea580c", label: "Orange" },
}

const themeColorKeys: ThemeColor[] = ["blue", "indigo", "pink", "rose", "emerald", "yellow", "orange"]

const prayerIcons = {
  subuh: Moon,
  syuruk: Sunrise,
  zohor: Sun,
  asar: CloudSun,
  maghrib: Sunset,
  isyak: Moon,
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

function getPrayerName(key: string, language: "en" | "ms", isFriday: boolean): string {
  const t = translations[language]
  if (key === "zohor" && isFriday) {
    return t.jumaah
  }
  return t[key as keyof typeof t] as string
}

function formatTimeDisplay(date: Date, format: "12h" | "24h"): string {
  if (format === "12h") {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    })
  }
  return date.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })
}

function formatPrayerTime(time: string, format: "12h" | "24h"): string {
  if (format === "24h" || !time.includes(":")) return time
  const [h, m] = time.split(":").map(Number)
  if (isNaN(h) || isNaN(m)) return time
  const period = h >= 12 ? "PM" : "AM"
  const hour12 = h % 12 || 12
  return `${hour12}:${m.toString().padStart(2, "0")} ${period}`
}

export function DisplayClient() {
  const router = useRouter()
  const { selectedZone, setSelectedZone, language, setLanguage } = useAppStore()
  const t = translations[language]
  const [currentTime, setCurrentTime] = useState(new Date())
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false)
  const [todayPrayer, setTodayPrayer] = useState<PrayerData | null>(null)
  const [nextPrayerKey, setNextPrayerKey] = useState<string | null>(null)
  const [countdown, setCountdown] = useState<string>("")
  const [showSettings, setShowSettings] = useState(false)
  const [settingsVisible, setSettingsVisible] = useState(true)
  const [lastMouseMove, setLastMouseMove] = useState(Date.now())
  const [customTitle, setCustomTitle] = useState("")
  const [tempCustomTitle, setTempCustomTitle] = useState("")
  const [tempZone, setTempZone] = useState(selectedZone)
  const [tempLanguage, setTempLanguage] = useState(language)
  const [alertState, setAlertState] = useState<AlertState>({ type: "none" })
  const [testMode, setTestMode] = useState<TestAlertType | null>(null)
  const [showZone, setShowZone] = useState(true)
  const [tempShowZone, setTempShowZone] = useState(true)
  const [showHeader, setShowHeader] = useState(false)
  const [tempShowHeader, setTempShowHeader] = useState(false)
  const [showTestAlertDropdown, setShowTestAlertDropdown] = useState(false)
  const [zoneSelectorOpen, setZoneSelectorOpen] = useState(false)
  const [hijriDate, setHijriDate] = useState<string>("")
  const [allPrayers, setAllPrayers] = useState<PrayerData[]>([])
  const [iqamahForPrayer, setIqamahForPrayer] = useState<string | null>(null)
  const [themeColor, setThemeColor] = useState<ThemeColor>("blue")
  const [tempThemeColor, setTempThemeColor] = useState<ThemeColor>("blue")
  const [enabledAlerts, setEnabledAlerts] = useState<Record<AlertType, boolean>>(DEFAULT_ENABLED_ALERTS)
  const [tempEnabledAlerts, setTempEnabledAlerts] = useState<Record<AlertType, boolean>>(DEFAULT_ENABLED_ALERTS)
  const [azanSoundEnabled, setAzanSoundEnabled] = useState(true)
  const [tempAzanSoundEnabled, setTempAzanSoundEnabled] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [tempAutoRefresh, setTempAutoRefresh] = useState(false)
  const [timeFormat, setTimeFormat] = useState<"12h" | "24h">("24h")
  const [tempTimeFormat, setTempTimeFormat] = useState<"12h" | "24h">("24h")
  const [showAzanBanner, setShowAzanBanner] = useState(false)
  const [isTestingAzan, setIsTestingAzan] = useState(false)
  const azanAudioRef = useRef<HTMLAudioElement | null>(null)
  const inPostAzanWindowRef = useRef(false)
  const timeOffsetRef = useRef(0)
  const [isLocating, setIsLocating] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  const [viewportWidth, setViewportWidth] = useState(1440)
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener("fullscreenchange", handleFsChange)
    return () => document.removeEventListener("fullscreenchange", handleFsChange)
  }, [])

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {})
    } else {
      document.documentElement.requestFullscreen().catch(() => {})
    }
  }, [])

  function getResponsivePadding(width: number): number {
    if (width <= 425) return 4
    if (width <= 768) return 6
    if (width <= 1024) return 8
    if (width <= 1440) return 12
    return 16
  }

  const padding = Math.max(4, getResponsivePadding(viewportWidth) * (viewportWidth >= 1440 ? scale : 1))

  useEffect(() => {
    const handleResize = () => setViewportWidth(window.innerWidth)
    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  useEffect(() => {
    const checkMobile = () => {
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768
      setIsMobileDrawerOpen(isMobile)
    }
    checkMobile()
  }, [])

  // Scale based on fixed 1920x1080 design so resolution stays consistent when alert shows
  useEffect(() => {
    const wrapperEl = wrapperRef.current
    if (!wrapperEl) return

    const REF_WIDTH = 1920
    const REF_HEIGHT = 1080
    const currentPadding = getResponsivePadding(viewportWidth) * 2

    const updateScale = () => {
      const availableWidth = wrapperEl.clientWidth || window.innerWidth - currentPadding
      const availableHeight = wrapperEl.clientHeight || window.innerHeight - currentPadding
      const scaleX = availableWidth / REF_WIDTH
      const scaleY = availableHeight / REF_HEIGHT
      setScale(Math.min(scaleX, scaleY))
    }

    updateScale()
    const ro = new ResizeObserver(updateScale)
    ro.observe(wrapperEl)
    window.addEventListener("resize", updateScale)

    return () => {
      ro.disconnect()
      window.removeEventListener("resize", updateScale)
    }
  }, [viewportWidth])

  useEffect(() => {
    try {
      const storedTheme = localStorage.getItem("waktu-display-theme")
      if (storedTheme && storedTheme in themeColorMap) {
        setThemeColor(storedTheme as ThemeColor)
      }
      const storedShowZone = localStorage.getItem("waktu-display-show-zone")
      if (storedShowZone !== null) {
        setShowZone(storedShowZone === "true")
      }
      const storedShowHeader = localStorage.getItem("waktu-display-show-header")
      if (storedShowHeader !== null) {
        setShowHeader(storedShowHeader === "true")
      }
      setEnabledAlerts(loadEnabledAlerts())
      const storedAzanSound = localStorage.getItem("waktu-display-azan-sound")
      const soundEnabled = storedAzanSound !== null ? storedAzanSound === "true" : true
      setAzanSoundEnabled(soundEnabled)

      const storedAutoRefresh = localStorage.getItem("waktu-display-auto-refresh")
      setAutoRefresh(storedAutoRefresh === "true")

      const storedTimeFormat = localStorage.getItem("waktu-display-time-format")
      if (storedTimeFormat === "12h" || storedTimeFormat === "24h") {
        setTimeFormat(storedTimeFormat)
      }

      const bannerDismissed = localStorage.getItem("waktu-display-azan-banner-dismissed") === "true"
      if (!bannerDismissed && window.innerWidth >= 768) {
        setShowAzanBanner(true)
      }
    } catch (e) {
      console.error("Failed to read display settings:", e)
    }
  }, [])

  useEffect(() => {
    if (!autoRefresh) return
    const interval = setInterval(() => window.location.reload(), 3_600_000)
    return () => clearInterval(interval)
  }, [autoRefresh])

  // Show banner when tab becomes visible (handles "already open" case)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        try {
          const bannerDismissed = localStorage.getItem("waktu-display-azan-banner-dismissed") === "true"
          if (!bannerDismissed && window.innerWidth >= 768) {
            setShowAzanBanner(true)
          }
        } catch {}
      }
    }
    document.addEventListener("visibilitychange", handleVisibilityChange)
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange)
  }, [])

  const playAzanSound = useCallback((prayerKey?: string, onEnded?: () => void) => {
    if (azanAudioRef.current) {
      azanAudioRef.current.pause()
      azanAudioRef.current.currentTime = 0
    }
    const src = prayerKey === "subuh" ? "/azan-subuh.mp3" : "/azan-new.mp3"
    const audio = new Audio(src)
    audio.loop = false
    azanAudioRef.current = audio
    audio.play().catch((e) => console.error("Failed to play azan sound:", e))
    audio.onended = () => {
      setIsTestingAzan(false)
      onEnded?.()
    }
  }, [])

  const stopAzanSound = useCallback(() => {
    if (azanAudioRef.current) {
      azanAudioRef.current.pause()
      azanAudioRef.current.currentTime = 0
      azanAudioRef.current = null
    }
    setIsTestingAzan(false)
  }, [])

  useEffect(() => {
    const isAzanNow = alertState.type === "azan_now"
    const alreadyPlaying = azanAudioRef.current && !azanAudioRef.current.paused
    if (isAzanNow && azanSoundEnabled && !alreadyPlaying) {
      playAzanSound(alertState.prayerKey)
    }
    const inPostAzanWindow = inPostAzanWindowRef.current
    const shouldNotStop =
      alertState.type === "iqamah" ||
      alertState.type === "khutbah_countdown" ||
      inPostAzanWindow
    if (!isAzanNow && !shouldNotStop && azanAudioRef.current && !isTestingAzan) {
      stopAzanSound()
    }
  }, [alertState.type, azanSoundEnabled, playAzanSound, stopAzanSound, isTestingAzan])

  useEffect(() => {
    return () => {
      if (azanAudioRef.current) {
        azanAudioRef.current.pause()
        azanAudioRef.current = null
      }
    }
  }, [])

  const zoneInfo = prayerZones.find((z) => z.code === selectedZone)
  const isFriday = currentTime.getDay() === 5

  const handleMouseMove = useCallback(() => {
    setLastMouseMove(Date.now())
    setSettingsVisible(true)
  }, [])

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove)
    window.addEventListener("touchstart", handleMouseMove)

    const hideTimer = setInterval(() => {
      if (Date.now() - lastMouseMove > 3000) {
        setSettingsVisible(false)
      }
    }, 500)

    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("touchstart", handleMouseMove)
      clearInterval(hideTimer)
    }
  }, [lastMouseMove, handleMouseMove])

  // Test mode auto-dismiss: each test alert disappears after its duration, then resets to "Reset"
  useEffect(() => {
    if (!testMode || testMode === "none") return
    if (testMode === "azan_now" && azanSoundEnabled) return // Reset handled by audio onended callback

    const durationMs = TEST_DURATION_SECONDS[testMode] * 1000
    const timer = setTimeout(() => {
      setTestMode(null)
      setAlertState({ type: "none" })
    }, durationMs)
    return () => clearTimeout(timer)
  }, [testMode, azanSoundEnabled])

  useEffect(() => {
    const fetchPrayer = async () => {
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
          setAllPrayers(data.prayers)
          const dayIndex = new Date().getDate() - 1
          const prayer = data.prayers[dayIndex] || data.prayers[0]
          if (prayer) {
            setTodayPrayer(prayer)
          }
        }
      } catch (error) {
        console.error("Failed to fetch prayer times:", error)
      }
    }
    fetchPrayer()
    const interval = setInterval(fetchPrayer, 300000)
    return () => clearInterval(interval)
  }, [selectedZone, language])

  // Hijri day starts at Maghrib; use next day's hijri when Maghrib has passed
  useEffect(() => {
    if (!todayPrayer?.hijri || allPrayers.length === 0) return

    const maghribStr = todayPrayer.maghrib
    if (!maghribStr || !maghribStr.includes(":")) {
      setHijriDate(formatHijriDate(todayPrayer.hijri, language))
      return
    }

    const [maghribH, maghribM] = maghribStr.split(":").map(Number)
    const maghribMinutes = (maghribH ?? 0) * 60 + (maghribM ?? 0)
    const now = currentTime
    const currentMinutes = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60

    const dayIndex = now.getDate() - 1
    const isAfterMaghrib = currentMinutes >= maghribMinutes
    const prayerForHijri = isAfterMaghrib && dayIndex + 1 < allPrayers.length
      ? allPrayers[dayIndex + 1]
      : todayPrayer

    if (prayerForHijri?.hijri) {
      setHijriDate(formatHijriDate(prayerForHijri.hijri, language))
    }
  }, [currentTime, todayPrayer, allPrayers, language])

  useEffect(() => {
    const syncTime = async () => {
      try {
        const res = await fetch("/api/time")
        if (res.ok) {
          const data = (await res.json()) as { unixtime: number }
          timeOffsetRef.current = data.unixtime * 1000 - Date.now()
        }
      } catch {
        timeOffsetRef.current = 0
      }
    }
    syncTime()
    const syncInterval = setInterval(syncTime, 5 * 60 * 1000)
    const timer = setInterval(
      () => setCurrentTime(new Date(Date.now() + timeOffsetRef.current)),
      1000,
    )
    return () => {
      clearInterval(timer)
      clearInterval(syncInterval)
    }
  }, [])

  const countdownLabels = {
    days: t.days,
    hours: t.hours,
    minutes: t.minutes,
    seconds: t.seconds,
  }

  useEffect(() => {
    inPostAzanWindowRef.current = false

    if (testMode && testMode !== "none") {
      const testPrayerName = nextPrayerKey
        ? getPrayerName(nextPrayerKey, language, isFriday && nextPrayerKey === "zohor")
        : t.zohor
      switch (testMode) {
        case "azan_countdown":
          setAlertState({ type: "azan_countdown", prayerName: testPrayerName, minutes: 15 })
          break
        case "azan_now": {
          const key = nextPrayerKey ?? "zohor"
          setAlertState({ type: "azan_now", prayerName: testPrayerName, prayerKey: key })
          const alreadyPlaying = azanAudioRef.current && !azanAudioRef.current.paused
          if (azanSoundEnabled && !alreadyPlaying) {
            playAzanSound(key, () => {
              setTestMode(null)
              setAlertState({ type: "none" })
            })
          }
          break
        }
        case "iqamah":
          setAlertState({ type: "iqamah", minutes: 10 })
          break
        case "khutbah_countdown":
          setAlertState({ type: "khutbah_countdown", minutes: 12 })
          break
        default:
          setAlertState({ type: "none" })
      }
      return
    }

    if (!todayPrayer) return

    const prayerKeysForAlerts = ["subuh", "zohor", "asar", "maghrib", "isyak"]
    const prayerTimesForAlerts = [
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

    for (let i = 0; i < prayerKeysForAlerts.length; i++) {
      const time = prayerTimesForAlerts[i]
      if (!time || typeof time !== "string" || !time.includes(":")) continue
      const [hours, minutes] = time.split(":").map(Number)
      if (isNaN(hours) || isNaN(minutes)) continue
      const prayerMinutes = hours * 60 + minutes

      const totalSecondsUntilPrayer = (prayerMinutes - currentMinutes) * 60 - currentSeconds
      const minutesUntilPrayer = Math.ceil(totalSecondsUntilPrayer / 60)

      if (minutesUntilPrayer <= 15 && minutesUntilPrayer > 0) {
        const prayerName = getPrayerName(
          prayerKeysForAlerts[i],
          language,
          isFriday && prayerKeysForAlerts[i] === "zohor",
        )
        setAlertState(
          enabledAlerts.azan_countdown
            ? { type: "azan_countdown", prayerName, minutes: minutesUntilPrayer }
            : { type: "none" },
        )
        for (let j = 0; j < allPrayerKeys.length; j++) {
          const pTime = allPrayerTimes[j]
          if (!pTime || typeof pTime !== "string" || !pTime.includes(":")) continue
          const [pH, pM] = pTime.split(":").map(Number)
          if (isNaN(pH) || isNaN(pM)) continue
          const pMinutes = pH * 60 + pM
          if (pMinutes > currentMinutes) {
            setNextPrayerKey(allPrayerKeys[j])
            const totalSecs = (pMinutes - currentMinutes) * 60 - currentSeconds
            setCountdown(formatSmartCountdown(totalSecs, translations[language]))
            break
          }
        }
        return
      }

      const minutesSincePrayer = currentMinutes - prayerMinutes + (currentSeconds > 0 ? 1 : 0)

      if (minutesSincePrayer >= 0 && minutesSincePrayer < 5) {
        setNextPrayerKey(prayerKeysForAlerts[i])
        setCountdown(t.azanNow)
        const prayerName = getPrayerName(
          prayerKeysForAlerts[i],
          language,
          isFriday && prayerKeysForAlerts[i] === "zohor",
        )
        setAlertState(
          enabledAlerts.azan_now ? { type: "azan_now", prayerName, prayerKey: prayerKeysForAlerts[i] } : { type: "none" },
        )
        setIqamahForPrayer(prayerKeysForAlerts[i])
        return
      }

      if (minutesSincePrayer >= 5 && minutesSincePrayer < 15) {
        inPostAzanWindowRef.current = true
        const iqamahRemaining = 15 - minutesSincePrayer

        // Friday/Jumaah: skip iqamah, go straight to khutbah countdown (12 mins)
        if (isFriday && prayerKeysForAlerts[i] === "zohor") {
          const nextIdx = allPrayerKeys.indexOf("asar")
          if (nextIdx !== -1) {
            setNextPrayerKey("asar")
            const asrTime = allPrayerTimes[nextIdx]
            if (asrTime && asrTime.includes(":")) {
              const [asrH, asrM] = asrTime.split(":").map(Number)
              const asrMinutes = asrH * 60 + asrM
              const totalSecs = (asrMinutes - currentMinutes) * 60 - currentSeconds
              setCountdown(formatSmartCountdown(totalSecs, translations[language]))
            }
          }
          setAlertState(
            enabledAlerts.khutbah_countdown
              ? { type: "khutbah_countdown", minutes: 17 - minutesSincePrayer }
              : { type: "none" },
          )
          return
        }

        // Subuh iqamah: countdown to sunrise (syuruk), not Dhuhr
        if (prayerKeysForAlerts[i] === "subuh") {
          const syurukTime = todayPrayer.syuruk
          if (syurukTime && syurukTime.includes(":")) {
            const [sH, sM] = syurukTime.split(":").map(Number)
            const syurukMinutes = sH * 60 + sM
            if (currentMinutes < syurukMinutes) {
              setNextPrayerKey("syuruk")
              const totalSecs = (syurukMinutes - currentMinutes) * 60 - currentSeconds
              setCountdown(formatSmartCountdown(totalSecs, translations[language]))
            }
          }
        } else {
          const currentPrayerIdx = allPrayerKeys.indexOf(prayerKeysForAlerts[i])
          let nextPrayerIdx = currentPrayerIdx + 1
          if (allPrayerKeys[nextPrayerIdx] === "syuruk") nextPrayerIdx++

          if (nextPrayerIdx < allPrayerKeys.length) {
            setNextPrayerKey(allPrayerKeys[nextPrayerIdx])
            const nextTime = allPrayerTimes[nextPrayerIdx]
            if (nextTime && nextTime.includes(":")) {
              const [nH, nM] = nextTime.split(":").map(Number)
              const nMinutes = nH * 60 + nM
              const totalSecs = (nMinutes - currentMinutes) * 60 - currentSeconds
              setCountdown(formatSmartCountdown(totalSecs, translations[language]))
            }
          } else {
            setNextPrayerKey("subuh")
            const fajrTime = todayPrayer.fajr
            if (fajrTime && fajrTime.includes(":")) {
              const [fH, fM] = fajrTime.split(":").map(Number)
              const fajrMinutes = fH * 60 + fM
              const minutesUntilMidnight = 24 * 60 - currentMinutes
              const totalMins = minutesUntilMidnight + fajrMinutes
              const totalSecs = totalMins * 60 - currentSeconds
              setCountdown(formatSmartCountdown(totalSecs, translations[language]))
            }
          }
        }
        if (enabledAlerts.iqamah) {
          setAlertState({ type: "iqamah", minutes: iqamahRemaining })
        } else if (prayerKeysForAlerts[i] === "subuh") {
          const syurukTime = todayPrayer.syuruk
          if (syurukTime && syurukTime.includes(":")) {
            const [sH, sM] = syurukTime.split(":").map(Number)
            const syurukMinutes = sH * 60 + sM
            if (currentMinutes < syurukMinutes) {
              setNextPrayerKey("syuruk")
              const totalSecs = (syurukMinutes - currentMinutes) * 60 - currentSeconds
              setCountdown(formatSmartCountdown(totalSecs, translations[language]))
              setAlertState({ type: "sunrise_countdown", minutes: Math.max(1, Math.ceil(totalSecs / 60)) })
              setIqamahForPrayer(null)
              return
            }
          }
          setAlertState({ type: "none" })
        } else {
          setAlertState({ type: "none" })
        }
        setIqamahForPrayer(null)
        return
      }

      if (prayerKeysForAlerts[i] === "subuh" && minutesSincePrayer >= 15) {
        const syurukTime = todayPrayer.syuruk
        if (syurukTime && syurukTime.includes(":")) {
          const [sH, sM] = syurukTime.split(":").map(Number)
          const syurukMinutes = sH * 60 + sM
          if (currentMinutes < syurukMinutes) {
            setNextPrayerKey("syuruk")
            const totalSecs = (syurukMinutes - currentMinutes) * 60 - currentSeconds
            setCountdown(formatSmartCountdown(totalSecs, translations[language]))
            setAlertState({ type: "sunrise_countdown", minutes: Math.max(1, Math.ceil(totalSecs / 60)) })
            return
          }
        }
      }

      if (isFriday && prayerKeysForAlerts[i] === "zohor" && minutesSincePrayer >= 17 && minutesSincePrayer < 47) {
        const nextIdx = allPrayerKeys.indexOf("asar")
        if (nextIdx !== -1) {
          setNextPrayerKey("asar")
          const asrTime = allPrayerTimes[nextIdx]
          if (asrTime && asrTime.includes(":")) {
            const [asrH, asrM] = asrTime.split(":").map(Number)
            const asrMinutes = asrH * 60 + asrM
            const totalSecs = (asrMinutes - currentMinutes) * 60 - currentSeconds
            setCountdown(formatSmartCountdown(totalSecs, translations[language]))
          }
        }
        setAlertState(
          { type: "none" },
        )
        return
      }
    }

    setAlertState({ type: "none" })
    setIqamahForPrayer(null)

    for (let i = 0; i < allPrayerKeys.length; i++) {
      const time = allPrayerTimes[i]
      if (!time || typeof time !== "string" || !time.includes(":")) continue
      const [hours, minutes] = time.split(":").map(Number)
      if (isNaN(hours) || isNaN(minutes)) continue
      const prayerMinutes = hours * 60 + minutes

      if (prayerMinutes > currentMinutes) {
        setNextPrayerKey(allPrayerKeys[i])
        const totalSecondsUntilPrayer = (prayerMinutes - currentMinutes) * 60 - currentSeconds
        setCountdown(formatSmartCountdown(totalSecondsUntilPrayer, translations[language]))
        return
      }
    }

    const fajrTime = todayPrayer.fajr
    if (fajrTime && typeof fajrTime === "string" && fajrTime.includes(":")) {
      const [fajrHours, fajrMinutes] = fajrTime.split(":").map(Number)
      if (!isNaN(fajrHours) && !isNaN(fajrMinutes)) {
        setNextPrayerKey("subuh")
        const fajrTotalMinutes = fajrHours * 60 + fajrMinutes
        const minutesUntilMidnight = 24 * 60 - currentMinutes
        const totalMinutesUntilFajr = minutesUntilMidnight + fajrTotalMinutes
        const totalSeconds = totalMinutesUntilFajr * 60 - currentSeconds
        setCountdown(formatSmartCountdown(totalSeconds, translations[language]))
        return
      }
    }

    setNextPrayerKey("subuh")
    setCountdown(t.tomorrow)
  }, [todayPrayer, currentTime, t, language, isFriday, testMode, enabledAlerts, nextPrayerKey, azanSoundEnabled, playAzanSound])

  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      alert(language === "ms" ? "Geolokasi tidak disokong" : "Geolocation not supported")
      return
    }
    setIsLocating(true)
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords
          const res = await fetch(`/api/locate?lat=${latitude}&lng=${longitude}`)
          if (res.ok) {
            const data = await res.json()
            const zone = data.zone ?? data.code
            if (zone) {
              setTempZone(zone)
              saveSettings(zone)
            }
          } else throw new Error("API error")
        } catch (error) {
          console.error("Location API error:", error)
          alert(language === "ms" ? "Tidak dapat mengesan zon. Sila pilih secara manual." : "Unable to detect zone. Please select manually.")
        } finally {
          setIsLocating(false)
        }
      },
      (error) => {
        console.error("Geolocation error:", error.code, error.message)
        setIsLocating(false)
        const messages: Record<number, { ms: string; en: string }> = {
          1: {
            ms: "Akses lokasi ditolak. Sila benarkan akses lokasi dalam tetapan pelayar.",
            en: "Location access denied. Please allow location access in your browser settings.",
          },
          2: {
            ms: "Lokasi tidak dapat dikesan. Sila pastikan GPS diaktifkan.",
            en: "Location unavailable. Please make sure GPS is enabled.",
          },
          3: {
            ms: "Permintaan lokasi tamat masa. Sila cuba lagi.",
            en: "Location request timed out. Please try again.",
          },
        }
        const msg = messages[error.code] || {
          ms: "Tidak dapat mendapatkan lokasi. Sila benarkan akses lokasi.",
          en: "Unable to get location. Please allow location access.",
        }
        alert(msg[language])
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    )
  }

  const openSettings = () => {
    setTempCustomTitle(customTitle)
    setTempZone(selectedZone)
    setTempLanguage(language)
    setTempShowZone(showZone)
    setTempShowHeader(showHeader)
    setTempThemeColor(themeColor)
    setTempEnabledAlerts({ ...enabledAlerts })
    setTempAzanSoundEnabled(azanSoundEnabled)
    setTempAutoRefresh(autoRefresh)
    setTempTimeFormat(timeFormat)
    setShowSettings(true)
  }

  const saveSettings = (zoneOverride?: string) => {
    const zoneToSave = zoneOverride ?? tempZone
    if (zoneToSave !== selectedZone) {
      stopAzanSound()
    }
    setCustomTitle(tempCustomTitle)
    setSelectedZone(zoneToSave)
    setLanguage(tempLanguage)
    setShowZone(tempShowZone)
    setShowHeader(tempShowHeader)
    setThemeColor(tempThemeColor)
    setEnabledAlerts(tempEnabledAlerts)
    setAzanSoundEnabled(tempAzanSoundEnabled)
    setAutoRefresh(tempAutoRefresh)
    setTimeFormat(tempTimeFormat)
    try {
      localStorage.setItem("waktu-display-theme", tempThemeColor)
      localStorage.setItem("waktu-display-show-zone", String(tempShowZone))
      localStorage.setItem("waktu-display-show-header", String(tempShowHeader))
      localStorage.setItem(ALERT_STORAGE_KEY, JSON.stringify(tempEnabledAlerts))
      localStorage.setItem("waktu-display-azan-sound", String(tempAzanSoundEnabled))
      localStorage.setItem("waktu-display-auto-refresh", String(tempAutoRefresh))
      localStorage.setItem("waktu-display-time-format", tempTimeFormat)
    } catch (e) {
      console.error("Failed to save display settings:", e)
    }
    setShowSettings(false)
    setShowTestAlertDropdown(false)
    setZoneSelectorOpen(false)
  }

  const prayerKeys = ["subuh", "syuruk", "zohor", "asar", "maghrib", "isyak"]
  const prayerTimes = todayPrayer
    ? [todayPrayer.fajr, todayPrayer.syuruk, todayPrayer.dhuhr, todayPrayer.asr, todayPrayer.maghrib, todayPrayer.isha]
    : ["00:00", "00:00", "00:00", "00:00", "00:00", "00:00"]

  const isWithin15Mins = alertState.type === "azan_countdown" || alertState.type === "azan_now"
  const hasAlert = alertState.type !== "none" && alertState.type !== "sunrise_countdown"
  const isAzanPlaying = alertState.type === "azan_now" && !testMode

  const hasSettingsChanged =
    tempCustomTitle !== customTitle ||
    tempZone !== selectedZone ||
    tempLanguage !== language ||
    tempShowZone !== showZone ||
    tempShowHeader !== showHeader ||
    tempThemeColor !== themeColor ||
    tempAzanSoundEnabled !== azanSoundEnabled ||
    tempAutoRefresh !== autoRefresh ||
    tempTimeFormat !== timeFormat ||
    JSON.stringify(tempEnabledAlerts) !== JSON.stringify(enabledAlerts)

  const testAlertOptions: { value: TestAlertType; label: string }[] = [
    { value: "none", label: t.resetAlert },
    { value: "azan_countdown", label: t.testAzanCountdown },
    { value: "azan_now", label: t.testAzanNow },
    { value: "iqamah", label: t.testIqamah },
    { value: "khutbah_countdown", label: t.testKhutbah },
  ]

  const currentTestAlertLabel =
    testAlertOptions.find((opt) => opt.value === (testMode || "none"))?.label || t.resetAlert

  const getCountdownText = () => {
    if (nextPrayerKey === "syuruk") {
      return `${t.sunriseIn} ${countdown}`
    }
    return `${t.begins} ${countdown}`
  }

  const renderAlert = () => {
    if (alertState.type === "none" || alertState.type === "sunrise_countdown") return null

    let alertText = ""
    switch (alertState.type) {
      case "azan_countdown":
        alertText = `${t.azanIn} ${alertState.prayerName} ${t.inMinutes} ${alertState.minutes} ${t.mins}`
        break
      case "azan_now":
        alertText = `${t.prayerTimeBegun} ${alertState.prayerName}`
        break
      case "iqamah":
        alertText = `${t.iqamahIn} ${alertState.minutes} ${t.mins}`
        break
      case "khutbah_countdown":
        alertText = `${t.khutbahStartsIn} ${alertState.minutes} ${t.mins}`
        break
    }

    return (
      <div
        style={{
          backgroundColor: "rgba(234, 179, 8, 0.1)",
          border: "2px solid #eab308",
          borderRadius: "8px",
          padding: "24px",
          marginBottom: "24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "16px",
          flexShrink: 0,
          minHeight: "96px",
          maxHeight: "120px",
        }}
      >
        <AlertTriangle style={{ width: "64px", height: "64px", color: "#eab308", flexShrink: 0 }} />
        <span
          style={{
            fontSize: "64px",
            fontWeight: 500,
            color: "#eab308",
            textAlign: "center",
            lineHeight: 1.2,
            wordBreak: "break-word",
            fontFamily: '"Satoshi", system-ui, sans-serif',
          }}
        >
          {alertText}
        </span>
      </div>
    )
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        overflow: "hidden",
        backgroundColor: "#18181b",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        paddingLeft: padding,
        paddingRight: padding,
        paddingTop: padding,
        paddingBottom: padding,
        boxSizing: "border-box",
        cursor: settingsVisible ? "auto" : "none",
        userSelect: "none",
        WebkitUserSelect: "none",
      }}
    >
      {showAzanBanner && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            zIndex: 9998,
            backgroundColor: "rgba(37, 99, 235, 0.95)",
            padding: "12px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "16px",
          }}
        >
          <span
            style={{
              color: "#ffffff",
              fontSize: "14px",
              fontFamily: '"Inter", system-ui, sans-serif',
            }}
          >
            {t.azanBannerText}
          </span>
          <button
            onClick={() => {
              setShowAzanBanner(false)
              try { localStorage.setItem("waktu-display-azan-banner-dismissed", "true") } catch {}
              openSettings()
            }}
            style={{
              padding: "8px 20px",
              backgroundColor: "transparent",
              color: "#ffffff",
              border: "1px solid #ffffff",
              borderRadius: "6px",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: '"Inter", system-ui, sans-serif',
              whiteSpace: "nowrap",
            }}
          >
            {t.openDisplaySettings}
          </button>
          <button
            onClick={() => {
              setShowAzanBanner(false)
              try { localStorage.setItem("waktu-display-azan-banner-dismissed", "true") } catch {}
            }}
            style={{
              padding: "8px 16px",
              backgroundColor: "transparent",
              color: "#ffffff",
              border: "1px solid #ffffff",
              borderRadius: "6px",
              fontSize: "13px",
              fontWeight: 500,
              cursor: "pointer",
              fontFamily: '"Inter", system-ui, sans-serif',
              whiteSpace: "nowrap",
            }}
          >
            {t.dismiss}
          </button>
        </div>
      )}
      <div
        ref={wrapperRef}
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minWidth: 0,
          overflow: "hidden",
        }}
      >
        <div
          ref={contentRef}
          style={{
            width: "1920px",
            height: "1080px",
            minHeight: "1080px",
            transform: `scale(${scale})`,
            transformOrigin: "center center",
            backgroundColor: "#18181b",
            padding: 0,
            display: "flex",
            flexDirection: "column",
            boxSizing: "border-box",
            fontFamily: '"Satoshi", system-ui, sans-serif',
          }}
        >
      {showHeader && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "24px",
            flexShrink: 0,
          }}
        >
          <div style={{ textAlign: "left", display: "flex", flexDirection: "column", gap: "8px" }}>
            <p style={{ fontSize: "64px", color: "#ffffff", fontWeight: 600, fontFamily: '"Satoshi", system-ui, sans-serif', lineHeight: 1.2 }} suppressHydrationWarning>
              {formatGregorianDate(language)}
            </p>
            <p style={{ fontSize: "64px", color: "#ffffff", fontWeight: 600, fontFamily: '"Satoshi", system-ui, sans-serif', lineHeight: 1.2 }} suppressHydrationWarning>
              {hijriDate}
            </p>
          </div>
          <div style={{ textAlign: "right" }}>
            <h1 style={{ fontSize: "68px", fontWeight: 700, color: themeColorMap[themeColor].primary, fontFamily: '"Satoshi", system-ui, sans-serif', lineHeight: 1.2 }}>
              {customTitle || "Waktu+"}
            </h1>
            <p style={{ fontSize: "68px", fontWeight: 600, color: "#ffffff", fontFamily: '"Satoshi", system-ui, sans-serif', lineHeight: 1.2 }} suppressHydrationWarning>
              {formatTimeDisplay(currentTime, timeFormat)}
            </p>
          </div>
        </div>
      )}

      {renderAlert()}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: hasAlert ? "24px" : "32px",
          flex: 1,
          minHeight: 0,
          overflow: "hidden",
        }}
      >
        {prayerKeys.map((key, index) => {
          const Icon = prayerIcons[key as keyof typeof prayerIcons]
          const isNext = key === nextPrayerKey
          const prayerName = getPrayerName(key, language, isFriday && key === "zohor")
          const isSyuruk = key === "syuruk"
          const isSunriseCountdown = alertState.type === "sunrise_countdown" && isSyuruk

          const showCountdown = isNext && (
            !isWithin15Mins ||
            alertState.type === "iqamah" ||
            alertState.type === "khutbah_countdown" ||
            (alertState.type === "sunrise_countdown" && !isSyuruk)
          )

          const cardScale = hasAlert ? 0.85 : 1
          const iconSize = hasAlert ? 64 : 80
          const nameSize = Math.round(120 * cardScale)
          const timeSize = Math.round(118 * cardScale)

          return (
            <div
              key={key}
              style={{
                backgroundColor: isNext ? undefined : "transparent",
                background: isNext ? `linear-gradient(135deg, ${themeColorMap[themeColor].primary} 0%, ${themeColorMap[themeColor].gradient} 100%)` : undefined,
                borderRadius: "8px",
                padding: hasAlert ? "12px" : "16px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                minHeight: hasAlert ? "160px" : "200px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: hasAlert ? "8px" : "12px", marginBottom: "4px", lineHeight: 1.2 }}>
                <Icon style={{ width: iconSize, height: iconSize, color: "#ffffff" }} />
                <span style={{ fontSize: nameSize, fontWeight: 600, color: "#ffffff", lineHeight: 1.2 }}>
                  {prayerName}
                </span>
              </div>
              <span style={{ fontSize: timeSize, fontWeight: 600, color: "#ffffff", lineHeight: 1.2 }}>
                {formatPrayerTime(prayerTimes[index], timeFormat)}
              </span>
              <div
                style={{
                  marginTop: hasAlert ? "4px" : "8px",
                  padding: hasAlert ? "8px 16px" : "12px 24px",
                  width: "fit-content",
                  maxWidth: "100%",
                  boxSizing: "border-box",
                  height: "fit-content",
                  visibility: showCountdown ? "visible" : "hidden",
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  marginLeft: "auto",
                  marginRight: "auto",
                }}
              >
                <span
                  style={{
                    fontSize: hasAlert ? "clamp(14px, 2vw, 22px)" : "clamp(18px, 2.5vw, 28px)",
                    fontWeight: 500,
                    color: "rgba(255,255,255,0.9)",
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                    lineHeight: 1,
                    fontFamily: '"Satoshi", system-ui, sans-serif',
                  }}
                >
                  {isSyuruk ? t.sunriseIn : t.begins}
                </span>
                <span
                  style={{
                    fontSize: hasAlert ? "clamp(14px, 2vw, 22px)" : "clamp(18px, 2.5vw, 28px)",
                    fontWeight: 500,
                    color: "rgba(255,255,255,0.9)",
                    whiteSpace: "nowrap",
                    textAlign: "center",
                    flexShrink: 0,
                    lineHeight: 1,
                    fontFamily: '"Satoshi", system-ui, sans-serif',
                  }}
                >
                  {countdown}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {(!showHeader || (showZone && zoneInfo)) && (
        <div
          style={{
            textAlign: "center",
            marginTop: "auto",
            paddingTop: hasAlert ? "16px" : "24px",
            flexShrink: 0,
            fontSize: hasAlert ? "20px" : "24px",
            fontWeight: 500,
            color: "rgba(255,255,255,0.7)",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          }}
        >
          {showZone && zoneInfo && (
            <p style={{ margin: 0 }}>
              <span>{t.zone}: {zoneInfo.name}</span>
            </p>
          )}
          {!showHeader && (
            <p style={{ margin: 0 }}>
              <span suppressHydrationWarning>{formatGregorianDate(language)}</span>
              <span> · </span>
              <span suppressHydrationWarning>{hijriDate}</span>
              <span> · </span>
              <span style={{ display: "inline-block", minWidth: timeFormat === "12h" ? "7.5em" : "5.5em", textAlign: "left" }} suppressHydrationWarning>
                {formatTimeDisplay(currentTime, timeFormat)}
              </span>
            </p>
          )}
        </div>
      )}
        </div>
      </div>
      {viewportWidth >= 768 && (
        <button
          onClick={toggleFullscreen}
          title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          style={{
            position: "fixed",
            bottom: "24px",
            right: "80px",
            backgroundColor: "#27272a",
            border: "none",
            borderRadius: "8px",
            padding: "12px",
            cursor: "pointer",
            opacity: settingsVisible ? 1 : 0,
            transition: "opacity 0.3s ease",
            pointerEvents: settingsVisible ? "auto" : "none",
            zIndex: 1000,
          }}
        >
          {isFullscreen
            ? <Shrink style={{ width: "24px", height: "24px", color: "#ffffff" }} />
            : <Expand style={{ width: "24px", height: "24px", color: "#ffffff" }} />}
        </button>
      )}
      <button
        onClick={openSettings}
        title={t.settings}
        style={{
          position: "fixed",
          bottom: "24px",
          right: "24px",
          backgroundColor: "#27272a",
          border: "none",
          borderRadius: "8px",
          padding: "12px",
          cursor: "pointer",
          opacity: settingsVisible ? 1 : 0,
          transition: "opacity 0.3s ease",
          pointerEvents: settingsVisible ? "auto" : "none",
        }}
      >
        <Settings style={{ width: "24px", height: "24px", color: "#ffffff" }} />
      </button>

      {showSettings && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            paddingLeft: viewportWidth < 1024 ? "12px" : 0,
            paddingRight: viewportWidth < 1024 ? "12px" : 0,
            boxSizing: "border-box",
          }}
          onClick={() => {
            setShowSettings(false)
            setShowTestAlertDropdown(false)
            setZoneSelectorOpen(false)
          }}
        >
          <div
            className="scrollbar-hide"
            style={{
              backgroundColor: "#18181b",
              borderRadius: "8px",
              padding: "24px",
              width: "100%",
              maxWidth: viewportWidth >= 768 ? "900px" : "400px",
              maxHeight: "90vh",
              overflowY: "auto",
              position: "relative",
              fontFamily: '"Satoshi", system-ui, sans-serif',
              height: viewportWidth >= 768 ? "auto" : "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: "24px", fontWeight: 600, color: "#ffffff", marginBottom: "24px", fontFamily: '"Satoshi", system-ui, sans-serif' }}>{t.settings}</h2>

            <div
              style={{
                display: "flex",
                flexDirection: viewportWidth >= 768 ? "row" : "column",
                gap: "24px",
                marginBottom: "24px",
                alignItems: "flex-start",
              }}
            >
              {/* Left: Display Identity + Location & Prayer Time */}
              <div style={{ flex: "1 1 0%", minWidth: 0, width: viewportWidth < 768 ? "100%" : undefined, display: "flex", flexDirection: "column", gap: "24px" }}>

                {/* Display Identity */}
                <div>
                  <div style={{ marginBottom: "16px", minHeight: viewportWidth < 768 ? "60px" : undefined, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                    <h3 style={{ fontSize: "15px", fontWeight: 600, color: "#ffffff", margin: 0, fontFamily: '"Satoshi", system-ui, sans-serif' }}>{t.sectionDisplayIdentity}</h3>
                    <p style={{ fontSize: "12px", color: "#71717a", margin: "4px 0 0 0", fontFamily: '"Inter", system-ui, sans-serif' }}>{t.sectionDisplayIdentityDesc}</p>
                  </div>

                  <div style={{ marginBottom: "12px" }}>
                    <label style={{ fontSize: "14px", color: "#a1a1aa", display: "block", marginBottom: "8px" }}>
                      {t.customTitle}
                    </label>
                    <input
                      type="text"
                      value={tempCustomTitle}
                      onChange={(e) => setTempCustomTitle(e.target.value)}
                      placeholder={t.customTitlePlaceholder}
                      className="placeholder-inter"
                      style={{
                        width: "100%",
                        padding: "12px",
                        backgroundColor: "#27272a",
                        border: "none",
                        borderRadius: "8px",
                        color: "#ffffff",
                        fontSize: "14px",
                        outline: "none",
                        boxSizing: "border-box",
                        fontFamily: '"Satoshi", system-ui, sans-serif',
                      }}
                    />
                  </div>

                  <div style={{ marginBottom: "12px" }}>
                    <label style={{ fontSize: "14px", color: "#a1a1aa", display: "block", marginBottom: "8px" }}>
                      {t.themeColor}
                    </label>
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                      {themeColorKeys.map((colorKey) => (
                        <button
                          key={colorKey}
                          onClick={() => setTempThemeColor(colorKey)}
                          style={{
                            width: "40px",
                            height: "40px",
                            borderRadius: "50%",
                            backgroundColor: themeColorMap[colorKey].primary,
                            border: tempThemeColor === colorKey ? "3px solid #ffffff" : "3px solid transparent",
                            cursor: "pointer",
                            transform: tempThemeColor === colorKey ? "scale(1.15)" : "scale(1)",
                            transition: "transform 0.15s ease, border-color 0.15s ease",
                            outline: "none",
                            padding: 0,
                          }}
                          title={themeColorMap[colorKey].label}
                        />
                      ))}
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "12px" }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "8px 12px",
                        backgroundColor: "#27272a",
                        borderRadius: "8px",
                      }}
                    >
                      <span style={{ fontSize: "14px", color: "#ffffff", fontFamily: '"Inter", system-ui, sans-serif' }}>
                        {t.showHeader}
                      </span>
                      <Switch
                        checked={tempShowHeader}
                        onCheckedChange={setTempShowHeader}
                      />
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "8px 12px",
                        backgroundColor: "#27272a",
                        borderRadius: "8px",
                      }}
                    >
                      <span style={{ fontSize: "14px", color: "#ffffff", fontFamily: '"Inter", system-ui, sans-serif' }}>
                        {t.showZone}
                      </span>
                      <Switch
                        checked={tempShowZone}
                        onCheckedChange={setTempShowZone}
                      />
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "8px 12px",
                        backgroundColor: "#27272a",
                        borderRadius: "8px",
                      }}
                    >
                      <span style={{ fontSize: "14px", color: "#ffffff", fontFamily: '"Inter", system-ui, sans-serif' }}>
                        {t.autoRefresh}
                      </span>
                      <Switch
                        checked={tempAutoRefresh}
                        onCheckedChange={setTempAutoRefresh}
                      />
                    </div>
                  </div>

                  <div style={{ marginBottom: "12px" }}>
                    <label style={{ fontSize: "14px", color: "#a1a1aa", display: "block", marginBottom: "8px" }}>
                      {t.language}
                    </label>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button
                        onClick={() => setTempLanguage("en")}
                        style={{
                          flex: 1,
                          padding: "12px",
                          backgroundColor: tempLanguage === "en" ? "#3b82f6" : "#27272a",
                          border: "none",
                          borderRadius: "8px",
                          color: "#ffffff",
                          fontSize: "14px",
                          fontWeight: 500,
                          cursor: "pointer",
                          fontFamily: '"Inter", system-ui, sans-serif',
                        }}
                      >
                        {t.english}
                      </button>
                      <button
                        onClick={() => setTempLanguage("ms")}
                        style={{
                          flex: 1,
                          padding: "12px",
                          backgroundColor: tempLanguage === "ms" ? "#3b82f6" : "#27272a",
                          border: "none",
                          borderRadius: "8px",
                          color: "#ffffff",
                          fontSize: "14px",
                          fontWeight: 500,
                          cursor: "pointer",
                          fontFamily: '"Inter", system-ui, sans-serif',
                        }}
                      >
                        {t.bahasaMelayu}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Location & Prayer Time */}
                <div>
                  <div style={{ marginBottom: "16px", minHeight: viewportWidth < 768 ? "60px" : undefined, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                    <h3 style={{ fontSize: "15px", fontWeight: 600, color: "#ffffff", margin: 0, fontFamily: '"Satoshi", system-ui, sans-serif' }}>{t.sectionLocation}</h3>
                    <p style={{ fontSize: "12px", color: "#71717a", margin: "4px 0 0 0", fontFamily: '"Inter", system-ui, sans-serif' }}>{t.sectionLocationDesc}</p>
                  </div>

                  <div style={{ marginBottom: "12px" }}>
                    <label style={{ fontSize: "14px", color: "#a1a1aa", display: "block", marginBottom: "8px" }}>
                      {t.prayerZone}
                    </label>
                    <ZoneSelector
                      value={tempZone}
                      onChange={setTempZone}
                      className="placeholder-inter [&_[data-slot=input-group-button]]:hover:bg-transparent [&_[data-slot=input-group-button]]:hover:text-current"
                      open={zoneSelectorOpen && !showTestAlertDropdown}
                      onOpenChange={(isOpen) => {
                        setZoneSelectorOpen(isOpen)
                        if (isOpen) setShowTestAlertDropdown(false)
                      }}
                    />
                    <p style={{ fontSize: "12px", color: "#a1a1aa", marginTop: "8px", marginBottom: 0 }}>
                      {t.zoneSource}
                    </p>
                    <button
                      type="button"
                      onClick={handleLocateMe}
                      disabled={isLocating}
                      style={{
                        width: "100%",
                        marginTop: "12px",
                        padding: "10px 16px",
                        backgroundColor: "#2563eb",
                        color: "#ffffff",
                        fontWeight: 500,
                        fontSize: "14px",
                        borderRadius: "8px",
                        border: "none",
                        cursor: isLocating ? "wait" : "pointer",
                        opacity: isLocating ? 0.7 : 1,
                        fontFamily: '"Inter", system-ui, sans-serif',
                      }}
                    >
                      {isLocating ? (language === "ms" ? "Mengesan..." : "Detecting...") : t.locateMe}
                    </button>
                  </div>

                </div>
              </div>

              {/* Right: Alerts & Behaviour + Audio */}
              <div style={{ flex: "1 1 0%", minWidth: 0, width: viewportWidth < 768 ? "100%" : undefined, display: "flex", flexDirection: "column", gap: "24px" }}>

                {/* Alerts & Behaviour */}
                <div>
                  <div style={{ marginBottom: "16px", minHeight: viewportWidth < 768 ? "60px" : undefined, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                    <h3 style={{ fontSize: "15px", fontWeight: 600, color: "#ffffff", margin: 0, fontFamily: '"Satoshi", system-ui, sans-serif' }}>{t.sectionAlerts}</h3>
                    <p style={{ fontSize: "12px", color: "#71717a", margin: "4px 0 0 0", fontFamily: '"Inter", system-ui, sans-serif' }}>{t.sectionAlertsDesc}</p>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    <p style={{ fontSize: "12px", color: "#71717a", margin: 0, fontFamily: '"Inter", system-ui, sans-serif', textTransform: "uppercase", letterSpacing: "0.05em" }}>{t.alertBefore}</p>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "8px 12px",
                        backgroundColor: "#27272a",
                        borderRadius: "8px",
                      }}
                    >
                      <span style={{ fontSize: "14px", color: "#ffffff", fontFamily: '"Inter", system-ui, sans-serif' }}>
                        {t.testAzanCountdown} ({ALERT_DURATION_MINS.azan_countdown} {t.mins})
                      </span>
                      <Switch
                        checked={tempEnabledAlerts.azan_countdown}
                        onCheckedChange={(checked) => setTempEnabledAlerts((prev) => ({ ...prev, azan_countdown: checked }))}
                        disabled={isAzanPlaying}
                      />
                    </div>

                    <p style={{ fontSize: "12px", color: "#71717a", margin: "4px 0 0 0", fontFamily: '"Inter", system-ui, sans-serif', textTransform: "uppercase", letterSpacing: "0.05em" }}>{t.alertAt}</p>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "8px 12px",
                        backgroundColor: "#27272a",
                        borderRadius: "8px",
                      }}
                    >
                      <span style={{ fontSize: "14px", color: "#ffffff", fontFamily: '"Inter", system-ui, sans-serif' }}>
                        {t.testAzanNow} ({ALERT_DURATION_MINS.azan_now} {t.mins})
                      </span>
                      <Switch
                        checked={tempEnabledAlerts.azan_now}
                        onCheckedChange={(checked) => setTempEnabledAlerts((prev) => ({ ...prev, azan_now: checked }))}
                        disabled={isAzanPlaying}
                      />
                    </div>

                    <p style={{ fontSize: "12px", color: "#71717a", margin: "4px 0 0 0", fontFamily: '"Inter", system-ui, sans-serif', textTransform: "uppercase", letterSpacing: "0.05em" }}>{t.alertAfter}</p>
                    {(["iqamah", "khutbah_countdown"] as AlertType[]).map((key) => {
                      const alertLabels: Record<AlertType, string> = {
                        azan_countdown: t.testAzanCountdown,
                        azan_now: t.testAzanNow,
                        iqamah: t.testIqamah,
                        khutbah_countdown: t.testKhutbah,
                      }
                      return (
                        <div
                          key={key}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            padding: "8px 12px",
                            backgroundColor: "#27272a",
                            borderRadius: "8px",
                          }}
                        >
                          <span style={{ fontSize: "14px", color: "#ffffff", fontFamily: '"Inter", system-ui, sans-serif' }}>
                            {alertLabels[key]} ({ALERT_DURATION_MINS[key]} {t.mins})
                          </span>
                          <Switch
                            checked={tempEnabledAlerts[key]}
                            onCheckedChange={(checked) => setTempEnabledAlerts((prev) => ({ ...prev, [key]: checked }))}
                            disabled={isAzanPlaying}
                          />
                        </div>
                      )
                    })}
                  </div>

                  <div style={{ marginTop: "12px" }}>
                    <label style={{ fontSize: "14px", color: "#a1a1aa", display: "block", marginBottom: "8px" }}>
                      {t.testAlerts}
                    </label>
                    <div style={{ position: "relative" }}>
                      <button
                        onClick={() => {
                          if (isAzanPlaying) return
                          setShowTestAlertDropdown((prev) => {
                            if (!prev) setZoneSelectorOpen(false)
                            return !prev
                          })
                        }}
                        disabled={isAzanPlaying}
                        style={{
                          width: "100%",
                          padding: "12px",
                          backgroundColor: "#27272a",
                          border: "1px solid #3f3f46",
                          borderRadius: "8px",
                          color: "#ffffff",
                          fontSize: "14px",
                          textAlign: "left",
                          cursor: isAzanPlaying ? "not-allowed" : "pointer",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          fontFamily: '"Inter", system-ui, sans-serif',
                          opacity: isAzanPlaying ? 0.6 : 1,
                        }}
                      >
                        <span style={{ fontFamily: '"Inter", system-ui, sans-serif' }}>{currentTestAlertLabel}</span>
                        <ChevronDown
                          style={{
                            width: "16px",
                            height: "16px",
                            flexShrink: 0,
                            transform: showTestAlertDropdown ? "rotate(180deg)" : "rotate(0deg)",
                            transition: "transform 0.2s",
                          }}
                        />
                      </button>
                      {showTestAlertDropdown && (
                        <div
                          className="scrollbar-hide"
                          style={{
                            position: "absolute",
                            bottom: "100%",
                            left: 0,
                            right: 0,
                            backgroundColor: "#27272a",
                            borderRadius: "8px",
                            border: "1px solid #3f3f46",
                            marginBottom: "4px",
                            maxHeight: "200px",
                            overflowY: "auto",
                            zIndex: 100,
                          }}
                        >
                          {testAlertOptions.map((option) => (
                            <button
                              key={option.value}
                              onClick={() => {
                                if (isAzanPlaying) return
                                setTestMode(option.value === "none" ? null : option.value)
                                setShowTestAlertDropdown(false)
                              }}
                              disabled={isAzanPlaying}
                              style={{
                                width: "100%",
                                padding: "12px",
                                backgroundColor: (testMode || "none") === option.value ? "#3b82f6" : "transparent",
                                border: "none",
                                color: "#ffffff",
                                fontSize: "14px",
                                textAlign: "left",
                                cursor: "pointer",
                                fontFamily: '"Inter", system-ui, sans-serif',
                              }}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Time Format */}
                <div>
                  <label style={{ fontSize: "14px", color: "#a1a1aa", display: "block", marginBottom: "8px" }}>
                    {t.timeFormat}
                  </label>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      onClick={() => setTempTimeFormat("12h")}
                      style={{
                        flex: 1,
                        padding: "12px",
                        backgroundColor: tempTimeFormat === "12h" ? "#3b82f6" : "#27272a",
                        border: "none",
                        borderRadius: "8px",
                        color: "#ffffff",
                        fontSize: "14px",
                        fontWeight: 500,
                        cursor: "pointer",
                        fontFamily: '"Inter", system-ui, sans-serif',
                      }}
                    >
                      {t.timeFormat12h}
                    </button>
                    <button
                      onClick={() => setTempTimeFormat("24h")}
                      style={{
                        flex: 1,
                        padding: "12px",
                        backgroundColor: tempTimeFormat === "24h" ? "#3b82f6" : "#27272a",
                        border: "none",
                        borderRadius: "8px",
                        color: "#ffffff",
                        fontSize: "14px",
                        fontWeight: 500,
                        cursor: "pointer",
                        fontFamily: '"Inter", system-ui, sans-serif',
                      }}
                    >
                      {t.timeFormat24h}
                    </button>
                  </div>
                </div>

                {/* Audio */}
                <div>
                  <div style={{ marginBottom: "16px", minHeight: viewportWidth < 768 ? "60px" : undefined, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                    <h3 style={{ fontSize: "15px", fontWeight: 600, color: "#ffffff", margin: 0, fontFamily: '"Satoshi", system-ui, sans-serif' }}>{t.sectionAudio}</h3>
                    <p style={{ fontSize: "12px", color: "#71717a", margin: "4px 0 0 0", fontFamily: '"Inter", system-ui, sans-serif' }}>{t.sectionAudioDesc}</p>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "8px 12px",
                      backgroundColor: "#27272a",
                      borderRadius: "8px",
                      marginBottom: "12px",
                    }}
                  >
                    <span style={{ fontSize: "14px", color: "#ffffff", fontFamily: '"Inter", system-ui, sans-serif' }}>
                      {t.azanSound}
                    </span>
                    <Switch
                      checked={tempAzanSoundEnabled}
                      onCheckedChange={setTempAzanSoundEnabled}
                      disabled={isAzanPlaying}
                    />
                  </div>
                  <button
                    onClick={() => {
                      if (isAzanPlaying) return
                      if (isTestingAzan) {
                        stopAzanSound()
                      } else {
                        setIsTestingAzan(true)
                        playAzanSound()
                      }
                    }}
                    disabled={isAzanPlaying}
                    style={{
                      width: "100%",
                      padding: "10px 16px",
                      backgroundColor: isTestingAzan ? "#ef4444" : "#2563eb",
                      border: "none",
                      borderRadius: "8px",
                      color: "#ffffff",
                      fontSize: "14px",
                      fontWeight: 500,
                      cursor: isAzanPlaying ? "not-allowed" : "pointer",
                      fontFamily: '"Inter", system-ui, sans-serif',
                      transition: "background-color 0.15s ease",
                      opacity: isAzanPlaying ? 0.6 : 1,
                    }}
                  >
                    {isTestingAzan ? t.stopAzan : t.playAzan}
                  </button>
                </div>
              </div>
            </div>

            <div>
              <button
                onClick={() => saveSettings()}
                disabled={!hasSettingsChanged}
                style={{
                  width: "100%",
                  padding: "12px",
                  backgroundColor: hasSettingsChanged ? "#3b82f6" : "#27272a",
                  border: "none",
                  borderRadius: "8px",
                  color: "#ffffff",
                  fontSize: "14px",
                  fontWeight: 500,
                  cursor: hasSettingsChanged ? "pointer" : "not-allowed",
                  opacity: hasSettingsChanged ? 1 : 0.5,
                  fontFamily: '"Inter", system-ui, sans-serif',
                  transition: "background-color 0.15s ease, opacity 0.15s ease",
                }}
              >
                {t.save}
              </button>
            </div>
          </div>
        </div>
      )}

      <Drawer open={isMobileDrawerOpen} onOpenChange={setIsMobileDrawerOpen}>
        <DrawerContent>
          <DrawerHeader className="text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-yellow-500/10">
              <Monitor className="h-6 w-6 text-yellow-500" />
            </div>
            <DrawerTitle>{t.mobileWarningTitle}</DrawerTitle>
            <DrawerDescription>{t.mobileWarningDescription}</DrawerDescription>
          </DrawerHeader>
          <DrawerFooter>
            <Button onClick={() => router.push("/")}>{t.visitHomepage}</Button>
            <DrawerClose asChild>
              <Button variant="outline">{t.dismiss}</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  )
}
