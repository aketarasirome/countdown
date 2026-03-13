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

type Snapshot = {
  weekdays: RatioBase
  holidays: RatioBase
  weekdaySleep: number
  holidaySleep: number
  now: number
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

function calcSleep(data: RatioBase) {
  const sum =
    data.commission +
    data.creation +
    data.research +
    data.life

  return Math.max(0, 100 - sum)
}

function calcRemainDaysFromSnapshot(
  snapshotNow: Date,
  weekdays: RatioBase,
  holidays: RatioBase,
  weekdaySleep: number,
  holidaySleep: number
) {
  const endOfYear = new Date(snapshotNow.getFullYear(), 11, 31)

  const tomorrow = new Date(
    snapshotNow.getFullYear(),
    snapshotNow.getMonth(),
    snapshotNow.getDate() + 1
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

  const currentDayRemainingHours =
    24 -
    snapshotNow.getHours() -
    snapshotNow.getMinutes() / 60 -
    snapshotNow.getSeconds() / 3600

  const currentDayType =
    snapshotNow.getDay() === 0 || snapshotNow.getDay() === 6
      ? "holidays"
      : "weekdays"

  function calcRemainDays(
    weekdayPercent: number,
    holidayPercent: number
  ): ItemMetrics {
    const remainHours =
      weekdayRemainDaysYear * 24 * (weekdayPercent / 100) +
      holidayRemainDaysYear * 24 * (holidayPercent / 100) +
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
}

export default function Settings() {
  const router = useRouter()

  const [weekdays, setWeekdays] = useState<RatioBase>(defaultWeekdays)
  const [holidays, setHolidays] = useState<RatioBase>(defaultHolidays)
  const [language, setLanguage] = useState<Language>("en")
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)

    const wdFromUrl = parseRatioBaseFromQuery(params.get("wd"))
    const hdFromUrl = parseRatioBaseFromQuery(params.get("hd"))

    if (wdFromUrl && hdFromUrl) {
      setWeekdays(wdFromUrl)
      setHolidays(hdFromUrl)
      setSnapshot({
        weekdays: wdFromUrl,
        holidays: hdFromUrl,
        weekdaySleep: calcSleep(wdFromUrl),
        holidaySleep: calcSleep(hdFromUrl),
        now: Date.now(),
      })
      return
    }

    const saved = localStorage.getItem("ratio")
    if (!saved) {
      setSnapshot({
        weekdays: defaultWeekdays,
        holidays: defaultHolidays,
        weekdaySleep: calcSleep(defaultWeekdays),
        holidaySleep: calcSleep(defaultHolidays),
        now: Date.now(),
      })
      return
    }

    try {
      const parsed: SavedRatio = JSON.parse(saved)

      const nextWeekdays = parsed.weekdays
        ? {
            commission:
              parsed.weekdays.commission ?? defaultWeekdays.commission,
            creation:
              parsed.weekdays.creation ?? defaultWeekdays.creation,
            research:
              parsed.weekdays.research ?? defaultWeekdays.research,
            life: parsed.weekdays.life ?? defaultWeekdays.life,
          }
        : defaultWeekdays

      const nextHolidays = parsed.holidays
        ? {
            commission:
              parsed.holidays.commission ?? defaultHolidays.commission,
            creation:
              parsed.holidays.creation ?? defaultHolidays.creation,
            research:
              parsed.holidays.research ?? defaultHolidays.research,
            life: parsed.holidays.life ?? defaultHolidays.life,
          }
        : defaultHolidays

      setWeekdays(nextWeekdays)
      setHolidays(nextHolidays)
      setSnapshot({
        weekdays: nextWeekdays,
        holidays: nextHolidays,
        weekdaySleep: calcSleep(nextWeekdays),
        holidaySleep: calcSleep(nextHolidays),
        now: Date.now(),
      })
    } catch (error) {
      console.error("Failed to load saved ratio:", error)
      setSnapshot({
        weekdays: defaultWeekdays,
        holidays: defaultHolidays,
        weekdaySleep: calcSleep(defaultWeekdays),
        holidaySleep: calcSleep(defaultHolidays),
        now: Date.now(),
      })
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
          langLabel: "日本語 / English",
          refreshText: "テキストを更新",
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
          langLabel: "日本語 / English",
          refreshText: "Refresh text",
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
    const baseSnapshot = snapshot ?? {
      weekdays,
      holidays,
      weekdaySleep,
      holidaySleep,
      now: Date.now(),
    }

    const metrics = calcRemainDaysFromSnapshot(
      new Date(baseSnapshot.now),
      baseSnapshot.weekdays,
      baseSnapshot.holidays,
      baseSnapshot.weekdaySleep,
      baseSnapshot.holidaySleep
    )

    if (language === "jp") {
      return {
        weekdays: jpHoursLine(
          "平日",
          baseSnapshot.weekdays,
          baseSnapshot.weekdaySleep,
          "家事育児"
        ),
        holidays: jpHoursLine(
          "土日祝",
          baseSnapshot.holidays,
          baseSnapshot.holidaySleep,
          "家事"
        ),
        remaining: `のこり時間：仕事 ${metrics.commission.remainDays}日、制作 ${metrics.creation.remainDays}日、勉強 ${metrics.research.remainDays}日、家事育児 ${metrics.life.remainDays}日、睡眠 ${metrics.sleep.remainDays}日`,
      }
    }

    return {
      weekdays: enHoursLine(
        "Weekdays",
        baseSnapshot.weekdays,
        baseSnapshot.weekdaySleep
      ),
      holidays: enHoursLine(
        "Weekends & holidays",
        baseSnapshot.holidays,
        baseSnapshot.holidaySleep
      ),
      remaining: `Remaining time: Commission ${metrics.commission.remainDays} days, Creation ${metrics.creation.remainDays} days, Research ${metrics.research.remainDays} days, Life ${metrics.life.remainDays} days, Sleep ${metrics.sleep.remainDays} days`,
    }
  }, [language, snapshot, weekdays, holidays, weekdaySleep, holidaySleep])

  function refreshTextSnapshot() {
    setSnapshot({
      weekdays: { ...weekdays },
      holidays: { ...holidays },
      weekdaySleep,
      holidaySleep,
      now: Date.now(),
    })
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

        <button
          type="button"
          onClick={refreshTextSnapshot}
          className="
            mt-4
            inline-flex
            items-center
            rounded-lg
            border border-gray-200
            px-3 py-1.5
            text-xs
            text-gray-600
            hover:bg-gray-50
            transition
          "
        >
          {t.refreshText}
        </button>
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