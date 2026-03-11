"use client"

import { useEffect, useState } from "react"
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

  function slider(
    title: string,
    key: keyof RatioBase,
    data: RatioBase,
    set: React.Dispatch<React.SetStateAction<RatioBase>>
  ) {
    const percent = data[key]
    const hours = (24 * percent / 100).toFixed(1)

    return (
      <div className="mb-10">
        <div className="text-xs text-gray-500 mb-1">
          {title}
        </div>

        <div className="text-xs text-gray-500">
          {percent}%
        </div>

        <div className="text-base">
          {hours}h / day
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
          className="w-full"
        />
      </div>
    )
  }

  function sleepSlider(data: RatioBase) {
    const percent = calcSleep(data)
    const hours = (24 * percent / 100).toFixed(1)

    return (
      <div className="mb-10 opacity-60">
        <div className="text-sm font-medium mb-1">
          Sleep
        </div>

        <div className="text-sm">
          {percent}%
        </div>

        <div className="text-xs text-gray-500 mb-3">
          {hours}h / day
        </div>

        <input
          type="range"
          min="0"
          max="100"
          value={percent}
          disabled
          className="w-full"
        />
      </div>
    )
  }

  function save() {
    const weekdaysSleep = calcSleep(weekdays)
    const holidaysSleep = calcSleep(holidays)

    localStorage.setItem(
      "ratio",
      JSON.stringify({
        weekdays: {
          ...weekdays,
          sleep: weekdaysSleep,
        },
        holidays: {
          ...holidays,
          sleep: holidaysSleep,
        },
      })
    )

    router.push("/")
  }

  return (
    <main className="max-w-xl mx-auto px-10 py-16">
      <h1 className="text-3xl font-bold mb-14">
        Edit Time Ratio
      </h1>

      <h2 className="text-xl mb-8 text-gray-500">
        Weekdays
      </h2>

      {slider("Commission", "commission", weekdays, setWeekdays)}
      {slider("Creation", "creation", weekdays, setWeekdays)}
      {slider("Research", "research", weekdays, setWeekdays)}
      {slider("Life", "life", weekdays, setWeekdays)}
      {sleepSlider(weekdays)}

      <h2 className="text-xl mt-16 mb-8 text-gray-500">
        Holidays
      </h2>

      {slider("Commission", "commission", holidays, setHolidays)}
      {slider("Creation", "creation", holidays, setHolidays)}
      {slider("Research", "research", holidays, setHolidays)}
      {slider("Life", "life", holidays, setHolidays)}
      {sleepSlider(holidays)}

      <button
        onClick={save}
        className="
          mt-20
          w-full
          bg-black
          text-white
          py-4
          rounded-xl
          text-lg
          hover:opacity-80
          transition
        "
      >
        Save
      </button>
    </main>
  )
}