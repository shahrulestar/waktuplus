"use client"

import { useSyncExternalStore } from "react"

/** Mobile-first default for SSR — matches compact layout (< 1024px). */
const MOBILE_DEFAULT_WIDTH = 390

function subscribe(callback: () => void) {
  window.addEventListener("resize", callback)
  return () => window.removeEventListener("resize", callback)
}

function getSnapshot() {
  return window.innerWidth
}

function getServerSnapshot() {
  return MOBILE_DEFAULT_WIDTH
}

export function useViewportWidth() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
