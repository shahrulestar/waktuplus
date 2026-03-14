"use client"

import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { useAppStore } from "@/lib/store"
import { translations } from "@/lib/translations"

export default function PWAScreen() {
  const { language } = useAppStore()
  const t = translations[language]

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
  const isAndroid = /Android/.test(navigator.userAgent)

  return (
    <main
      style={{
        minHeight: "100vh",
        backgroundColor: "#18181b",
        paddingTop: "16px",
        paddingBottom: "120px",
        paddingLeft: "24px",
        paddingRight: "24px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <div style={{ maxWidth: "448px", width: "100%", margin: "0 auto" }}>
        {/* Back button */}
        <Link
          href="/links"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            color: "#3b82f6",
            textDecoration: "none",
            fontSize: "14px",
            fontWeight: 500,
            marginBottom: "24px",
          }}
        >
          <ChevronLeft size={20} />
          Back
        </Link>

        <h1 style={{ fontSize: "28px", fontWeight: 700, color: "#ffffff", margin: "0 0 8px 0" }}>Waktu+ PWA</h1>
        <p style={{ fontSize: "14px", color: "#a1a1aa", margin: "0 0 24px 0" }}>
          Install Waktu+ as a web app for the best experience
        </p>

        {/* General info */}
        <div
          style={{
            padding: "16px",
            backgroundColor: "#27272a",
            borderRadius: "8px",
            marginBottom: "16px",
            border: "1px solid #3f3f46",
          }}
        >
          <h2 style={{ fontSize: "16px", fontWeight: 600, color: "#ffffff", margin: "0 0 8px 0" }}>What is PWA?</h2>
          <p style={{ fontSize: "14px", color: "#a1a1aa", margin: 0, lineHeight: "1.6" }}>
            Progressive Web App (PWA) gives you an app-like experience directly in your browser. Access Waktu+ offline,
            get faster loading times, and install it on your home screen.
          </p>
        </div>

        {/* Installation guide */}
        <div
          style={{
            padding: "16px",
            backgroundColor: "#27272a",
            borderRadius: "8px",
            marginBottom: "16px",
            border: "1px solid #3f3f46",
          }}
        >
          <h2 style={{ fontSize: "16px", fontWeight: 600, color: "#ffffff", margin: "0 0 12px 0" }}>How to Install</h2>

          {/* Android instructions */}
          <div style={{ marginBottom: "16px" }}>
            <h3 style={{ fontSize: "14px", fontWeight: 600, color: "#3b82f6", margin: "0 0 8px 0" }}>On Android</h3>
            <ol style={{ fontSize: "14px", color: "#a1a1aa", margin: "0 0 0 16px", paddingLeft: "0" }}>
              <li style={{ marginBottom: "6px" }}>Open Waktu+ in your browser (Chrome recommended)</li>
              <li style={{ marginBottom: "6px" }}>Tap the menu icon (⋮) in the top right</li>
              <li style={{ marginBottom: "6px" }}>Select "Install app" or "Add to Home screen"</li>
              <li>Tap "Install" to confirm</li>
            </ol>
          </div>

          {/* iOS instructions */}
          <div>
            <h3 style={{ fontSize: "14px", fontWeight: 600, color: "#ec4899", margin: "0 0 8px 0" }}>On iOS</h3>
            <ol style={{ fontSize: "14px", color: "#a1a1aa", margin: "0 0 0 16px", paddingLeft: "0" }}>
              <li style={{ marginBottom: "6px" }}>Open Waktu+ in Safari</li>
              <li style={{ marginBottom: "6px" }}>Tap the Share button (↗️) at the bottom</li>
              <li style={{ marginBottom: "6px" }}>Scroll down and select "Add to Home Screen"</li>
              <li>Tap "Add" in the top right to confirm</li>
            </ol>
          </div>
        </div>

        {/* Benefits */}
        <div
          style={{
            padding: "16px",
            backgroundColor: "#27272a",
            borderRadius: "8px",
            marginBottom: "16px",
            border: "1px solid #3f3f46",
          }}
        >
          <h2 style={{ fontSize: "16px", fontWeight: 600, color: "#ffffff", margin: "0 0 12px 0" }}>Benefits</h2>
          <ul style={{ fontSize: "14px", color: "#a1a1aa", margin: "0", paddingLeft: "16px", lineHeight: "1.8" }}>
            <li>⚡ Faster loading times with offline support</li>
            <li>🔔 Push notifications for prayer times</li>
            <li>📱 App-like experience on your home screen</li>
            <li>📊 Automatic updates in the background</li>
            <li>🔒 Secure connection with HTTPS</li>
          </ul>
        </div>

        {/* Troubleshooting */}
        <div
          style={{
            padding: "16px",
            backgroundColor: "#27272a",
            borderRadius: "8px",
            border: "1px solid #3f3f46",
          }}
        >
          <h2 style={{ fontSize: "16px", fontWeight: 600, color: "#ffffff", margin: "0 0 12px 0" }}>Troubleshooting</h2>
          <div style={{ marginBottom: "12px" }}>
            <h3 style={{ fontSize: "14px", fontWeight: 600, color: "#f59e0b", margin: "0 0 6px 0" }}>
              Don't see "Install app"?
            </h3>
            <p style={{ fontSize: "14px", color: "#a1a1aa", margin: 0, lineHeight: "1.6" }}>
              Try using Chrome, Samsung Internet, or Firefox on Android. On iOS, use Safari for the best experience.
            </p>
          </div>
          <div>
            <h3 style={{ fontSize: "14px", fontWeight: 600, color: "#f59e0b", margin: "0 0 6px 0" }}>
              Updates not showing?
            </h3>
            <p style={{ fontSize: "14px", color: "#a1a1aa", margin: 0, lineHeight: "1.6" }}>
              Close the app completely and reopen it. If needed, reinstall from your home screen.
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
