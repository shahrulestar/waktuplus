import { NextResponse } from "next/server"

function formatTime(timestamp: number | string): string {
  if (typeof timestamp === "string" && timestamp.includes(":")) {
    return timestamp
  }

  if (typeof timestamp === "number" || !isNaN(Number(timestamp))) {
    const ts = typeof timestamp === "number" ? timestamp : Number(timestamp)
    const date = new Date(ts * 1000)
    return date.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "Asia/Kuala_Lumpur",
    })
  }

  return "--:--"
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const zone = searchParams.get("zone") || "WLY01"
  const year = searchParams.get("year")
  const month = searchParams.get("month")

  try {
    // Build URL with optional year/month params
    let apiUrl = `https://api.waktusolat.app/v2/solat/${zone}`
    if (year && month) {
      apiUrl = `https://api.waktusolat.app/v2/solat/${zone}?year=${year}&month=${month}`
    }

    const res = await fetch(apiUrl, {
      headers: { Accept: "application/json" },
    })

    if (res.ok) {
      const data = await res.json()

      if (data.prayers && Array.isArray(data.prayers)) {
        const transformedPrayers = data.prayers.map(
          (prayer: {
            date?: string
            hijri?: string
            day?: string
            imsak?: number | string
            fajr?: number | string
            syuruk?: number | string
            dhuhr?: number | string
            asr?: number | string
            maghrib?: number | string
            isha?: number | string
          }) => ({
            date: prayer.date,
            hijri: prayer.hijri,
            day: prayer.day,
            imsak: formatTime(prayer.imsak || 0),
            fajr: formatTime(prayer.fajr || 0),
            syuruk: formatTime(prayer.syuruk || 0),
            dhuhr: formatTime(prayer.dhuhr || 0),
            asr: formatTime(prayer.asr || 0),
            maghrib: formatTime(prayer.maghrib || 0),
            isha: formatTime(prayer.isha || 0),
          }),
        )

        return NextResponse.json({ prayers: transformedPrayers })
      }

      return NextResponse.json(data)
    }

    // Fallback to Aladhan API
    const aladhanRes = await fetch(`https://api.aladhan.com/v1/timings?latitude=3.139&longitude=101.6869&method=3`)

    if (aladhanRes.ok) {
      const aladhanData = await aladhanRes.json()
      if (aladhanData.data?.timings) {
        const timings = aladhanData.data.timings
        return NextResponse.json({
          prayers: [
            {
              date: new Date().toISOString().split("T")[0],
              fajr: timings.Fajr,
              syuruk: timings.Sunrise,
              dhuhr: timings.Dhuhr,
              asr: timings.Asr,
              maghrib: timings.Maghrib,
              isha: timings.Isha,
            },
          ],
        })
      }
    }

    return NextResponse.json({ error: "Failed to fetch prayer times" }, { status: 500 })
  } catch (error) {
    console.error("Prayer API error:", error)
    return NextResponse.json({ error: "Failed to fetch prayer times" }, { status: 500 })
  }
}
