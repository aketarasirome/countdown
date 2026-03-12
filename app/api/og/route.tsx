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

function formatSharedAt(value: string | null) {
  const date = value ? new Date(value) : new Date()
  if (Number.isNaN(date.getTime())) return "Now"
  return `${date.getFullYear()}.${date.getMonth() + 1}.${date.getDate()} ${date.getHours()}h ${date.getMinutes()}m ${date.getSeconds()}s`
}

function remainingHoursAt(sharedAt: string | null) {
  const now = sharedAt ? new Date(sharedAt) : new Date()
  if (Number.isNaN(now.getTime())) return 0
  const end = new Date(now.getFullYear(), 11, 31, 23, 59, 59)
  return Math.max(0, Math.floor((end.getTime() - now.getTime()) / 1000 / 60 / 60))
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)

  const weekdays =
    parseGroup(searchParams.get("wd")) ?? buildRatioSet(40, 20, 10, 10)
  const holidays =
    parseGroup(searchParams.get("hd")) ?? buildRatioSet(10, 40, 10, 20)
  const sharedAt = searchParams.get("sharedAt")

  const titleTime = formatSharedAt(sharedAt)
  const remain = remainingHoursAt(sharedAt)

  const commission = Math.round(remain * (weekdays.commission / 100))
  const creation = Math.round(remain * (weekdays.creation / 100))
  const research = Math.round(remain * (weekdays.research / 100))
  const life = Math.round(remain * (weekdays.life / 100))
  const sleep = Math.round(remain * (weekdays.sleep / 100))
  const elapsed = Math.max(
    0,
    365 * 24 - (commission + creation + research + life + sleep)
  )

  const totalWidth = 1060
  const widthFor = (hours: number) => `${(hours / (365 * 24)) * totalWidth}px`

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          background: "#f3f3f1",
          display: "flex",
          flexDirection: "column",
          padding: "64px 68px",
          fontFamily: "Arial, sans-serif",
          color: "#111111",
        }}
      >
        <div
          style={{
            fontSize: 46,
            fontWeight: 700,
            lineHeight: 1.1,
            marginBottom: 56,
          }}
        >
          {titleTime}
        </div>

        <div
          style={{
            fontSize: 82,
            fontWeight: 700,
            lineHeight: 1,
            marginBottom: 56,
          }}
        >
          {remain}h
        </div>

        <div
          style={{
            width: `${totalWidth}px`,
            height: "72px",
            borderRadius: "22px",
            overflow: "hidden",
            display: "flex",
            background: "#e5e5e5",
            marginBottom: 56,
          }}
        >
          <div style={{ width: widthFor(elapsed), background: "#000000" }} />
          <div style={{ width: widthFor(commission), background: "#3B82F6" }} />
          <div style={{ width: widthFor(creation), background: "#9333EA" }} />
          <div style={{ width: widthFor(research), background: "#F59E0B" }} />
          <div style={{ width: widthFor(life), background: "#10B981" }} />
          <div style={{ width: widthFor(sleep), background: "#EF4444" }} />
        </div>

        <div
          style={{
            display: "flex",
            gap: "36px",
            fontSize: 30,
            color: "#5c5c5c",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ width: 18, height: 18, background: "#000000" }} />
            <div>Total</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ width: 18, height: 18, background: "#3B82F6" }} />
            <div>Commission</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ width: 18, height: 18, background: "#9333EA" }} />
            <div>Creation</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ width: 18, height: 18, background: "#F59E0B" }} />
            <div>Research</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ width: 18, height: 18, background: "#10B981" }} />
            <div>Life</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ width: 18, height: 18, background: "#EF4444" }} />
            <div>Sleep</div>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  )
}