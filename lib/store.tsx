"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

interface AppState {
  selectedZone: string
  language: "en" | "ms"
  showTransliteration: boolean
  showQuranTranslation: boolean
  quranTranslationLang: "en" | "ms"
  setSelectedZone: (zone: string) => void
  setLanguage: (lang: "en" | "ms") => void
  setShowTransliteration: (show: boolean) => void
  setShowQuranTranslation: (show: boolean) => void
  setQuranTranslationLang: (lang: "en" | "ms") => void
}

const defaultState: AppState = {
  selectedZone: "WLY01",
  language: "en",
  showTransliteration: true,
  showQuranTranslation: true,
  quranTranslationLang: "en",
  setSelectedZone: () => {},
  setLanguage: () => {},
  setShowTransliteration: () => {},
  setShowQuranTranslation: () => {},
  setQuranTranslationLang: () => {},
}

const AppContext = createContext<AppState>(defaultState)

export function AppProvider({ children }: { children: ReactNode }) {
  const [selectedZone, setSelectedZone] = useState("WLY01")
  const [language, setLanguage] = useState<"en" | "ms">("en")
  const [showTransliteration, setShowTransliteration] = useState(true)
  const [showQuranTranslation, setShowQuranTranslation] = useState(true)
  const [quranTranslationLang, setQuranTranslationLang] = useState<"en" | "ms">("en")
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem("waktu-storage")
      if (stored) {
        const data = JSON.parse(stored)
        if (data.selectedZone) setSelectedZone(data.selectedZone)
        if (data.language) setLanguage(data.language)
        if (typeof data.showTransliteration === "boolean") setShowTransliteration(data.showTransliteration)
        if (typeof data.showQuranTranslation === "boolean") setShowQuranTranslation(data.showQuranTranslation)
        if (data.quranTranslationLang) setQuranTranslationLang(data.quranTranslationLang)
      }
    } catch (e) {
      console.error("Failed to parse stored data:", e)
    }
    setIsHydrated(true)
  }, [])

  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem(
        "waktu-storage",
        JSON.stringify({ selectedZone, language, showTransliteration, showQuranTranslation, quranTranslationLang }),
      )
    }
  }, [selectedZone, language, showTransliteration, showQuranTranslation, quranTranslationLang, isHydrated])

  return (
    <AppContext.Provider
      value={{
        selectedZone,
        language,
        showTransliteration,
        showQuranTranslation,
        quranTranslationLang,
        setSelectedZone,
        setLanguage,
        setShowTransliteration,
        setShowQuranTranslation,
        setQuranTranslationLang,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useAppStore() {
  return useContext(AppContext)
}
