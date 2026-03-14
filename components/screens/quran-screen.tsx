"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Search, Settings2 } from "lucide-react"
import type { QuranApiResponse, QuranSurah } from "@/lib/types"
import { useAppStore } from "@/lib/store"
import { translations } from "@/lib/translations"
import { getCachedData } from "@/lib/api-cache"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"

export function QuranScreen() {
  const [searchQuery, setSearchQuery] = useState("")
  const [surahs, setSurahs] = useState<QuranSurah[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("juz")
  const { language, showTransliteration, setShowTransliteration, showQuranTranslation, setShowQuranTranslation, quranTranslationLang, setQuranTranslationLang } = useAppStore()
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
          7 * 24 * 60 * 60 * 1000,
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

  const listContent = (
    <>
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
      ) : activeTab === "juz" ? (
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
    </>
  )

  return (
    <div style={{ padding: "16px", backgroundColor: "#18181b", minHeight: "100%" }}>
      <h1 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "16px", color: "#ffffff" }}>{t.alQuran}</h1>

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
          placeholder={activeTab === "juz" ? t.searchJuz : t.searchSurah}
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

      {/* Tabs row with settings icon */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
          <TabsList className="bg-[#27272a] w-full">
            <TabsTrigger
              value="juz"
              className="flex-1 data-[state=active]:bg-[#2563eb] data-[state=active]:text-white text-zinc-400 data-[state=active]:border-transparent"
            >
              {t.juz}
            </TabsTrigger>
            <TabsTrigger
              value="surah"
              className="flex-1 data-[state=active]:bg-[#2563eb] data-[state=active]:text-white text-zinc-400 data-[state=active]:border-transparent"
            >
              Surah
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <Popover>
          <PopoverTrigger asChild>
            <button
              aria-label={t.settings}
              title={t.settings}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "36px",
                height: "36px",
                borderRadius: "8px",
                backgroundColor: "#27272a",
                border: "none",
                cursor: "pointer",
                flexShrink: 0,
              }}
            >
              <Settings2 style={{ width: "18px", height: "18px", color: "#a1a1aa" }} />
            </button>
          </PopoverTrigger>
          <PopoverContent
            align="end"
            className="bg-[#27272a] border-[#3f3f46] w-64"
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* Translation toggle */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: "14px", color: "#ffffff" }}>{t.translation}</span>
                <Switch
                  checked={showQuranTranslation}
                  onCheckedChange={setShowQuranTranslation}
                />
              </div>

              {/* Translation language selector */}
              {showQuranTranslation && (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <span style={{ fontSize: "12px", color: "#71717a" }}>{t.languageLabel}</span>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      onClick={() => setQuranTranslationLang("en")}
                      style={{
                        flex: 1,
                        padding: "6px 12px",
                        borderRadius: "6px",
                        fontSize: "13px",
                        fontWeight: 500,
                        cursor: "pointer",
                        backgroundColor: quranTranslationLang === "en" ? "#2563eb" : "#3f3f46",
                        color: "#ffffff",
                        border: "none",
                      }}
                    >
                      {t.english}
                    </button>
                    <button
                      onClick={() => setQuranTranslationLang("ms")}
                      style={{
                        flex: 1,
                        padding: "6px 12px",
                        borderRadius: "6px",
                        fontSize: "13px",
                        fontWeight: 500,
                        cursor: "pointer",
                        backgroundColor: quranTranslationLang === "ms" ? "#2563eb" : "#3f3f46",
                        color: "#ffffff",
                        border: "none",
                      }}
                    >
                      {t.bahasaMelayu}
                    </button>
                  </div>
                </div>
              )}

              {/* Transliteration toggle */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: "14px", color: "#ffffff" }}>{t.transliteration}</span>
                <Switch
                  checked={showTransliteration}
                  onCheckedChange={setShowTransliteration}
                />
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* List */}
      {listContent}
    </div>
  )
}
