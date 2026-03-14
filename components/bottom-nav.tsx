"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Home, BookOpen, Grid2X2, Settings, Clock, Calendar, Monitor, ChevronRight } from "lucide-react"
import { useAppStore } from "@/lib/store"
import { translations } from "@/lib/translations"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface BottomNavProps {
  activeScreen: string
}

export function BottomNav({ activeScreen }: BottomNavProps) {
  const { language } = useAppStore()
  const t = translations[language]
  const router = useRouter()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [isDesktop, setIsDesktop] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 768px)")
    const updateScreenSize = () => setIsDesktop(mediaQuery.matches)
    updateScreenSize()
    mediaQuery.addEventListener("change", updateScreenSize)
    return () => mediaQuery.removeEventListener("change", updateScreenSize)
  }, [])

  const navItems = [
    { id: "home", label: t.home, icon: Home, href: "/" },
    { id: "quran", label: "Al-Quran", icon: BookOpen, href: "/quran" },
    { id: "menu", label: "Menu", icon: Grid2X2, href: "" },
    { id: "settings", label: t.settings, icon: Settings, href: "/settings" },
  ]

  const menuItems = [
    { icon: BookOpen, label: t.quran, description: t.readHolyQuran, href: "/quran" },
    { icon: Clock, label: t.prayerTimes, description: t.monthlyPrayerSchedule, href: "/prayer-times" },
    { icon: Calendar, label: t.importantDates, description: t.importantIslamicDates, href: "/islamic-calendar" },
    { icon: Monitor, label: t.waktuDisplay, description: t.displayDescription, href: "/display" },
  ]

  const activeColor = "#3B82F6"
  const inactiveColor = "#71717a"

  return (
    <>
      {isDesktop ? (
        <Dialog open={drawerOpen} onOpenChange={setDrawerOpen}>
          <DialogContent
            showCloseButton={false}
            style={{ backgroundColor: "#18181b", borderColor: "#27272a", maxWidth: "560px", padding: 0, gap: 0 }}
          >
            <DialogHeader style={{ textAlign: "left", padding: "16px 16px 8px 16px" }}>
              <DialogTitle className="font-heading" style={{ color: "#ffffff" }}>{t.menu}</DialogTitle>
              <DialogDescription style={{ color: "#71717a" }}>
                {language === "ms" ? "Terokai ciri-ciri Waktu+" : "Explore Waktu+ features"}
              </DialogDescription>
            </DialogHeader>
            <div style={{ display: "flex", flexDirection: "column", padding: "0 16px 16px 16px" }}>
              {menuItems.map((item) => {
                const Icon = item.icon
                return (
                  <DialogClose key={item.label} asChild>
                    <button
                      onClick={() => {
                        setDrawerOpen(false)
                        router.push(item.href)
                      }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        padding: "14px 0px",
                        backgroundColor: "transparent",
                        border: "none",
                        borderBottom: "none",
                        cursor: "pointer",
                        textAlign: "left",
                        width: "100%",
                      }}
                    >
                      <div
                        style={{
                          width: "40px",
                          height: "40px",
                          borderRadius: "10px",
                          backgroundColor: "#27272a",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <Icon style={{ width: "20px", height: "20px", color: "#3b82f6" }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: "14px", fontWeight: 500, color: "#ffffff", margin: 0 }}>{item.label}</p>
                        <p style={{ fontSize: "12px", color: "#71717a", margin: "2px 0 0 0" }}>{item.description}</p>
                      </div>
                      <ChevronRight style={{ width: "16px", height: "16px", color: "#71717a", flexShrink: 0 }} />
                    </button>
                  </DialogClose>
                )
              })}
            </div>
          </DialogContent>
        </Dialog>
      ) : (
        <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
          <DrawerContent style={{ backgroundColor: "#18181b", borderColor: "#27272a" }}>
            <DrawerHeader style={{ textAlign: "left" }}>
              <DrawerTitle className="font-heading" style={{ color: "#ffffff" }}>{t.menu}</DrawerTitle>
              <DrawerDescription style={{ color: "#71717a" }}>
                {language === "ms" ? "Terokai ciri-ciri Waktu+" : "Explore Waktu+ features"}
              </DrawerDescription>
            </DrawerHeader>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                padding: "0 16px calc(16px + env(safe-area-inset-bottom, 0px))",
              }}
            >
              {menuItems.map((item) => {
                const Icon = item.icon
                return (
                  <DrawerClose key={item.label} asChild>
                    <button
                      onClick={() => {
                        setDrawerOpen(false)
                        router.push(item.href)
                      }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        padding: "14px 0px",
                        backgroundColor: "transparent",
                        border: "none",
                        borderBottom: "none",
                        cursor: "pointer",
                        textAlign: "left",
                        width: "100%",
                      }}
                    >
                      <div
                        style={{
                          width: "40px",
                          height: "40px",
                          borderRadius: "10px",
                          backgroundColor: "#27272a",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <Icon style={{ width: "20px", height: "20px", color: "#3b82f6" }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: "14px", fontWeight: 500, color: "#ffffff", margin: 0 }}>{item.label}</p>
                        <p style={{ fontSize: "12px", color: "#71717a", margin: "2px 0 0 0" }}>{item.description}</p>
                      </div>
                      <ChevronRight style={{ width: "16px", height: "16px", color: "#71717a", flexShrink: 0 }} />
                    </button>
                  </DrawerClose>
                )
              })}
            </div>
          </DrawerContent>
        </Drawer>
      )}

      <nav
        style={{
          position: "fixed",
          bottom: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: "100%",
          maxWidth: "448px",
          backgroundColor: "#18181b",
          borderTop: "1px solid #27272a",
          zIndex: 50,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-around", padding: "12px 0" }}>
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = activeScreen === item.id
            const color = isActive ? activeColor : inactiveColor

            if (item.id === "menu") {
              return (
                <button
                  key={item.id}
                  onClick={() => setDrawerOpen(true)}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "4px",
                    padding: "4px 16px",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: inactiveColor,
                    transition: "color 0.2s",
                  }}
                >
                  <Icon style={{ width: "24px", height: "24px", color: inactiveColor }} />
                  <span style={{ fontSize: "12px", fontWeight: 500, color: inactiveColor }}>
                    {item.label}
                  </span>
                </button>
              )
            }

            return (
              <Link
                key={item.id}
                href={item.href}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "4px",
                  padding: "4px 16px",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color,
                  transition: "color 0.2s",
                  textDecoration: "none",
                }}
              >
                <Icon style={{ width: "24px", height: "24px", color }} />
                <span style={{ fontSize: "12px", fontWeight: 500, color }}>
                  {item.label}
                </span>
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}
