// Dynamic countdown formatter that shows only non-zero units
// Examples: "3 H 23 M 30 S", "45 M 20 S", "30 S", "20 D 9 H", "30 D 19 M"

interface CountdownUnits {
  days?: number
  hours?: number
  minutes?: number
  seconds?: number
}

interface CountdownLabels {
  days: string
  hours: string
  minutes: string
  seconds: string
}

export function formatDynamicCountdown(
  units: CountdownUnits,
  labels: CountdownLabels,
  options?: { includeDays?: boolean; includeSeconds?: boolean },
): string {
  const { days = 0, hours = 0, minutes = 0, seconds = 0 } = units
  const { includeDays = true, includeSeconds = true } = options || {}

  const parts: string[] = []

  // Add days if non-zero and included
  if (includeDays && days > 0) {
    parts.push(`${days} ${labels.days}`)
  }

  // Add hours if non-zero OR if we have days (to show progression)
  if (hours > 0 || (includeDays && days > 0 && (minutes > 0 || (includeSeconds && seconds > 0)))) {
    if (hours > 0) {
      parts.push(`${hours} ${labels.hours}`)
    }
  }

  // Add minutes if non-zero OR if we have higher units
  if (minutes > 0 || (parts.length > 0 && includeSeconds && seconds > 0)) {
    if (minutes > 0) {
      parts.push(`${minutes} ${labels.minutes}`)
    }
  }

  // Add seconds if non-zero and included
  if (includeSeconds && seconds > 0) {
    parts.push(`${seconds} ${labels.seconds}`)
  }

  // If all values are zero, show "0 S" or "0 M" depending on context
  if (parts.length === 0) {
    if (includeSeconds) {
      return `0 ${labels.seconds}`
    }
    return `0 ${labels.minutes}`
  }

  return parts.join(" ")
}

// Simplified version that only shows non-zero values
export function formatSmartCountdown(
  totalSeconds: number,
  labels: CountdownLabels,
  options?: { includeDays?: boolean },
): string {
  const { includeDays = false } = options || {}

  let remaining = totalSeconds

  const days = includeDays ? Math.floor(remaining / 86400) : 0
  remaining = includeDays ? remaining % 86400 : remaining

  const hours = Math.floor(remaining / 3600)
  remaining = remaining % 3600

  const minutes = Math.floor(remaining / 60)
  const seconds = remaining % 60

  const parts: string[] = []

  if (days > 0) {
    parts.push(`${days} ${labels.days}`)
  }

  if (hours > 0) {
    parts.push(`${hours} ${labels.hours}`)
  }

  if (minutes > 0) {
    parts.push(`${minutes} ${labels.minutes}`)
  }

  if (seconds > 0 || parts.length === 0) {
    parts.push(`${seconds} ${labels.seconds}`)
  }

  return parts.join(" ")
}
