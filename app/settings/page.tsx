"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"

type RatioBase = {
  commission: number
  creation: number
  research: number
  life: number
}

type SavedRatio = {
  weekdays: RatioBase & { sleep?: number }
  holidays: RatioBase & { sleep?: number }
}

const defaultWeekdays: RatioBase = {
  commission: 40,
  creation: 20,
  research: 10,
  life: 10,
}

const defaultHolidays: RatioBase = {
  commission: 10,
  creation: 40,
  research: 10,
  life: 20,
}

export default function Settings() {
  const router = useRouter()

  const [weekdays, setWeekdays] = useState<RatioBase>(defaultWeekdays)
  const [holidays, setHolidays] = useState<RatioBase>(defaultHolidays)

  useEffect(() => {
    const saved = localStorage.getItem("ratio")
    if (!saved) return

    try {
      const parsed: SavedRatio = JSON.parse(saved)

      if (parsed.weekdays) {
        setWeekdays({
          commission: parsed.weekdays.commission ?? defaultWeekdays.commission,
          creation: parsed.weekdays.creation ?? defaultWeekdays.creation,
          research: parsed.weekdays.research ?? defaultWeekdays.research,
          life: parsed.weekdays.life ?? defaultWeekdays.life,
        })
      }

      if (parsed.holidays) {
        setHolidays({
          commission: parsed.holidays.commission ?? defaultHolidays.commission,
          creation: parsed.holidays.creation ?? defaultHolidays.creation,
          research: parsed.holidays.research ?? defaultHolidays.research,
          life: parsed.holidays.life ?? defaultHolidays.life,
        })
      }
    } catch (error) {
      console.error("Failed to load saved ratio:", error)
    }
  }, [])

  function calcSleep(data: RatioBase) {
    const sum =
      data.commission +
      data.creation +
      data.research +
      data.life

    return Math.max(0, 100 - sum)
  }

  const weekdaySleep = useMemo(() => calcSleep(weekdays), [weekdays])
  const holidaySleep = useMemo(() => calcSleep(holidays), [holidays])

  function slider(
    title: string,
    key: keyof RatioBase,
    data: RatioBase,
    set: React.Dispatch<React.SetStateAction<RatioBase>>
  ) {
    const percent = data[key]
    const hours = (24 * percent / 100).toFixed(1)

    return (
      <div className="mb-8 sm:mb-10">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="text-xs text-gray-500 mb-1">
              {title}
            </div>

            <div className="text-xs text-gray-500">
              {percent}%
            </div>

            <div className="text-sm sm:text-base break-words">
              {hours}h / day
            </div>
          </div>
        </div>

        <input
          type="range"
          min="0"
          max="100"
          value={percent}
          onChange={(e) => {
            const value = Number(e.target.value)

            const newData: RatioBase = {
              ...data,
              [key]: value,
            }

            const sum =
              newData.commission +
              newData.creation +
              newData.research +
              newData.life

            if (sum > 100) {
              return
            }

            set(newData)
          }}
          className="w-full mt-3"
        />
      </div>
    )
  }

  function sleepSlider(data: RatioBase) {
    const percent = calcSleep(data)
    const hours = (24 * percent / 100).toFixed(1)

    return (
      <div className="mb-8 sm:mb-10 opacity-60">
        <div className="text-sm font-medium mb-1">
          Sleep
        </div>

        <div className="text-sm">
          {percent}%
        </div>

        <div className="text-xs text-gray-500">
          {hours}h / day
        </div>

        <input
          type="range"
          min="0"
          max="100"
          value={percent}
          disabled
          className="w-full mt-3"
        />
      </div>
    )
  }

  function save() {
    localStorage.setItem(
      "ratio",
      JSON.stringify({
        weekdays: {
          ...weekdays,
          sleep: weekdaySleep,
        },
        holidays: {
          ...holidays,
          sleep: holidaySleep,
        },
      })
    )

    router.push("/")
  }

  return (
    <main className="max-w-xl mx-auto px-5 py-8 sm:px-10 sm:py-16">
      <h1 className="text-2xl sm:text-3xl font-bold mb-10 sm:mb-14 leading-tight">
        Edit Time Ratio
      </h1>

      <section className="mb-12 sm:mb-16">
        <h2 className="text-lg sm:text-xl mb-2 text-gray-500">
          Weekdays
        </h2>

        <p className="text-sm text-gray-500 mb-6 sm:mb-8 leading-6">
          Monday to Friday, excluding Japanese public holidays.
        </p>

        {slider("Commission", "commission", weekdays, setWeekdays)}
        {slider("Creation", "creation", weekdays, setWeekdays)}
        {slider("Research", "research", weekdays, setWeekdays)}
        {slider("Life", "life", weekdays, setWeekdays)}
        {sleepSlider(weekdays)}
      </section>

      <section>
        <h2 className="text-lg sm:text-xl mb-2 text-gray-500">
          Holidays
        </h2>

        <p className="text-sm text-gray-500 mb-6 sm:mb-8 leading-6">
          Saturdays, Sundays, and Japanese public holidays.
        </p>

        {slider("Commission", "commission", holidays, setHolidays)}
        {slider("Creation", "creation", holidays, setHolidays)}
        {slider("Research", "research", holidays, setHolidays)}
        {slider("Life", "life", holidays, setHolidays)}
        {sleepSlider(holidays)}
      </section>

      <div className="mt-10 sm:mt-14 rounded-2xl border border-gray-200 p-4 sm:p-5 text-sm text-gray-600 leading-6">
        <div className="mb-2 font-medium text-black">
          How this is used on the dashboard
        </div>
        <div>
          W = remaining / total time on weekdays
        </div>
        <div>
          H = remaining / total time on holidays
        </div>
      </div>

      <button
        onClick={save}
        className="
          mt-12 sm:mt-20
          w-full
          bg-black
          text-white
          py-4
          rounded-xl
          text-base sm:text-lg
          hover:opacity-80
          transition
        "
      >
        Save
      </button>
    </main>
  )
}