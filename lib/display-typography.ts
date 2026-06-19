/**
 * Centralized responsive typography classes for the prayer-times display.
 *
 * Three viewport tiers map to Tailwind breakpoints:
 *   - Mobile & tablet (< 1024px): tablet-tier sizes (formerly `md:`)
 *   - TV/desktop (>= 1024px): `lg:` signage sizes *
 * The TV layout renders on a fixed 1920x1080 canvas scaled with transform,
 * so `lg:` classes always apply in that mode and produce the large signage sizes.
 */

// --- Prayer cards ---

export function displayPrayerTimeClass(hasAlert: boolean): string {
  return hasAlert
    ? "text-4xl lg:text-8xl"
    : "text-5xl lg:text-9xl"
}

export function displayPrayerNameClass(hasAlert: boolean): string {
  return hasAlert
    ? "text-3xl lg:text-7xl"
    : "text-4xl lg:text-8xl"
}

export function displayCountdownClass(hasAlert: boolean): string {
  return hasAlert
    ? "text-sm lg:text-xl"
    : "text-sm lg:text-2xl"
}

// --- Header ---

export function displayHeaderDateClass(): string {
  return "text-lg md:text-3xl lg:text-7xl"
}

export function displayHeaderTitleClass(): string {
  return "text-xl md:text-4xl lg:text-7xl"
}

// --- Alert banner ---

export function displayAlertTextClass(): string {
  return "text-base md:text-2xl lg:text-6xl"
}

// --- Footer (zone / date) ---

export function displayFooterClass(hasAlert: boolean): string {
  return hasAlert
    ? "text-xs md:text-sm lg:text-xl"
    : "text-xs md:text-sm lg:text-2xl"
}

// --- Settings panel ---

export function displaySettingsTitleClass(): string {
  return "text-lg md:text-xl lg:text-2xl"
}

export function displaySettingsSectionTitleClass(): string {
  return "text-sm md:text-base"
}

export function displaySettingsSectionDescClass(): string {
  return "text-xs md:text-sm"
}

export function displaySettingsLabelClass(): string {
  return "text-sm lg:text-base"
}

export function displaySettingsHelperClass(): string {
  return "text-xs lg:text-sm"
}
