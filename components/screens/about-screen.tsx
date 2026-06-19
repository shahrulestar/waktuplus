"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useAppStore } from "@/lib/store"
import { translations } from "@/lib/translations"

export function AboutScreen() {
  const { language } = useAppStore()
  const t = translations[language]

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#18181b",
        color: "#ffffff",
        padding: "24px",
        maxWidth: "448px",
        margin: "0 auto",
      }}
    >
      <Button variant="ghost" asChild className="-ml-2.5 mb-6 text-zinc-400 hover:text-white">
        <Link href="/settings">{t.aboutPageBack}</Link>
      </Button>

      <h1 style={{ fontSize: "20px", fontWeight: 700, margin: "0 0 16px 0" }}>{t.aboutPageTitle}</h1>

      <p style={{ fontSize: "15px", lineHeight: 1.6, color: "#d4d4d8", margin: "0 0 12px 0" }}>
        {t.aboutPageIntro}
      </p>

      <p style={{ fontSize: "15px", lineHeight: 1.6, color: "#a1a1aa", margin: "0 0 12px 0" }}>
        {t.aboutPageDetail}
      </p>

      <p style={{ fontSize: "14px", lineHeight: 1.6, color: "#71717a", margin: "0 0 24px 0" }}>
        {t.aboutPageFree}
      </p>

      <div>
        <h2 style={{ fontSize: "16px", fontWeight: 600, margin: "0 0 8px 0", color: "#ffffff" }}>
          {t.aboutPageContactTitle}
        </h2>
        <p style={{ fontSize: "14px", lineHeight: 1.6, color: "#a1a1aa", margin: "0 0 12px 0" }}>
          {t.aboutPageContactIntro}
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <a
            href="mailto:hello@shahrulestar.com"
            style={{ fontSize: "14px", color: "#3b82f6", textDecoration: "none" }}
          >
            hello@shahrulestar.com
          </a>
          <a
            href="https://www.threads.com/@shahrulestar"
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: "14px", color: "#3b82f6", textDecoration: "none" }}
          >
            @shahrulestar
          </a>
        </div>
      </div>
    </div>
  )
}
