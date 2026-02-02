import { createSignal, createResource, For, Show, createMemo } from 'solid-js'
import { A } from '@solidjs/router'
import { apiGet, apiDelete } from '../api'
import { useAuth } from '../auth'

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

interface Workout {
  id: number
  name: string
  created_when: string
  modified_when: string
  exercises?: WorkoutExercise[]
}

interface WorkoutsResponse {
  workouts: Workout[]
  count: number
}

async function fetchWorkouts(): Promise<WorkoutsResponse> {
  const response = await apiGet<WorkoutsResponse>('/workouts')
  
  // Fetch exercises for each workout
  const workoutsWithExercises = await Promise.all(
    response.workouts.map(async (workout) => {
      try {
        const exercisesData = await apiGet<{ exercises: WorkoutExercise[] }>(`/workouts/${workout.id}/exercises`)
        return { ...workout, exercises: exercisesData.exercises }
      } catch {
        return { ...workout, exercises: [] }
      }
    })
  )
  
  return { ...response, workouts: workoutsWithExercises }
}

export default function Workouts() {
  const auth = useAuth()
  const [data, { refetch }] = createResource(fetchWorkouts)
  const [search, setSearch] = createSignal('')
  const [deletingId, setDeletingId] = createSignal<number | null>(null)

  const filteredWorkouts = createMemo(() => {
    const workouts = data()?.workouts ?? []
    const query = search().toLowerCase().trim()
    if (!query) return workouts
    return workouts.filter((w) => w.name.toLowerCase().includes(query))
  })

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to delete workout "${name}"?`)) {
      return
    }

    setDeletingId(id)
    try {
      await apiDelete(`/workouts/${id}`)
      refetch()
    } catch (err: any) {
      alert(`Failed to delete workout: ${err.message}`)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div class="relative">
      {/* Stats */}
      <Show when={data()}>
        <div class="flex gap-3 mb-6 flex-wrap">
          <span class="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-full text-sm font-medium shadow-sm">
            My Workouts
            <span class="bg-primary-500 text-white px-2 py-0.5 rounded-full text-xs font-semibold">
              {data()!.count}
            </span>
          </span>
        </div>
      </Show>

      {/* Auth Check */}
      <Show when={!auth.user}>
        <div class="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
          <div class="text-4xl mb-3">🔒</div>
          <h3 class="text-lg font-semibold text-slate-900 mb-2">Authentication Required</h3>
          <p class="text-slate-600 mb-4">Please sign in to view and manage your workouts.</p>
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
          {/* Search Box */}
          <div class="p-4 border-b border-slate-200 bg-slate-50">
            <div class="relative">
              <span class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                🔍
              </span>
              <input
                type="text"
                class="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-lg text-sm bg-white 
                       focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
                       placeholder:text-slate-400 transition-shadow"
                placeholder="Search workouts..."
                value={search()}
                onInput={(e) => setSearch(e.currentTarget.value)}
              />
            </div>
          </div>

          {/* Loading State */}
          <Show when={data.loading}>
            <div class="flex flex-col items-center justify-center py-16 text-slate-500">
              <div class="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mb-4"></div>
              <span>Loading workouts...</span>
            </div>
          </Show>

          {/* Error State */}
          <Show when={data.error}>
            <div class="py-12 px-4 text-center text-red-600">
              <div class="text-4xl mb-2">⚠️</div>
              <p class="font-medium">Failed to load workouts</p>
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
            <Show when={filteredWorkouts().length === 0 && !search()}>
              <div class="py-16 px-4 text-center text-slate-500">
                <div class="text-4xl mb-2 opacity-50">💪</div>
                <p class="font-medium text-lg mb-1">No workouts yet</p>
                <p class="text-sm">Create your first workout to get started!</p>
              </div>
            </Show>

            <Show when={filteredWorkouts().length === 0 && search()}>
              <div class="py-16 px-4 text-center text-slate-500">
                <div class="text-4xl mb-2 opacity-50">🔍</div>
                <p>No workouts found matching "{search()}"</p>
              </div>
            </Show>

            <Show when={filteredWorkouts().length > 0}>
              {/* Desktop View */}
              <div class="hidden sm:block divide-y divide-slate-200">
                <For each={filteredWorkouts()}>
                  {(workout) => (
                    <div class="p-6 hover:bg-slate-50 transition-colors">
                      <div class="flex items-start justify-between gap-4 mb-4">
                        <div class="flex-1">
                          <A 
                            href={`/workouts/${workout.id}/edit`}
                            class="text-lg font-bold text-primary-600 hover:text-primary-700 hover:underline transition-colors cursor-pointer inline-block"
                          >
                            {workout.name}
                          </A>
                        </div>
                        <button
                          onClick={() => handleDelete(workout.id, workout.name)}
                          disabled={deletingId() === workout.id}
                          class="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all
                                 disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Delete workout"
                        >
                          <Show when={deletingId() === workout.id}>
                            <div class="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                          </Show>
                          <Show when={deletingId() !== workout.id}>
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </Show>
                        </button>
                      </div>
                      
                      {/* Exercises List */}
                      <Show when={(workout.exercises || []).length > 0}>
                        <div class="space-y-1.5">
                          <For each={workout.exercises}>
                            {(ex) => (
                              <div class="flex items-center gap-3 p-2 bg-white border border-slate-200 rounded-lg hover:border-slate-300 transition-colors">
                                <div class="flex-1 flex items-center gap-3 flex-wrap min-w-0">
                                  <div class="flex items-center gap-2 min-w-0">
                                    <div class="font-medium text-slate-900 text-sm truncate">{ex.exercise_name}</div>
                                    <div class="text-xs text-slate-400 flex-shrink-0">·</div>
                                    <div class="text-xs text-slate-500 flex-shrink-0">{ex.exercise_type}</div>
                                  </div>
                                  <div class="flex items-center gap-1.5 flex-wrap">
                                    <Show when={ex.sets}>
                                      <span class="px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-medium whitespace-nowrap">
                                        {ex.sets}×
                                      </span>
                                    </Show>
                                    <Show when={ex.reps}>
                                      <span class="px-1.5 py-0.5 bg-green-50 text-green-700 rounded text-xs font-medium whitespace-nowrap">
                                        {ex.reps} reps
                                      </span>
                                    </Show>
                                    <Show when={ex.time_seconds}>
                                      <span class="px-1.5 py-0.5 bg-purple-50 text-purple-700 rounded text-xs font-medium whitespace-nowrap">
                                        {ex.time_seconds}s
                                      </span>
                                    </Show>
                                    <Show when={ex.weight}>
                                      <span class="px-1.5 py-0.5 bg-orange-50 text-orange-700 rounded text-xs font-medium whitespace-nowrap">
                                        {ex.weight}kg
                                      </span>
                                    </Show>
                                    <Show when={ex.rest_seconds}>
                                      <span class="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-xs font-medium whitespace-nowrap">
                                        ↻ {ex.rest_seconds}s
                                      </span>
                                    </Show>
                                  </div>
                                </div>
                                <Show when={ex.notes}>
                                  <div class="text-xs text-slate-500 italic flex-shrink-0 max-w-xs truncate" title={ex.notes}>
                                    "{ex.notes}"
                                  </div>
                                </Show>
                              </div>
                            )}
                          </For>
                        </div>
                      </Show>
                      
                      <Show when={(workout.exercises || []).length === 0}>
                        <div class="text-sm text-slate-400 italic">No exercises added yet</div>
                      </Show>
                    </div>
                  )}
                </For>
              </div>

              {/* Mobile View */}
              <div class="sm:hidden p-4 space-y-4">
                <For each={filteredWorkouts()}>
                  {(workout) => (
                    <div class="bg-white border border-slate-200 rounded-lg p-4 hover:border-primary-300 hover:shadow-md transition-all">
                      <div class="flex justify-between items-start gap-3 mb-4">
                        <A 
                          href={`/workouts/${workout.id}/edit`}
                          class="font-bold text-primary-600 flex-1 text-lg"
                        >
                          {workout.name}
                        </A>
                        <button
                          onClick={() => handleDelete(workout.id, workout.name)}
                          disabled={deletingId() === workout.id}
                          class="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all flex-shrink-0
                                 disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Delete workout"
                        >
                          <Show when={deletingId() === workout.id}>
                            <div class="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                          </Show>
                          <Show when={deletingId() !== workout.id}>
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </Show>
                        </button>
                      </div>
                      
                      {/* Exercises List */}
                      <Show when={(workout.exercises || []).length > 0}>
                        <div class="space-y-1.5">
                          <For each={workout.exercises}>
                            {(ex) => (
                              <div class="p-2 bg-slate-50 border border-slate-200 rounded-lg">
                                <div class="flex items-center gap-2 mb-1.5">
                                  <div class="font-medium text-slate-900 text-sm flex-1 truncate">{ex.exercise_name}</div>
                                  <div class="text-xs text-slate-500 flex-shrink-0">{ex.exercise_type}</div>
                                </div>
                                <div class="flex flex-wrap gap-1.5">
                                  <Show when={ex.sets}>
                                    <span class="px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-medium">
                                      {ex.sets}×
                                    </span>
                                  </Show>
                                  <Show when={ex.reps}>
                                    <span class="px-1.5 py-0.5 bg-green-50 text-green-700 rounded text-xs font-medium">
                                      {ex.reps} reps
                                    </span>
                                  </Show>
                                  <Show when={ex.time_seconds}>
                                    <span class="px-1.5 py-0.5 bg-purple-50 text-purple-700 rounded text-xs font-medium">
                                      {ex.time_seconds}s
                                    </span>
                                  </Show>
                                  <Show when={ex.weight}>
                                    <span class="px-1.5 py-0.5 bg-orange-50 text-orange-700 rounded text-xs font-medium">
                                      {ex.weight}kg
                                    </span>
                                  </Show>
                                  <Show when={ex.rest_seconds}>
                                    <span class="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-xs font-medium">
                                      ↻ {ex.rest_seconds}s
                                    </span>
                                  </Show>
                                </div>
                                <Show when={ex.notes}>
                                  <div class="text-xs text-slate-600 mt-1.5 italic line-clamp-1">"{ex.notes}"</div>
                                </Show>
                              </div>
                            )}
                          </For>
                        </div>
                      </Show>
                      
                      <Show when={(workout.exercises || []).length === 0}>
                        <div class="text-sm text-slate-400 italic">No exercises added yet</div>
                      </Show>
                    </div>
                  )}
                </For>
              </div>
            </Show>
          </Show>
        </div>
      </Show>

      {/* Floating Action Button */}
      <Show when={auth.user}>
        <A
          href="/workouts/new"
          class="fixed bottom-6 right-6 w-14 h-14 bg-accent-500 text-white rounded-full shadow-lg
                 flex items-center justify-center text-2xl hover:bg-accent-600 hover:scale-110
                 active:scale-95 transition-all z-50"
          title="Add new workout"
        >
          ➕
        </A>
      </Show>
    </div>
  )
}
