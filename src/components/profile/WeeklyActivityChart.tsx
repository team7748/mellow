import { useState } from "react"
import type { AppLanguage } from "../../types/preferences"
import type { DailyActivitySummary } from "../../lib/activity/weeklyActivitySummary"

type WeeklyActivityChartProps = {
  days: DailyActivitySummary[]
  language: AppLanguage
}

const modeLabels = {
  flashcard: "Flashcard",
  quiz: "Quiz",
  grammar: "Grammar",
  speak: "Speak",
} as const

function toLocalDate(localDate: string) {
  const [year, month, day] = localDate.split("-").map(Number)
  return new Date(year, month - 1, day, 12)
}

export function WeeklyActivityChart({ days, language }: WeeklyActivityChartProps) {
  const [selectedDate, setSelectedDate] = useState(days.at(-1)?.localDate ?? "")
  const selectedDay = days.find((day) => day.localDate === selectedDate) ?? days.at(-1)
  const maximum = Math.max(1, ...days.map((day) => day.totalActions))
  const locale = language === "th" ? "th-TH" : "en-US"

  return (
    <div>
      <div className="flex h-24 items-end justify-between gap-2">
        {days.map((day, index) => {
          const date = toLocalDate(day.localDate)
          const isToday = index === days.length - 1
          const isSelected = day.localDate === selectedDay?.localDate
          const height = day.totalActions > 0
            ? Math.max(8, (day.totalActions / maximum) * 100)
            : 8
          const weekday = new Intl.DateTimeFormat(locale, { weekday: "narrow" }).format(date)
          const fullDate = new Intl.DateTimeFormat(locale, {
            weekday: "long",
            day: "numeric",
            month: "short",
          }).format(date)

          return (
            <button
              key={day.localDate}
              type="button"
              aria-label={`${fullDate}: ${day.totalActions} ${language === "th" ? "กิจกรรม" : "activities"}`}
              aria-pressed={isSelected}
              onClick={() => setSelectedDate(day.localDate)}
              className="group flex min-w-0 flex-1 flex-col items-center gap-1.5 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              <span className="relative flex h-full w-full items-end justify-center">
                <span
                  className={`block w-full rounded-md transition-[height,background-color] duration-200 ${
                    day.totalActions > 0
                      ? isToday ? "bg-primary" : "bg-primary/25"
                      : "bg-neutral-soft group-hover:bg-primary-soft"
                  } ${isSelected ? "ring-2 ring-primary/25 ring-offset-1" : ""}`}
                  style={{ height: `${height}%` }}
                />
              </span>
              <span className={`text-[11px] font-medium ${isToday ? "font-bold text-primary" : "text-ink-secondary"}`}>
                {weekday}
              </span>
            </button>
          )
        })}
      </div>

      {selectedDay && (selectedDay.totalActions > 0 || selectedDay.totalPracticeSeconds > 0) ? (
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-ink-secondary" aria-live="polite">
          {(Object.keys(modeLabels) as Array<keyof typeof modeLabels>).map((mode) =>
            selectedDay.actionCounts[mode] > 0 ? (
              <span key={mode} className="font-medium text-ink">
                {modeLabels[mode]} {selectedDay.actionCounts[mode]}
              </span>
            ) : null,
          )}
          {selectedDay.totalPracticeSeconds > 0 && (
            <span className="font-semibold text-primary">
              {language === "th" ? "ฝึก" : "Practiced"}{" "}
              {Math.round(selectedDay.totalPracticeSeconds / 60)} {language === "th" ? "นาที" : "min"}
            </span>
          )}
        </div>
      ) : (
        <p className="mt-4 text-center text-sm text-ink-secondary" aria-live="polite">
          {language === "th" ? "ยังไม่มีกิจกรรมในวันนี้" : "No activity on this day"}
        </p>
      )}
    </div>
  )
}
