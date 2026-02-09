"use client"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { useAppStore } from "@/lib/store"
import { translations } from "@/lib/translations"
import { islamicDates2026 } from "@/lib/islamic-dates"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { BottomNav } from "@/components/bottom-nav"

export function IslamicCalendarClient() {
  const { language } = useAppStore()
  const t = translations[language]

  return (
    <div
      style={{
        maxWidth: "448px",
        margin: "0 auto",
        minHeight: "100vh",
        backgroundColor: "#18181b",
        paddingBottom: "80px",
      }}
    >
      <div style={{ padding: "16px" }}>
        <Link
          href="/"
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
            marginBottom: "16px",
          }}
        >
          <ChevronLeft style={{ width: "20px", height: "20px" }} />
          <span style={{ fontSize: "14px", fontWeight: 500 }}>{t.back}</span>
        </Link>

        <h1 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "16px", color: "#ffffff" }}>
          {t.islamicCalendar}
        </h1>

        {/* Data Table */}
        <div
          style={{
            backgroundColor: "#27272a",
            borderRadius: "8px",
            overflow: "hidden",
          }}
        >
          <Table>
            <TableHeader>
              <TableRow style={{ borderBottom: "1px solid #3f3f46" }}>
                <TableHead style={{ color: "#3b82f6", fontSize: "12px", fontWeight: 600, padding: "12px" }}>
                  {t.hijriDate}
                </TableHead>
                <TableHead style={{ color: "#3b82f6", fontSize: "12px", fontWeight: 600, padding: "12px" }}>
                  {t.gregorianDate}
                </TableHead>
                <TableHead style={{ color: "#3b82f6", fontSize: "12px", fontWeight: 600, padding: "12px" }}>
                  {t.celebration}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {islamicDates2026.map((date, index) => (
                <TableRow
                  key={index}
                  style={{ borderBottom: index < islamicDates2026.length - 1 ? "1px solid #3f3f46" : "none" }}
                >
                  <TableCell style={{ color: "#ffffff", fontSize: "14px", padding: "12px" }}>
                    {language === "ms" ? date.hijriDateMs : date.hijriDate}
                  </TableCell>
                  <TableCell style={{ color: "#ffffff", fontSize: "14px", padding: "12px" }}>
                    {language === "ms" ? date.gregorianDateMs : date.gregorianDateEn}
                  </TableCell>
                  <TableCell style={{ color: "#ffffff", fontSize: "14px", padding: "12px", fontWeight: 500 }}>
                    {language === "ms" ? date.celebrationMs : date.celebrationEn}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <p style={{ fontSize: "12px", color: "#a1a1aa", marginTop: "16px" }}>
          Source:{" "}
          <a
            href="https://muftiwp.gov.my/images/falak/takwim/tarikh_penting/TARIKH_Penting_Islam_2026.pdf"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "#3b82f6", textDecoration: "underline" }}
          >
            Jabatan Kemajuan Islam Malaysia (JAKIM)
          </a>
        </p>
      </div>
      <BottomNav activeScreen="menu" />
    </div>
  )
}
