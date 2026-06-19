"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { Moon, Sun, Sunrise, Sunset, CloudSun, Settings, AlertTriangle, ChevronDown, Expand, Shrink, X } from "lucide-react"
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
  DrawerFooter,
} from "@/components/ui/drawer"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  displayPrayerTimeClass,
  displayPrayerNameClass,
  displayCountdownClass,
  displayHeaderDateClass,
  displayHeaderTitleClass,
  displayAlertTextClass,
  displayFooterClass,
  displaySettingsTitleClass,
  displaySettingsSectionTitleClass,
  displaySettingsSectionDescClass,
  displaySettingsLabelClass,
  displaySettingsHelperClass,
} from "@/lib/display-typography"

interface PrayerData {
  hijri?: string
  date?: string
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
  khutbah_countdown: 8,
}

/** Test mode durations in seconds (shorter for quick testing) */
const TEST_DURATION_SECONDS: Record<Exclude<TestAlertType, "none">, number> = {
  azan_countdown: 15,
  azan_now: 5,
  iqamah: 10,
  khutbah_countdown: 8,
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

type ThemeColor = "blue" | "indigo" | "pink" | "rose" | "emerald" | "yellow" | "orange" | "sky" | "stone"

const themeColorMap: Record<ThemeColor, { primary: string; gradient: string; label: string }> = {
  blue: { primary: "#3b82f6", gradient: "#2563eb", label: "Blue" },
  indigo: { primary: "#6366f1", gradient: "#4f46e5", label: "Indigo" },
  pink: { primary: "#ec4899", gradient: "#db2777", label: "Pink" },
  rose: { primary: "#f43f5e", gradient: "#e11d48", label: "Rose" },
  emerald: { primary: "#10b981", gradient: "#059669", label: "Emerald" },
  yellow: { primary: "#eab308", gradient: "#ca8a04", label: "Yellow" },
  orange: { primary: "#f97316", gradient: "#ea580c", label: "Orange" },
  sky: { primary: "#0ea5e9", gradient: "#0284c7", label: "Sky" },
  stone: { primary: "#78716c", gradient: "#57534e", label: "Stone" },
}

const themeColorKeys: ThemeColor[] = ["blue", "indigo", "pink", "rose", "emerald", "yellow", "orange", "sky", "stone"]

const prayerIcons = {
  subuh: Moon,
  syuruk: Sunrise,
  zohor: Sun,
  asar: CloudSun,
  maghrib: Sunset,
  isyak: Moon,
}

function getLocalDateString(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
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

type LayoutMode = "compact" | "tv"

function getLayoutMode(width: number): LayoutMode {
  return width < 1024 ? "compact" : "tv"
}

export function DisplayClient() {
  const { selectedZone, setSelectedZone, language, setLanguage } = useAppStore()
  const t = translations[language]
  const [currentTime, setCurrentTime] = useState(new Date())
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
    const handleFsChange = () => {
      const fs = !!document.fullscreenElement
      setIsFullscreen(fs)
      try { localStorage.setItem("waktu-display-fullscreen", String(fs)) } catch {}
    }
    document.addEventListener("fullscreenchange", handleFsChange)
    return () => document.removeEventListener("fullscreenchange", handleFsChange)
  }, [])

  useEffect(() => {
    try {
      if (localStorage.getItem("waktu-display-fullscreen") !== "true") return
    } catch { return }
    if (document.fullscreenElement) return

    const restore = () => {
      document.documentElement.requestFullscreen().catch(() => {})
      cleanup()
    }
    const cleanup = () => {
      for (const ev of ["click", "keydown", "touchstart", "mousemove"] as const) {
        document.removeEventListener(ev, restore)
      }
    }
    for (const ev of ["click", "keydown", "touchstart", "mousemove"] as const) {
      document.addEventListener(ev, restore, { once: false })
    }
    return cleanup
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

  const layoutMode = getLayoutMode(viewportWidth)
  const isCompact = layoutMode === "compact"
  const padding = Math.max(4, getResponsivePadding(viewportWidth) * (layoutMode === "tv" && viewportWidth >= 1440 ? scale : 1))
  const fabBottom = isCompact ? "calc(16px + env(safe-area-inset-bottom, 0px))" : "24px"

  useEffect(() => {
    const handleResize = () => setViewportWidth(window.innerWidth)
    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // Scale based on fixed 1920x1080 design so resolution stays consistent when alert shows
  useEffect(() => {
    if (getLayoutMode(viewportWidth) === "compact") {
      setScale(1)
      return
    }

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
          const now = new Date()
          const todayDate = getLocalDateString(now)
          let todayIdx = data.prayers.findIndex((p: PrayerData) => p.date === todayDate)
          if (todayIdx < 0) {
            todayIdx = now.getDate() - 1
          }
          const prayer = data.prayers[todayIdx] || data.prayers[0]
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

    const todayDate = getLocalDateString(now)
    const todayIdx = allPrayers.findIndex((p) => p.date === todayDate)
    const dayIndex = todayIdx >= 0 ? todayIdx : now.getDate() - 1
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
              ? { type: "khutbah_countdown", minutes: 13 - minutesSincePrayer }
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

      if (isFriday && prayerKeysForAlerts[i] === "zohor" && minutesSincePrayer >= 13 && minutesSincePrayer < 43) {
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

  const closeSettings = useCallback(() => {
    setShowSettings(false)
    setShowTestAlertDropdown(false)
    setZoneSelectorOpen(false)
  }, [])

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
          padding: isCompact ? "12px" : "24px",
          marginBottom: isCompact ? "12px" : "24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: isCompact ? "8px" : "16px",
          flexShrink: 0,
          minHeight: isCompact ? "auto" : "96px",
          maxHeight: isCompact ? "none" : "120px",
        }}
      >
        <AlertTriangle
          style={{
            width: isCompact ? "clamp(24px, 6vw, 40px)" : "64px",
            height: isCompact ? "clamp(24px, 6vw, 40px)" : "64px",
            color: "#eab308",
            flexShrink: 0,
          }}
        />
        <span
          className={cn("font-medium leading-tight", displayAlertTextClass())}
          style={{
            color: "#eab308",
            textAlign: "center",
            wordBreak: "break-word",
            fontFamily: 'var(--font-geist-sans), system-ui, sans-serif',
          }}
        >
          {alertText}
        </span>
      </div>
    )
  }

  const renderSaveButton = () => (
    <button
      onClick={() => saveSettings()}
      disabled={!hasSettingsChanged}
      className={displaySettingsLabelClass()}
      style={{
        width: "100%",
        padding: "12px",
        backgroundColor: hasSettingsChanged ? "#3b82f6" : "#27272a",
        border: "none",
        borderRadius: "8px",
        color: "#ffffff",
        fontWeight: 500,
        cursor: hasSettingsChanged ? "pointer" : "not-allowed",
        opacity: hasSettingsChanged ? 1 : 0.5,
        fontFamily: 'var(--font-geist-sans), system-ui, sans-serif',
        transition: "background-color 0.15s ease, opacity 0.15s ease",
      }}
    >
      {t.save}
    </button>
  )

  const renderSettingsBody = () => (
    <div
      style={{
        display: "flex",
        flexDirection: isCompact ? "column" : (viewportWidth >= 768 ? "row" : "column"),
        gap: "24px",
        alignItems: "flex-start",
      }}
    >
      <div style={{ flex: "1 1 0%", minWidth: 0, width: isCompact ? "100%" : undefined, display: "flex", flexDirection: "column", gap: "24px" }}>
        <div>
          <div style={{ marginBottom: "16px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <h3 className={cn("font-semibold", displaySettingsSectionTitleClass())} style={{ color: "#ffffff", margin: 0 }}>{t.sectionDisplayIdentity}</h3>
            <p className={displaySettingsSectionDescClass()} style={{ color: "#71717a", margin: "4px 0 0 0", fontFamily: 'var(--font-geist-sans), system-ui, sans-serif' }}>{t.sectionDisplayIdentityDesc}</p>
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label className={displaySettingsLabelClass()} style={{ color: "#a1a1aa", display: "block", marginBottom: "8px" }}>
              {t.customTitle}
            </label>
            <input
              type="text"
              value={tempCustomTitle}
              onChange={(e) => setTempCustomTitle(e.target.value)}
              placeholder={t.customTitlePlaceholder}
              className={cn("placeholder-inter", displaySettingsLabelClass())}
              style={{
                width: "100%",
                padding: "12px",
                backgroundColor: "#27272a",
                border: "none",
                borderRadius: "8px",
                color: "#ffffff",
                outline: "none",
                boxSizing: "border-box",
                fontFamily: 'var(--font-geist-sans), system-ui, sans-serif',
              }}
            />
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label className={displaySettingsLabelClass()} style={{ color: "#a1a1aa", display: "block", marginBottom: "8px" }}>
              {t.themeColor}
            </label>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "8px",
              }}
            >
              {themeColorKeys.map((colorKey) => (
                <button
                  key={colorKey}
                  onClick={() => setTempThemeColor(colorKey)}
                  style={{
                    flex: isCompact ? "0 0 auto" : "1 1 0%",
                    aspectRatio: "1",
                    minWidth: isCompact ? "36px" : 0,
                    width: isCompact ? "36px" : undefined,
                    height: isCompact ? "36px" : undefined,
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

          <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "16px" }}>
            {[
              { label: t.showHeader, checked: tempShowHeader, onChange: setTempShowHeader },
              { label: t.showZone, checked: tempShowZone, onChange: setTempShowZone },
            ].map((item) => (
              <div
                key={item.label}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "8px 12px",
                  backgroundColor: "#27272a",
                  borderRadius: "8px",
                  gap: "12px",
                }}
              >
                <span className={displaySettingsLabelClass()} style={{ color: "#ffffff", fontFamily: 'var(--font-geist-sans), system-ui, sans-serif', flex: 1, minWidth: 0 }}>
                  {item.label}
                </span>
                <Switch checked={item.checked} onCheckedChange={item.onChange} />
              </div>
            ))}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "8px 12px",
                backgroundColor: "#27272a",
                borderRadius: "8px",
                gap: "12px",
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <span className={displaySettingsLabelClass()} style={{ color: "#ffffff", fontFamily: 'var(--font-geist-sans), system-ui, sans-serif', display: "block" }}>
                  {t.autoRefresh}
                </span>
                <span className={displaySettingsHelperClass()} style={{ color: "#71717a", fontFamily: 'var(--font-geist-sans), system-ui, sans-serif' }}>
                  {t.autoRefreshDescription}
                </span>
              </div>
              <Switch checked={tempAutoRefresh} onCheckedChange={setTempAutoRefresh} />
            </div>
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label className={displaySettingsLabelClass()} style={{ color: "#a1a1aa", display: "block", marginBottom: "8px" }}>
              {t.language}
            </label>
            <div style={{ display: "flex", gap: "8px" }}>
              {(["en", "ms"] as const).map((lang) => (
                <button
                  key={lang}
                  onClick={() => setTempLanguage(lang)}
                  className={displaySettingsLabelClass()}
                  style={{
                    flex: 1,
                    padding: "12px",
                    backgroundColor: tempLanguage === lang ? "#3b82f6" : "#27272a",
                    border: "none",
                    borderRadius: "8px",
                    color: "#ffffff",
                    fontWeight: 500,
                    cursor: "pointer",
                    fontFamily: 'var(--font-geist-sans), system-ui, sans-serif',
                  }}
                >
                  {lang === "en" ? t.english : t.bahasaMelayu}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div>
          <div style={{ marginBottom: "16px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <h3 className={cn("font-semibold", displaySettingsSectionTitleClass())} style={{ color: "#ffffff", margin: 0 }}>{t.sectionLocation}</h3>
            <p className={displaySettingsSectionDescClass()} style={{ color: "#71717a", margin: "4px 0 0 0", fontFamily: 'var(--font-geist-sans), system-ui, sans-serif' }}>{t.sectionLocationDesc}</p>
          </div>

          <div style={{ marginBottom: "12px" }}>
            <label className={displaySettingsLabelClass()} style={{ color: "#a1a1aa", display: "block", marginBottom: "8px" }}>
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
            <p className={displaySettingsHelperClass()} style={{ color: "#a1a1aa", marginTop: "8px", marginBottom: 0 }}>
              {t.zoneSource}
            </p>
            <button
              type="button"
              onClick={handleLocateMe}
              disabled={isLocating}
              className={displaySettingsLabelClass()}
              style={{
                width: "100%",
                marginTop: "12px",
                padding: "10px 16px",
                backgroundColor: "#2563eb",
                color: "#ffffff",
                fontWeight: 500,
                borderRadius: "8px",
                border: "none",
                cursor: isLocating ? "wait" : "pointer",
                opacity: isLocating ? 0.7 : 1,
                fontFamily: 'var(--font-geist-sans), system-ui, sans-serif',
              }}
            >
              {isLocating ? (language === "ms" ? "Mengesan..." : "Detecting...") : t.locateMe}
            </button>
          </div>
        </div>
      </div>

      <div style={{ flex: "1 1 0%", minWidth: 0, width: isCompact ? "100%" : undefined, display: "flex", flexDirection: "column", gap: "28px" }}>
        <div>
          <div style={{ marginBottom: "16px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <h3 className={cn("font-semibold", displaySettingsSectionTitleClass())} style={{ color: "#ffffff", margin: 0 }}>{t.sectionAlerts}</h3>
            <p className={displaySettingsSectionDescClass()} style={{ color: "#71717a", margin: "4px 0 0 0", fontFamily: 'var(--font-geist-sans), system-ui, sans-serif' }}>{t.sectionAlertsDesc}</p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <p className={displaySettingsHelperClass()} style={{ color: "#71717a", margin: 0, fontFamily: 'var(--font-geist-sans), system-ui, sans-serif', textTransform: "uppercase", letterSpacing: "0.05em" }}>{t.alertBefore}</p>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", backgroundColor: "#27272a", borderRadius: "8px", gap: "12px" }}>
              <span className={displaySettingsLabelClass()} style={{ color: "#ffffff", fontFamily: 'var(--font-geist-sans), system-ui, sans-serif', flex: 1, minWidth: 0 }}>
                {t.testAzanCountdown} ({ALERT_DURATION_MINS.azan_countdown} {t.mins})
              </span>
              <Switch
                checked={tempEnabledAlerts.azan_countdown}
                onCheckedChange={(checked) => setTempEnabledAlerts((prev) => ({ ...prev, azan_countdown: checked }))}
                disabled={isAzanPlaying}
              />
            </div>

            <p className={displaySettingsHelperClass()} style={{ color: "#71717a", margin: "4px 0 0 0", fontFamily: 'var(--font-geist-sans), system-ui, sans-serif', textTransform: "uppercase", letterSpacing: "0.05em" }}>{t.alertAt}</p>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", backgroundColor: "#27272a", borderRadius: "8px", gap: "12px" }}>
              <span className={displaySettingsLabelClass()} style={{ color: "#ffffff", fontFamily: 'var(--font-geist-sans), system-ui, sans-serif', flex: 1, minWidth: 0 }}>
                {t.testAzanNow} ({ALERT_DURATION_MINS.azan_now} {t.mins})
              </span>
              <Switch
                checked={tempEnabledAlerts.azan_now}
                onCheckedChange={(checked) => setTempEnabledAlerts((prev) => ({ ...prev, azan_now: checked }))}
                disabled={isAzanPlaying}
              />
            </div>

            <p className={displaySettingsHelperClass()} style={{ color: "#71717a", margin: "4px 0 0 0", fontFamily: 'var(--font-geist-sans), system-ui, sans-serif', textTransform: "uppercase", letterSpacing: "0.05em" }}>{t.alertAfter}</p>
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
                    gap: "12px",
                  }}
                >
                  <span className={displaySettingsLabelClass()} style={{ color: "#ffffff", fontFamily: 'var(--font-geist-sans), system-ui, sans-serif', flex: 1, minWidth: 0 }}>
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

          <div style={{ marginTop: "16px" }}>
            <label className={displaySettingsLabelClass()} style={{ color: "#a1a1aa", display: "block", marginBottom: "8px" }}>
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
                className={displaySettingsLabelClass()}
                style={{
                  width: "100%",
                  padding: "12px",
                  backgroundColor: "#27272a",
                  border: "1px solid #3f3f46",
                  borderRadius: "8px",
                  color: "#ffffff",
                  textAlign: "left",
                  cursor: isAzanPlaying ? "not-allowed" : "pointer",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  fontFamily: 'var(--font-geist-sans), system-ui, sans-serif',
                  opacity: isAzanPlaying ? 0.6 : 1,
                }}
              >
                <span style={{ fontFamily: 'var(--font-geist-sans), system-ui, sans-serif', fontWeight: 500 }}>{currentTestAlertLabel}</span>
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
                    ...(isCompact
                      ? { top: "100%", left: 0, right: 0, marginTop: "4px" }
                      : { bottom: "100%", left: 0, right: 0, marginBottom: "4px" }),
                    backgroundColor: "#27272a",
                    borderRadius: "8px",
                    border: "1px solid #3f3f46",
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
                      className={displaySettingsLabelClass()}
                      style={{
                        width: "100%",
                        padding: "12px",
                        backgroundColor: (testMode || "none") === option.value ? "#3b82f6" : "transparent",
                        border: "none",
                        color: "#ffffff",
                        textAlign: "left",
                        cursor: "pointer",
                        fontFamily: 'var(--font-geist-sans), system-ui, sans-serif',
                        fontWeight: 400,
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

        <div>
          <label className={displaySettingsLabelClass()} style={{ color: "#a1a1aa", display: "block", marginBottom: "8px" }}>
            {t.timeFormat}
          </label>
          <div style={{ display: "flex", gap: "8px" }}>
            {(["12h", "24h"] as const).map((fmt) => (
              <button
                key={fmt}
                onClick={() => setTempTimeFormat(fmt)}
                className={displaySettingsLabelClass()}
                style={{
                  flex: 1,
                  padding: "12px",
                  backgroundColor: tempTimeFormat === fmt ? "#3b82f6" : "#27272a",
                  border: "none",
                  borderRadius: "8px",
                  color: "#ffffff",
                  fontWeight: 500,
                  cursor: "pointer",
                  fontFamily: 'var(--font-geist-sans), system-ui, sans-serif',
                }}
              >
                {fmt === "12h" ? t.timeFormat12h : t.timeFormat24h}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div style={{ marginBottom: "16px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <h3 className={cn("font-semibold", displaySettingsSectionTitleClass())} style={{ color: "#ffffff", margin: 0 }}>{t.sectionAudio}</h3>
            <p className={displaySettingsSectionDescClass()} style={{ color: "#71717a", margin: "4px 0 0 0", fontFamily: 'var(--font-geist-sans), system-ui, sans-serif' }}>{t.sectionAudioDesc}</p>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", backgroundColor: "#27272a", borderRadius: "8px", marginBottom: "12px", gap: "12px" }}>
            <span className={displaySettingsLabelClass()} style={{ color: "#ffffff", fontFamily: 'var(--font-geist-sans), system-ui, sans-serif', flex: 1, minWidth: 0 }}>
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
            className={displaySettingsLabelClass()}
            style={{
              width: "100%",
              padding: "10px 16px",
              backgroundColor: isTestingAzan ? "#ef4444" : "#2563eb",
              border: "none",
              borderRadius: "8px",
              color: "#ffffff",
              fontWeight: 500,
              cursor: isAzanPlaying ? "not-allowed" : "pointer",
              fontFamily: 'var(--font-geist-sans), system-ui, sans-serif',
              transition: "background-color 0.15s ease",
              opacity: isAzanPlaying ? 0.6 : 1,
            }}
          >
            {isTestingAzan ? t.stopAzan : t.playAzan}
          </button>
        </div>
      </div>
    </div>
  )

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
            padding: isCompact ? "12px 16px" : "12px 24px",
            display: "flex",
            flexDirection: isCompact ? "column" : "row",
            alignItems: "center",
            justifyContent: "center",
            gap: isCompact ? "10px" : "16px",
          }}
        >
          <span
            className={displaySettingsLabelClass()}
            style={{
              color: "#ffffff",
              fontFamily: 'var(--font-geist-sans), system-ui, sans-serif',
              textAlign: isCompact ? "center" : "left",
            }}
          >
            {t.azanBannerText}
          </span>
          <div className="flex shrink-0 flex-row items-center gap-2">
            <Button
              size="sm"
              onClick={() => {
                setShowAzanBanner(false)
                try { localStorage.setItem("waktu-display-azan-banner-dismissed", "true") } catch {}
                openSettings()
              }}
            >
              {t.openDisplaySettings}
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setShowAzanBanner(false)
                try { localStorage.setItem("waktu-display-azan-banner-dismissed", "true") } catch {}
              }}
            >
              {t.dismiss}
            </Button>
          </div>
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
            ...(isCompact
              ? {
                  width: "100%",
                  height: "100%",
                  minHeight: 0,
                  transform: "none",
                }
              : {
                  width: "1920px",
                  height: "1080px",
                  minHeight: "1080px",
                  transform: `scale(${scale})`,
                  transformOrigin: "center center",
                }),
            backgroundColor: "#18181b",
            padding: 0,
            display: "flex",
            flexDirection: "column",
            boxSizing: "border-box",
            fontFamily: 'var(--font-geist-sans), system-ui, sans-serif',
            overflow: isCompact ? "hidden" : undefined,
          }}
        >
      {showHeader && (
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: isCompact ? "12px" : "24px",
            flexShrink: 0,
            gap: isCompact ? "12px" : undefined,
            width: "100%",
          }}
        >
          <div style={{ textAlign: "left", display: "flex", flexDirection: "column", gap: isCompact ? "4px" : "8px", minWidth: 0, flex: 1 }}>
            <p className={cn("metric-number text-white leading-tight", displayHeaderDateClass())} suppressHydrationWarning>
              {formatGregorianDate(language)}
            </p>
            <p className={cn("metric-number text-white leading-tight", displayHeaderDateClass())} suppressHydrationWarning>
              {hijriDate}
            </p>
          </div>
          <div style={{ textAlign: "right", minWidth: 0, flexShrink: 0 }}>
            <h1 className={cn("font-bold leading-tight", displayHeaderTitleClass())} style={{ color: themeColorMap[themeColor].primary }}>
              {customTitle || "Waktu+"}
            </h1>
            <p className={cn("metric-number text-white leading-tight", displayHeaderTitleClass())} suppressHydrationWarning>
              {formatTimeDisplay(currentTime, timeFormat)}
            </p>
          </div>
        </div>
      )}

      {renderAlert()}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: isCompact ? "repeat(2, 1fr)" : "repeat(3, 1fr)",
          gap: isCompact ? (hasAlert ? "8px" : "12px") : (hasAlert ? "24px" : "32px"),
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

          const showCountdown = isNext && (
            !isWithin15Mins ||
            alertState.type === "iqamah" ||
            alertState.type === "khutbah_countdown" ||
            (alertState.type === "sunrise_countdown" && !isSyuruk)
          )

          const iconSize = isCompact
            ? (hasAlert ? "clamp(24px, 5vw, 36px)" : "clamp(28px, 6vw, 44px)")
            : (hasAlert ? 64 : 80)

          return (
            <div
              key={key}
              style={{
                backgroundColor: isNext ? undefined : "transparent",
                background: isNext ? `linear-gradient(135deg, ${themeColorMap[themeColor].primary} 0%, ${themeColorMap[themeColor].gradient} 100%)` : undefined,
                borderRadius: "8px",
                padding: isCompact ? (hasAlert ? "8px" : "10px") : (hasAlert ? "12px" : "16px"),
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                minHeight: isCompact ? (hasAlert ? "100px" : "120px") : (hasAlert ? "160px" : "200px"),
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: isCompact ? "6px" : (hasAlert ? "8px" : "12px"), marginBottom: "4px", lineHeight: 1.2 }}>
                <Icon style={{ width: iconSize, height: iconSize, color: "#ffffff", flexShrink: 0 }} />
                <span className={cn("font-semibold text-white leading-tight", displayPrayerNameClass(hasAlert))}>
                  {prayerName}
                </span>
              </div>
              <span className={cn("metric-number text-white leading-tight", displayPrayerTimeClass(hasAlert))}>
                {formatPrayerTime(prayerTimes[index], timeFormat)}
              </span>
              <div
                style={{
                  marginTop: isCompact ? "2px" : (hasAlert ? "4px" : "8px"),
                  padding: isCompact ? "4px 8px" : (hasAlert ? "8px 16px" : "12px 24px"),
                  width: "fit-content",
                  maxWidth: "100%",
                  boxSizing: "border-box",
                  height: "fit-content",
                  visibility: showCountdown ? "visible" : "hidden",
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "4px",
                  marginLeft: "auto",
                  marginRight: "auto",
                }}
              >
                <span
                  className={cn("font-semibold leading-none", displayCountdownClass(hasAlert))}
                  style={{
                    color: "rgba(255,255,255,0.9)",
                    whiteSpace: isCompact ? "normal" : "nowrap",
                    flexShrink: 0,
                    fontFamily: 'var(--font-geist-sans), system-ui, sans-serif',
                  }}
                >
                  {isSyuruk ? t.sunriseIn : t.begins}
                </span>
                <span
                  className={cn("metric-number leading-none", displayCountdownClass(hasAlert))}
                  style={{
                    color: "rgba(255,255,255,0.9)",
                    whiteSpace: isCompact ? "normal" : "nowrap",
                    textAlign: "center",
                    flexShrink: 0,
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
          className={cn("font-medium", displayFooterClass(hasAlert))}
          style={{
            textAlign: "center",
            marginTop: "auto",
            paddingTop: isCompact ? (hasAlert ? "8px" : "12px") : (hasAlert ? "16px" : "24px"),
            flexShrink: 0,
            color: "rgba(255,255,255,0.7)",
            display: "flex",
            flexDirection: "column",
            gap: isCompact ? "4px" : "8px",
          }}
        >
          {showZone && zoneInfo && (
            <p style={{ margin: 0 }}>
              <span style={{ fontWeight: 600, color: "#ffffff" }}>{t.zone}: {zoneInfo.name}</span>
            </p>
          )}
          {!showHeader && (
            <p style={{ margin: 0, fontWeight: 600, color: "#ffffff", display: "flex", flexWrap: "wrap", justifyContent: "center", gap: isCompact ? "4px 8px" : undefined }}>
              <span style={{ fontWeight: 600 }} suppressHydrationWarning>{formatGregorianDate(language)}</span>
              {!isCompact && <span style={{ fontWeight: 600 }}> · </span>}
              <span style={{ fontWeight: 600 }} suppressHydrationWarning>{hijriDate}</span>
              {!isCompact && <span style={{ fontWeight: 600 }}> · </span>}
              <span className="metric-number" style={{ display: "inline-block", minWidth: isCompact ? undefined : (timeFormat === "12h" ? "7.5em" : "5.5em"), textAlign: isCompact ? "center" : "left" }} suppressHydrationWarning>
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
            bottom: fabBottom,
            right: isCompact ? "64px" : "80px",
            backgroundColor: "#27272a",
            border: "none",
            borderRadius: "8px",
            padding: isCompact ? "10px" : "12px",
            cursor: "pointer",
            opacity: settingsVisible ? 1 : 0,
            transition: "opacity 0.3s ease",
            pointerEvents: settingsVisible ? "auto" : "none",
            zIndex: 1000,
          }}
        >
          {isFullscreen
            ? <Shrink style={{ width: isCompact ? "20px" : "24px", height: isCompact ? "20px" : "24px", color: "#ffffff" }} />
            : <Expand style={{ width: isCompact ? "20px" : "24px", height: isCompact ? "20px" : "24px", color: "#ffffff" }} />}
        </button>
      )}
      <button
        onClick={openSettings}
        title={t.settings}
        style={{
          position: "fixed",
          bottom: fabBottom,
          right: isCompact ? "16px" : "24px",
          backgroundColor: "#27272a",
          border: "none",
          borderRadius: "8px",
          padding: isCompact ? "10px" : "12px",
          cursor: "pointer",
          opacity: settingsVisible ? 1 : 0,
          transition: "opacity 0.3s ease",
          pointerEvents: settingsVisible ? "auto" : "none",
          zIndex: 1000,
        }}
      >
        <Settings style={{ width: isCompact ? "20px" : "24px", height: isCompact ? "20px" : "24px", color: "#ffffff" }} />
      </button>

      {showSettings && !isCompact && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            boxSizing: "border-box",
          }}
          onClick={closeSettings}
        >
          <div
            className="scrollbar-hide"
            style={{
              backgroundColor: "#18181b",
              borderRadius: "8px",
              padding: "24px",
              width: "100%",
              maxWidth: "900px",
              maxHeight: "90vh",
              overflowY: "auto",
              position: "relative",
              fontFamily: 'var(--font-geist-sans), system-ui, sans-serif',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className={cn("font-semibold", displaySettingsTitleClass())} style={{ color: "#ffffff", marginBottom: "24px" }}>{t.settings}</h2>
            <div style={{ marginBottom: "24px" }}>{renderSettingsBody()}</div>
            {renderSaveButton()}
          </div>
        </div>
      )}

      <Drawer
        open={showSettings && isCompact}
        onOpenChange={(open) => {
          if (!open) closeSettings()
        }}
      >
        <DrawerContent
          className="flex max-h-[92vh] flex-col border-zinc-800 bg-[#18181b] text-white"
          style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
        >
          <DrawerHeader className="sticky top-0 z-10 shrink-0 border-b border-zinc-800 bg-[#18181b] px-4 pb-3 pt-2 text-left">
            <div className="flex items-center justify-between gap-3">
              <DrawerTitle className="text-lg font-semibold text-white">{t.settings}</DrawerTitle>
              <button
                type="button"
                onClick={closeSettings}
                aria-label={t.dismiss}
                style={{
                  backgroundColor: "#27272a",
                  border: "none",
                  borderRadius: "8px",
                  padding: "8px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <X style={{ width: "18px", height: "18px", color: "#ffffff" }} />
              </button>
            </div>
          </DrawerHeader>
          <div className="scrollbar-hide flex-1 overflow-y-auto px-4 py-4">
            {renderSettingsBody()}
          </div>
          <DrawerFooter className="sticky bottom-0 shrink-0 border-t border-zinc-800 bg-[#18181b] px-4 pt-3">
            {renderSaveButton()}
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

    </div>
  )
}
