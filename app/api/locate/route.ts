import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const lat = searchParams.get("lat")
  const lng = searchParams.get("lng")

  if (!lat || !lng) {
    return NextResponse.json({ error: "Missing lat/lng" }, { status: 400 })
  }

  try {
    const res = await fetch(`https://api.waktusolat.app/v2/solat/gps/${lat}/${lng}`, {
      headers: { Accept: "application/json" },
    })

    if (!res.ok) {
      throw new Error("Failed to fetch zone")
    }

    const data = await res.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Locate API error:", error)
    return NextResponse.json({ error: "Failed to get zone" }, { status: 500 })
  }
}
