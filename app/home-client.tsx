"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import Holidays from "date-holidays"

type RatioSet = {
  commission: number
  creation: number
  research: number
  life: number
  sleep: number
}

type Ratio = {
  weekdays: RatioSet
  holidays: RatioSet
}

function buildRatioSet(
  commission: number,
  creation: number,
  research: number,
  life: number
): RatioSet {
  const sleep = Math.max(0, 100 - (commission + creation + research + life))
  return { commission, creation, research, life, sleep }
}

const defaultRatio: Ratio = {
  weekdays: buildRatioSet(40, 20, 10, 10),
  holidays: buildRatioSet(10, 40, 10, 20),
}

export default function HomeClient() {
  const YEAR_HOURS = 365 * 24

  const [ratio, setRatio] = useState<Ratio | null>(null)
  const [remaining, setRemaining] = useState(0)

  const hd = new Holidays("JP")

  function isHoliday(date: Date) {
    const day = date.getDay()
    if (day === 0 || day === 6) return true
    return !!hd.isHoliday(date)
  }

  useEffect(() => {
    const saved = localStorage.getItem("ratio")

    if (saved) {
      setRatio(JSON.parse(saved))
    } else {
      setRatio(defaultRatio)
    }
  }, [])

  useEffect(() => {
    const timer = setInterval(() => {
      const end = new Date(
        new Date().getFullYear(),
        11,
        31,
        23,
        59,
        59
      )

      const now = new Date()

      setRemaining(end.getTime() - now.getTime())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const remain = useMemo(() => {
    return Math.max(0, remaining / 1000 / 60 / 60)
  }, [remaining])

  const remainH = Math.floor(remain)
  const remainM = Math.floor((remain * 60) % 60)
  const remainS = Math.floor((remain * 3600) % 60)

  const blocks = useMemo(() => {
    if (!ratio) return null

    const commission = remain * (ratio.weekdays.commission / 100)
    const creation = remain * (ratio.weekdays.creation / 100)
    const research = remain * (ratio.weekdays.research / 100)
    const life = remain * (ratio.weekdays.life / 100)
    const sleep = remain * (ratio.weekdays.sleep / 100)

    const elapsed =
      YEAR_HOURS - (commission + creation + research + life + sleep)

    return {
      elapsed,
      commission,
      creation,
      research,
      life,
      sleep,
    }
  }, [ratio, remain])

  function shareUrl() {
    if (!ratio) return ""

    const wd = [
      ratio.weekdays.commission,
      ratio.weekdays.creation,
      ratio.weekdays.research,
      ratio.weekdays.life,
    ].join(",")

    const hdValues = [
      ratio.holidays.commission,
      ratio.holidays.creation,
      ratio.holidays.research,
      ratio.holidays.life,
    ].join(",")

    const now = new Date()
    const sharedAtMs = String(now.getTime())
    const tzOffset = String(now.getTimezoneOffset())
    const v = String(now.getTime())

    const params = new URLSearchParams()
    params.set("wd", wd)
    params.set("hd", hdValues)
    params.set("sharedAtMs", sharedAtMs)
    params.set("tzOffset", tzOffset)
    params.set("v", v)

    return `${window.location.origin}?${params.toString()}`
  }

  async function copyShareUrl() {
    const url = shareUrl()

    try {
      await navigator.clipboard.writeText(url)
      alert("Share URL copied")
    } catch {
      alert(url)
    }
  }

  function ShareIcon() {
    return (
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 16V4" />
        <path d="M8 8l4-4 4 4" />
        <path d="M4 14v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4" />
      </svg>
    )
  }

  if (!ratio || !blocks) return null

  const total = YEAR_HOURS

  function width(h: number) {
    return `${(h / total) * 100}%`
  }

  const now = new Date()

  return (
    <main className="font-sans max-w-4xl mx-auto px-5 py-8 sm:px-10 sm:py-16">
      <button
        aria-label="Copy share URL"
        onClick={copyShareUrl}
        className="fixed top-4 right-4 sm:top-5 sm:right-5 z-50 h-11 w-11 sm:h-12 sm:w-12 rounded-full border border-black/10 bg-white/85 text-black shadow-[0_8px_30px_rgba(0,0,0,0.08)] backdrop-blur-md flex items-center justify-center hover:bg-white active:scale-95 transition"
      >
        <ShareIcon />
      </button>

      <h1 className="text-2xl sm:text-4xl font-bold leading-tight break-words">
        {now.getFullYear()}.{now.getMonth() + 1}.{now.getDate()}{" "}
        {now.getHours()}h {now.getMinutes()}m {now.getSeconds()}s
      </h1>

      <div className="mt-10 sm:mt-16">
        <div className="text-5xl sm:text-6xl font-bold leading-none break-words">
          {remainH}h {remainM}m {remainS}s
        </div>
      </div>

      <div className="mt-10 sm:mt-16">
        <div className="w-full h-10 sm:h-14 rounded-2xl overflow-hidden flex bg-gray-100">
          <div style={{ width: width(blocks.elapsed), background: "#000000" }} />
          <div style={{ width: width(blocks.commission), background: "#3B82F6" }} />
          <div style={{ width: width(blocks.creation), background: "#9333EA" }} />
          <div style={{ width: width(blocks.research), background: "#F59E0B" }} />
          <div style={{ width: width(blocks.life), background: "#10B981" }} />
          <div style={{ width: width(blocks.sleep), background: "#EF4444" }} />
        </div>
      </div>

      <div className="mt-16 sm:mt-24 flex justify-center">
        <Link
          href="/settings"
          className="w-full sm:w-auto text-center bg-black text-white px-8 sm:px-10 py-4 rounded-xl text-base sm:text-lg hover:opacity-80 transition"
        >
          Edit Ratio
        </Link>
      </div>
    </main>
  )
}