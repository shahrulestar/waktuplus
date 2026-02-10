"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ChevronLeft, ChevronDown } from "lucide-react"
import { useAppStore } from "@/lib/store"
import { prayerZones, zonesByState } from "@/lib/prayer-zones"
import { getCachedData } from "@/lib/api-cache"
import { translations } from "@/lib/translations"
import { BottomNav } from "@/components/bottom-nav"

interface PrayerDay {
  hijri: string
  date: string
  day: string
  imsak: string
  fajr: string
  syuruk: string
  dhuhr: string
  asr: string
  maghrib: string
  isha: string
}

const months = [
  { value: 1, key: "january" },
  { value: 2, key: "february" },
  { value: 3, key: "march" },
  { value: 4, key: "april" },
  { value: 5, key: "may" },
  { value: 6, key: "june" },
  { value: 7, key: "july" },
  { value: 8, key: "august" },
  { value: 9, key: "september" },
  { value: 10, key: "october" },
  { value: 11, key: "november" },
  { value: 12, key: "december" },
] as const

const stateOrder = [
  "Johor",
  "Kedah",
  "Kelantan",
  "Melaka",
  "Negeri Sembilan",
  "Pahang",
  "Perak",
  "Perlis",
  "Pulau Pinang",
  "Sabah",
  "Sarawak",
  "Selangor",
  "Terengganu",
  "Wilayah Persekutuan",
]

export function PrayerTimesClientPage() {
  const { selectedZone, setSelectedZone, language } = useAppStore()
  const t = translations[language]

  const currentYear = new Date().getFullYear()
  const currentMonth = new Date().getMonth() + 1
  const todayDate = new Date().getDate()

  const [zone, setZone] = useState(selectedZone)
  const [month, setMonth] = useState(currentMonth)
  const [prayers, setPrayers] = useState<PrayerDay[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showZoneDropdown, setShowZoneDropdown] = useState(false)
  const [showMonthDropdown, setShowMonthDropdown] = useState(false)

  const currentZone = prayerZones.find((z) => z.code === zone)

  useEffect(() => {
    const fetchPrayers = async () => {
      setIsLoading(true)
      try {
        const cacheKey = `prayer_${zone}_${currentYear}_${month}`
        const data = await getCachedData(
          cacheKey,
          async () => {
            const res = await fetch(`/api/prayer?zone=${zone}&year=${currentYear}&month=${month}`)
            if (!res.ok) throw new Error("Failed to fetch")
            return res.json()
          },
          30 * 24 * 60 * 60 * 1000, // 30 hari untuk data bulanan
        )
        setPrayers(data.prayers || [])
      } catch (error) {
        console.error("Failed to fetch prayers:", error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchPrayers()
  }, [zone, month, currentYear])

  useEffect(() => {
    setZone(selectedZone)
  }, [selectedZone])

  const handleZoneChange = (newZone: string) => {
    setZone(newZone)
    setSelectedZone(newZone)
    setShowZoneDropdown(false)
  }

  const labelColor = "#3B82F6"

  return (
    <div
      style={{
        maxWidth: "448px",
        margin: "0 auto",
        minHeight: "100vh",
        backgroundColor: "#18181b",
        paddingBottom: "80px",
      }}
    >
      <div style={{ padding: "16px" }}>
        <Link
          href="/"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "4px",
            padding: "8px 12px",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            color: "#ffffff",
            textDecoration: "none",
            borderRadius: "8px",
            marginBottom: "16px",
          }}
        >
          <ChevronLeft style={{ width: "20px", height: "20px" }} />
          <span style={{ fontSize: "14px", fontWeight: 500 }}>{t.back}</span>
        </Link>

        <h1 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "16px", color: "#ffffff", fontFamily: '"Satoshi", system-ui, sans-serif' }}>{t.prayerTimes}</h1>

        {/* Zone Dropdown */}
        <div style={{ marginBottom: "16px" }}>
          <p style={{ fontSize: "14px", color: "#ffffff", marginBottom: "8px" }}>{t.selectZone}</p>
          <div style={{ position: "relative" }}>
            <button
              onClick={() => { setShowZoneDropdown(!showZoneDropdown); setShowMonthDropdown(false) }}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                backgroundColor: "#27272a",
                borderRadius: "8px",
                padding: "16px",
                border: "1px solid #3f3f46",
                cursor: "pointer",
              }}
            >
              <span
                style={{
                  fontSize: "14px",
                  color: "#ffffff",
                  flex: 1,
                  textAlign: "left",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {currentZone?.code} - {currentZone?.name}
              </span>
              <ChevronDown
                style={{
                  width: "20px",
                  height: "20px",
                  color: "#ffffff",
                  transform: showZoneDropdown ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "transform 0.2s",
                }}
              />
            </button>

            {showZoneDropdown && (
              <div
                className="scrollbar-hide"
                style={{
                  position: "absolute",
                  zIndex: 50,
                  width: "100%",
                  marginTop: "8px",
                  backgroundColor: "#27272a",
                  borderRadius: "8px",
                  border: "1px solid #3f3f46",
                  maxHeight: "350px",
                  overflowY: "auto",
                }}
              >
                {stateOrder.map((state) => {
                  const zones = zonesByState[state]
                  if (!zones || zones.length === 0) return null
                  return (
                    <div key={state}>
                      <div
                        style={{
                          padding: "12px",
                          fontSize: "12px",
                          fontWeight: 600,
                          color: "#3b82f6",
                          backgroundColor: "#1f1f23",
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                        }}
                      >
                        {state}
                      </div>
                      {zones.map((z) => (
                        <button
                          key={z.code}
                          onClick={() => handleZoneChange(z.code)}
                          style={{
                            width: "100%",
                            textAlign: "left",
                            padding: "12px",
                            fontSize: "14px",
                            color: z.code === zone ? "#3b82f6" : "#ffffff",
                            background: z.code === zone ? "#1f1f23" : "none",
                            border: "none",
                            cursor: "pointer",
                          }}
                        >
                          {z.code}: {z.name}
                        </button>
                      ))}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Month Dropdown */}
        <div style={{ marginBottom: "16px" }}>
          <p style={{ fontSize: "14px", color: "#ffffff", marginBottom: "8px" }}>{t.selectMonth}</p>
          <div style={{ position: "relative" }}>
            <button
              onClick={() => { setShowMonthDropdown(!showMonthDropdown); setShowZoneDropdown(false) }}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                backgroundColor: "#27272a",
                borderRadius: "8px",
                padding: "16px",
                border: "1px solid #3f3f46",
                cursor: "pointer",
              }}
            >
              <span style={{ fontSize: "14px", color: "#ffffff" }}>
                {t[months.find((m) => m.value === month)?.key || "january"]} {currentYear}
              </span>
              <ChevronDown
                style={{
                  width: "20px",
                  height: "20px",
                  color: "#ffffff",
                  transform: showMonthDropdown ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "transform 0.2s",
                }}
              />
            </button>

            {showMonthDropdown && (
              <div
                className="scrollbar-hide"
                style={{
                  position: "absolute",
                  zIndex: 50,
                  width: "100%",
                  marginTop: "8px",
                  backgroundColor: "#27272a",
                  borderRadius: "8px",
                  border: "1px solid #3f3f46",
                  maxHeight: "350px",
                  overflowY: "auto",
                }}
              >
                {months.map((m) => (
                  <button
                    key={m.value}
                    onClick={() => {
                      setMonth(m.value)
                      setShowMonthDropdown(false)
                    }}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      padding: "12px",
                      fontSize: "14px",
                      color: m.value === month ? "#3b82f6" : "#ffffff",
                      background: m.value === month ? "#1f1f23" : "none",
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    {t[m.key]} {currentYear}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Prayer Times Table */}
        <div style={{ backgroundColor: "#27272a", borderRadius: "8px", padding: "16px", overflowX: "auto" }}>
          {isLoading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "32px 0" }}>
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  border: "2px solid transparent",
                  borderBottomColor: "#2563eb",
                  borderRadius: "50%",
                  animation: "spin 1s linear infinite",
                }}
              />
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, fontSize: "12px" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #3f3f46" }}>
                  <th style={{ padding: "8px 4px", textAlign: "left", color: labelColor, fontWeight: 500 }}>
                    {t.date}
                  </th>
                  <th style={{ padding: "8px 4px", textAlign: "center", color: labelColor, fontWeight: 500 }}>
                    {t.imsak}
                  </th>
                  <th style={{ padding: "8px 4px", textAlign: "center", color: labelColor, fontWeight: 500 }}>
                    {t.subuh}
                  </th>
                  <th style={{ padding: "8px 4px", textAlign: "center", color: labelColor, fontWeight: 500 }}>
                    {t.syuruk}
                  </th>
                  <th style={{ padding: "8px 4px", textAlign: "center", color: labelColor, fontWeight: 500 }}>
                    {t.zohor}
                  </th>
                  <th style={{ padding: "8px 4px", textAlign: "center", color: labelColor, fontWeight: 500 }}>
                    {t.asar}
                  </th>
                  <th style={{ padding: "8px 4px", textAlign: "center", color: labelColor, fontWeight: 500 }}>
                    {t.maghrib}
                  </th>
                  <th style={{ padding: "8px 4px", textAlign: "center", color: labelColor, fontWeight: 500 }}>
                    {t.isyak}
                  </th>
                </tr>
              </thead>
              <tbody>
                {prayers.map((prayer, index) => {
                  const isToday = month === currentMonth && index + 1 === todayDate
                  return (
                    <tr
                      key={index}
                      style={{
                        borderBottom: "1px solid #3f3f46",
                        backgroundColor: isToday ? "#2563eb" : "transparent",
                      }}
                    >
                      <td
                        style={{
                          padding: "8px 4px",
                          color: "#ffffff",
                          fontWeight: isToday ? 600 : 400,
                          ...(isToday && { borderRadius: "4px 0 0 4px" }),
                        }}
                      >
                        {prayer.day}
                      </td>
                      <td style={{ padding: "8px 4px", textAlign: "center", color: "#ffffff" }}>{prayer.imsak}</td>
                      <td style={{ padding: "8px 4px", textAlign: "center", color: "#ffffff" }}>{prayer.fajr}</td>
                      <td style={{ padding: "8px 4px", textAlign: "center", color: "#ffffff" }}>{prayer.syuruk}</td>
                      <td style={{ padding: "8px 4px", textAlign: "center", color: "#ffffff" }}>{prayer.dhuhr}</td>
                      <td style={{ padding: "8px 4px", textAlign: "center", color: "#ffffff" }}>{prayer.asr}</td>
                      <td style={{ padding: "8px 4px", textAlign: "center", color: "#ffffff" }}>{prayer.maghrib}</td>
                      <td
                        style={{
                          padding: "8px 4px",
                          textAlign: "center",
                          color: "#ffffff",
                          ...(isToday && { borderRadius: "0 4px 4px 0" }),
                        }}
                      >
                        {prayer.isha}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
      <BottomNav activeScreen="menu" />
    </div>
  )
}
