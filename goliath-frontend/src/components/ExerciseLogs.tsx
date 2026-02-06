import { createResource, For, Show, createMemo } from 'solid-js'
import { A } from '@solidjs/router'
import { apiGet, apiDelete } from '../api'
import { useAuth } from '../auth'

interface ExerciseLog {
  id: number
  user_id: number
  workout_id?: number | null
  exercise_id: number
  exercise_name: string
  exercise_type: string
  logged_when: string
  position: number
  sets?: number
  reps?: number
  time_seconds?: number
  weight?: number
  rest_seconds?: number
  notes?: string
}

interface ExerciseLogsResponse {
  exercise_logs: ExerciseLog[]
  count: number
}

interface DayGroup {
  date: string
  label: string
  logs: ExerciseLog[]
}

async function fetchExerciseLogs(): Promise<ExerciseLogsResponse> {
  return apiGet<ExerciseLogsResponse>('/exercise-logs?limit=200')
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getDateKey(dateStr: string): string {
  const date = new Date(dateStr)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function getRelativeDayLabel(dateStr: string): string {
  const date = new Date(dateStr)
  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)

  const dateKey = getDateKey(dateStr)
  const todayKey = getDateKey(today.toISOString())
  const yesterdayKey = getDateKey(yesterday.toISOString())

  if (dateKey === todayKey) return 'Today'
  if (dateKey === yesterdayKey) return 'Yesterday'

  const dayName = date.toLocaleDateString('en-US', { weekday: 'long' })
  return `${dayName}, ${formatDate(dateStr)}`
}

export default function ExerciseLogs() {
  const auth = useAuth()
  const [data, { refetch }] = createResource(fetchExerciseLogs)

  const groupedLogs = createMemo((): DayGroup[] => {
    const logs = data()?.exercise_logs ?? []
    const groups: Map<string, DayGroup> = new Map()

    for (const log of logs) {
      const key = getDateKey(log.logged_when)
      if (!groups.has(key)) {
        groups.set(key, {
          date: key,
          label: getRelativeDayLabel(log.logged_when),
          logs: [],
        })
      }
      groups.get(key)!.logs.push(log)
    }

    // Sort groups by date descending (newest first)
    return Array.from(groups.values()).sort((a, b) => b.date.localeCompare(a.date))
  })

  const totalLogs = () => data()?.count ?? 0

  const handleDelete = async (id: number, exerciseName: string) => {
    if (!confirm(`Delete log entry for "${exerciseName}"?`)) return

    try {
      await apiDelete(`/exercise-logs/${id}`)
      refetch()
    } catch (err: any) {
      alert(`Failed to delete log: ${err.message}`)
    }
  }

  return (
    <div class="relative">
      {/* Stats */}
      <Show when={data()}>
        <div class="flex gap-3 mb-6 flex-wrap">
          <span class="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-full text-sm font-medium shadow-sm">
            Exercise Log
            <span class="bg-accent-500 text-white px-2 py-0.5 rounded-full text-xs font-semibold">
              {totalLogs()}
            </span>
          </span>
          <Show when={groupedLogs().length > 0}>
            <span class="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-full text-sm font-medium shadow-sm">
              Days
              <span class="bg-primary-500 text-white px-2 py-0.5 rounded-full text-xs font-semibold">
                {groupedLogs().length}
              </span>
            </span>
          </Show>
        </div>
      </Show>

      {/* Auth Check */}
      <Show when={!auth.user}>
        <div class="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
          <div class="text-4xl mb-3">🔒</div>
          <h3 class="text-lg font-semibold text-slate-900 mb-2">Authentication Required</h3>
          <p class="text-slate-600 mb-4">Please sign in to view your exercise log.</p>
          <A
            href="/login"
            class="inline-block px-6 py-2 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600"
          >
            Sign In
          </A>
        </div>
      </Show>

      <Show when={auth.user}>
        {/* Table Container */}
        <div class="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
          {/* Header */}
          <div class="p-4 border-b border-slate-200 bg-gradient-to-r from-accent-50 to-primary-50">
            <h2 class="text-lg font-bold text-slate-900">Exercise Log</h2>
            <p class="text-sm text-slate-600 mt-0.5">Your completed exercises, grouped by day</p>
          </div>

          {/* Loading State */}
          <Show when={data.loading}>
            <div class="flex flex-col items-center justify-center py-16 text-slate-500">
              <div class="w-8 h-8 border-4 border-accent-500 border-t-transparent rounded-full animate-spin mb-4"></div>
              <span>Loading exercise log...</span>
            </div>
          </Show>

          {/* Error State */}
          <Show when={data.error}>
            <div class="py-12 px-4 text-center text-red-600">
              <div class="text-4xl mb-2">⚠️</div>
              <p class="font-medium">Failed to load exercise log</p>
              <p class="text-sm opacity-80 mt-1">{data.error?.message}</p>
              <button
                class="mt-4 px-6 py-2 bg-primary-500 text-white rounded-lg text-sm font-medium
                       hover:bg-primary-600 active:scale-[0.98] transition-all"
                onClick={() => refetch()}
              >
                Try Again
              </button>
            </div>
          </Show>

          {/* Content */}
          <Show when={data() && !data.loading && !data.error}>
            {/* Empty State */}
            <Show when={totalLogs() === 0}>
              <div class="py-16 px-4 text-center text-slate-500">
                <div class="text-4xl mb-2 opacity-50">📝</div>
                <p class="font-medium text-lg mb-1">No exercises logged yet</p>
                <p class="text-sm">Log exercises from your workouts to track your progress!</p>
                <A
                  href="/workouts"
                  class="inline-block mt-4 px-6 py-2 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600"
                >
                  Go to Workouts
                </A>
              </div>
            </Show>

            <Show when={totalLogs() > 0}>
              {/* Desktop Table - single table for consistent column widths */}
              <div class="hidden sm:block">
                <table class="w-full table-fixed">
                  <colgroup>
                    <col class="w-[100px]" />
                    <col class="w-[25%]" />
                    <col />
                    <col class="w-[20%]" />
                    <col class="w-[50px]" />
                  </colgroup>
                  <thead>
                    <tr class="border-b border-slate-100">
                      <th class="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-2">Time</th>
                      <th class="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-2">Exercise</th>
                      <th class="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-2">Details</th>
                      <th class="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-2">Notes</th>
                      <th class="px-6 py-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    <For each={groupedLogs()}>
                      {(group, groupIndex) => (
                        <>
                          {/* Day Header Row */}
                          <tr class={`bg-slate-50 ${groupIndex() > 0 ? 'border-t-2 border-slate-200' : ''}`}>
                            <td colspan="5" class="px-6 py-3 border-b border-slate-200">
                              <div class="flex items-center justify-between">
                                <div class="flex items-center gap-3">
                                  <span class="text-lg">📅</span>
                                  <span class="font-semibold text-slate-800">{group.label}</span>
                                </div>
                                <span class="text-xs text-slate-500 bg-white px-2.5 py-1 rounded-full border border-slate-200">
                                  {group.logs.length} {group.logs.length === 1 ? 'exercise' : 'exercises'}
                                </span>
                              </div>
                            </td>
                          </tr>
                          {/* Log Rows */}
                          <For each={group.logs}>
                            {(log) => (
                              <tr class="hover:bg-slate-50 transition-colors border-b border-slate-100">
                                <td class="px-6 py-3 text-sm text-slate-500 whitespace-nowrap">
                                  {formatTime(log.logged_when)}
                                </td>
                                <td class="px-6 py-3">
                                  <div class="font-medium text-slate-900 text-sm truncate">{log.exercise_name}</div>
                                  <div class="text-xs text-slate-500 truncate">{log.exercise_type}</div>
                                </td>
                                <td class="px-6 py-3">
                                  <div class="flex items-center gap-1.5 flex-wrap">
                                    <Show when={log.sets}>
                                      <span class="px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-medium whitespace-nowrap">
                                        {log.sets} sets
                                      </span>
                                    </Show>
                                    <Show when={log.reps}>
                                      <span class="px-1.5 py-0.5 bg-green-50 text-green-700 rounded text-xs font-medium whitespace-nowrap">
                                        {log.reps} reps
                                      </span>
                                    </Show>
                                    <Show when={log.time_seconds}>
                                      <span class="px-1.5 py-0.5 bg-purple-50 text-purple-700 rounded text-xs font-medium whitespace-nowrap">
                                        {log.time_seconds}s
                                      </span>
                                    </Show>
                                    <Show when={log.weight}>
                                      <span class="px-1.5 py-0.5 bg-orange-50 text-orange-700 rounded text-xs font-medium whitespace-nowrap">
                                        {log.weight}kg
                                      </span>
                                    </Show>
                                    <Show when={log.rest_seconds}>
                                      <span class="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-xs font-medium whitespace-nowrap">
                                        ↻ {log.rest_seconds}s
                                      </span>
                                    </Show>
                                  </div>
                                </td>
                                <td class="px-6 py-3">
                                  <Show when={log.notes}>
                                    <div class="text-xs text-slate-500 italic truncate" title={log.notes}>
                                      "{log.notes}"
                                    </div>
                                  </Show>
                                </td>
                                <td class="px-6 py-3 text-right">
                                  <button
                                    onClick={() => handleDelete(log.id, log.exercise_name)}
                                    class="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-all"
                                    title="Delete log entry"
                                  >
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  </button>
                                </td>
                              </tr>
                            )}
                          </For>
                        </>
                      )}
                    </For>
                  </tbody>
                </table>
              </div>

              {/* Mobile View */}
              <div class="sm:hidden">
                <For each={groupedLogs()}>
                  {(group, groupIndex) => (
                    <div class={groupIndex() > 0 ? 'border-t-2 border-slate-200' : ''}>
                      {/* Day Header */}
                      <div class="px-4 py-3 bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
                        <div class="flex items-center justify-between">
                          <div class="flex items-center gap-3">
                            <span class="text-lg">📅</span>
                            <span class="font-semibold text-slate-800">{group.label}</span>
                          </div>
                          <span class="text-xs text-slate-500 bg-white px-2.5 py-1 rounded-full border border-slate-200">
                            {group.logs.length} {group.logs.length === 1 ? 'exercise' : 'exercises'}
                          </span>
                        </div>
                      </div>
                      <div class="p-3 space-y-2">
                        <For each={group.logs}>
                          {(log) => (
                            <div class="p-3 bg-white border border-slate-200 rounded-lg">
                              <div class="flex items-start justify-between gap-2 mb-2">
                                <div class="flex-1 min-w-0">
                                  <div class="font-medium text-slate-900 text-sm">{log.exercise_name}</div>
                                  <div class="flex items-center gap-2 text-xs text-slate-500">
                                    <span>{log.exercise_type}</span>
                                    <span>·</span>
                                    <span>{formatTime(log.logged_when)}</span>
                                  </div>
                                </div>
                                <button
                                  onClick={() => handleDelete(log.id, log.exercise_name)}
                                  class="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-all flex-shrink-0"
                                  title="Delete log entry"
                                >
                                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                              <div class="flex flex-wrap gap-1.5">
                                <Show when={log.sets}>
                                  <span class="px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-medium">
                                    {log.sets} sets
                                  </span>
                                </Show>
                                <Show when={log.reps}>
                                  <span class="px-1.5 py-0.5 bg-green-50 text-green-700 rounded text-xs font-medium">
                                    {log.reps} reps
                                  </span>
                                </Show>
                                <Show when={log.time_seconds}>
                                  <span class="px-1.5 py-0.5 bg-purple-50 text-purple-700 rounded text-xs font-medium">
                                    {log.time_seconds}s
                                  </span>
                                </Show>
                                <Show when={log.weight}>
                                  <span class="px-1.5 py-0.5 bg-orange-50 text-orange-700 rounded text-xs font-medium">
                                    {log.weight}kg
                                  </span>
                                </Show>
                                <Show when={log.rest_seconds}>
                                  <span class="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-xs font-medium">
                                    ↻ {log.rest_seconds}s
                                  </span>
                                </Show>
                              </div>
                              <Show when={log.notes}>
                                <div class="text-xs text-slate-500 mt-2 italic line-clamp-2">"{log.notes}"</div>
                              </Show>
                            </div>
                          )}
                        </For>
                      </div>
                    </div>
                  )}
                </For>
              </div>
            </Show>
          </Show>
        </div>
      </Show>
    </div>
  )
}
