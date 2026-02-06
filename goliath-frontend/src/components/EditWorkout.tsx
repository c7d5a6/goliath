import { createSignal, createResource, createEffect, createMemo, Show, For } from 'solid-js'
import { useNavigate, useParams } from '@solidjs/router'
import { apiGet, apiPut, apiPost, apiDelete } from '../api'
import { useAuth } from '../auth'
import { A } from '@solidjs/router'

interface Workout {
  id: number
  name: string
  user_id: number
}

interface WorkoutExercise {
  id: number
  exercise_id: number
  exercise_name: string
  exercise_type: string
  position: number
  sets?: number
  reps?: number
  time_seconds?: number
  weight?: number
  rest_seconds?: number
  notes?: string
}

interface ExerciseArea {
  exercise_area_id: number
  exercise_area_name: string
  percentage: number
}

interface Exercise {
  id: number
  name: string
  type: string
}

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

async function fetchWorkout(id: number) {
  return apiGet<Workout>(`/workouts/${id}`)
}

async function fetchWorkoutExercises(id: number) {
  const data = await apiGet<{ exercises: WorkoutExercise[] }>(`/workouts/${id}/exercises`)
  return data.exercises
}

async function fetchAllExercises() {
  const data = await apiGet<{ exercises: Exercise[] }>('/exercises')
  return data.exercises
}

async function fetchWorkoutExerciseAreas(id: number) {
  const data = await apiGet<{ exercise_areas: ExerciseArea[] }>(`/workouts/${id}/exercise-areas`)
  return data.exercise_areas
}

async function fetchLatestLogs(id: number) {
  return apiGet<ExerciseLogsResponse>(`/workouts/${id}/latest-logs`)
}

export default function EditWorkout() {
  const params = useParams()
  const navigate = useNavigate()
  const auth = useAuth()
  const workoutId = parseInt(params.id || '0')
  
  const [workout] = createResource(() => workoutId, fetchWorkout)
  const [workoutExercises, { refetch: refetchExercises }] = createResource(() => workoutId, fetchWorkoutExercises)
  const [allExercises] = createResource(fetchAllExercises)
  const [workoutExerciseAreas, { refetch: refetchExerciseAreas }] = createResource(() => workoutId, fetchWorkoutExerciseAreas)
  const [latestLogs, { refetch: refetchLatestLogs }] = createResource(() => workoutId, fetchLatestLogs)
  
  const [name, setName] = createSignal('')
  const [error, setError] = createSignal('')
  const [isSubmitting, setIsSubmitting] = createSignal(false)
  
  // Exercise search and add state
  const [searchExercise, setSearchExercise] = createSignal('')
  const [showExerciseSearch, setShowExerciseSearch] = createSignal(false)
  const [editingExercise, setEditingExercise] = createSignal<WorkoutExercise | null>(null)
  const [showAllAreas, setShowAllAreas] = createSignal(false)
  
  // Exercise logging state
  const [loggingExercise, setLoggingExercise] = createSignal<WorkoutExercise | null>(null)
  const [isLogging, setIsLogging] = createSignal(false)

  // Latest logs grouped by day
  const formatLogDate = (dateStr: string): string => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  const formatLogTime = (dateStr: string): string => {
    const date = new Date(dateStr)
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  }

  const getDateKey = (dateStr: string): string => {
    const date = new Date(dateStr)
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  }

  const getRelativeDayLabel = (dateStr: string): string => {
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
    return `${dayName}, ${formatLogDate(dateStr)}`
  }

  const groupedLatestLogs = createMemo(() => {
    const logs = latestLogs()?.exercise_logs ?? []
    const groups: Map<string, { date: string; label: string; logs: ExerciseLog[] }> = new Map()

    for (const log of logs) {
      const key = getDateKey(log.logged_when)
      if (!groups.has(key)) {
        groups.set(key, { date: key, label: getRelativeDayLabel(log.logged_when), logs: [] })
      }
      groups.get(key)!.logs.push(log)
    }

    return Array.from(groups.values()).sort((a, b) => b.date.localeCompare(a.date))
  })

  // Initialize form with workout data when loaded
  createEffect(() => {
    const w = workout()
    if (w) {
      setName(w.name)
    }
  })

  const filteredExercises = () => {
    const exercises = allExercises() || []
    const query = searchExercise().toLowerCase()
    const existingIds = (workoutExercises() || []).map(we => we.exercise_id)
    
    return exercises
      .filter(e => !existingIds.includes(e.id))
      .filter(e => !query || e.name.toLowerCase().includes(query))
      .slice(0, 10)
  }

  // Split exercise areas into primary (within 25% of max) and secondary
  const splitExerciseAreas = () => {
    const areas = workoutExerciseAreas() || []
    if (areas.length === 0) return { primary: [], secondary: [] }
    
    const maxPercentage = areas[0].percentage // Already sorted descending
    const threshold = maxPercentage - 25
    
    const primary = areas.filter(area => area.percentage >= threshold)
    const secondary = areas.filter(area => area.percentage < threshold)
    
    return { primary, secondary }
  }

  // Calculate total workout time
  const totalWorkoutTime = () => {
    const exercises = workoutExercises() || []
    let totalSeconds = 0

    for (const ex of exercises) {
      const sets = ex.sets || 0
      const reps = ex.reps || 0
      const timeSeconds = ex.time_seconds || 0
      const restSeconds = ex.rest_seconds || 0

      // Calculate rest time: rest_seconds * sets
      const totalRestTime = restSeconds * sets

      // Calculate exercise time based on type
      let exerciseTime = 0
      if (ex.exercise_type === 'Isometric' || ex.exercise_type === 'Isometric Weighted') {
        // Isometric exercises use the time field, multiplied by sets
        exerciseTime = timeSeconds * sets
      } else {
        // Reps-based exercises: reps * 3 seconds * sets
        exerciseTime = reps * 3 * sets
      }

      totalSeconds += totalRestTime + exerciseTime
    }

    // Add 10% for error
    totalSeconds = Math.round(totalSeconds * 1.1)

    // Format as minutes:seconds
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }


  const handleSubmit = async (e: Event) => {
    e.preventDefault()
    setError('')

    if (!name().trim()) {
      setError('Workout name is required')
      return
    }

    setIsSubmitting(true)
    
    try {
      await apiPut(`/workouts/${workoutId}`, {
        name: name().trim(),
      })

      navigate('/workouts')
    } catch (err: any) {
      setError(err.message || 'Network error')
      setIsSubmitting(false)
    }
  }

  // Helper functions to determine which fields to show for each exercise type
  const showSets = (type: string) => ['Reps', 'Isometric', 'Eccentric', 'Reps Weighted', 'Isometric Weighted'].includes(type)
  const showReps = (type: string) => ['Reps', 'Eccentric', 'Reps Weighted'].includes(type)
  const showWeight = (type: string) => ['Reps Weighted', 'Isometric Weighted'].includes(type)
  const showTime = (type: string) => ['Isometric', 'Isometric Weighted'].includes(type)
  const showRest = (type: string) => ['Reps', 'Isometric', 'Eccentric', 'Reps Weighted', 'Isometric Weighted'].includes(type)

  const handleAddExercise = async (exercise: Exercise) => {
    try {
      const exercises = workoutExercises() || []
      const position = exercises.length
      
      await apiPost(`/workouts/${workoutId}/exercises`, {
        exercise_id: exercise.id,
        position: position,
        sets: showSets(exercise.type) ? 3 : undefined,
        reps: showReps(exercise.type) ? 10 : undefined,
        time_seconds: showTime(exercise.type) ? 30 : undefined,
        weight: showWeight(exercise.type) ? 0 : undefined,
        rest_seconds: showRest(exercise.type) ? 60 : undefined,
      })
      
      setSearchExercise('')
      setShowExerciseSearch(false)
      refetchExercises()
      refetchExerciseAreas()
      refetchLatestLogs()
    } catch (err: any) {
      setError(err.message || 'Failed to add exercise')
    }
  }

  const handleUpdateExercise = async () => {
    const ex = editingExercise()
    if (!ex) return

    try {
      await apiPut(`/workouts/${workoutId}/exercises/${ex.id}`, {
        position: ex.position,
        sets: ex.sets,
        reps: ex.reps,
        time_seconds: ex.time_seconds,
        weight: ex.weight,
        rest_seconds: ex.rest_seconds,
        notes: ex.notes,
      })
      
      setEditingExercise(null)
      refetchExercises()
      refetchExerciseAreas()
    } catch (err: any) {
      setError(err.message || 'Failed to update exercise')
    }
  }

  const handleRemoveExercise = async (workoutExerciseId: number) => {
    if (!confirm('Remove this exercise from the workout?')) return

    try {
      await apiDelete(`/workouts/${workoutId}/exercises/${workoutExerciseId}`)
      refetchExercises()
      refetchExerciseAreas()
      refetchLatestLogs()
    } catch (err: any) {
      setError(err.message || 'Failed to remove exercise')
    }
  }

  const handleMoveExercise = async (exercise: WorkoutExercise, direction: 'up' | 'down') => {
    const exercises = workoutExercises() || []
    const currentIndex = exercises.findIndex(e => e.id === exercise.id)
    
    if (direction === 'up' && currentIndex === 0) return
    if (direction === 'down' && currentIndex === exercises.length - 1) return

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    const targetExercise = exercises[targetIndex]

    try {
      // Swap positions
      await apiPut(`/workouts/${workoutId}/exercises/${exercise.id}`, {
        position: targetExercise.position,
        sets: exercise.sets,
        reps: exercise.reps,
        time_seconds: exercise.time_seconds,
        weight: exercise.weight,
        rest_seconds: exercise.rest_seconds,
        notes: exercise.notes,
      })
      
      await apiPut(`/workouts/${workoutId}/exercises/${targetExercise.id}`, {
        position: exercise.position,
        sets: targetExercise.sets,
        reps: targetExercise.reps,
        time_seconds: targetExercise.time_seconds,
        weight: targetExercise.weight,
        rest_seconds: targetExercise.rest_seconds,
        notes: targetExercise.notes,
      })
      
      refetchExercises()
    } catch (err: any) {
      setError(err.message || 'Failed to reorder exercise')
    }
  }

  const handleQuickLogExercise = async (exercise: WorkoutExercise) => {
    setIsLogging(true)
    try {
      await apiPost('/exercise-logs', {
        workout_id: workoutId,
        exercise_id: exercise.exercise_id,
        position: exercise.position,
        sets: exercise.sets,
        reps: exercise.reps,
        time_seconds: exercise.time_seconds,
        weight: exercise.weight,
        rest_seconds: exercise.rest_seconds,
        notes: exercise.notes,
      })
      
      // Show success message briefly
      setError('')
      refetchLatestLogs()
      alert('Exercise logged successfully!')
    } catch (err: any) {
      setError(err.message || 'Failed to log exercise')
    } finally {
      setIsLogging(false)
    }
  }

  const handleOpenLogModal = (exercise: WorkoutExercise) => {
    setLoggingExercise({...exercise})
  }

  const handleSaveLogExercise = async () => {
    const ex = loggingExercise()
    if (!ex) return

    setIsLogging(true)
    try {
      await apiPost('/exercise-logs', {
        workout_id: workoutId,
        exercise_id: ex.exercise_id,
        position: ex.position,
        sets: ex.sets,
        reps: ex.reps,
        time_seconds: ex.time_seconds,
        weight: ex.weight,
        rest_seconds: ex.rest_seconds,
        notes: ex.notes,
      })
      
      setLoggingExercise(null)
      setError('')
      refetchLatestLogs()
      alert('Exercise logged successfully!')
    } catch (err: any) {
      setError(err.message || 'Failed to log exercise')
    } finally {
      setIsLogging(false)
    }
  }

  return (
    <div class="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
      <div class="p-6 border-b border-slate-200 bg-gradient-to-r from-primary-50 to-accent-50">
        <h2 class="text-xl font-bold text-slate-900">Edit Workout</h2>
        <p class="text-sm text-slate-600 mt-1">Modify your workout details and exercises</p>
      </div>

      <Show when={!auth.user}>
        <div class="p-6">
          <div class="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
            <div class="text-4xl mb-3">🔒</div>
            <h3 class="text-lg font-semibold text-slate-900 mb-2">Authentication Required</h3>
            <p class="text-slate-600 mb-4">Please sign in to edit workouts.</p>
            <A
              href="/login"
              class="inline-block px-6 py-2 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600"
            >
              Sign In
            </A>
          </div>
        </div>
      </Show>

      <Show when={auth.user}>
        <Show when={workout.loading}>
          <div class="flex flex-col items-center justify-center py-16 text-slate-500">
            <div class="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <span>Loading workout...</span>
          </div>
        </Show>

        <Show when={workout.error}>
          <div class="p-6">
            <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-3">
              <span class="text-lg">⚠️</span>
              <div class="flex-1">
                <p class="font-medium">Error Loading Workout</p>
                <p class="text-sm mt-0.5">{workout.error?.message}</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/workouts')}
              class="mt-4 px-6 py-2 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200"
            >
              Back to Workouts
            </button>
          </div>
        </Show>

        <Show when={workout() && !workout.loading}>
          <div class="p-6 space-y-6">
            {/* Error Alert */}
            <Show when={error()}>
              <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-3">
                <span class="text-lg">⚠️</span>
                <div class="flex-1">
                  <p class="font-medium">Error</p>
                  <p class="text-sm mt-0.5">{error()}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setError('')}
                  class="text-red-400 hover:text-red-600"
                >
                  ✕
                </button>
              </div>
            </Show>

            {/* Workout Name Form */}
            <form onSubmit={handleSubmit} class="space-y-4">
              <div>
                <label class="block text-sm font-semibold text-slate-700 mb-2">
                  Workout Name *
                </label>
                <input
                  type="text"
                  value={name()}
                  onInput={(e) => setName(e.currentTarget.value)}
                  placeholder="e.g., Upper Body Day, Leg Day, Full Body"
                  class="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm bg-white 
                         focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
                         placeholder:text-slate-400"
                  required
                />
              </div>

              <div class="flex gap-3">
                <button
                  type="submit"
                  disabled={isSubmitting()}
                  class="px-6 py-2 bg-primary-500 text-white rounded-lg font-medium
                         hover:bg-primary-600 active:scale-[0.98] transition-all
                         disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Show when={isSubmitting()}>
                    <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  </Show>
                  {isSubmitting() ? 'Saving...' : 'Save Name'}
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/workouts')}
                  disabled={isSubmitting()}
                  class="px-6 py-2 bg-slate-100 text-slate-700 rounded-lg font-medium
                         hover:bg-slate-200 active:scale-[0.98] transition-all
                         disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Back to Workouts
                </button>
              </div>
            </form>

            {/* Exercise Areas Summary */}
            <Show when={(workoutExercises() || []).length > 0 && (workoutExerciseAreas() || []).length > 0}>
              <div class="border-t border-slate-200 pt-6">
                <h3 class="text-lg font-semibold text-slate-900 mb-4">Targeted Exercise Areas</h3>
                <div class="bg-slate-50 rounded-lg p-5 border border-slate-200">
                  {/* Primary areas (within 25% of max) */}
                  <div class="flex flex-wrap gap-2.5">
                    <For each={splitExerciseAreas().primary}>
                      {(area) => (
                        <div class="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border border-slate-200 hover:border-slate-300 transition-colors">
                          <span class="font-medium text-slate-700 text-sm">{area.exercise_area_name}</span>
                          <div class="flex items-center gap-1.5">
                            <div class="h-1.5 w-14 bg-slate-200 rounded-full overflow-hidden">
                              <div 
                                class="h-full bg-slate-600 rounded-full transition-all"
                                style={{ width: `${Math.min(area.percentage, 100)}%` }}
                              />
                            </div>
                            <span class="text-xs font-semibold text-slate-600 min-w-[2rem] text-right">
                              {Math.round(area.percentage)}%
                            </span>
                          </div>
                        </div>
                      )}
                    </For>
                  </div>

                  {/* Secondary areas (below 25% threshold) - collapsible */}
                  <Show when={splitExerciseAreas().secondary.length > 0}>
                    <div class="mt-3 pt-3 border-t border-slate-200">
                      <button
                        onClick={() => setShowAllAreas(!showAllAreas())}
                        class="text-xs text-slate-500 hover:text-slate-700 font-medium flex items-center gap-1.5 transition-colors"
                      >
                        <span class="text-[10px]">{showAllAreas() ? '▼' : '▶'}</span>
                        <span>
                          {showAllAreas() ? 'Hide' : 'Show all'} ({splitExerciseAreas().secondary.length} more)
                        </span>
                      </button>
                      
                      <Show when={showAllAreas()}>
                        <div class="flex flex-wrap gap-2.5 mt-3">
                          <For each={splitExerciseAreas().secondary}>
                            {(area) => (
                              <div class="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border border-slate-200 opacity-60">
                                <span class="font-medium text-slate-600 text-sm">{area.exercise_area_name}</span>
                                <div class="flex items-center gap-1.5">
                                  <div class="h-1.5 w-14 bg-slate-200 rounded-full overflow-hidden">
                                    <div 
                                      class="h-full bg-slate-400 rounded-full transition-all"
                                      style={{ width: `${Math.min(area.percentage, 100)}%` }}
                                    />
                                  </div>
                                  <span class="text-xs font-semibold text-slate-500 min-w-[2rem] text-right">
                                    {Math.round(area.percentage)}%
                                  </span>
                                </div>
                              </div>
                            )}
                          </For>
                        </div>
                      </Show>
                    </div>
                  </Show>

                  <div class="mt-3 text-xs text-slate-500 italic">
                    Mean activation across all exercises in this workout
                  </div>
                </div>
              </div>
            </Show>

            {/* Exercises Section */}
            <div class="border-t border-slate-200 pt-6">
              <div class="flex justify-between items-center mb-4">
                <div class="flex items-center gap-3">
                  <h3 class="text-lg font-semibold text-slate-900">Exercises</h3>
                  <Show when={(workoutExercises() || []).length > 0}>
                    <div class="px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-sm font-medium flex items-center gap-1.5">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {totalWorkoutTime()}
                    </div>
                  </Show>
                </div>
                <button
                  onClick={() => setShowExerciseSearch(!showExerciseSearch())}
                  class="px-4 py-2 bg-accent-500 text-white rounded-lg text-sm font-medium
                         hover:bg-accent-600 active:scale-[0.98] transition-all"
                >
                  ➕ Add Exercise
                </button>
              </div>

              {/* Add Exercise Search */}
              <Show when={showExerciseSearch()}>
                <div class="mb-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <input
                    type="text"
                    value={searchExercise()}
                    onInput={(e) => setSearchExercise(e.currentTarget.value)}
                    placeholder="Search exercises..."
                    class="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm bg-white 
                           focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  
                  <Show when={searchExercise() && filteredExercises().length > 0}>
                    <div class="mt-2 border border-slate-200 rounded-lg divide-y divide-slate-100 max-h-60 overflow-y-auto bg-white">
                      <For each={filteredExercises()}>
                        {(exercise) => (
                          <button
                            type="button"
                            onClick={() => handleAddExercise(exercise)}
                            class="w-full px-4 py-2 text-left hover:bg-primary-50 transition-colors flex items-center justify-between group"
                          >
                            <div>
                              <div class="text-sm font-medium text-slate-900">{exercise.name}</div>
                              <div class="text-xs text-slate-500">{exercise.type}</div>
                            </div>
                            <span class="text-primary-500 opacity-0 group-hover:opacity-100">+ Add</span>
                          </button>
                        )}
                      </For>
                    </div>
                  </Show>
                </div>
              </Show>

              {/* Exercises List */}
              <Show when={workoutExercises.loading}>
                <div class="text-center py-8 text-slate-500">
                  <div class="w-6 h-6 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                  Loading exercises...
                </div>
              </Show>

              <Show when={!workoutExercises.loading && workoutExercises() && workoutExercises()!.length === 0}>
                <div class="text-center py-12 text-slate-400">
                  <div class="text-4xl mb-2">💪</div>
                  <p>No exercises added yet. Click "Add Exercise" to get started.</p>
                </div>
              </Show>

              <div class="space-y-2">
                <For each={workoutExercises()}>
                  {(ex) => (
                    <div class="p-4 border border-slate-200 rounded-lg hover:border-primary-300 transition-colors">
                      <Show when={editingExercise()?.id !== ex.id}>
                        <div class="flex items-start justify-between gap-4">
                          {/* Order controls */}
                          <div class="flex flex-col gap-1">
                            <button
                              onClick={() => handleMoveExercise(ex, 'up')}
                              disabled={(workoutExercises() || []).findIndex(e => e.id === ex.id) === 0}
                              class="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                              title="Move up"
                            >
                              ▲
                            </button>
                            <button
                              onClick={() => handleMoveExercise(ex, 'down')}
                              disabled={(workoutExercises() || []).findIndex(e => e.id === ex.id) === (workoutExercises() || []).length - 1}
                              class="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                              title="Move down"
                            >
                              ▼
                            </button>
                          </div>
                          
                          <div class="flex-1 min-w-0">
                            <div class="font-semibold text-slate-900">{ex.exercise_name}</div>
                            <div class="text-xs text-slate-500 mb-2">{ex.exercise_type}</div>
                            <div class="flex flex-wrap gap-2 text-sm">
                              <Show when={ex.sets}>
                                <span class="px-2 py-0.5 bg-blue-50 text-blue-700 rounded">
                                  {ex.sets} sets
                                </span>
                              </Show>
                              <Show when={ex.reps}>
                                <span class="px-2 py-0.5 bg-green-50 text-green-700 rounded">
                                  {ex.reps} reps
                                </span>
                              </Show>
                              <Show when={ex.time_seconds}>
                                <span class="px-2 py-0.5 bg-purple-50 text-purple-700 rounded">
                                  {ex.time_seconds}s
                                </span>
                              </Show>
                              <Show when={ex.weight}>
                                <span class="px-2 py-0.5 bg-orange-50 text-orange-700 rounded">
                                  {ex.weight} kg
                                </span>
                              </Show>
                              <Show when={ex.rest_seconds}>
                                <span class="px-2 py-0.5 bg-slate-50 text-slate-700 rounded">
                                  Rest: {ex.rest_seconds}s
                                </span>
                              </Show>
                            </div>
                            <Show when={ex.notes}>
                              <div class="text-xs text-slate-600 mt-2 italic">{ex.notes}</div>
                            </Show>
                          </div>
                          
                          {/* Action buttons */}
                          <div class="flex gap-2">
                            <div class="flex flex-col gap-1">
                              <button
                                onClick={() => setEditingExercise(ex)}
                                class="w-7 h-7 flex items-center justify-center text-primary-500 hover:text-primary-700 hover:bg-primary-50 rounded transition-colors"
                                title="Edit exercise"
                              >
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleRemoveExercise(ex.id)}
                                class="w-7 h-7 flex items-center justify-center text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                                title="Remove exercise"
                              >
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                            <div class="flex flex-col gap-1">
                              <button
                                onClick={() => handleQuickLogExercise(ex)}
                                disabled={isLogging()}
                                class="w-7 h-7 flex items-center justify-center text-green-500 hover:text-green-700 hover:bg-green-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Quick log (save with current params)"
                              >
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleOpenLogModal(ex)}
                                disabled={isLogging()}
                                class="w-7 h-7 flex items-center justify-center text-accent-500 hover:text-accent-700 hover:bg-accent-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Log with edits"
                              >
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        </div>
                      </Show>

                      <Show when={editingExercise()?.id === ex.id}>
                        <div class="space-y-3">
                          <div class="font-semibold text-slate-900 mb-3">
                            {ex.exercise_name} <span class="text-xs text-slate-500">({ex.exercise_type})</span>
                          </div>
                          <div class="grid grid-cols-2 gap-3">
                            {/* Sets - for all types */}
                            <Show when={showSets(ex.exercise_type)}>
                              <div>
                                <label class="block text-xs font-medium text-slate-700 mb-1">Sets</label>
                                <input
                                  type="number"
                                  value={editingExercise()?.sets || ''}
                                  onInput={(e) => setEditingExercise(prev => ({ ...prev!, sets: parseInt(e.currentTarget.value) || undefined }))}
                                  class="w-full px-3 py-2 border border-slate-200 rounded text-sm"
                                  min="1"
                                />
                              </div>
                            </Show>
                            
                            {/* Reps - for Reps, Eccentric, Reps Weighted */}
                            <Show when={showReps(ex.exercise_type)}>
                              <div>
                                <label class="block text-xs font-medium text-slate-700 mb-1">Reps</label>
                                <input
                                  type="number"
                                  value={editingExercise()?.reps || ''}
                                  onInput={(e) => setEditingExercise(prev => ({ ...prev!, reps: parseInt(e.currentTarget.value) || undefined }))}
                                  class="w-full px-3 py-2 border border-slate-200 rounded text-sm"
                                  min="1"
                                />
                              </div>
                            </Show>
                            
                            {/* Time - for Isometric, Isometric Weighted */}
                            <Show when={showTime(ex.exercise_type)}>
                              <div>
                                <label class="block text-xs font-medium text-slate-700 mb-1">Time (seconds)</label>
                                <input
                                  type="number"
                                  value={editingExercise()?.time_seconds || ''}
                                  onInput={(e) => setEditingExercise(prev => ({ ...prev!, time_seconds: parseInt(e.currentTarget.value) || undefined }))}
                                  class="w-full px-3 py-2 border border-slate-200 rounded text-sm"
                                  min="1"
                                />
                              </div>
                            </Show>
                            
                            {/* Weight - for Reps Weighted, Isometric Weighted */}
                            <Show when={showWeight(ex.exercise_type)}>
                              <div>
                                <label class="block text-xs font-medium text-slate-700 mb-1">Weight (kg)</label>
                                <input
                                  type="number"
                                  step="0.5"
                                  value={editingExercise()?.weight || ''}
                                  onInput={(e) => setEditingExercise(prev => ({ ...prev!, weight: parseFloat(e.currentTarget.value) || undefined }))}
                                  class="w-full px-3 py-2 border border-slate-200 rounded text-sm"
                                  min="0"
                                />
                              </div>
                            </Show>
                            
                            {/* Rest - for all types */}
                            <Show when={showRest(ex.exercise_type)}>
                              <div>
                                <label class="block text-xs font-medium text-slate-700 mb-1">Rest (seconds)</label>
                                <input
                                  type="number"
                                  value={editingExercise()?.rest_seconds || ''}
                                  onInput={(e) => setEditingExercise(prev => ({ ...prev!, rest_seconds: parseInt(e.currentTarget.value) || undefined }))}
                                  class="w-full px-3 py-2 border border-slate-200 rounded text-sm"
                                  min="0"
                                />
                              </div>
                            </Show>
                          </div>
                          <div>
                            <label class="block text-xs font-medium text-slate-700 mb-1">Notes</label>
                            <input
                              type="text"
                              value={editingExercise()?.notes || ''}
                              onInput={(e) => setEditingExercise(prev => ({ ...prev!, notes: e.currentTarget.value || undefined }))}
                              class="w-full px-3 py-2 border border-slate-200 rounded text-sm"
                              placeholder="Optional notes..."
                            />
                          </div>
                          <div class="flex gap-2 pt-2">
                            <button
                              onClick={handleUpdateExercise}
                              class="px-4 py-2 bg-primary-500 text-white rounded text-sm hover:bg-primary-600"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingExercise(null)}
                              class="px-4 py-2 bg-slate-100 text-slate-700 rounded text-sm hover:bg-slate-200"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </Show>
                    </div>
                  )}
                </For>
              </div>
            </div>

            {/* Last Logged Exercises Card */}
            <Show when={(latestLogs()?.exercise_logs ?? []).length > 0}>
              <div class="border-t border-slate-200 pt-6">
                <div class="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
                  {/* Header */}
                  <div class="p-4 border-b border-slate-200 bg-gradient-to-r from-accent-50 to-primary-50">
                    <h3 class="text-lg font-bold text-slate-900">Last Logged</h3>
                    <p class="text-sm text-slate-600 mt-0.5">Latest log entry per exercise in this workout</p>
                  </div>

                  {/* Desktop Table - single table for consistent column widths */}
                  <div class="hidden sm:block">
                    <table class="w-full table-fixed">
                      <colgroup>
                        <col class="w-[100px]" />
                        <col class="w-[25%]" />
                        <col />
                        <col class="w-[20%]" />
                      </colgroup>
                      <thead>
                        <tr class="border-b border-slate-100">
                          <th class="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-2">Time</th>
                          <th class="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-2">Exercise</th>
                          <th class="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-2">Details</th>
                          <th class="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-2">Notes</th>
                        </tr>
                      </thead>
                      <tbody>
                        <For each={groupedLatestLogs()}>
                          {(group, groupIndex) => (
                            <>
                              {/* Day Header Row */}
                              <tr class={`bg-slate-50 ${groupIndex() > 0 ? 'border-t-2 border-slate-200' : ''}`}>
                                <td colspan="4" class="px-6 py-3 border-b border-slate-200">
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
                                      {formatLogTime(log.logged_when)}
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
                    <For each={groupedLatestLogs()}>
                      {(group, groupIndex) => (
                        <div class={groupIndex() > 0 ? 'border-t-2 border-slate-200' : ''}>
                          {/* Day Header */}
                          <div class="px-4 py-3 bg-slate-50 border-b border-slate-200">
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
                                  <div class="flex-1 min-w-0 mb-2">
                                    <div class="font-medium text-slate-900 text-sm">{log.exercise_name}</div>
                                    <div class="flex items-center gap-2 text-xs text-slate-500">
                                      <span>{log.exercise_type}</span>
                                      <span>·</span>
                                      <span>{formatLogTime(log.logged_when)}</span>
                                    </div>
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
                </div>
              </div>
            </Show>
          </div>
        </Show>
      </Show>

      {/* Exercise Log Modal */}
      <Show when={loggingExercise()}>
        <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div class="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div class="p-6 border-b border-slate-200 bg-gradient-to-r from-accent-50 to-primary-50">
              <h3 class="text-xl font-bold text-slate-900">Log Exercise</h3>
              <p class="text-sm text-slate-600 mt-1">Edit parameters before logging</p>
            </div>
            
            <div class="p-6">
              <Show when={error()}>
                <div class="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-3">
                  <span class="text-lg">⚠️</span>
                  <div class="flex-1">
                    <p class="font-medium">Error</p>
                    <p class="text-sm mt-0.5">{error()}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setError('')}
                    class="text-red-400 hover:text-red-600"
                  >
                    ✕
                  </button>
                </div>
              </Show>

              <div class="space-y-4">
                <div class="font-semibold text-slate-900 mb-3">
                  {loggingExercise()?.exercise_name} <span class="text-xs text-slate-500">({loggingExercise()?.exercise_type})</span>
                </div>
                
                <div class="grid grid-cols-2 gap-4">
                  {/* Sets - for all types */}
                  <Show when={showSets(loggingExercise()?.exercise_type || '')}>
                    <div>
                      <label class="block text-sm font-medium text-slate-700 mb-1">Sets</label>
                      <input
                        type="number"
                        value={loggingExercise()?.sets || ''}
                        onInput={(e) => setLoggingExercise(prev => ({ ...prev!, sets: parseInt(e.currentTarget.value) || undefined }))}
                        class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent-500"
                        min="1"
                      />
                    </div>
                  </Show>
                  
                  {/* Reps - for Reps, Eccentric, Reps Weighted */}
                  <Show when={showReps(loggingExercise()?.exercise_type || '')}>
                    <div>
                      <label class="block text-sm font-medium text-slate-700 mb-1">Reps</label>
                      <input
                        type="number"
                        value={loggingExercise()?.reps || ''}
                        onInput={(e) => setLoggingExercise(prev => ({ ...prev!, reps: parseInt(e.currentTarget.value) || undefined }))}
                        class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent-500"
                        min="1"
                      />
                    </div>
                  </Show>
                  
                  {/* Time - for Isometric, Isometric Weighted */}
                  <Show when={showTime(loggingExercise()?.exercise_type || '')}>
                    <div>
                      <label class="block text-sm font-medium text-slate-700 mb-1">Time (seconds)</label>
                      <input
                        type="number"
                        value={loggingExercise()?.time_seconds || ''}
                        onInput={(e) => setLoggingExercise(prev => ({ ...prev!, time_seconds: parseInt(e.currentTarget.value) || undefined }))}
                        class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent-500"
                        min="1"
                      />
                    </div>
                  </Show>
                  
                  {/* Weight - for Reps Weighted, Isometric Weighted */}
                  <Show when={showWeight(loggingExercise()?.exercise_type || '')}>
                    <div>
                      <label class="block text-sm font-medium text-slate-700 mb-1">Weight (kg)</label>
                      <input
                        type="number"
                        step="0.5"
                        value={loggingExercise()?.weight || ''}
                        onInput={(e) => setLoggingExercise(prev => ({ ...prev!, weight: parseFloat(e.currentTarget.value) || undefined }))}
                        class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent-500"
                        min="0"
                      />
                    </div>
                  </Show>
                  
                  {/* Rest - for all types */}
                  <Show when={showRest(loggingExercise()?.exercise_type || '')}>
                    <div>
                      <label class="block text-sm font-medium text-slate-700 mb-1">Rest (seconds)</label>
                      <input
                        type="number"
                        value={loggingExercise()?.rest_seconds || ''}
                        onInput={(e) => setLoggingExercise(prev => ({ ...prev!, rest_seconds: parseInt(e.currentTarget.value) || undefined }))}
                        class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent-500"
                        min="0"
                      />
                    </div>
                  </Show>
                </div>
                
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-1">Notes</label>
                  <textarea
                    value={loggingExercise()?.notes || ''}
                    onInput={(e) => setLoggingExercise(prev => ({ ...prev!, notes: e.currentTarget.value || undefined }))}
                    class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent-500"
                    placeholder="Optional notes..."
                    rows="3"
                  />
                </div>
              </div>
            </div>

            <div class="p-6 border-t border-slate-200 bg-slate-50 flex gap-3">
              <button
                onClick={handleSaveLogExercise}
                disabled={isLogging()}
                class="flex-1 px-6 py-2.5 bg-accent-500 text-white rounded-lg font-medium
                       hover:bg-accent-600 active:scale-[0.98] transition-all
                       disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Show when={isLogging()}>
                  <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                </Show>
                {isLogging() ? 'Logging...' : 'Log Exercise'}
              </button>
              <button
                onClick={() => setLoggingExercise(null)}
                disabled={isLogging()}
                class="px-6 py-2.5 bg-slate-100 text-slate-700 rounded-lg font-medium
                       hover:bg-slate-200 active:scale-[0.98] transition-all
                       disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </Show>
    </div>
  )
}
