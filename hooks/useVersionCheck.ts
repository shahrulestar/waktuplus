"use client"

import { useEffect, useRef, useState } from "react"

const POLL_INTERVAL_MS = 30_000

interface VersionResponse {
  version: number
}

export function useVersionCheck(): { updateAvailable: boolean } {
  const [updateAvailable, setUpdateAvailable] = useState(false)
  const initialVersionRef = useRef<number | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    async function fetchVersion(): Promise<number | null> {
      try {
        const res = await fetch(`/version.json?t=${Date.now()}`, {
          cache: "no-store",
        })
        if (!res.ok) return null
        const data: VersionResponse = await res.json()
        return typeof data.version === "number" ? data.version : null
      } catch {
        return null
      }
    }

    async function init() {
      const version = await fetchVersion()
      if (version !== null) {
        initialVersionRef.current = version
      }
    }

    init().then(() => {
      intervalRef.current = setInterval(async () => {
        const newVersion = await fetchVersion()
        const initial = initialVersionRef.current
        if (
          newVersion !== null &&
          initial !== null &&
          newVersion !== initial
        ) {
          setUpdateAvailable(true)
        }
      }, POLL_INTERVAL_MS)
    })

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [])

  return { updateAvailable }
}
