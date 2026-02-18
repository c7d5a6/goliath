import { createSignal, createResource, createMemo, For, Show } from 'solid-js'
import { apiGet } from '../api'
import { useI18n, useDateLocale } from '../i18n'

// --- API response types ---

interface CalendarYearDay {
  date: string
  workout_ids: number[]
}

interface CalendarYearResponse {
  year: number
  days: CalendarYearDay[]
}

interface CalendarMonthWorkout {
  workout_id: number
  workout_name: string
  exercise_count: number
}

interface CalendarMonthDay {
  date: string
  workout_ids: number[]
  workouts: CalendarMonthWorkout[]
}

interface CalendarMonthResponse {
  year: number
  month: number
  days: CalendarMonthDay[]
}

interface CalendarWeekExercise {
  exercise_name: string
  exercise_type: string
  sets?: number
  reps?: number
  time_seconds?: number
  weight?: number
  rest_seconds?: number
}

interface CalendarWeekWorkout {
  workout_id: number
  workout_name: string
  exercises: CalendarWeekExercise[]
}

interface CalendarWeekDay {
  date: string
  workout_ids: number[]
  workouts: CalendarWeekWorkout[]
}

interface CalendarWeekResponse {
  start_date: string
  end_date: string
  days: CalendarWeekDay[]
}

// --- Color palette ---

const WORKOUT_DOT_COLORS = [
  'bg-blue-500',
  'bg-emerald-500',
  'bg-violet-500',
  'bg-amber-500',
  'bg-rose-500',
  'bg-cyan-500',
  'bg-pink-500',
  'bg-teal-500',
  'bg-orange-500',
  'bg-indigo-500',
]

const WORKOUT_TEXT_COLORS = [
  'text-blue-700',
  'text-emerald-700',
  'text-violet-700',
  'text-amber-700',
  'text-rose-700',
  'text-cyan-700',
  'text-pink-700',
  'text-teal-700',
  'text-orange-700',
  'text-indigo-700',
]

const WORKOUT_BG_LIGHT = [
  'bg-blue-50',
  'bg-emerald-50',
  'bg-violet-50',
  'bg-amber-50',
  'bg-rose-50',
  'bg-cyan-50',
  'bg-pink-50',
  'bg-teal-50',
  'bg-orange-50',
  'bg-indigo-50',
]

function getWorkoutDotColor(wid: number): string {
  if (wid === 0) return 'bg-slate-400'
  return WORKOUT_DOT_COLORS[(wid - 1) % WORKOUT_DOT_COLORS.length]
}

function getWorkoutTextColor(wid: number): string {
  if (wid === 0) return 'text-slate-600'
  return WORKOUT_TEXT_COLORS[(wid - 1) % WORKOUT_TEXT_COLORS.length]
}

function getWorkoutBgLight(wid: number): string {
  if (wid === 0) return 'bg-slate-50'
  return WORKOUT_BG_LIGHT[(wid - 1) % WORKOUT_BG_LIGHT.length]
}

// --- Calendar helpers ---

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate()
}

function getFirstDayOfWeek(year: number, month: number): number {
  const day = new Date(year, month - 1, 1).getDay()
  return day === 0 ? 7 : day // Monday = 1, Sunday = 7
}

function formatDateISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function getMondayOfWeek(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  return d
}

// --- Component ---

export type ViewMode = 'year' | 'month' | 'week'

interface CalendarViewProps {
  viewMode: () => ViewMode
  setViewMode: (mode: ViewMode) => void
}

export default function CalendarView(props: CalendarViewProps) {
  const { t } = useI18n()
  const dateLocale = useDateLocale()

  const now = new Date()
  const [currentYear, setCurrentYear] = createSignal(now.getFullYear())
  const [currentMonth, setCurrentMonth] = createSignal(now.getMonth() + 1)
  const [weekStart, setWeekStart] = createSignal(formatDateISO(getMondayOfWeek(now)))

  const weekEnd = createMemo(() => {
    const parts = weekStart().split('-').map(Number)
    const monday = new Date(parts[0], parts[1] - 1, parts[2])
    const sunday = new Date(monday)
    sunday.setDate(monday.getDate() + 6)
    return formatDateISO(sunday)
  })

  // --- Data fetching ---

  const [yearData] = createResource(
    () => props.viewMode() === 'year' ? currentYear() : false as false,
    (year) => apiGet<CalendarYearResponse>(`/exercise-logs/calendar/year?year=${year}`)
  )

  const [monthData] = createResource(
    () => props.viewMode() === 'month' ? `${currentYear()}-${currentMonth()}` : false as false,
    (key) => {
      const [y, m] = (key as string).split('-').map(Number)
      return apiGet<CalendarMonthResponse>(`/exercise-logs/calendar/month?year=${y}&month=${m}`)
    }
  )

  const [weekData] = createResource(
    () => props.viewMode() === 'week' ? `${weekStart()}_${weekEnd()}` : false as false,
    (key) => {
      const [start, end] = (key as string).split('_')
      return apiGet<CalendarWeekResponse>(`/exercise-logs/calendar/week?start=${start}&end=${end}`)
    }
  )

  // --- Data lookups ---

  const yearDayMap = createMemo(() => {
    const map = new Map<string, number[]>()
    const data = yearData()
    if (data?.days) {
      for (const day of data.days) {
        map.set(day.date, day.workout_ids)
      }
    }
    return map
  })

  const monthDayMap = createMemo(() => {
    const map = new Map<string, CalendarMonthDay>()
    const data = monthData()
    if (data?.days) {
      for (const day of data.days) {
        map.set(day.date, day)
      }
    }
    return map
  })

  const weekDayMap = createMemo(() => {
    const map = new Map<string, CalendarWeekDay>()
    const data = weekData()
    if (data?.days) {
      for (const day of data.days) {
        map.set(day.date, day)
      }
    }
    return map
  })

  // --- Navigation ---

  const prevYear = () => setCurrentYear(y => y - 1)
  const nextYear = () => setCurrentYear(y => y + 1)

  const prevMonth = () => {
    if (currentMonth() === 1) {
      setCurrentMonth(12)
      setCurrentYear(y => y - 1)
    } else {
      setCurrentMonth(m => m - 1)
    }
  }

  const nextMonth = () => {
    if (currentMonth() === 12) {
      setCurrentMonth(1)
      setCurrentYear(y => y + 1)
    } else {
      setCurrentMonth(m => m + 1)
    }
  }

  const prevWeek = () => {
    const parts = weekStart().split('-').map(Number)
    const d = new Date(parts[0], parts[1] - 1, parts[2])
    d.setDate(d.getDate() - 7)
    setWeekStart(formatDateISO(d))
  }

  const nextWeek = () => {
    const parts = weekStart().split('-').map(Number)
    const d = new Date(parts[0], parts[1] - 1, parts[2])
    d.setDate(d.getDate() + 7)
    setWeekStart(formatDateISO(d))
  }

  // --- Drill-down click handlers ---

  const handleYearMonthClick = (month: number) => {
    setCurrentMonth(month)
    props.setViewMode('month')
  }

  const handleMonthDayClick = (dateStr: string) => {
    const parts = dateStr.split('-').map(Number)
    const d = new Date(parts[0], parts[1] - 1, parts[2])
    const monday = getMondayOfWeek(d)
    setWeekStart(formatDateISO(monday))
    props.setViewMode('week')
  }

  // --- Locale helpers ---

  const monthName = (month: number, short = false) => {
    const d = new Date(2026, month - 1, 1)
    return d.toLocaleDateString(dateLocale(), { month: short ? 'short' : 'long' })
  }

  const weekdayNarrow = createMemo(() => {
    const names: string[] = []
    for (let i = 0; i < 7; i++) {
      // Jan 3, 2000 is a Monday
      const d = new Date(2000, 0, 3 + i)
      names.push(d.toLocaleDateString(dateLocale(), { weekday: 'narrow' }))
    }
    return names
  })

  const weekdayShort = createMemo(() => {
    const names: string[] = []
    for (let i = 0; i < 7; i++) {
      const d = new Date(2000, 0, 3 + i)
      names.push(d.toLocaleDateString(dateLocale(), { weekday: 'short' }))
    }
    return names
  })

  const weekRangeLabel = createMemo(() => {
    const sp = weekStart().split('-').map(Number)
    const ep = weekEnd().split('-').map(Number)
    const sd = new Date(sp[0], sp[1] - 1, sp[2])
    const ed = new Date(ep[0], ep[1] - 1, ep[2])
    const startStr = sd.toLocaleDateString(dateLocale(), { month: 'short', day: 'numeric' })
    const endStr = ed.toLocaleDateString(dateLocale(), { month: 'short', day: 'numeric', year: 'numeric' })
    return `${startStr} – ${endStr}`
  })

  const today = formatDateISO(new Date())

  // --- Year View: mini month renderer ---

  const renderMiniMonth = (month: number) => {
    const year = currentYear()
    const daysCount = getDaysInMonth(year, month)
    const firstDay = getFirstDayOfWeek(year, month)

    const cells: { day: number; date: string; workoutIds: number[] }[] = []

    // Empty cells before first day
    for (let i = 1; i < firstDay; i++) {
      cells.push({ day: 0, date: '', workoutIds: [] })
    }

    // Day cells
    for (let d = 1; d <= daysCount; d++) {
      const date = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      const workoutIds = yearDayMap().get(date) || []
      cells.push({ day: d, date, workoutIds })
    }

    return (
      <div class="flex flex-col">
        <button
          class="text-sm font-semibold text-slate-700 mb-1.5 text-left hover:text-primary-600 transition-colors capitalize"
          onClick={() => handleYearMonthClick(month)}
        >
          {monthName(month, true)}
        </button>
        <div class="grid grid-cols-7 gap-px">
          {/* Weekday header */}
          <For each={weekdayNarrow()}>
            {(name) => (
              <div class="text-[9px] text-slate-400 text-center font-medium pb-0.5">{name}</div>
            )}
          </For>
          {/* Day cells */}
          <For each={cells}>
            {(cell) => (
              <div
                class={`h-[22px] flex flex-col items-center justify-center ${
                  cell.day > 0 && cell.workoutIds.length > 0 ? 'cursor-pointer hover:bg-slate-50 rounded' : ''
                } ${cell.date === today ? 'bg-primary-50 rounded' : ''}`}
                onClick={() => cell.day > 0 && handleYearMonthClick(month)}
              >
                <Show when={cell.day > 0}>
                  <span class={`text-[10px] leading-none ${cell.date === today ? 'font-bold text-primary-600' : 'text-slate-500'}`}>
                    {cell.day}
                  </span>
                  <Show when={cell.workoutIds.length > 0}>
                    <div class="flex gap-px mt-px">
                      <For each={cell.workoutIds.slice(0, 3)}>
                        {(wid) => (
                          <div class={`w-1 h-1 rounded-full ${getWorkoutDotColor(wid)}`} />
                        )}
                      </For>
                      <Show when={cell.workoutIds.length > 3}>
                        <div class="w-1 h-1 rounded-full bg-slate-300" />
                      </Show>
                    </div>
                  </Show>
                </Show>
              </div>
            )}
          </For>
        </div>
      </div>
    )
  }

  // --- Month View: calendar grid data ---

  const monthCalendarWeeks = createMemo(() => {
    const year = currentYear()
    const month = currentMonth()
    const daysCount = getDaysInMonth(year, month)
    const firstDay = getFirstDayOfWeek(year, month)

    const weeks: { day: number; date: string; isCurrentMonth: boolean }[][] = []
    let week: { day: number; date: string; isCurrentMonth: boolean }[] = []

    // Previous month fill
    const prevM = month === 1 ? 12 : month - 1
    const prevY = month === 1 ? year - 1 : year
    const prevDays = getDaysInMonth(prevY, prevM)
    for (let i = firstDay - 2; i >= 0; i--) {
      const d = prevDays - i
      week.push({
        day: d,
        date: `${prevY}-${String(prevM).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
        isCurrentMonth: false,
      })
    }

    // Current month days
    for (let d = 1; d <= daysCount; d++) {
      week.push({
        day: d,
        date: `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
        isCurrentMonth: true,
      })
      if (week.length === 7) {
        weeks.push(week)
        week = []
      }
    }

    // Next month fill
    if (week.length > 0) {
      let d = 1
      const nextM = month === 12 ? 1 : month + 1
      const nextY = month === 12 ? year + 1 : year
      while (week.length < 7) {
        week.push({
          day: d,
          date: `${nextY}-${String(nextM).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
          isCurrentMonth: false,
        })
        d++
      }
      weeks.push(week)
    }

    return weeks
  })

  // --- Week View: days list ---

  const weekDays = createMemo(() => {
    const parts = weekStart().split('-').map(Number)
    const monday = new Date(parts[0], parts[1] - 1, parts[2])
    const days: { date: string; dayName: string; dayNum: number; monthStr: string }[] = []

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday)
      d.setDate(monday.getDate() + i)
      days.push({
        date: formatDateISO(d),
        dayName: d.toLocaleDateString(dateLocale(), { weekday: 'short' }),
        dayNum: d.getDate(),
        monthStr: d.toLocaleDateString(dateLocale(), { month: 'short' }),
      })
    }

    return days
  })

  // --- Render ---

  return (
    <div class="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
      {/* Header */}
      <div class="p-4 border-b border-slate-200 bg-gradient-to-r from-accent-50 to-primary-50">
        <div class="flex items-center justify-between mb-3">
          <div>
            <h2 class="text-lg font-bold text-slate-900">{t('calendar.title')}</h2>
            <p class="text-sm text-slate-600 mt-0.5">{t('calendar.subtitle')}</p>
          </div>
        </div>

        {/* View mode tabs */}
        <div class="flex gap-1 bg-slate-100 rounded-lg p-1">
          <button
            class={`flex-1 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
              props.viewMode() === 'year'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
            onClick={() => props.setViewMode('year')}
          >
            {t('calendar.yearView')}
          </button>
          <button
            class={`flex-1 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
              props.viewMode() === 'month'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
            onClick={() => props.setViewMode('month')}
          >
            {t('calendar.monthView')}
          </button>
          <button
            class={`flex-1 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
              props.viewMode() === 'week'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
            onClick={() => props.setViewMode('week')}
          >
            {t('calendar.weekView')}
          </button>
        </div>

        {/* Navigation */}
        <div class="flex items-center justify-between mt-3">
          <button
            class="p-1.5 rounded-lg hover:bg-white/50 transition-colors text-slate-600"
            onClick={() => {
              if (props.viewMode() === 'year') prevYear()
              else if (props.viewMode() === 'month') prevMonth()
              else prevWeek()
            }}
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <span class="text-sm font-semibold text-slate-800">
            <Show when={props.viewMode() === 'year'}>{currentYear()}</Show>
            <Show when={props.viewMode() === 'month'}>
              <span class="capitalize">{monthName(currentMonth())} {currentYear()}</span>
            </Show>
            <Show when={props.viewMode() === 'week'}>{weekRangeLabel()}</Show>
          </span>

          <button
            class="p-1.5 rounded-lg hover:bg-white/50 transition-colors text-slate-600"
            onClick={() => {
              if (props.viewMode() === 'year') nextYear()
              else if (props.viewMode() === 'month') nextMonth()
              else nextWeek()
            }}
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Content */}
      <div class="p-4">
        {/* Loading */}
        <Show when={
          (props.viewMode() === 'year' && yearData.loading) ||
          (props.viewMode() === 'month' && monthData.loading) ||
          (props.viewMode() === 'week' && weekData.loading)
        }>
          <div class="flex flex-col items-center justify-center py-16 text-slate-500">
            <div class="w-8 h-8 border-4 border-accent-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <span>{t('common.loading')}</span>
          </div>
        </Show>

        {/* ===== YEAR VIEW ===== */}
        <Show when={props.viewMode() === 'year' && !yearData.loading}>
          <div class="grid grid-cols-3 sm:grid-cols-4 gap-4 sm:gap-6">
            <For each={Array.from({ length: 12 }, (_, i) => i + 1)}>
              {(month) => renderMiniMonth(month)}
            </For>
          </div>
        </Show>

        {/* ===== MONTH VIEW ===== */}
        <Show when={props.viewMode() === 'month' && !monthData.loading}>
          <div class="border border-slate-200 rounded-lg overflow-hidden">
            {/* Weekday headers */}
            <div class="grid grid-cols-7 bg-slate-50 border-b border-slate-200">
              <For each={weekdayShort()}>
                {(name) => (
                  <div class="py-2 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    {name}
                  </div>
                )}
              </For>
            </div>

            {/* Calendar weeks */}
            <For each={monthCalendarWeeks()}>
              {(week) => (
                <div class="grid grid-cols-7 border-b border-slate-100 last:border-b-0">
                  <For each={week}>
                    {(cell) => {
                      const dayData = () => monthDayMap().get(cell.date)
                      const isToday = cell.date === today

                      return (
                        <div
                          class={`min-h-[80px] sm:min-h-[100px] p-1.5 border-r border-slate-100 last:border-r-0 transition-colors ${
                            !cell.isCurrentMonth ? 'bg-slate-50/50' : 'bg-white'
                          } ${dayData() ? 'cursor-pointer hover:bg-blue-50/30' : ''}`}
                          onClick={() => dayData() && handleMonthDayClick(cell.date)}
                        >
                          {/* Date number */}
                          <div class="flex items-center gap-1 mb-1">
                            <span
                              class={`text-xs font-medium ${
                                isToday
                                  ? 'w-5 h-5 rounded-full bg-primary-500 text-white flex items-center justify-center'
                                  : !cell.isCurrentMonth
                                  ? 'text-slate-300'
                                  : 'text-slate-600'
                              }`}
                            >
                              {cell.day}
                            </span>
                            {/* Color dots */}
                            <Show when={dayData()}>
                              <div class="flex gap-0.5 ml-auto">
                                <For each={dayData()!.workout_ids}>
                                  {(wid) => (
                                    <div class={`w-1.5 h-1.5 rounded-full ${getWorkoutDotColor(wid)}`} />
                                  )}
                                </For>
                              </div>
                            </Show>
                          </div>

                          {/* Workout list */}
                          <Show when={dayData()}>
                            <div class="space-y-0.5">
                              <For each={dayData()!.workouts}>
                                {(workout) => (
                                  <div
                                    class={`text-[10px] leading-tight px-1 py-0.5 rounded truncate ${getWorkoutBgLight(
                                      workout.workout_id
                                    )} ${getWorkoutTextColor(workout.workout_id)}`}
                                  >
                                    {workout.workout_name || t('calendar.noWorkout')}
                                    <span class="opacity-60 ml-0.5">({workout.exercise_count})</span>
                                  </div>
                                )}
                              </For>
                            </div>
                          </Show>
                        </div>
                      )
                    }}
                  </For>
                </div>
              )}
            </For>
          </div>
        </Show>

        {/* ===== WEEK VIEW ===== */}
        <Show when={props.viewMode() === 'week' && !weekData.loading}>
          <div class="grid grid-cols-1 sm:grid-cols-7 gap-px sm:gap-0 sm:border sm:border-slate-200 sm:rounded-lg sm:overflow-hidden">
            <For each={weekDays()}>
              {(day) => {
                const dayData = () => weekDayMap().get(day.date)
                const isToday = day.date === today

                return (
                  <div
                    class={`sm:min-h-[160px] p-3 sm:border-r sm:border-slate-100 sm:last:border-r-0 bg-white ${
                      isToday ? 'ring-2 ring-inset ring-primary-400 sm:ring-2' : ''
                    } rounded-lg sm:rounded-none border border-slate-200 sm:border-0 sm:border-b sm:border-slate-100`}
                  >
                    {/* Day header */}
                    <div class="flex items-center gap-1.5 mb-2 pb-1.5 border-b border-slate-100">
                      <span class="text-xs font-medium text-slate-400 uppercase">{day.dayName}</span>
                      <span
                        class={`text-sm font-bold ${isToday ? 'text-primary-600' : 'text-slate-800'}`}
                      >
                        {day.dayNum}
                      </span>
                      <span class="text-xs text-slate-400">{day.monthStr}</span>
                      {/* Color dots */}
                      <Show when={dayData()}>
                        <div class="flex gap-0.5 ml-auto">
                          <For each={dayData()!.workout_ids}>
                            {(wid) => (
                              <div class={`w-2 h-2 rounded-full ${getWorkoutDotColor(wid)}`} />
                            )}
                          </For>
                        </div>
                      </Show>
                    </div>

                    {/* Day content */}
                    <Show when={dayData()}>
                      <div class="space-y-2">
                        <For each={dayData()!.workouts}>
                          {(workout) => (
                            <div>
                              <div
                                class={`text-xs font-semibold mb-0.5 flex items-center gap-1 ${getWorkoutTextColor(
                                  workout.workout_id
                                )}`}
                              >
                                <div
                                  class={`w-2 h-2 rounded-full flex-shrink-0 ${getWorkoutDotColor(
                                    workout.workout_id
                                  )}`}
                                />
                                <span class="truncate">
                                  {workout.workout_name || t('calendar.noWorkout')}
                                </span>
                              </div>
                              <div class="space-y-0.5 ml-3">
                                <For each={workout.exercises}>
                                  {(ex) => (
                                    <div class="text-xs text-slate-600 leading-relaxed">
                                      <span class="font-medium">{ex.exercise_name}</span>
                                      <span class="text-slate-400 ml-1">
                                        {[
                                          ex.sets && `${ex.sets}×${ex.reps || ''}`,
                                          ex.weight && `${ex.weight}kg`,
                                          ex.time_seconds && `${ex.time_seconds}s`,
                                        ]
                                          .filter(Boolean)
                                          .join(' · ')}
                                      </span>
                                    </div>
                                  )}
                                </For>
                              </div>
                            </div>
                          )}
                        </For>
                      </div>
                    </Show>

                    <Show when={!dayData()}>
                      <div class="text-xs text-slate-300 italic">{t('calendar.noEntries')}</div>
                    </Show>
                  </div>
                )
              }}
            </For>
          </div>
        </Show>
      </div>
    </div>
  )
}
