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
    <div className="flex flex-col gap-5">
      {/* Chart Bars */}
      <div className="flex h-28 items-end justify-between gap-1.5 sm:gap-2 px-1">
        {days.map((day, index) => {
          const date = toLocalDate(day.localDate)
          const isToday = index === days.length - 1
          const isSelected = day.localDate === selectedDay?.localDate
          const height = day.totalActions > 0
            ? Math.max(12, (day.totalActions / maximum) * 100)
            : 8
          
          const weekday = new Intl.DateTimeFormat(locale, { weekday: "short" }).format(date).replace(/\./g, '')
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
              className="group flex min-w-0 flex-1 flex-col items-center gap-2 outline-none"
            >
              <span className="relative flex h-full w-full flex-col justify-end items-center">
                {/* Value tooltip on hover/select for active days */}
                {day.totalActions > 0 && (
                  <span className={`absolute -top-7 text-xs font-bold transition-all duration-300 ${
                    isSelected ? "opacity-100 text-primary translate-y-0" : "opacity-0 text-ink-secondary translate-y-2 group-hover:opacity-100"
                  }`}>
                    {day.totalActions}
                  </span>
                )}
                <span
                  className={`block w-full max-w-[28px] rounded-t-lg rounded-b-sm transition-all duration-300 ease-out ${
                    day.totalActions > 0
                      ? isSelected 
                        ? "bg-primary shadow-md shadow-primary/30 ring-2 ring-primary/20 ring-offset-2" 
                        : "bg-primary/30 group-hover:bg-primary/50"
                      : isSelected
                        ? "bg-neutral-soft ring-2 ring-neutral-soft ring-offset-2"
                        : "bg-slate-100 group-hover:bg-slate-200"
                  }`}
                  style={{ height: `${height}%` }}
                />
              </span>
              <span className={`text-xs transition-colors duration-200 ${
                isSelected ? "font-bold text-ink" : isToday ? "font-bold text-primary" : "font-medium text-ink-secondary"
              }`}>
                {weekday}
              </span>
            </button>
          )
        })}
      </div>

      {/* Selected Day Details Card */}
      {selectedDay && (selectedDay.totalActions > 0 || selectedDay.totalPracticeSeconds > 0) ? (
        <div 
          key={selectedDay.localDate} 
          className="rounded-2xl border border-border/60 bg-slate-50/50 p-4 animate-in fade-in slide-in-from-bottom-2 duration-300"
          aria-live="polite"
        >
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-bold text-ink">
              {new Intl.DateTimeFormat(locale, { weekday: "long", day: "numeric", month: "long" }).format(toLocalDate(selectedDay.localDate))}
            </h4>
            {selectedDay.totalPracticeSeconds > 0 && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-primary/10 text-xs font-bold text-primary">
                {language === "th" ? "ฝึกซ้อม" : "Practice"} {Math.round(selectedDay.totalPracticeSeconds / 60)} {language === "th" ? "นาที" : "min"}
              </span>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
            {(Object.keys(modeLabels) as Array<keyof typeof modeLabels>).map((mode) =>
              selectedDay.actionCounts[mode] > 0 ? (
                <div key={mode} className="flex items-center justify-between gap-3 bg-white border border-border/60 rounded-xl px-3 py-2.5 shadow-sm sm:flex-1 sm:min-w-[120px]">
                  <span className="text-xs font-semibold text-ink-secondary">
                    {modeLabels[mode]}
                  </span>
                  <span className="text-sm font-bold text-ink">
                    {selectedDay.actionCounts[mode]}
                  </span>
                </div>
              ) : null,
            )}
          </div>
        </div>
      ) : (
        <div 
          key={`empty-${selectedDay?.localDate}`}
          className="flex items-center justify-center rounded-2xl border border-dashed border-border/60 bg-slate-50/30 h-[104px] animate-in fade-in duration-300" 
          aria-live="polite"
        >
          <p className="text-sm font-medium text-ink-secondary">
            {language === "th" ? "ไม่มีกิจกรรมในวันนี้" : "No activity on this day"}
          </p>
        </div>
      )}
    </div>
  )
}
