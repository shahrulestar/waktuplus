"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { useAppStore } from "@/lib/store"
import { translations } from "@/lib/translations"

interface JuzDetailScreenProps {
  juzNumber: number
}

interface JuzAyah {
  number: number
  text: string
  numberInSurah: number
  juz: number
  surah: {
    number: number
    name: string
    englishName: string
    englishNameTranslation: string
    numberOfAyahs: number
    revelationType: string
  }
}

export function JuzDetailScreen({ juzNumber }: JuzDetailScreenProps) {
  const { language, showTransliteration } = useAppStore()
  const t = translations[language]
  const [ayahs, setAyahs] = useState<JuzAyah[]>([])
  const [translation, setTranslation] = useState<JuzAyah[]>([])
  const [transliteration, setTransliteration] = useState<JuzAyah[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const topRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetchJuz = async () => {
      setIsLoading(true)
      try {
        const translationEdition = language === "ms" ? "ms.basmeih" : "en.asad"

        const [arabicRes, translationRes, translitRes] = await Promise.all([
          fetch(`/api/quran?endpoint=juz/${juzNumber}/quran-uthmani`),
          fetch(`/api/quran?endpoint=juz/${juzNumber}/${translationEdition}`),
          fetch(`/api/quran?endpoint=juz/${juzNumber}/en.transliteration`),
        ])

        const arabicData = await arabicRes.json()
        const translationData = await translationRes.json()
        const translitData = await translitRes.json()

        setAyahs(arabicData?.data?.ayahs || [])
        setTranslation(translationData?.data?.ayahs || [])
        setTransliteration(translitData?.data?.ayahs || [])
      } catch (error) {
        console.error("Failed to fetch juz:", error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchJuz()
    setPage(1)
  }, [juzNumber, language])

  const itemsPerPage = 10
  const totalAyahs = ayahs.length
  const totalPages = Math.max(1, Math.ceil(totalAyahs / itemsPerPage))

  const startIndex = (page - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentAyahs = ayahs.slice(startIndex, endIndex)

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

  const firstSurah = ayahs[0]?.surah?.englishName || "Al-Fatihah"

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

      {/* Juz Header - Blue card */}
      <div style={{ backgroundColor: "#2563eb", padding: "16px", margin: "0 16px", borderRadius: "8px" }}>
        <h1 style={{ fontSize: "16px", fontWeight: 600, color: "#ffffff", margin: 0 }}>
          {t.juz} {juzNumber}
        </h1>
        <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.8)", margin: "4px 0 0 0" }}>
          {t.showingVerses} {totalAyahs} {t.verses}
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
        {currentAyahs.map((ayah, index) => {
          const trans = translation.find((t) => t.number === ayah.number)
          const translit = transliteration.find((t) => t.number === ayah.number)

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
                  <span style={{ fontSize: "12px", fontWeight: 600, color: "#ffffff" }}>{startIndex + index + 1}</span>
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <p
                  className="font-arabic"
                  style={{ fontSize: "20px", textAlign: "right", marginTop: "0px", color: "#ffffff", lineHeight: 2 }}
                  dir="rtl"
                >
                  {ayah.text}
                </p>
                {showTransliteration && translit && (
                  <p style={{ fontSize: "14px", color: "#a1a1aa", marginTop: "8px", fontStyle: "italic" }}>
                    {translit.text}
                  </p>
                )}
                {trans && <p style={{ fontSize: "14px", color: "#ffffff", marginTop: "4px" }}>{trans.text}</p>}
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
          href={juzNumber > 1 ? `/quran/juz/${juzNumber - 1}` : "#"}
          style={{
            fontSize: "14px",
            color: juzNumber === 1 ? "#71717a" : "#2563eb",
            cursor: juzNumber === 1 ? "not-allowed" : "pointer",
            fontWeight: 500,
            textDecoration: "none",
            pointerEvents: juzNumber === 1 ? "none" : "auto",
          }}
        >
          {t.previousJuz}
        </Link>
        <Link
          href={juzNumber < 30 ? `/quran/juz/${juzNumber + 1}` : "#"}
          style={{
            fontSize: "14px",
            color: juzNumber === 30 ? "#71717a" : "#2563eb",
            cursor: juzNumber === 30 ? "not-allowed" : "pointer",
            fontWeight: 500,
            textDecoration: "none",
            pointerEvents: juzNumber === 30 ? "none" : "auto",
          }}
        >
          {t.nextJuz}
        </Link>
      </div>
    </div>
  )
}
