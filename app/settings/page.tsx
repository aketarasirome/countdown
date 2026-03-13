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

type Language = "en" | "jp"

type ItemMetrics = {
  remainDays: number
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

function parseRatioBaseFromQuery(value: string | null): RatioBase | null {
  if (!value) return null

  const parts = value.split(",").map((v) => Number(v))
  if (parts.length !== 4 || parts.some((n) => Number.isNaN(n))) {
    return null
  }

  const [commission, creation, research, life] = parts
  const sum = commission + creation + research + life

  if (sum > 100) return null

  return { commission, creation, research, life }
}

export default function Settings() {
  const router = useRouter()

  const [weekdays, setWeekdays] = useState<RatioBase>(defaultWeekdays)
  const [holidays, setHolidays] = useState<RatioBase>(defaultHolidays)
  const [language, setLanguage] = useState<Language>("en")
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)

    const wdFromUrl = parseRatioBaseFromQuery(params.get("wd"))
    const hdFromUrl = parseRatioBaseFromQuery(params.get("hd"))

    if (wdFromUrl && hdFromUrl) {
      setWeekdays(wdFromUrl)
      setHolidays(hdFromUrl)
      return
    }

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

  useEffect(() => {
    const savedLanguage = localStorage.getItem("settingsLanguage")
    if (savedLanguage === "jp" || savedLanguage === "en") {
      setLanguage(savedLanguage)
    }
  }, [])

  useEffect(() => {
    localStorage.setItem("settingsLanguage", language)
  }, [language])

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date())
    }, 1000)

    return () => clearInterval(timer)
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

  const t =
    language === "jp"
      ? {
          title: "時間配分を編集",
          weekdays: "平日",
          weekdaysDesc: "月曜日から金曜日。日本の祝日を除きます。",
          holidays: "土日祝",
          holidaysDesc: "土曜、日曜、日本の祝日。",
          commission: "仕事",
          creation: "制作",
          research: "勉強",
          life: "家事育児",
          sleep: "睡眠",
          save: "保存",
          howUsed: "How this is used on the dashboard",
          howUsed1: "W = 平日の残り時間 / 合計時間",
          howUsed2: "H = 土日祝の残り時間 / 合計時間",
          resetLabel: "初期値に戻す",
          langLabel: "日本語 / English",
        }
      : {
          title: "Edit Time Ratio",
          weekdays: "Weekdays",
          weekdaysDesc: "Monday to Friday, excluding Japanese public holidays.",
          holidays: "Holidays",
          holidaysDesc: "Saturdays, Sundays, and Japanese public holidays.",
          commission: "Commission",
          creation: "Creation",
          research: "Research",
          life: "Life",
          sleep: "Sleep",
          save: "Save",
          howUsed: "How this is used on the dashboard",
          howUsed1: "W = remaining / total time on weekdays",
          howUsed2: "H = remaining / total time on holidays",
          resetLabel: "Reset to default",
          langLabel: "日本語 / English",
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

            if (sum > 100) return

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
          {t.sleep}
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

  const calendarCounts = useMemo(() => {
    const endOfYear = new Date(now.getFullYear(), 11, 31)

    const tomorrow = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1
    )

    const isHoliday = (date: Date) => {
      const day = date.getDay()
      return day === 0 || day === 6
    }

    let weekdayRemainDaysYear = 0
    let holidayRemainDaysYear = 0

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

    return {
      weekdayRemainDaysYear,
      holidayRemainDaysYear,
    }
  }, [now])

  const summaryMetrics = useMemo(() => {
    const currentDayRemainingHours =
      24 - now.getHours() - now.getMinutes() / 60 - now.getSeconds() / 3600

    const currentDayType =
      now.getDay() === 0 || now.getDay() === 6 ? "holidays" : "weekdays"

    function calcRemainDays(
      weekdayPercent: number,
      holidayPercent: number
    ): ItemMetrics {
      const remainHours =
        calendarCounts.weekdayRemainDaysYear * 24 * (weekdayPercent / 100) +
        calendarCounts.holidayRemainDaysYear * 24 * (holidayPercent / 100) +
        currentDayRemainingHours *
          ((currentDayType === "weekdays" ? weekdayPercent : holidayPercent) /
            100)

      return {
        remainDays: Math.round(remainHours / 24),
      }
    }

    return {
      commission: calcRemainDays(
        weekdays.commission,
        holidays.commission
      ),
      creation: calcRemainDays(
        weekdays.creation,
        holidays.creation
      ),
      research: calcRemainDays(
        weekdays.research,
        holidays.research
      ),
      life: calcRemainDays(
        weekdays.life,
        holidays.life
      ),
      sleep: calcRemainDays(
        weekdaySleep,
        holidaySleep
      ),
    }
  }, [
    now,
    weekdays,
    holidays,
    weekdaySleep,
    holidaySleep,
    calendarCounts,
  ])

  function jpHoursLine(
    prefix: string,
    data: RatioBase,
    sleep: number,
    lifeLabel: string
  ) {
    const commissionHours = Math.round((24 * data.commission) / 100)
    const creationHours = Math.round((24 * data.creation) / 100)
    const researchHours = Math.round((24 * data.research) / 100)
    const lifeHours = Math.round((24 * data.life) / 100)
    const sleepHours = Math.round((24 * sleep) / 100)

    return `${prefix}：仕事 ${commissionHours}時間、制作 ${creationHours}時間、勉強 ${researchHours}時間、${lifeLabel} ${lifeHours}時間、睡眠 ${sleepHours}時間`
  }

  function enHoursLine(prefix: string, data: RatioBase, sleep: number) {
    const commissionHours = Math.round((24 * data.commission) / 100)
    const creationHours = Math.round((24 * data.creation) / 100)
    const researchHours = Math.round((24 * data.research) / 100)
    const lifeHours = Math.round((24 * data.life) / 100)
    const sleepHours = Math.round((24 * sleep) / 100)

    return `${prefix}: Commission ${commissionHours}h, Creation ${creationHours}h, Research ${researchHours}h, Life ${lifeHours}h, Sleep ${sleepHours}h`
  }

  const settingsText = useMemo(() => {
    if (language === "jp") {
      return {
        weekdays: jpHoursLine("平日", weekdays, weekdaySleep, "家事育児"),
        holidays: jpHoursLine("土日祝", holidays, holidaySleep, "家事"),
        remaining: `のこり時間：仕事 ${summaryMetrics.commission.remainDays}日、制作 ${summaryMetrics.creation.remainDays}日、勉強 ${summaryMetrics.research.remainDays}日、家事育児 ${summaryMetrics.life.remainDays}日、睡眠 ${summaryMetrics.sleep.remainDays}日`,
      }
    }

    return {
      weekdays: enHoursLine("Weekdays", weekdays, weekdaySleep),
      holidays: enHoursLine("Weekends & holidays", holidays, holidaySleep),
      remaining: `Remaining time: Commission ${summaryMetrics.commission.remainDays} days, Creation ${summaryMetrics.creation.remainDays} days, Research ${summaryMetrics.research.remainDays} days, Life ${summaryMetrics.life.remainDays} days, Sleep ${summaryMetrics.sleep.remainDays} days`,
    }
  }, [
    language,
    weekdays,
    holidays,
    weekdaySleep,
    holidaySleep,
    summaryMetrics,
  ])

  function resetToDefault() {
    setWeekdays(defaultWeekdays)
    setHolidays(defaultHolidays)
  }

  function save() {
    const payload = {
      weekdays: {
        ...weekdays,
        sleep: weekdaySleep,
      },
      holidays: {
        ...holidays,
        sleep: holidaySleep,
      },
    }

    localStorage.setItem("ratio", JSON.stringify(payload))

    const wd = [
      weekdays.commission,
      weekdays.creation,
      weekdays.research,
      weekdays.life,
    ].join(",")

    const hd = [
      holidays.commission,
      holidays.creation,
      holidays.research,
      holidays.life,
    ].join(",")

    router.push(`/?wd=${wd}&hd=${hd}`)
  }

  function RefreshIcon() {
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
        <path d="M21 2v6h-6" />
        <path d="M3 12a9 9 0 0 1 15-6l3 2" />
        <path d="M3 22v-6h6" />
        <path d="M21 12a9 9 0 0 1-15 6l-3-2" />
      </svg>
    )
  }

  return (
    <main className="max-w-xl mx-auto px-5 py-8 sm:px-10 sm:py-16">
      <div className="fixed top-4 right-4 sm:top-5 sm:right-5 z-50 flex gap-3">
        <button
          type="button"
          onClick={() => setLanguage((prev) => (prev === "en" ? "jp" : "en"))}
          aria-label={t.langLabel}
          title={t.langLabel}
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
          type="button"
          onClick={resetToDefault}
          aria-label={t.resetLabel}
          title={t.resetLabel}
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
          <RefreshIcon />
        </button>
      </div>

      <h1 className="text-2xl sm:text-3xl font-bold mb-10 sm:mb-14 leading-tight">
        {t.title}
      </h1>

      <section className="mb-12 sm:mb-16">
        <h2 className="text-lg sm:text-xl mb-2 text-gray-500">
          {t.weekdays}
        </h2>

        <p className="text-sm text-gray-500 mb-6 sm:mb-8 leading-6">
          {t.weekdaysDesc}
        </p>

        {slider(t.commission, "commission", weekdays, setWeekdays)}
        {slider(t.creation, "creation", weekdays, setWeekdays)}
        {slider(t.research, "research", weekdays, setWeekdays)}
        {slider(t.life, "life", weekdays, setWeekdays)}
        {sleepSlider(weekdays)}
      </section>

      <section>
        <h2 className="text-lg sm:text-xl mb-2 text-gray-500">
          {t.holidays}
        </h2>

        <p className="text-sm text-gray-500 mb-6 sm:mb-8 leading-6">
          {t.holidaysDesc}
        </p>

        {slider(t.commission, "commission", holidays, setHolidays)}
        {slider(t.creation, "creation", holidays, setHolidays)}
        {slider(t.research, "research", holidays, setHolidays)}
        {slider(t.life, "life", holidays, setHolidays)}
        {sleepSlider(holidays)}
      </section>

      <div className="mt-10 sm:mt-14 rounded-2xl border border-gray-200 p-4 sm:p-5 text-sm text-gray-600 leading-6">
        <div className="mb-2 font-medium text-black">
          {t.howUsed}
        </div>
        <div>
          {t.howUsed1}
        </div>
        <div className="mb-4">
          {t.howUsed2}
        </div>

        <div className="space-y-2 whitespace-pre-wrap break-words">
          <div>{settingsText.weekdays}</div>
          <div>{settingsText.holidays}</div>
          <div>{settingsText.remaining}</div>
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
        {t.save}
      </button>
    </main>
  )
}