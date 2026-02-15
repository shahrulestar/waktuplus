"use client"

import { useMemo, useState } from "react"
import {
  Combobox,
  ComboboxCollection,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  ComboboxLabel,
  ComboboxList,
  ComboboxSeparator,
  useComboboxAnchor,
} from "@/components/ui/combobox"
import { prayerZones, zonesByState } from "@/lib/prayer-zones"
import type { PrayerZone } from "@/lib/prayer-zones"
import { cn } from "@/lib/utils"

const stateOrder = [
  "Johor",
  "Kedah",
  "Kelantan",
  "Melaka",
  "Negeri Sembilan",
  "Pahang",
  "Perak",
  "Perlis",
  "Pulau Pinang",
  "Sabah",
  "Sarawak",
  "Selangor",
  "Terengganu",
  "Wilayah Persekutuan",
]

interface ZoneSelectorProps {
  value: string
  onChange: (code: string) => void
  placeholder?: string
  maxHeight?: number
  className?: string
}

export function ZoneSelector({
  value,
  onChange,
  placeholder = "Search zone by code or name...",
  maxHeight = 350,
  className,
}: ZoneSelectorProps) {
  const groupedZones = useMemo(
    () =>
      stateOrder
        .filter((state) => zonesByState[state]?.length)
        .map((state) => ({ value: state, items: zonesByState[state]! })),
    [],
  )

  const zoneCode = value || "WLY01"
  const selectedZone = prayerZones.find((z) => z.code === zoneCode) ?? null

  const [open, setOpen] = useState(false)
  const [inputValue, setInputValue] = useState("")
  const anchorRef = useComboboxAnchor()

  const displayValue = open
    ? inputValue
    : selectedZone
      ? `${selectedZone.code} - ${selectedZone.name}`
      : ""

  return (
    <Combobox<PrayerZone>
      value={selectedZone}
      onValueChange={(zone) => {
        onChange(zone?.code ?? "WLY01")
        setInputValue("")
        setOpen(false)
      }}
      open={open}
      onOpenChange={(isOpen) => {
        setOpen(isOpen)
        if (isOpen) setInputValue("")
      }}
      inputValue={displayValue}
      onInputValueChange={(val) => setInputValue(val)}
      items={groupedZones}
      itemToStringValue={(zone) => zone.code}
      itemToStringLabel={(zone) => `${zone.code} - ${zone.name}`}
      isItemEqualToValue={(item, val) => item.code === (val?.code ?? (typeof val === "string" ? val : ""))}
      filter={(zone, query) => {
        if (!query || !query.trim()) return true
        const q = query.toLowerCase().trim()
        const stateMatch = zone.state.toLowerCase().includes(q)
        const codeMatch = zone.code.toLowerCase().includes(q)
        const nameMatch = zone.name.toLowerCase().includes(q)
        return stateMatch || codeMatch || nameMatch
      }}
      autoHighlight
    >
      <div ref={anchorRef} className="w-full">
        <ComboboxInput
          placeholder={placeholder}
          showTrigger={true}
          showClear={false}
          aria-label="Search and select prayer zone"
          className={cn(
            "w-full h-10 min-h-10 rounded-lg border bg-[#27272a] border-[#3f3f46] text-white",
            "placeholder:text-zinc-400 [&_input]:text-white [&_input]:bg-transparent [&_input]:text-sm",
            "[&>svg]:text-white [&>svg]:opacity-80",
            className
          )}
        />
      </div>
      <ComboboxContent
        side="bottom"
        align="center"
        anchor={anchorRef}
        className={cn(
          "!w-[var(--anchor-width)] !min-w-[var(--anchor-width)] !max-w-[var(--anchor-width)]",
          "bg-[#27272a] border border-[#3f3f46] rounded-lg p-0 shadow-lg",
          "ring-0 overflow-hidden flex flex-col min-h-0"
        )}
        style={{ maxHeight }}
      >
        <ComboboxList
          className={cn(
            "flex-1 min-h-0 min-w-0 w-full overflow-y-auto overscroll-contain scrollbar-hide border-0 p-0",
            "max-h-[280px] sm:max-h-[320px] touch-pan-y"
          )}
          onWheel={(e) => e.stopPropagation()}
        >
          <ComboboxEmpty className="py-4 text-center text-sm text-zinc-400">
            No zone found.
          </ComboboxEmpty>
          <ComboboxCollection>
            {(group: { value: string; items: typeof prayerZones }, index: number) => (
              <div key={group.value}>
                <ComboboxGroup>
                  <ComboboxLabel
                    className={cn(
                      "px-3 py-2 text-xs font-semibold uppercase tracking-wide",
                      "text-[#3b82f6] bg-[#1f1f23]"
                    )}
                  >
                    {group.value}
                  </ComboboxLabel>
                  {group.items.map((zone) => (
                    <ComboboxItem
                      key={zone.code}
                      value={zone}
                      className={cn(
                        "px-3 py-3 text-sm text-white",
                        "data-[highlighted]:bg-[#1f1f23] data-[highlighted]:text-[#3b82f6]",
                        "data-[selected]:bg-[#1f1f23] data-[selected]:text-[#3b82f6]"
                      )}
                    >
                      {zone.code}: {zone.name}
                    </ComboboxItem>
                  ))}
                </ComboboxGroup>
                <ComboboxSeparator className="my-1 h-px bg-transparent" />
              </div>
            )}
          </ComboboxCollection>
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}
