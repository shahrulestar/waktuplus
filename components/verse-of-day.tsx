"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { translations } from "@/lib/translations"
import { getCachedData } from "@/lib/api-cache"
import { Skeleton } from "@/components/ui/skeleton"

interface VerseData {
  arabic: string
  translation: string
  surah: string
  ayah: number
  surahNumber: number
}

interface VerseOfDayProps {
  language: "en" | "ms"
}

export function VerseOfDay({ language }: VerseOfDayProps) {
  const t = translations[language]
  const [verse, setVerse] = useState<VerseData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchVerse = async () => {
      setIsLoading(true)
      try {
        // Total verses in Quran: 6236
        const now = new Date()
        const start = new Date(now.getFullYear(), 0, 0)
        const diff = now.getTime() - start.getTime()
        const oneDay = 1000 * 60 * 60 * 24
        const dayOfYear = Math.floor(diff / oneDay)
        const verseNumber = (dayOfYear % 6236) + 1

        const translationEdition = language === "ms" ? "ms.basmeih" : "en.asad"
        const cacheKey = `verse_${verseNumber}_${translationEdition}`

        const [arabicData, translationData] = await Promise.all([
          getCachedData(
            `verse_arabic_${verseNumber}`,
            async () => {
              const res = await fetch(`/api/quran?endpoint=ayah/${verseNumber}`)
              if (!res.ok) throw new Error("Failed to fetch")
              return res.json()
            },
            24 * 60 * 60 * 1000,
          ),
          getCachedData(
            cacheKey,
            async () => {
              const res = await fetch(`/api/quran?endpoint=ayah/${verseNumber}/${translationEdition}`)
              if (!res.ok) throw new Error("Failed to fetch")
              return res.json()
            },
            24 * 60 * 60 * 1000,
          ),
        ])

        if (arabicData?.data && translationData?.data) {
          setVerse({
            arabic: arabicData.data.text,
            translation: translationData.data.text,
            surah: translationData.data.surah.englishName,
            ayah: translationData.data.numberInSurah,
            surahNumber: translationData.data.surah.number,
          })
        }
      } catch (error) {
        console.error("Failed to fetch verse:", error)
        setVerse({
          arabic: "وَمَن يَتَوَكَّلْ عَلَى اللَّهِ فَهُوَ حَسْبُهُ",
          translation:
            language === "ms"
              ? "Dan sesiapa yang bertawakkal kepada Allah, maka cukuplah Allah baginya."
              : "And whoever puts his trust in Allah, He will be enough for him.",
          surah: "At-Talaq",
          ayah: 3,
          surahNumber: 65,
        })
      } finally {
        setIsLoading(false)
      }
    }
    fetchVerse()
  }, [language])

  return (
    <div style={{ backgroundColor: "#27272a", borderRadius: "8px", padding: "16px" }}>
      <h2 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "16px", color: "#ffffff", fontFamily: 'var(--font-geist-sans), system-ui, sans-serif' }}>{t.dailyVerse}</h2>

      {isLoading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <Skeleton className="h-6 w-28 bg-muted" />
          <Skeleton className="h-16 w-full bg-muted" />
          <Skeleton className="h-4 w-full bg-muted" />
          <Skeleton className="h-4 w-48 bg-muted" />
          <Skeleton className="h-4 w-20 bg-muted" />
          <Skeleton className="h-10 w-full rounded-lg bg-muted mt-2" />
        </div>
      ) : null}
      {!isLoading && verse ? (
        <>
          <p
            className="font-arabic"
            style={{ fontSize: "24px", textAlign: "right", lineHeight: 2, marginBottom: "16px", color: "#ffffff" }}
            dir="rtl"
          >
            {verse.arabic}
          </p>
          <p style={{ fontSize: "14px", color: "#a1a1aa", lineHeight: 1.6, marginBottom: "8px" }}>
            "{verse.translation}"
          </p>
          <p style={{ fontSize: "14px", color: "#a1a1aa", marginBottom: "16px" }}>
            Surah {verse.surah} ({verse.surahNumber}:{verse.ayah})
          </p>
        </>
      ) : null}

      {!isLoading && (
      <Link
        href="/quran"
        style={{
          display: "block",
          width: "100%",
          backgroundColor: "#2563eb",
          color: "#ffffff",
          fontWeight: 500,
          fontSize: "14px",
          borderRadius: "8px",
          height: "40px",
          border: "none",
          cursor: "pointer",
          textDecoration: "none",
          textAlign: "center",
          lineHeight: "40px",
          boxSizing: "border-box",
        }}
      >
        {t.readQuran}
      </Link>
      )}
    </div>
  )
}
