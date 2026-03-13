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

type ItemMetrics = {
  yearRemainHours: number
  yearTotalHours: number
  monthRemainHours: number
  monthTotalHours: number
  dayRemainHours: number
  dayTotalHours: number
  weekdayRemainHours: number
  weekdayTotalHours: number
  holidayRemainHours: number
  holidayTotalHours: number
}

type Language = "en" | "jp"

const defaultRatio: Ratio = {
  weekdays: {
    commission: 40,
    creation: 20,
    research: 10,
    life: 10,
    sleep: 20,
  },
  holidays: {
    commission: 10,
    creation: 40,
    research: 10,
    life: 20,
    sleep: 20,
  },
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

function parseRatioFromUrl(): Ratio | null {
  if (typeof window === "undefined") return null

  const params = new URLSearchParams(window.location.search)
  const wd = params.get("wd")
  const hd = params.get("hd")

  if (!wd || !hd) return null

  const parseGroup = (value: string) => {
    const parts = value.split(",").map((v) => Number(v))
    if (parts.length !== 4 || parts.some((n) => Number.isNaN(n))) {
      return null
    }
    return buildRatioSet(parts[0], parts[1], parts[2], parts[3])
  }

  const weekdays = parseGroup(wd)
  const holidays = parseGroup(hd)

  if (!weekdays || !holidays) return null

  return { weekdays, holidays }
}

export default function HomeClient() {
  const YEAR_HOURS = 365 * 24

  const [ratio, setRatio] = useState<Ratio>(defaultRatio)
  const [now, setNow] = useState(new Date())
  const [language, setLanguage] = useState<Language>("en")

  const hd = useMemo(() => new Holidays("JP"), [])

  useEffect(() => {
    const savedLanguage = localStorage.getItem("settingsLanguage")
    if (savedLanguage === "jp" || savedLanguage === "en") {
      setLanguage(savedLanguage)
    }
  }, [])

  useEffect(() => {
    localStorage.setItem("settingsLanguage", language)
  }, [language])

  function isHoliday(date: Date) {
    const day = date.getDay()
    if (day === 0 || day === 6) return true
    return !!hd.isHoliday(date)
  }

  useEffect(() => {
    const urlRatio = parseRatioFromUrl()
    if (urlRatio) {
      setRatio(urlRatio)
      return
    }

    const saved = localStorage.getItem("ratio")
    if (saved) {
      try {
        setRatio(JSON.parse(saved))
      } catch (error) {
        console.error("Failed to parse saved ratio:", error)
      }
    }
  }, [])

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  function remainingMs() {
    const end = new Date(now.getFullYear(), 11, 31, 23, 59, 59)
    return Math.max(0, end.getTime() - now.getTime())
  }

  function hours(ms: number) {
    return Math.max(0, Math.floor(ms / 1000 / 60 / 60))
  }

  function minutes(ms: number) {
    return Math.floor((ms / 1000 / 60) % 60)
  }

  function seconds(ms: number) {
    return Math.floor((ms / 1000) % 60)
  }

  function hoursToDays(h: number) {
    return Math.round(h / 24)
  }

  function formatCurrentTime(date: Date) {
    return `${date.getFullYear()}.${date.getMonth() + 1}.${date.getDate()} ${date.getHours()}h ${date.getMinutes()}m ${date.getSeconds()}s`
  }

  const remaining = remainingMs()
  const remainingHours = hours(remaining)
  const syncedDigit = seconds(remaining) % 10

  const calendarCounts = useMemo(() => {
    const startOfYear = new Date(now.getFullYear(), 0, 1)
    const endOfYear = new Date(now.getFullYear(), 11, 31)

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

    const tomorrow = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1
    )

    let weekdayTotalDaysYear = 0
    let holidayTotalDaysYear = 0
    let weekdayRemainDaysYear = 0
    let holidayRemainDaysYear = 0

    let weekdayTotalDaysMonth = 0
    let holidayTotalDaysMonth = 0
    let weekdayRemainDaysMonth = 0
    let holidayRemainDaysMonth = 0

    {
      const cursor = new Date(startOfYear)
      while (cursor <= endOfYear) {
        if (isHoliday(cursor)) {
          holidayTotalDaysYear++
        } else {
          weekdayTotalDaysYear++
        }
        cursor.setDate(cursor.getDate() + 1)
      }
    }

    {
      const cursor = new Date(tomorrow)
      while (cursor <= endOfYear) {
        if (isHoliday(cursor)) {
          holidayRemainDaysYear++
        } else {
          weekdayRemainDaysYear++
        }
        cursor.setDate(cursor.getDate() + 1)
      }
    }

    {
      const cursor = new Date(startOfMonth)
      while (cursor <= endOfMonth) {
        if (isHoliday(cursor)) {
          holidayTotalDaysMonth++
        } else {
          weekdayTotalDaysMonth++
        }
        cursor.setDate(cursor.getDate() + 1)
      }
    }

    {
      const cursor = new Date(tomorrow)
      while (cursor <= endOfMonth) {
        if (isHoliday(cursor)) {
          holidayRemainDaysMonth++
        } else {
          weekdayRemainDaysMonth++
        }
        cursor.setDate(cursor.getDate() + 1)
      }
    }

    return {
      weekdayTotalDaysYear,
      holidayTotalDaysYear,
      weekdayRemainDaysYear,
      holidayRemainDaysYear,
      weekdayTotalDaysMonth,
      holidayTotalDaysMonth,
      weekdayRemainDaysMonth,
      holidayRemainDaysMonth,
    }
  }, [hd, now.getFullYear(), now.getMonth(), now.getDate()])

  const metrics = useMemo(() => {
    const currentDayRemainingHours =
      24 - now.getHours() - now.getMinutes() / 60 - now.getSeconds() / 3600

    const currentDayType = isHoliday(now) ? "holidays" : "weekdays"

    function calcItem(
      weekdayPercent: number,
      holidayPercent: number
    ): ItemMetrics {
      const yearTotalHours =
        calendarCounts.weekdayTotalDaysYear * 24 * (weekdayPercent / 100) +
        calendarCounts.holidayTotalDaysYear * 24 * (holidayPercent / 100)

      const yearRemainHours =
        calendarCounts.weekdayRemainDaysYear * 24 * (weekdayPercent / 100) +
        calendarCounts.holidayRemainDaysYear * 24 * (holidayPercent / 100) +
        currentDayRemainingHours *
          ((currentDayType === "weekdays" ? weekdayPercent : holidayPercent) /
            100)

      const monthTotalHours =
        calendarCounts.weekdayTotalDaysMonth * 24 * (weekdayPercent / 100) +
        calendarCounts.holidayTotalDaysMonth * 24 * (holidayPercent / 100)

      const monthRemainHours =
        calendarCounts.weekdayRemainDaysMonth * 24 * (weekdayPercent / 100) +
        calendarCounts.holidayRemainDaysMonth * 24 * (holidayPercent / 100) +
        currentDayRemainingHours *
          ((currentDayType === "weekdays" ? weekdayPercent : holidayPercent) /
            100)

      const dayTotalHours =
        24 *
        ((currentDayType === "weekdays" ? weekdayPercent : holidayPercent) / 100)

      const dayRemainHours =
        currentDayRemainingHours *
        ((currentDayType === "weekdays" ? weekdayPercent : holidayPercent) / 100)

      const weekdayTotalHours =
        calendarCounts.weekdayTotalDaysYear * 24 * (weekdayPercent / 100)

      const weekdayRemainHours =
        calendarCounts.weekdayRemainDaysYear * 24 * (weekdayPercent / 100) +
        (currentDayType === "weekdays"
          ? currentDayRemainingHours * (weekdayPercent / 100)
          : 0)

      const holidayTotalHours =
        calendarCounts.holidayTotalDaysYear * 24 * (holidayPercent / 100)

      const holidayRemainHours =
        calendarCounts.holidayRemainDaysYear * 24 * (holidayPercent / 100) +
        (currentDayType === "holidays"
          ? currentDayRemainingHours * (holidayPercent / 100)
          : 0)

      return {
        yearRemainHours,
        yearTotalHours,
        monthRemainHours,
        monthTotalHours,
        dayRemainHours,
        dayTotalHours,
        weekdayRemainHours,
        weekdayTotalHours,
        holidayRemainHours,
        holidayTotalHours,
      }
    }

    return {
      total: calcItem(100, 100),
      commission: calcItem(
        ratio.weekdays.commission,
        ratio.holidays.commission
      ),
      creation: calcItem(
        ratio.weekdays.creation,
        ratio.holidays.creation
      ),
      research: calcItem(
        ratio.weekdays.research,
        ratio.holidays.research
      ),
      life: calcItem(
        ratio.weekdays.life,
        ratio.holidays.life
      ),
      sleep: calcItem(
        ratio.weekdays.sleep,
        ratio.holidays.sleep
      ),
    }
  }, [
    ratio,
    calendarCounts,
    now.getHours(),
    now.getMinutes(),
    now.getSeconds(),
  ])

  const elapsedHours = YEAR_HOURS - remainingHours

  const segments = [
    { key: "elapsed", value: elapsedHours, color: "#000000" },
    {
      key: "commission",
      value: metrics.commission.yearRemainHours,
      color: "#3B82F6",
    },
    {
      key: "creation",
      value: metrics.creation.yearRemainHours,
      color: "#9333EA",
    },
    {
      key: "research",
      value: metrics.research.yearRemainHours,
      color: "#F59E0B",
    },
    { key: "life", value: metrics.life.yearRemainHours, color: "#10B981" },
    { key: "sleep", value: metrics.sleep.yearRemainHours, color: "#EF4444" },
  ]

  function segmentWidth(hoursValue: number) {
    return `${(hoursValue / YEAR_HOURS) * 100}%`
  }

  function shareUrl() {
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

    const current = new Date()
    const sharedAtMs = String(current.getTime())
    const tzOffset = String(current.getTimezoneOffset())
    const sharedLabel = `${current.getFullYear()}.${current.getMonth() + 1}.${current.getDate()} ${current.getHours()}h ${current.getMinutes()}m ${current.getSeconds()}s`
    const v = String(current.getTime())

    const params = new URLSearchParams()
    params.set("wd", wd)
    params.set("hd", hdValues)
    params.set("sharedAtMs", sharedAtMs)
    params.set("tzOffset", tzOffset)
    params.set("sharedLabel", sharedLabel)
    params.set("v", v)

    if (typeof window === "undefined") {
      return `/?${params.toString()}`
    }

    return `${window.location.origin}?${params.toString()}`
  }

  async function copyShareUrl() {
    const url = shareUrl()

    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(url)
        window.alert("Share URL copied")
        return
      }

      window.alert(url)
    } catch (error) {
      console.error("Failed to copy share URL:", error)
      window.alert(url)
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

  const labels =
    language === "jp"
      ? {
          total: "年間",
          commission: "仕事",
          creation: "制作",
          research: "研究",
          life: "家事育児",
          sleep: "睡眠",
          y: "年",
          m: "月",
          d: "日",
          w: "平日",
          h: "土日祝",
        }
      : {
          total: "Total",
          commission: "Commission",
          creation: "Creation",
          research: "Research",
          life: "Life",
          sleep: "Sleep",
          y: "Y",
          m: "M",
          d: "D",
          w: "W",
          h: "H",
        }

  function MetricLine({
    label,
    remainHours,
    totalHours,
    showDays = true,
  }: {
    label: string
    remainHours: number
    totalHours: number
    showDays?: boolean
  }) {
    if (language === "jp") {
      return (
        <div className="break-words">
          <span className="inline-block min-w-[3.2rem]">{label} :</span>{" "}
          {Math.round(remainHours)}
          <span className="text-[0.85em] text-gray-500">時間</span>
          {showDays && (
            <span className="text-gray-400 ml-0.5">
              ({hoursToDays(remainHours)}
              <span className="text-[0.85em]">日</span>)
            </span>
          )}
          /
          {Math.round(totalHours)}
          <span className="text-[0.85em] text-gray-500">時間</span>
          {showDays && (
            <span className="text-gray-400 ml-0.5">
              ({hoursToDays(totalHours)}
              <span className="text-[0.85em]">日</span>)
            </span>
          )}
        </div>
      )
    }

    return (
      <div className="break-words">
        <span className="inline-block min-w-[1.6rem]">{label} :</span>{" "}
        {Math.round(remainHours)}h
        {showDays && (
          <span className="text-gray-400 ml-0.5">
            ({hoursToDays(remainHours)}d)
          </span>
        )}
        /
        {Math.round(totalHours)}h
        {showDays && (
          <span className="text-gray-400 ml-0.5">
            ({hoursToDays(totalHours)}d)
          </span>
        )}
      </div>
    )
  }

  function block(title: string, color: string, data: ItemMetrics) {
    return (
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <div
            className="shrink-0"
            style={{ width: 12, height: 12, background: color }}
          />
          <div className="text-gray-600 text-base sm:text-lg">{title}</div>
        </div>

        <div className="mt-3 text-xs sm:text-sm leading-7 sm:leading-8 break-words">
          <MetricLine
            label={labels.y}
            remainHours={data.yearRemainHours}
            totalHours={data.yearTotalHours}
          />
          <MetricLine
            label={labels.m}
            remainHours={data.monthRemainHours}
            totalHours={data.monthTotalHours}
          />
          <MetricLine
            label={labels.d}
            remainHours={data.dayRemainHours}
            totalHours={data.dayTotalHours}
            showDays={false}
          />
          <MetricLine
            label={labels.w}
            remainHours={data.weekdayRemainHours}
            totalHours={data.weekdayTotalHours}
          />
          <MetricLine
            label={labels.h}
            remainHours={data.holidayRemainHours}
            totalHours={data.holidayTotalHours}
          />
        </div>
      </div>
    )
  }

  return (
    <main className="font-sans max-w-4xl mx-auto px-5 py-8 sm:px-10 sm:py-16">
      <div className="fixed top-4 right-4 sm:top-5 sm:right-5 z-50 flex gap-3">
        <button
          type="button"
          onClick={() => setLanguage((prev) => (prev === "en" ? "jp" : "en"))}
          aria-label="日本語 / English"
          title="日本語 / English"
          className="
            h-11 w-11 sm:h-12 sm:w-12
            rounded-full
            border border-black/10
            bg-white/85
            text-black
            shadow-[0_8px_30px_rgba(0,0,0,0.08)]
            backdrop-blur-md
            flex items-center justify-center
            hover:bg-white
            active:scale-95
            transition
            font-semibold text-sm
          "
        >
          Aあ
        </button>

        <button
          onClick={copyShareUrl}
          aria-label="Copy share URL"
          className="
            h-11 w-11 sm:h-12 sm:w-12
            rounded-full
            border border-black/10
            bg-white/85
            text-black
            shadow-[0_8px_30px_rgba(0,0,0,0.08)]
            backdrop-blur-md
            flex items-center justify-center
            hover:bg-white
            active:scale-95
            transition
          "
        >
          <ShareIcon />
        </button>
      </div>

      <h1 className="text-2xl sm:text-4xl font-bold leading-tight break-words">
        {formatCurrentTime(now)}
      </h1>

      <div className="relative mt-10 sm:mt-16">
        <div className="text-5xl sm:text-6xl font-bold leading-none break-words pr-28 sm:pr-40">
          {hours(remaining)}h {minutes(remaining)}m {seconds(remaining)}s
        </div>

        <img
          src={`/digits/${syncedDigit}.png`}
          alt=""
          className="
            absolute
            right-0
            top-1/2
            -translate-y-1/2
            w-24
            sm:w-32
            md:w-40
            pointer-events-none
            select-none
          "
        />
      </div>

      <div className="mt-10 sm:mt-16">
        <div className="w-full h-10 sm:h-14 rounded-2xl overflow-hidden flex bg-gray-100">
          {segments.map((segment) => (
            <div
              key={segment.key}
              style={{
                width: segmentWidth(segment.value),
                background: segment.color,
              }}
            />
          ))}
        </div>
      </div>

      <div className="mt-12 sm:mt-20 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-10 sm:gap-12 text-sm">
        {block(labels.total, "#000", metrics.total)}
        {block(labels.commission, "#3B82F6", metrics.commission)}
        {block(labels.creation, "#9333EA", metrics.creation)}
        {block(labels.research, "#F59E0B", metrics.research)}
        {block(labels.life, "#10B981", metrics.life)}
        {block(labels.sleep, "#EF4444", metrics.sleep)}
      </div>

      <div className="mt-16 sm:mt-24 flex justify-center">
        <Link
          href="/settings"
          className="
            w-full sm:w-auto
            text-center
            bg-black
            text-white
            px-8 sm:px-10
            py-4
            rounded-xl
            text-base sm:text-lg
            hover:opacity-80
            transition
          "
        >
          Edit Ratio
        </Link>
      </div>
    </main>
  )
}