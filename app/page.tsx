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

export default function Home() {
  const YEAR_HOURS = 365 * 24

  const [ratio, setRatio] = useState<Ratio>(defaultRatio)
  const [now, setNow] = useState(new Date())

  const hd = useMemo(() => new Holidays("JP"), [])

  function isHoliday(date: Date) {
    const day = date.getDay()
    if (day === 0 || day === 6) return true
    return !!hd.isHoliday(date)
  }

  useEffect(() => {
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
    { key: "commission", value: metrics.commission.yearRemainHours, color: "#3B82F6" },
    { key: "creation", value: metrics.creation.yearRemainHours, color: "#9333EA" },
    { key: "research", value: metrics.research.yearRemainHours, color: "#F59E0B" },
    { key: "life", value: metrics.life.yearRemainHours, color: "#10B981" },
    { key: "sleep", value: metrics.sleep.yearRemainHours, color: "#EF4444" },
  ]

  function segmentWidth(hoursValue: number) {
    return `${(hoursValue / YEAR_HOURS) * 100}%`
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

  function block(
    title: string,
    color: string,
    data: ItemMetrics
  ) {
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
            label="Y"
            remainHours={data.yearRemainHours}
            totalHours={data.yearTotalHours}
          />
          <MetricLine
            label="M"
            remainHours={data.monthRemainHours}
            totalHours={data.monthTotalHours}
          />
          <MetricLine
            label="D"
            remainHours={data.dayRemainHours}
            totalHours={data.dayTotalHours}
            showDays={false}
          />
          <MetricLine
            label="W"
            remainHours={data.weekdayRemainHours}
            totalHours={data.weekdayTotalHours}
          />
          <MetricLine
            label="H"
            remainHours={data.holidayRemainHours}
            totalHours={data.holidayTotalHours}
          />
        </div>
      </div>
    )
  }

  return (
    <main className="font-sans max-w-4xl mx-auto px-5 py-8 sm:px-10 sm:py-16">
      <h1 className="text-2xl sm:text-4xl font-bold leading-tight break-words">
        {formatCurrentTime(now)}
      </h1>

      <div className="mt-10 sm:mt-16">
        <div className="text-5xl sm:text-6xl font-bold leading-none break-words">
          {hours(remaining)}h {minutes(remaining)}m {seconds(remaining)}s
        </div>
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
        {block("Total", "#000", metrics.total)}
        {block("Commission", "#3B82F6", metrics.commission)}
        {block("Creation", "#9333EA", metrics.creation)}
        {block("Research", "#F59E0B", metrics.research)}
        {block("Life", "#10B981", metrics.life)}
        {block("Sleep", "#EF4444", metrics.sleep)}
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