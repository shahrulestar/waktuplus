"use client"

import { useState, useEffect, useRef, useMemo } from "react"
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

interface SurahAyahAuxData {
  number: number
  text: string
  numberInSurah: number
}

function normalizeAyahs(ayahs: AyahData[] | undefined): AyahData[] {
  if (!Array.isArray(ayahs)) return []
  return [...ayahs]
    .filter((ayah) => Number.isFinite(ayah.numberInSurah) && ayah.numberInSurah > 0)
    .sort((a, b) => a.numberInSurah - b.numberInSurah)
}

function normalizeAuxAyahs(
  ayahs: SurahAyahAuxData[] | undefined,
  allowedNumbers: Set<number>,
): SurahAyahAuxData[] {
  if (!Array.isArray(ayahs)) return []
  return [...ayahs]
    .filter((ayah) => allowedNumbers.has(ayah.number))
    .sort((a, b) => a.numberInSurah - b.numberInSurah)
}

export function SurahDetailScreen({ surahNumber }: SurahDetailScreenProps) {
  const { language, showTransliteration, showQuranTranslation, quranTranslationLang } = useAppStore()
  const t = translations[language]
  const [surah, setSurah] = useState<SurahData | null>(null)
  const [translation, setTranslation] = useState<{ number: number; text: string; numberInSurah: number }[]>([])
  const [transliteration, setTransliteration] = useState<{ number: number; text: string; numberInSurah: number }[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const topRef = useRef<HTMLDivElement>(null)
  const requestIdRef = useRef(0)

  useEffect(() => {
    setPage(1)
    setSurah(null)
    setTranslation([])
    setTransliteration([])
    setIsLoading(true)

    const currentRequestId = ++requestIdRef.current

    const fetchSurah = async () => {
      const translationEdition = quranTranslationLang === "ms" ? "ms.basmeih" : "en.asad"

      const arabicPromise = getCachedData(
        `surah_arabic_${surahNumber}`,
        async () => {
          const res = await fetch(`/api/quran?endpoint=surah/${surahNumber}/quran-uthmani`)
          if (!res.ok) throw new Error("Failed to fetch")
          return res.json()
        },
        7 * 24 * 60 * 60 * 1000,
      )
      const translationPromise = showQuranTranslation
        ? getCachedData(
            `surah_${surahNumber}_${translationEdition}`,
            async () => {
              const res = await fetch(`/api/quran?endpoint=surah/${surahNumber}/${translationEdition}`)
              if (!res.ok) throw new Error("Failed to fetch")
              return res.json()
            },
            7 * 24 * 60 * 60 * 1000,
          )
        : Promise.resolve({ data: { ayahs: [] } })
      const translitPromise = getCachedData(
        `surah_${surahNumber}_transliteration`,
        async () => {
          const res = await fetch(`/api/quran?endpoint=surah/${surahNumber}/en.transliteration`)
          if (!res.ok) throw new Error("Failed to fetch")
          return res.json()
        },
        7 * 24 * 60 * 60 * 1000,
      )

      const results = await Promise.allSettled([arabicPromise, translationPromise, translitPromise])

      if (currentRequestId !== requestIdRef.current) return

      const arabicResult = results[0]
      const translationResult = results[1]
      const translitResult = results[2]

      const arabicSurah =
        arabicResult.status === "fulfilled" && arabicResult.value?.data?.number === surahNumber
          ? (arabicResult.value.data as SurahData)
          : null
      const normalizedArabicAyahs = normalizeAyahs(arabicSurah?.ayahs)
      const allowedAyahNumbers = new Set<number>(normalizedArabicAyahs.map((ayah) => ayah.number))

      if (arabicSurah) {
        setSurah({
          ...arabicSurah,
          ayahs: normalizedArabicAyahs,
          numberOfAyahs: normalizedArabicAyahs.length || arabicSurah.numberOfAyahs,
        })
      } else {
        setSurah(null)
      }

      if (translationResult.status === "fulfilled" && translationResult.value?.data?.ayahs) {
        setTranslation(normalizeAuxAyahs(translationResult.value.data.ayahs, allowedAyahNumbers))
      } else {
        setTranslation([])
      }
      if (translitResult.status === "fulfilled" && translitResult.value?.data?.ayahs) {
        setTransliteration(normalizeAuxAyahs(translitResult.value.data.ayahs, allowedAyahNumbers))
      } else {
        setTransliteration([])
      }

      if (arabicResult.status === "rejected") {
        console.error("Failed to fetch surah:", arabicResult.reason)
      } else if (!arabicSurah) {
        console.error("Surah payload mismatch for requested surah:", surahNumber)
      }
      if (translationResult.status === "rejected" && showQuranTranslation) {
        console.error("Failed to fetch surah translation:", translationResult.reason)
      }
      if (translitResult.status === "rejected") {
        console.error("Failed to fetch surah transliteration:", translitResult.reason)
      }

      setIsLoading(false)
    }
    fetchSurah()
  }, [surahNumber, quranTranslationLang, showQuranTranslation])

  const itemsPerPage = 10
  const ayahsList = surah?.ayahs ?? []
  const totalPages = Math.max(1, Math.ceil(ayahsList.length / itemsPerPage))

  const startIndex = (page - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentAyahs = ayahsList.slice(startIndex, endIndex)

  const translationMap = useMemo(() => {
    const m = new Map<number, { number: number; text: string; numberInSurah: number }>()
    for (const t of translation) {
      m.set(t.number, t)
    }
    return m
  }, [translation])
  const transliterationMap = useMemo(() => {
    const m = new Map<number, { number: number; text: string; numberInSurah: number }>()
    for (const t of transliteration) {
      m.set(t.number, t)
    }
    return m
  }, [transliteration])

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
        <h1 style={{ fontSize: "16px", fontWeight: 700, color: "#ffffff", margin: 0 }}>{surah?.englishName}</h1>
        <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.8)", margin: "4px 0 0 0" }}>
          {surah?.englishNameTranslation}
        </p>
        <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.8)", margin: "4px 0 0 0" }}>
          {surah?.numberOfAyahs} {t.verses} • {surah?.revelationType}
        </p>
      </div>

      {/* Verses */}
      <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "32px" }}>
        {currentAyahs.map((ayah) => {
          const trans = translationMap.get(ayah.number)
          const translit = transliterationMap.get(ayah.number)

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
                  style={{ fontSize: "32px", textAlign: "right", marginTop: "12px", color: "#ffffff", lineHeight: 2 }}
                  dir="rtl"
                >
                  {ayah.text}
                </p>
                {showTransliteration && translit && (
                  <p style={{ fontSize: "14px", color: "#a1a1aa", marginTop: "8px", fontStyle: "italic" }}>
                    {translit.text}
                  </p>
                )}
                {showQuranTranslation && trans && (
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
