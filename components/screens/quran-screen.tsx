"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Search } from "lucide-react"
import type { QuranApiResponse, QuranSurah } from "@/lib/types"
import { useAppStore } from "@/lib/store"
import { translations } from "@/lib/translations"
import { getCachedData } from "@/lib/api-cache"

export function QuranScreen() {
  const [viewMode, setViewMode] = useState<"juz" | "surah">("juz")
  const [searchQuery, setSearchQuery] = useState("")
  const [surahs, setSurahs] = useState<QuranSurah[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { language, setLanguage, showTransliteration, setShowTransliteration } = useAppStore()
  const t = translations[language]

  useEffect(() => {
    const fetchQuran = async () => {
      setIsLoading(true)
      try {
        const data = await getCachedData<QuranApiResponse>(
          "quran_surahs",
          async () => {
            const res = await fetch("/api/quran?endpoint=quran/en.asad")
            if (!res.ok) throw new Error("Failed to fetch")
            return res.json()
          },
          7 * 24 * 60 * 60 * 1000, // 7 hari (data Quran jarang berubah)
        )
        setSurahs(data?.data?.surahs || [])
      } catch (error) {
        console.error("Failed to fetch Quran:", error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchQuran()
  }, [])

  const filteredSurahs = surahs.filter(
    (surah) =>
      surah.englishName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      surah.name.includes(searchQuery) ||
      surah.number.toString().includes(searchQuery),
  )

  const juzData = Array.from({ length: 30 }, (_, i) => ({ number: i + 1, name: `${t.juz} ${i + 1}` }))
  const filteredJuz = juzData.filter((juz) => juz.number.toString().includes(searchQuery))

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

  const cardStyle = {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    backgroundColor: "#27272a",
    borderRadius: "8px",
    padding: "16px",
    textDecoration: "none",
    minHeight: "72px",
    boxSizing: "border-box" as const,
    width: "100%",
    overflow: "hidden",
  }

  return (
    <div style={{ padding: "16px", backgroundColor: "#18181b", minHeight: "100%" }}>
      <h1 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "16px", color: "#ffffff", fontFamily: '"Satoshi", system-ui, sans-serif' }}>{t.alQuran}</h1>

      {/* Search */}
      <div style={{ position: "relative", marginBottom: "16px" }}>
        <Search
          style={{
            position: "absolute",
            left: "12px",
            top: "50%",
            transform: "translateY(-50%)",
            width: "16px",
            height: "16px",
            color: "#71717a",
          }}
        />
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={viewMode === "juz" ? t.searchJuz : t.searchSurah}
          style={{
            width: "100%",
            paddingLeft: "40px",
            paddingRight: "16px",
            backgroundColor: "#27272a",
            border: "none",
            color: "#ffffff",
            fontSize: "14px",
            borderRadius: "8px",
            height: "40px",
            outline: "none",
            boxSizing: "border-box",
          }}
        />
      </div>

      <p style={{ fontSize: "14px", color: "#ffffff", marginBottom: "12px" }}>{t.languageLabel}</p>

      {/* Language Toggle */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
        <button onClick={() => setLanguage("en")} style={language === "en" ? primaryButtonStyle : secondaryButtonStyle}>
          {t.english}
        </button>
        <button onClick={() => setLanguage("ms")} style={language === "ms" ? primaryButtonStyle : secondaryButtonStyle}>
          {t.bahasaMelayu}
        </button>
      </div>

      {/* Transliteration Toggle */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
        <button
          onClick={() => setShowTransliteration(!showTransliteration)}
          style={showTransliteration ? primaryButtonStyle : secondaryButtonStyle}
        >
          {t.transliteration} {showTransliteration ? t.on : t.off}
        </button>
      </div>

      {/* Juz/Surah Toggle */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
        <button
          onClick={() => setViewMode("juz")}
          style={viewMode === "juz" ? primaryButtonStyle : secondaryButtonStyle}
        >
          {t.juzView}
        </button>
        <button
          onClick={() => setViewMode("surah")}
          style={viewMode === "surah" ? primaryButtonStyle : secondaryButtonStyle}
        >
          {t.surahView}
        </button>
      </div>

      {/* List */}
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
      ) : viewMode === "juz" ? (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
          {filteredJuz.map((juz) => (
            <Link key={juz.number} href={`/quran/juz/${juz.number}`} style={cardStyle}>
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  backgroundColor: "#2563eb",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <span style={{ fontSize: "14px", fontWeight: 600, color: "#ffffff" }}>{juz.number}</span>
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <p
                  style={{
                    fontSize: "14px",
                    fontWeight: 500,
                    color: "#ffffff",
                    margin: 0,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {juz.name}
                </p>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
          {filteredSurahs.map((surah) => (
            <Link key={surah.number} href={`/quran/surah/${surah.number}`} style={cardStyle}>
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  backgroundColor: "#2563eb",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <span style={{ fontSize: "14px", fontWeight: 600, color: "#ffffff" }}>{surah.number}</span>
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <p
                  style={{
                    fontSize: "14px",
                    fontWeight: 500,
                    color: "#ffffff",
                    margin: 0,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {surah.englishName}
                </p>
                <p
                  style={{
                    fontSize: "12px",
                    color: "#71717a",
                    margin: "2px 0 0 0",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {surah.englishNameTranslation}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
