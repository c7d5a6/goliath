import { createSignal, createResource, createEffect, Show, For } from 'solid-js'
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
  notes?: string
}

interface Exercise {
  id: number
  name: string
  type: string
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

export default function EditWorkout() {
  const params = useParams()
  const navigate = useNavigate()
  const auth = useAuth()
  const workoutId = parseInt(params.id || '0')
  
  const [workout] = createResource(() => workoutId, fetchWorkout)
  const [workoutExercises, { refetch: refetchExercises }] = createResource(() => workoutId, fetchWorkoutExercises)
  const [allExercises] = createResource(fetchAllExercises)
  
  const [name, setName] = createSignal('')
  const [error, setError] = createSignal('')
  const [isSubmitting, setIsSubmitting] = createSignal(false)
  
  // Exercise search and add state
  const [searchExercise, setSearchExercise] = createSignal('')
  const [showExerciseSearch, setShowExerciseSearch] = createSignal(false)
  const [editingExercise, setEditingExercise] = createSignal<WorkoutExercise | null>(null)

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

  const handleAddExercise = async (exercise: Exercise) => {
    try {
      const exercises = workoutExercises() || []
      const position = exercises.length
      
      await apiPost(`/workouts/${workoutId}/exercises`, {
        exercise_id: exercise.id,
        position: position,
        sets: exercise.type === 'Reps' ? 3 : undefined,
        reps: exercise.type === 'Reps' ? 10 : undefined,
        time_seconds: exercise.type !== 'Reps' ? 30 : undefined,
      })
      
      setSearchExercise('')
      setShowExerciseSearch(false)
      refetchExercises()
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
        notes: ex.notes,
      })
      
      setEditingExercise(null)
      refetchExercises()
    } catch (err: any) {
      setError(err.message || 'Failed to update exercise')
    }
  }

  const handleRemoveExercise = async (workoutExerciseId: number) => {
    if (!confirm('Remove this exercise from the workout?')) return

    try {
      await apiDelete(`/workouts/${workoutId}/exercises/${workoutExerciseId}`)
      refetchExercises()
    } catch (err: any) {
      setError(err.message || 'Failed to remove exercise')
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

            {/* Exercises Section */}
            <div class="border-t border-slate-200 pt-6">
              <div class="flex justify-between items-center mb-4">
                <h3 class="text-lg font-semibold text-slate-900">Exercises</h3>
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
                          <div class="flex-1">
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
                            </div>
                            <Show when={ex.notes}>
                              <div class="text-xs text-slate-600 mt-2 italic">{ex.notes}</div>
                            </Show>
                          </div>
                          <div class="flex gap-2">
                            <button
                              onClick={() => setEditingExercise(ex)}
                              class="px-3 py-1 text-sm text-primary-600 hover:bg-primary-50 rounded"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleRemoveExercise(ex.id)}
                              class="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </Show>

                      <Show when={editingExercise()?.id === ex.id}>
                        <div class="space-y-3">
                          <div class="font-semibold text-slate-900 mb-3">{ex.exercise_name}</div>
                          <div class="grid grid-cols-2 gap-3">
                            <Show when={ex.exercise_type === 'Reps'}>
                              <div>
                                <label class="block text-xs font-medium text-slate-700 mb-1">Sets</label>
                                <input
                                  type="number"
                                  value={editingExercise()?.sets || ''}
                                  onInput={(e) => setEditingExercise({ ...ex, sets: parseInt(e.currentTarget.value) || undefined })}
                                  class="w-full px-3 py-2 border border-slate-200 rounded text-sm"
                                  min="1"
                                />
                              </div>
                              <div>
                                <label class="block text-xs font-medium text-slate-700 mb-1">Reps</label>
                                <input
                                  type="number"
                                  value={editingExercise()?.reps || ''}
                                  onInput={(e) => setEditingExercise({ ...ex, reps: parseInt(e.currentTarget.value) || undefined })}
                                  class="w-full px-3 py-2 border border-slate-200 rounded text-sm"
                                  min="1"
                                />
                              </div>
                            </Show>
                            <Show when={ex.exercise_type !== 'Reps'}>
                              <div>
                                <label class="block text-xs font-medium text-slate-700 mb-1">Time (seconds)</label>
                                <input
                                  type="number"
                                  value={editingExercise()?.time_seconds || ''}
                                  onInput={(e) => setEditingExercise({ ...ex, time_seconds: parseInt(e.currentTarget.value) || undefined })}
                                  class="w-full px-3 py-2 border border-slate-200 rounded text-sm"
                                  min="1"
                                />
                              </div>
                            </Show>
                            <div>
                              <label class="block text-xs font-medium text-slate-700 mb-1">Weight (kg)</label>
                              <input
                                type="number"
                                step="0.5"
                                value={editingExercise()?.weight || ''}
                                onInput={(e) => setEditingExercise({ ...ex, weight: parseFloat(e.currentTarget.value) || undefined })}
                                class="w-full px-3 py-2 border border-slate-200 rounded text-sm"
                                min="0"
                              />
                            </div>
                          </div>
                          <div>
                            <label class="block text-xs font-medium text-slate-700 mb-1">Notes</label>
                            <input
                              type="text"
                              value={editingExercise()?.notes || ''}
                              onInput={(e) => setEditingExercise({ ...ex, notes: e.currentTarget.value || undefined })}
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
          </div>
        </Show>
      </Show>
    </div>
  )
}
