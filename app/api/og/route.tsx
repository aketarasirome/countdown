import { ImageResponse } from "next/og"

export const runtime = "edge"

function buildRatioSet(
  commission: number,
  creation: number,
  research: number,
  life: number
) {
  const sleep = Math.max(0, 100 - (commission + creation + research + life))
  return { commission, creation, research, life, sleep }
}

function parseGroup(value: string | null) {
  if (!value) return null
  const parts = value.split(",").map((v) => Number(v))
  if (parts.length !== 4 || parts.some((n) => Number.isNaN(n))) return null
  return buildRatioSet(parts[0], parts[1], parts[2], parts[3])
}

function getShiftedDate(sharedAtMs: string | null, tzOffset: string | null) {
  if (!sharedAtMs || !tzOffset) return null

  const ms = Number(sharedAtMs)
  const offset = Number(tzOffset)

  if (Number.isNaN(ms) || Number.isNaN(offset)) return null

  return new Date(ms - offset * 60 * 1000)
}

function remainingTimeAt(sharedAtMs: string | null, tzOffset: string | null) {
  const shifted = getShiftedDate(sharedAtMs, tzOffset)

  if (!shifted) {
    const now = new Date()
    const end = new Date(now.getFullYear(), 11, 31, 23, 59, 59)
    const diff = Math.max(0, end.getTime() - now.getTime())

    return {
      h: Math.floor(diff / 1000 / 60 / 60),
      m: Math.floor((diff / 1000 / 60) % 60),
      s: Math.floor((diff / 1000) % 60),
      totalHours: diff / 1000 / 60 / 60,
    }
  }

  const localYear = shifted.getUTCFullYear()
  const endShiftedMs = Date.UTC(localYear, 11, 31, 23, 59, 59)
  const diff = Math.max(0, endShiftedMs - shifted.getTime())

  return {
    h: Math.floor(diff / 1000 / 60 / 60),
    m: Math.floor((diff / 1000 / 60) % 60),
    s: Math.floor((diff / 1000) % 60),
    totalHours: diff / 1000 / 60 / 60,
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)

  const weekdays =
    parseGroup(searchParams.get("wd")) ?? buildRatioSet(40, 20, 10, 10)

  const holidays =
    parseGroup(searchParams.get("hd")) ?? buildRatioSet(10, 40, 10, 20)

  const sharedAtMs = searchParams.get("sharedAtMs")
  const tzOffset = searchParams.get("tzOffset")
  const sharedLabel = searchParams.get("sharedLabel")

  const titleTime =
    sharedLabel ||
    (() => {
      const now = new Date()
      return `${now.getFullYear()}.${now.getMonth() + 1}.${now.getDate()} ${now.getHours()}h ${now.getMinutes()}m ${now.getSeconds()}s`
    })()

  const remainTime = remainingTimeAt(sharedAtMs, tzOffset)
  const remain = remainTime.totalHours

  const commission = Math.round(remain * (weekdays.commission / 100))
  const creation = Math.round(remain * (weekdays.creation / 100))
  const research = Math.round(remain * (weekdays.research / 100))
  const life = Math.round(remain * (weekdays.life / 100))
  const sleep = Math.round(remain * (weekdays.sleep / 100))

  const elapsed = Math.max(
    0,
    365 * 24 - (commission + creation + research + life + sleep)
  )

  const totalHours = 365 * 24
  const totalWidth = 1060

  const widthFor = (hours: number) =>
    Math.max(0, Math.round((hours / totalHours) * totalWidth))

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#f3f3f1",
          padding: "64px 68px",
          color: "#111111",
          fontFamily:
            'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif',
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 44,
            fontWeight: 700,
            lineHeight: 1.1,
            letterSpacing: "-0.03em",
            marginBottom: 56,
          }}
        >
          {titleTime}
        </div>

        <div
          style={{
            display: "flex",
            fontSize: 82,
            fontWeight: 700,
            lineHeight: 1,
            letterSpacing: "-0.05em",
            marginBottom: 56,
          }}
        >
          {remainTime.h}h {remainTime.m}m {remainTime.s}s
        </div>

        <div
          style={{
            display: "flex",
            width: `${totalWidth}px`,
            height: "72px",
            overflow: "hidden",
            borderRadius: "22px",
            backgroundColor: "#e5e5e5",
            marginBottom: 56,
          }}
        >
          <div style={{ display: "flex", width: `${widthFor(elapsed)}px`, height: "72px", backgroundColor: "#000000" }} />
          <div style={{ display: "flex", width: `${widthFor(commission)}px`, height: "72px", backgroundColor: "#3B82F6" }} />
          <div style={{ display: "flex", width: `${widthFor(creation)}px`, height: "72px", backgroundColor: "#9333EA" }} />
          <div style={{ display: "flex", width: `${widthFor(research)}px`, height: "72px", backgroundColor: "#F59E0B" }} />
          <div style={{ display: "flex", width: `${widthFor(life)}px`, height: "72px", backgroundColor: "#10B981" }} />
          <div style={{ display: "flex", width: `${widthFor(sleep)}px`, height: "72px", backgroundColor: "#EF4444" }} />
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "row",
            flexWrap: "wrap",
            gap: "22px",
            color: "#5c5c5c",
            fontSize: 28,
            fontWeight: 400,
          }}
        >
          {[
            ["#000000", "Elapsed"],
            ["#3B82F6", "Commission"],
            ["#9333EA", "Creation"],
            ["#F59E0B", "Research"],
            ["#10B981", "Life"],
            ["#EF4444", "Sleep"],
          ].map(([color, label]) => (
            <div
              key={label}
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <div
                style={{
                  display: "flex",
                  width: "18px",
                  height: "18px",
                  backgroundColor: color,
                  marginRight: "10px",
                }}
              />
              <div style={{ display: "flex" }}>{label}</div>
            </div>
          ))}
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  )
}