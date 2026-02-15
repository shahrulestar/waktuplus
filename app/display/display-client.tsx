"use client"

import { useEffect, useState, useCallback } from "react"
import { Moon, Sun, Sunrise, SunDim, Sunset, CloudSun, Settings, AlertTriangle, ChevronDown } from "lucide-react"
import { useAppStore } from "@/lib/store"
import { prayerZones } from "@/lib/prayer-zones"
import { ZoneSelector } from "@/components/zone-selector"
import { translations } from "@/lib/translations"
import { formatSmartCountdown } from "@/lib/countdown-utils"
import { getCachedData } from "@/lib/api-cache"

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
  | { type: "azan_now"; prayerName: string }
  | { type: "iqamah"; minutes: number }
  | { type: "khutbah_countdown"; minutes: number }
  | { type: "khutbah_quiet" }

type TestAlertType = "none" | "azan_countdown" | "azan_now" | "iqamah" | "khutbah_countdown" | "khutbah_quiet"

type ThemeColor = "blue" | "indigo" | "pink" | "rose" | "emerald" | "yellow"

const themeColorMap: Record<ThemeColor, { primary: string; gradient: string; label: string }> = {
  blue: { primary: "#3b82f6", gradient: "#2563eb", label: "Blue" },
  indigo: { primary: "#6366f1", gradient: "#4f46e5", label: "Indigo" },
  pink: { primary: "#ec4899", gradient: "#db2777", label: "Pink" },
  rose: { primary: "#f43f5e", gradient: "#e11d48", label: "Rose" },
  emerald: { primary: "#10b981", gradient: "#059669", label: "Emerald" },
  yellow: { primary: "#eab308", gradient: "#ca8a04", label: "Yellow" },
}

const themeColorKeys: ThemeColor[] = ["blue", "indigo", "pink", "rose", "emerald", "yellow"]

const prayerIcons = {
  subuh: Moon,
  syuruk: Sunrise,
  zohor: Sun,
  asar: CloudSun,
  maghrib: Sunset,
  isyak: SunDim,
}

function formatHijriDate(hijriStr: string | undefined, language: "en" | "ms"): string {
  if (!hijriStr) return ""

  const parts = hijriStr.split("-")
  if (parts.length !== 3) return hijriStr

  const year = parts[0]
  const month = Number.parseInt(parts[1], 10)
  const day = Number.parseInt(parts[2], 10)

  const monthNamesMs = [
    "Muharam",
    "Safar",
    "Rabiul Awal",
    "Rabiul Akhir",
    "Jamadil Awal",
    "Jamadil Akhir",
    "Rejab",
    "Syaaban",
    "Ramadan",
    "Syawal",
    "Zulkaedah",
    "Zulhijjah",
  ]

  const monthNamesEn = [
    "Muharram",
    "Safar",
    "Rabi' al-Awwal",
    "Rabi' al-Akhir",
    "Jumada al-Ula",
    "Jumada al-Akhirah",
    "Rajab",
    "Sha'ban",
    "Ramadan",
    "Shawwal",
    "Dhul-Qa'dah",
    "Dhul-Hijjah",
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
    month: "long",
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
  const [showTestAlertDropdown, setShowTestAlertDropdown] = useState(false)
  const [hijriDate, setHijriDate] = useState<string>("")
  const [iqamahForPrayer, setIqamahForPrayer] = useState<string | null>(null)
  const [themeColor, setThemeColor] = useState<ThemeColor>("blue")
  const [tempThemeColor, setTempThemeColor] = useState<ThemeColor>("blue")

  useEffect(() => {
    try {
      const stored = localStorage.getItem("waktu-display-theme")
      if (stored && stored in themeColorMap) {
        setThemeColor(stored as ThemeColor)
      }
    } catch (e) {
      console.error("Failed to read theme color:", e)
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
      if (Date.now() - lastMouseMove > 60000) {
        setSettingsVisible(false)
      }
    }, 1000)

    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("touchstart", handleMouseMove)
      clearInterval(hideTimer)
    }
  }, [lastMouseMove, handleMouseMove])

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
          const dayIndex = new Date().getDate() - 1
          const prayer = data.prayers[dayIndex] || data.prayers[0]
          if (prayer) {
            setTodayPrayer(prayer)
            if (prayer.hijri) {
              setHijriDate(formatHijriDate(prayer.hijri, language))
            }
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

  useEffect(() => {
    if (todayPrayer?.hijri) {
      setHijriDate(formatHijriDate(todayPrayer.hijri, language))
    }
  }, [language, todayPrayer?.hijri])

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const countdownLabels = {
    days: t.days,
    hours: t.hours,
    minutes: t.minutes,
    seconds: t.seconds,
  }

  useEffect(() => {
    if (testMode && testMode !== "none") {
      switch (testMode) {
        case "azan_countdown":
          setAlertState({ type: "azan_countdown", prayerName: t.zohor, minutes: 10 })
          break
        case "azan_now":
          setAlertState({ type: "azan_now", prayerName: t.zohor })
          break
        case "iqamah":
          setAlertState({ type: "iqamah", minutes: 5 })
          break
        case "khutbah_countdown":
          setAlertState({ type: "khutbah_countdown", minutes: 12 })
          break
        case "khutbah_quiet":
          setAlertState({ type: "khutbah_quiet" })
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
        setAlertState({ type: "azan_countdown", prayerName, minutes: minutesUntilPrayer })
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

      if (minutesSincePrayer >= 0 && minutesSincePrayer < 3) {
        setNextPrayerKey(prayerKeysForAlerts[i])
        setCountdown(t.azanNow)
        const prayerName = getPrayerName(
          prayerKeysForAlerts[i],
          language,
          isFriday && prayerKeysForAlerts[i] === "zohor",
        )
        setAlertState({ type: "azan_now", prayerName })
        setIqamahForPrayer(prayerKeysForAlerts[i])
        return
      }

      if (minutesSincePrayer >= 3 && minutesSincePrayer < 11) {
        const iqamahRemaining = 11 - minutesSincePrayer

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
          setAlertState({ type: "khutbah_countdown", minutes: 15 - (minutesSincePrayer - 3) })
          return
        }

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
        setAlertState({ type: "iqamah", minutes: iqamahRemaining })
        setIqamahForPrayer(null)
        return
      }

      if (isFriday && prayerKeysForAlerts[i] === "zohor" && minutesSincePrayer >= 11 && minutesSincePrayer < 41) {
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
        setAlertState({ type: "khutbah_quiet" })
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
  }, [todayPrayer, currentTime, t, language, isFriday, testMode])

  const openSettings = () => {
    setTempCustomTitle(customTitle)
    setTempZone(selectedZone)
    setTempLanguage(language)
    setTempShowZone(showZone)
    setTempThemeColor(themeColor)
    setShowSettings(true)
  }

  const saveSettings = () => {
    setCustomTitle(tempCustomTitle)
    setSelectedZone(tempZone)
    setLanguage(tempLanguage)
    setShowZone(tempShowZone)
    setThemeColor(tempThemeColor)
    try {
      localStorage.setItem("waktu-display-theme", tempThemeColor)
    } catch (e) {
      console.error("Failed to save theme color:", e)
    }
    setShowSettings(false)
    setShowTestAlertDropdown(false)
  }

  const prayerKeys = ["subuh", "syuruk", "zohor", "asar", "maghrib", "isyak"]
  const prayerTimes = todayPrayer
    ? [todayPrayer.fajr, todayPrayer.syuruk, todayPrayer.dhuhr, todayPrayer.asr, todayPrayer.maghrib, todayPrayer.isha]
    : ["--:--", "--:--", "--:--", "--:--", "--:--", "--:--"]

  const isWithin15Mins = alertState.type === "azan_countdown" || alertState.type === "azan_now"

  const testAlertOptions: { value: TestAlertType; label: string }[] = [
    { value: "none", label: t.resetAlert },
    { value: "azan_countdown", label: t.testAzanCountdown },
    { value: "azan_now", label: t.testAzanNow },
    { value: "iqamah", label: t.testIqamah },
    { value: "khutbah_countdown", label: t.testKhutbah },
    { value: "khutbah_quiet", label: t.pleaseQuiet.substring(0, 20) + "..." },
  ]

  const currentTestAlertLabel =
    testAlertOptions.find((opt) => opt.value === (testMode || "none"))?.label || t.resetAlert

  const getCountdownText = () => {
    if (nextPrayerKey === "syuruk") {
      return `${t.sunriseIn} ${countdown}`
    }
    return `${t.nextPrayer} • ${countdown}`
  }

  const renderAlert = () => {
    if (alertState.type === "none") return null

    let alertText = ""
    switch (alertState.type) {
      case "azan_countdown":
        alertText = `${t.azanIn} ${alertState.prayerName} ${t.inMinutes} ${alertState.minutes} ${t.mins}`
        break
      case "azan_now":
        alertText = `${t.azanNow} - ${alertState.prayerName}`
        break
      case "iqamah":
        alertText = `${t.iqamahIn} ${alertState.minutes} ${t.mins}`
        break
      case "khutbah_countdown":
        alertText = `${t.khutbahStartsIn} ${alertState.minutes} ${t.mins}`
        break
      case "khutbah_quiet":
        alertText = t.pleaseQuiet
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
        }}
      >
        <AlertTriangle style={{ width: "64px", height: "64px", color: "#eab308", flexShrink: 0 }} />
        <span style={{ fontSize: "64px", fontWeight: 500, color: "#eab308", textAlign: "center" }}>{alertText}</span>
      </div>
    )
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#18181b",
        padding: "24px",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "24px",
        }}
      >
        <div style={{ textAlign: "left" }}>
          <p style={{ fontSize: "64px", color: "#ffffff", fontWeight: 600 }}>{formatGregorianDate(language)}</p>
          <p style={{ fontSize: "64px", color: "#ffffff", fontWeight: 600 }}>{hijriDate}</p>
        </div>
        <div style={{ textAlign: "right" }}>
          <h1 style={{ fontSize: "96px", fontWeight: 700, color: themeColorMap[themeColor].primary, fontFamily: '"Satoshi", system-ui, sans-serif' }}>
            {customTitle || "Waktu+"}
          </h1>
          <p style={{ fontSize: "96px", fontWeight: 600, color: "#ffffff" }}>
            {currentTime.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
          </p>
        </div>
      </div>

      {renderAlert()}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "32px",
          flex: 1,
        }}
      >
        {prayerKeys.map((key, index) => {
          const Icon = prayerIcons[key as keyof typeof prayerIcons]
          const isNext = key === nextPrayerKey
          const prayerName = getPrayerName(key, language, isFriday && key === "zohor")
          const isSyuruk = key === "syuruk"

          return (
            <div
              key={key}
              style={{
                backgroundColor: isNext ? undefined : "transparent",
                background: isNext ? `linear-gradient(135deg, ${themeColorMap[themeColor].primary} 0%, ${themeColorMap[themeColor].gradient} 100%)` : undefined,
                borderRadius: "8px",
                padding: "16px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                minHeight: "200px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "4px", lineHeight: 1.2 }}>
                <Icon style={{ width: "80px", height: "80px", color: "#ffffff" }} />
                <span style={{ fontSize: "120px", fontWeight: 600, color: "#ffffff", lineHeight: 1.2 }}>
                  {prayerName}
                </span>
              </div>
              <span style={{ fontSize: "118px", fontWeight: 600, color: "#ffffff", lineHeight: 1.2 }}>
                {prayerTimes[index]}
              </span>
              {isNext &&
                !isWithin15Mins &&
                alertState.type !== "iqamah" &&
                alertState.type !== "khutbah_countdown" &&
                alertState.type !== "khutbah_quiet" && (
                  <div style={{ marginTop: "8px", textAlign: "center" }}>
                    <span style={{ fontSize: "28px", fontWeight: 500, color: "rgba(255,255,255,0.9)" }}>
                      {isSyuruk ? `${t.sunriseIn} ${countdown}` : `${t.nextPrayer} • ${countdown}`}
                    </span>
                  </div>
                )}
              {isNext &&
                (alertState.type === "iqamah" ||
                  alertState.type === "khutbah_countdown" ||
                  alertState.type === "khutbah_quiet") && (
                  <div style={{ marginTop: "8px", textAlign: "center" }}>
                    <span style={{ fontSize: "28px", fontWeight: 500, color: "rgba(255,255,255,0.9)" }}>
                      {isSyuruk ? `${t.sunriseIn} ${countdown}` : `${t.nextPrayer} • ${countdown}`}
                    </span>
                  </div>
                )}
            </div>
          )
        })}
      </div>

      {showZone && zoneInfo && (
        <p
          style={{
            textAlign: "center",
            marginTop: "24px",
            fontSize: "24px",
            fontWeight: 500,
            color: "rgba(255,255,255,0.7)",
          }}
        >
          {t.zone}: {zoneInfo.name}
        </p>
      )}

      <button
        onClick={openSettings}
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
            backgroundColor: "rgba(0,0,0,0.8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
          }}
          onClick={() => {
    setShowSettings(false)
            setShowTestAlertDropdown(false)
          }}
        >
          <div
            style={{
              backgroundColor: "#18181b",
              borderRadius: "8px",
              padding: "24px",
              width: "100%",
              maxWidth: "400px",
              maxHeight: "80vh",
              overflowY: "auto",
              position: "relative",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: "24px", fontWeight: 600, color: "#ffffff", marginBottom: "24px", fontFamily: '"Satoshi", system-ui, sans-serif' }}>{t.settings}</h2>

            <div style={{ marginBottom: "16px" }}>
              <label style={{ fontSize: "14px", color: "#a1a1aa", display: "block", marginBottom: "8px" }}>
                {t.customTitle}
              </label>
              <input
                type="text"
                value={tempCustomTitle}
                onChange={(e) => setTempCustomTitle(e.target.value)}
                placeholder={t.customTitlePlaceholder}
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
                }}
              />
            </div>

            <div style={{ marginBottom: "16px" }}>
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

            <div style={{ marginBottom: "16px" }}>
              <label style={{ fontSize: "14px", color: "#a1a1aa", display: "block", marginBottom: "8px" }}>
                {t.prayerZone}
              </label>
              <ZoneSelector value={tempZone} onChange={setTempZone} />
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label style={{ fontSize: "14px", color: "#a1a1aa", display: "block", marginBottom: "8px" }}>
                {t.showZone}
              </label>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  onClick={() => setTempShowZone(true)}
                  style={{
                    flex: 1,
                    padding: "12px",
                    backgroundColor: tempShowZone ? "#3b82f6" : "#27272a",
                    border: "none",
                    borderRadius: "8px",
                    color: "#ffffff",
                    fontSize: "14px",
                    fontWeight: 500,
                    cursor: "pointer",
                  }}
                >
                  {t.on}
                </button>
                <button
                  onClick={() => setTempShowZone(false)}
                  style={{
                    flex: 1,
                    padding: "12px",
                    backgroundColor: !tempShowZone ? "#3b82f6" : "#27272a",
                    border: "none",
                    borderRadius: "8px",
                    color: "#ffffff",
                    fontSize: "14px",
                    fontWeight: 500,
                    cursor: "pointer",
                  }}
                >
                  {t.off}
                </button>
              </div>
            </div>

            <div style={{ marginBottom: "24px" }}>
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
                  }}
                >
                  {t.bahasaMelayu}
                </button>
              </div>
            </div>

            <div style={{ marginBottom: "24px" }}>
              <label style={{ fontSize: "14px", color: "#a1a1aa", display: "block", marginBottom: "8px" }}>
                {t.testAlerts}
              </label>
              <div style={{ position: "relative" }}>
                <button
                  onClick={() => setShowTestAlertDropdown(!showTestAlertDropdown)}
                  style={{
                    width: "100%",
                    padding: "12px",
                    backgroundColor: "#27272a",
                    border: "1px solid #3f3f46",
                    borderRadius: "8px",
                    color: "#ffffff",
                    fontSize: "14px",
                    textAlign: "left",
                    cursor: "pointer",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span>{currentTestAlertLabel}</span>
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
                          setTestMode(option.value === "none" ? null : option.value)
                          setShowTestAlertDropdown(false)
                        }}
                        style={{
                          width: "100%",
                          padding: "12px",
                          backgroundColor: (testMode || "none") === option.value ? "#3b82f6" : "transparent",
                          border: "none",
                          color: "#ffffff",
                          fontSize: "14px",
                          textAlign: "left",
                          cursor: "pointer",
                        }}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={saveSettings}
              style={{
                width: "100%",
                padding: "12px",
                backgroundColor: "#3b82f6",
                border: "none",
                borderRadius: "8px",
                color: "#ffffff",
                fontSize: "14px",
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              {t.save}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
