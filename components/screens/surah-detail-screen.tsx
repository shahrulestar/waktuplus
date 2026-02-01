"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { useAppStore } from "@/lib/store"
import { translations } from "@/lib/translations"
import { getCachedData } from "@/lib/api-cache"

interface SurahDetailScreenProps {
  surahNumber: number
}

interface AyahData {
  number: number
  text: string
  numberInSurah: number
  sajda: boolean
}

interface SurahData {
  number: number
  name: string
  englishName: string
  englishNameTranslation: string
  numberOfAyahs: number
  revelationType: string
  ayahs: AyahData[]
}

export function SurahDetailScreen({ surahNumber }: SurahDetailScreenProps) {
  const { language, showTransliteration } = useAppStore()
  const t = translations[language]
  const [surah, setSurah] = useState<SurahData | null>(null)
  const [translation, setTranslation] = useState<{ number: number; text: string; numberInSurah: number }[]>([])
  const [transliteration, setTransliteration] = useState<{ number: number; text: string; numberInSurah: number }[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const topRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetchSurah = async () => {
      setIsLoading(true)
      try {
        const translationEdition = language === "ms" ? "ms.basmeih" : "en.asad"

        const [arabicData, translationData, translitData] = await Promise.all([
          getCachedData(
            `surah_arabic_${surahNumber}`,
            async () => {
              const res = await fetch(`/api/quran?endpoint=surah/${surahNumber}`)
              if (!res.ok) throw new Error("Failed to fetch")
              return res.json()
            },
            7 * 24 * 60 * 60 * 1000,
          ),
          getCachedData(
            `surah_${surahNumber}_${translationEdition}`,
            async () => {
              const res = await fetch(`/api/quran?endpoint=surah/${surahNumber}/${translationEdition}`)
              if (!res.ok) throw new Error("Failed to fetch")
              return res.json()
            },
            7 * 24 * 60 * 60 * 1000,
          ),
          getCachedData(
            `surah_${surahNumber}_transliteration`,
            async () => {
              const res = await fetch(`/api/quran?endpoint=surah/${surahNumber}/en.transliteration`)
              if (!res.ok) throw new Error("Failed to fetch")
              return res.json()
            },
            7 * 24 * 60 * 60 * 1000,
          ),
        ])

        setSurah(arabicData?.data)
        setTranslation(translationData?.data?.ayahs || [])
        setTransliteration(translitData?.data?.ayahs || [])
      } catch (error) {
        console.error("Failed to fetch surah:", error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchSurah()
    setPage(1)
  }, [surahNumber, language])

  const itemsPerPage = 10
  const totalPages = surah ? Math.max(1, Math.ceil(surah.numberOfAyahs / itemsPerPage)) : 1

  const startIndex = (page - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentAyahs = surah?.ayahs.slice(startIndex, endIndex) || []

  const handleNext = () => {
    if (page < totalPages) {
      setPage(page + 1)
      topRef.current?.scrollIntoView({ behavior: "instant" })
    }
  }

  const handlePrev = () => {
    if (page > 1) {
      setPage(page - 1)
      topRef.current?.scrollIntoView({ behavior: "instant" })
    }
  }

  if (isLoading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          backgroundColor: "#18181b",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
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
    )
  }

  return (
    <div ref={topRef} style={{ minHeight: "100vh", backgroundColor: "#18181b" }}>
      <div style={{ padding: "16px" }}>
        <Link
          href="/quran"
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
          }}
        >
          <ChevronLeft style={{ width: "20px", height: "20px" }} />
          <span style={{ fontSize: "14px", fontWeight: 500 }}>{t.back}</span>
        </Link>
      </div>

      {/* Surah Header - Blue card */}
      <div style={{ backgroundColor: "#2563eb", padding: "16px", margin: "0 16px", borderRadius: "8px" }}>
        <h1 style={{ fontSize: "16px", fontWeight: 700, color: "#ffffff", margin: 0, fontFamily: '"Satoshi", system-ui, sans-serif' }}>{surah?.englishName}</h1>
        <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.8)", margin: "4px 0 0 0" }}>
          {surah?.englishNameTranslation}
        </p>
        <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.8)", margin: "4px 0 0 0" }}>
          {surah?.numberOfAyahs} {t.verses} • {surah?.revelationType}
        </p>
        <p
          className="font-arabic"
          style={{ textAlign: "right", fontSize: "24px", marginTop: "12px", color: "#ffffff" }}
          dir="rtl"
        >
          بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
        </p>
        <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.8)", textAlign: "center", marginTop: "8px" }}>
          {t.bismillah}
        </p>
      </div>

      {/* Verses */}
      <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "16px" }}>
        {currentAyahs.map((ayah) => {
          const trans = translation.find((t) => t.numberInSurah === ayah.numberInSurah)
          const translit = transliteration.find((t) => t.numberInSurah === ayah.numberInSurah)

          return (
            <div key={ayah.number} style={{ display: "flex", gap: "12px" }}>
              <div style={{ flexShrink: 0 }}>
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    backgroundColor: "#2563eb",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <span style={{ fontSize: "12px", fontWeight: 600, color: "#ffffff" }}>{ayah.numberInSurah}</span>
                </div>
              </div>
              <div style={{ flex: 1, position: "relative" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "14px", color: "#ffffff", fontWeight: 500 }}>{surah?.englishName}</span>
                  <span style={{ fontSize: "12px", color: "#71717a" }}>
                    ({surah?.number}:{ayah.numberInSurah})
                  </span>
                </div>
                <p
                  className="font-arabic"
                  style={{ fontSize: "20px", textAlign: "right", marginTop: "12px", color: "#ffffff", lineHeight: 2 }}
                  dir="rtl"
                >
                  {ayah.text}
                </p>
                {showTransliteration && translit && (
                  <p style={{ fontSize: "14px", color: "#a1a1aa", marginTop: "8px", fontStyle: "italic" }}>
                    {translit.text}
                  </p>
                )}
                {trans && (
                  <p style={{ fontSize: "14px", color: "#ffffff", marginTop: "4px" }}>{trans.text}</p>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <div
        style={{
          padding: "16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <button
          onClick={handlePrev}
          disabled={page === 1}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "4px",
            fontSize: "14px",
            color: page === 1 ? "#71717a" : "#2563eb",
            cursor: page === 1 ? "not-allowed" : "pointer",
            fontWeight: 500,
            background: "none",
            border: "none",
          }}
        >
          <ChevronLeft style={{ width: "16px", height: "16px" }} />
          {t.previous}
        </button>
        <span style={{ fontSize: "14px", color: "#a1a1aa" }}>
          {t.page} {page} {t.of} {totalPages}
        </span>
        <button
          onClick={handleNext}
          disabled={page === totalPages}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "4px",
            fontSize: "14px",
            color: page === totalPages ? "#71717a" : "#2563eb",
            cursor: page === totalPages ? "not-allowed" : "pointer",
            fontWeight: 500,
            background: "none",
            border: "none",
          }}
        >
          {t.next}
          <ChevronRight style={{ width: "16px", height: "16px" }} />
        </button>
      </div>

      <div
        style={{
          padding: "16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Link
          href={surahNumber > 1 ? `/quran/surah/${surahNumber - 1}` : "#"}
          style={{
            fontSize: "14px",
            color: surahNumber === 1 ? "#71717a" : "#2563eb",
            cursor: surahNumber === 1 ? "not-allowed" : "pointer",
            fontWeight: 500,
            textDecoration: "none",
            pointerEvents: surahNumber === 1 ? "none" : "auto",
          }}
        >
          {t.previousSurah}
        </Link>
        <Link
          href={surahNumber < 114 ? `/quran/surah/${surahNumber + 1}` : "#"}
          style={{
            fontSize: "14px",
            color: surahNumber === 114 ? "#71717a" : "#2563eb",
            cursor: surahNumber === 114 ? "not-allowed" : "pointer",
            fontWeight: 500,
            textDecoration: "none",
            pointerEvents: surahNumber === 114 ? "none" : "auto",
          }}
        >
          {t.nextSurah}
        </Link>
      </div>
    </div>
  )
}
