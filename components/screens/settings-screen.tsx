"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"
import { useAppStore } from "@/lib/store"
import { prayerZones, zonesByState } from "@/lib/prayer-zones"
import { translations } from "@/lib/translations"

export function SettingsScreen() {
  const { selectedZone, setSelectedZone, language, setLanguage } = useAppStore()
  const t = translations[language]
  const [showZoneDropdown, setShowZoneDropdown] = useState(false)
  const [isLocating, setIsLocating] = useState(false)

  const currentZone = prayerZones.find((z) => z.code === selectedZone)

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
            if (data.zone) {
              setSelectedZone(data.zone)
              setShowZoneDropdown(false)
            } else if (data.code) {
              setSelectedZone(data.code)
              setShowZoneDropdown(false)
            }
          } else {
            throw new Error("API error")
          }
        } catch (error) {
          console.error("Location API error:", error)
          alert(
            language === "ms"
              ? "Tidak dapat mengesan zon. Sila pilih secara manual."
              : "Unable to detect zone. Please select manually.",
          )
        } finally {
          setIsLocating(false)
        }
      },
      (error) => {
        console.error("Geolocation error:", error)
        setIsLocating(false)
        alert(
          language === "ms"
            ? "Tidak dapat mendapatkan lokasi. Sila benarkan akses lokasi."
            : "Unable to get location. Please allow location access.",
        )
      },
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }

  const secondaryButtonStyle = {
    flex: 1,
    padding: "10px 16px",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: 500,
    cursor: "pointer",
    backgroundColor: "#27272A",
    color: "#ffffff",
    border: "none",
  }

  const primaryButtonStyle = {
    flex: 1,
    padding: "10px 16px",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: 500,
    cursor: "pointer",
    backgroundColor: "#2563eb",
    color: "#ffffff",
    border: "none",
  }

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

  return (
    <div style={{ padding: "16px", backgroundColor: "#18181b", minHeight: "100%" }}>
      <h1 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "24px", color: "#ffffff", fontFamily: '"Satoshi", system-ui, sans-serif' }}>{t.settings}</h1>

      {/* Prayer Zone */}
      <div style={{ marginBottom: "24px" }}>
        <h2 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "12px", color: "#ffffff", fontFamily: '"Satoshi", system-ui, sans-serif' }}>{t.prayerZone}</h2>
        <div style={{ position: "relative" }}>
          <button
            onClick={() => setShowZoneDropdown(!showZoneDropdown)}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              backgroundColor: "#27272a",
              borderRadius: "8px",
              padding: "16px",
              border: "none",
              cursor: "pointer",
            }}
          >
            <span
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "flex-start",
                fontSize: "14px",
                color: "#ffffff",
                width: "100%",
                textAlign: "left",
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
              style={{
                position: "absolute",
                zIndex: 50,
                width: "100%",
                marginTop: "8px",
                backgroundColor: "#27272a",
                borderRadius: "8px",
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
                    {zones.map((zone) => (
                      <button
                        key={zone.code}
                        onClick={() => {
                          setSelectedZone(zone.code)
                          setShowZoneDropdown(false)
                        }}
                        style={{
                          width: "100%",
                          textAlign: "left",
                          padding: "12px",
                          fontSize: "14px",
                          color: zone.code === selectedZone ? "#3b82f6" : "#ffffff",
                          background: zone.code === selectedZone ? "#1f1f23" : "none",
                          border: "none",
                          cursor: "pointer",
                        }}
                      >
                        {zone.code}: {zone.name}
                      </button>
                    ))}
                  </div>
                )
              })}
            </div>
          )}
        </div>
        <button
          onClick={handleLocateMe}
          disabled={isLocating}
          style={{
            width: "100%",
            marginTop: "12px",
            backgroundColor: "#2563eb",
            color: "#ffffff",
            fontWeight: 500,
            fontSize: "14px",
            borderRadius: "8px",
            height: "40px",
            border: "none",
            cursor: isLocating ? "wait" : "pointer",
            opacity: isLocating ? 0.7 : 1,
          }}
        >
          {isLocating ? (language === "ms" ? "Mengesan..." : "Locating...") : t.locateMe}
        </button>
      </div>

      {/* Language */}
      <div style={{ marginBottom: "24px" }}>
        <h2 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "12px", color: "#ffffff", fontFamily: '"Satoshi", system-ui, sans-serif' }}>{t.language}</h2>
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={() => setLanguage("en")}
            style={language === "en" ? primaryButtonStyle : secondaryButtonStyle}
          >
            {t.english}
          </button>
          <button
            onClick={() => setLanguage("ms")}
            style={language === "ms" ? primaryButtonStyle : secondaryButtonStyle}
          >
            {t.bahasaMelayu}
          </button>
        </div>
      </div>

      {/* About App */}
      <div style={{ marginBottom: "24px" }}>
        <h2 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "12px", color: "#ffffff", fontFamily: '"Satoshi", system-ui, sans-serif' }}>{t.aboutApp}</h2>
        <div style={{ backgroundColor: "#27272a", borderRadius: "8px", padding: "16px" }}>
          <button
            onClick={() => window.open("https://instagram.com/waktuplus", "_blank")}
            style={{
              width: "100%",
              backgroundColor: "#2563eb",
              color: "#ffffff",
              fontWeight: 500,
              fontSize: "14px",
              borderRadius: "8px",
              height: "40px",
              border: "none",
              cursor: "pointer",
              marginBottom: "16px",
            }}
          >
            {t.followInstagram}
          </button>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <p style={{ fontSize: "14px", color: "#71717a", lineHeight: 1.6, margin: 0 }}>
              {t.aboutPrayerData}
              <br />
              {t.aboutQuranApi}{" "}
              <a href="https://alquran.cloud/" target="_blank" rel="noopener noreferrer" style={{ color: "#3b82f6" }}>
                https://alquran.cloud/
              </a>
            </p>

            <div>
              <h3 style={{ fontSize: "14px", fontWeight: 600, color: "#ffffff", marginBottom: "8px" }}>
                {t.aboutPwaTitle}
              </h3>
              <p style={{ fontSize: "14px", color: "#71717a", lineHeight: 1.6, margin: 0 }}>{t.aboutPwaContent}</p>
            </div>

            <div>
              <h3 style={{ fontSize: "14px", fontWeight: 600, color: "#ffffff", marginBottom: "8px" }}>
                {t.aboutMosqueTitle}
              </h3>
              <p style={{ fontSize: "14px", color: "#71717a", lineHeight: 1.6, margin: 0 }}>{t.aboutMosqueContent}</p>
            </div>

            <div>
              <h3 style={{ fontSize: "14px", fontWeight: 600, color: "#ffffff", marginBottom: "8px" }}>
                {t.aboutNoteTitle}
              </h3>
              <p style={{ fontSize: "14px", color: "#71717a", lineHeight: 1.6, margin: 0 }}>{t.aboutNoteContent}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
