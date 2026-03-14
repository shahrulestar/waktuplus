"use client"

import Link from "next/link"
import { Home } from "lucide-react"

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#18181b",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        textAlign: "center",
      }}
    >
      <div style={{ marginBottom: "32px" }}>
        <h1 className="metric-number" style={{ fontSize: "96px", fontWeight: 700, color: "#3b82f6", margin: 0 }}>404</h1>
        <p style={{ fontSize: "20px", fontWeight: 600, color: "#ffffff", margin: "16px 0 8px 0", fontFamily: 'var(--font-geist-sans), system-ui, sans-serif' }}>Page Not Found</p>
        <p style={{ fontSize: "16px", color: "#a1a1aa", margin: 0, fontFamily: 'var(--font-geist-sans), system-ui, sans-serif' }}>
          Sorry, the page you're looking for doesn't exist.
        </p>
      </div>

      <Link
        href="/"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          padding: "12px 24px",
          backgroundColor: "#2563eb",
          color: "#ffffff",
          textDecoration: "none",
          borderRadius: "8px",
          fontSize: "14px",
          fontWeight: 500,
          border: "none",
          cursor: "pointer",
          transition: "background-color 0.2s",
          fontFamily: 'var(--font-geist-sans), system-ui, sans-serif',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#1d4ed8")}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#2563eb")}
      >
        <Home style={{ width: "16px", height: "16px" }} />
        Back to Home
      </Link>
    </div>
  )
}
