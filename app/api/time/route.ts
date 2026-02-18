import { NextResponse } from "next/server"

const TIMEZONE = "Asia/Kuala_Lumpur"

export async function GET() {
  try {
    const res = await fetch(
      `https://worldtimeapi.org/api/timezone/${TIMEZONE}`,
      { next: { revalidate: 0 } },
    )
    if (res.ok) {
      const data = (await res.json()) as { unixtime: number; datetime: string }
      return NextResponse.json({
        unixtime: data.unixtime,
        datetime: data.datetime,
      })
    }
  } catch {
    // Fallback: server time (client will use for sync)
  }
  return NextResponse.json({
    unixtime: Math.floor(Date.now() / 1000),
    datetime: new Date().toISOString(),
  })
}
