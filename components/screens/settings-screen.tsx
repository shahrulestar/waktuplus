"use client"

import { useState } from "react"
import { useAppStore } from "@/lib/store"
import { ZoneSelector } from "@/components/zone-selector"
import { translations } from "@/lib/translations"

export function SettingsScreen() {
  const { selectedZone, setSelectedZone, language, setLanguage } = useAppStore()
  const t = translations[language]
  const [isLocating, setIsLocating] = useState(false)

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
            } else if (data.code) {
              setSelectedZone(data.code)
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

  return (
    <div style={{ padding: "16px", backgroundColor: "#18181b", minHeight: "100%" }}>
      <h1 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "24px", color: "#ffffff" }}>{t.settings}</h1>

      {/* Prayer Zone */}
      <div style={{ marginBottom: "24px" }}>
        <h2 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "12px", color: "#ffffff" }}>{t.prayerZone}</h2>
        <ZoneSelector value={selectedZone} onChange={setSelectedZone} />
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
        <h2 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "12px", color: "#ffffff" }}>{t.language}</h2>
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
        <h2 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "12px", color: "#ffffff" }}>{t.aboutApp}</h2>
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
