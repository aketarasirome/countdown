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

export default function Home() {
  const YEAR_HOURS = 365 * 24

  const [ratio, setRatio] = useState<Ratio | null>(null)
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
      setRatio(JSON.parse(saved))
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
    if (!ratio) return null

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
  }, [ratio, hd, now.getFullYear(), now.getMonth(), now.getDate()])

  const metrics = useMemo(() => {
    if (!ratio || !calendarCounts) return null

    const counts = calendarCounts

    const currentDayRemainingHours =
      24 - now.getHours() - now.getMinutes() / 60 - now.getSeconds() / 3600

    const currentDayType = isHoliday(now) ? "holidays" : "weekdays"

    function calcItem(
      weekdayPercent: number,
      holidayPercent: number
    ): ItemMetrics {
      const yearTotalHours =
        counts.weekdayTotalDaysYear * 24 * (weekdayPercent / 100) +
        counts.holidayTotalDaysYear * 24 * (holidayPercent / 100)

      const yearRemainHours =
        counts.weekdayRemainDaysYear * 24 * (weekdayPercent / 100) +
        counts.holidayRemainDaysYear * 24 * (holidayPercent / 100) +
        currentDayRemainingHours *
          ((currentDayType === "weekdays" ? weekdayPercent : holidayPercent) /
            100)

      const monthTotalHours =
        counts.weekdayTotalDaysMonth * 24 * (weekdayPercent / 100) +
        counts.holidayTotalDaysMonth * 24 * (holidayPercent / 100)

      const monthRemainHours =
        counts.weekdayRemainDaysMonth * 24 * (weekdayPercent / 100) +
        counts.holidayRemainDaysMonth * 24 * (holidayPercent / 100) +
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
        counts.weekdayTotalDaysYear * 24 * (weekdayPercent / 100)

      const weekdayRemainHours =
        counts.weekdayRemainDaysYear * 24 * (weekdayPercent / 100) +
        (currentDayType === "weekdays"
          ? currentDayRemainingHours * (weekdayPercent / 100)
          : 0)

      const holidayTotalHours =
        counts.holidayTotalDaysYear * 24 * (holidayPercent / 100)

      const holidayRemainHours =
        counts.holidayRemainDaysYear * 24 * (holidayPercent / 100) +
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

  if (!ratio || !metrics) {
    return null
  }

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

  function block(
    title: string,
    color: string,
    data: ItemMetrics
  ) {
    return (
      <div>
        <div className="flex items-center gap-2">
          <div style={{ width: 12, height: 12, background: color }} />
          <div className="text-gray-600">{title}</div>
        </div>

        <div className="mt-2 font-mono text-sm">
          <div>
            Y : {Math.round(data.yearRemainHours)}h({hoursToDays(data.yearRemainHours)}d)/{Math.round(data.yearTotalHours)}h({hoursToDays(data.yearTotalHours)}d)
          </div>

          <div>
            M : {Math.round(data.monthRemainHours)}h({hoursToDays(data.monthRemainHours)}d)/{Math.round(data.monthTotalHours)}h({hoursToDays(data.monthTotalHours)}d)
          </div>

          <div>
            D : {Math.floor(data.dayRemainHours)}h/{Math.round(data.dayTotalHours)}h
          </div>

          <div>
            W : {Math.round(data.weekdayRemainHours)}h({hoursToDays(data.weekdayRemainHours)}d)/{Math.round(data.weekdayTotalHours)}h({hoursToDays(data.weekdayTotalHours)}d)
          </div>

          <div>
            H : {Math.round(data.holidayRemainHours)}h({hoursToDays(data.holidayRemainHours)}d)/{Math.round(data.holidayTotalHours)}h({hoursToDays(data.holidayTotalHours)}d)
          </div>
        </div>
      </div>
    )
  }

  return (
    <main className="max-w-4xl mx-auto px-10 py-16">
      <h1 className="text-4xl font-bold">
        {formatCurrentTime(now)}
      </h1>

      <div className="mt-16">
        <div className="text-6xl font-bold mt-2">
          {hours(remaining)}h {minutes(remaining)}m {seconds(remaining)}s
        </div>
      </div>

      <div className="mt-16">
        <div className="w-full h-14 rounded-xl overflow-hidden flex bg-gray-100">
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

      <div className="mt-20 grid grid-cols-3 gap-12 text-sm">
        {block("Total", "#000", metrics.total)}
        {block("Commission", "#3B82F6", metrics.commission)}
        {block("Creation", "#9333EA", metrics.creation)}
        {block("Research", "#F59E0B", metrics.research)}
        {block("Life", "#10B981", metrics.life)}
        {block("Sleep", "#EF4444", metrics.sleep)}
      </div>

      <div className="mt-24 flex justify-center">
        <Link
          href="/settings"
          className="
            bg-black
            text-white
            px-10
            py-4
            rounded-xl
            text-lg
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