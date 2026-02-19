"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useVersionCheck } from "@/hooks/useVersionCheck"

const COUNTDOWN_SECONDS = 5

export function UpdateBanner() {
  const { updateAvailable } = useVersionCheck()
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS)

  useEffect(() => {
    if (!updateAvailable) return

    setCountdown(COUNTDOWN_SECONDS)
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          window.location.reload()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [updateAvailable])

  if (!updateAvailable) return null

  return (
    <div
      className={cn(
        "fixed left-0 right-0 top-0 z-[9999] flex w-full items-center justify-center gap-4",
        "border-b border-border bg-background px-4 py-3 text-foreground shadow-sm",
        "animate-in slide-in-from-top-2 duration-300"
      )}
    >
      <span className="text-sm font-medium">
        A new version is available. Refreshing in {countdown}s
      </span>
      <Button
        variant="default"
        size="sm"
        onClick={() => window.location.reload()}
      >
        Refresh now
      </Button>
    </div>
  )
}
