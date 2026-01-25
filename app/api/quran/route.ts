import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const endpoint = searchParams.get("endpoint")

  if (!endpoint) {
    return NextResponse.json({ error: "Endpoint required" }, { status: 400 })
  }

  try {
    const res = await fetch(`https://api.alquran.cloud/v1/${endpoint}`, {
      headers: {
        Accept: "application/json",
      },
      next: { revalidate: 3600 },
    })

    if (!res.ok) {
      throw new Error(`API returned ${res.status}`)
    }

    const data = await res.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Quran API error:", error)
    return NextResponse.json({ error: "Failed to fetch from Quran API" }, { status: 500 })
  }
}
