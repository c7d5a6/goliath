import { createSignal, createResource, createEffect, Show } from 'solid-js'
import { useNavigate, useParams } from '@solidjs/router'
import { apiGet, apiPut } from '../api'
import { useAuth } from '../auth'
import { A } from '@solidjs/router'

interface Workout {
  id: number
  name: string
  user_id: number
}

async function fetchWorkout(id: number) {
  return apiGet<Workout>(`/workouts/${id}`)
}

export default function EditWorkout() {
  const params = useParams()
  const navigate = useNavigate()
  const auth = useAuth()
  const workoutId = parseInt(params.id || '0')
  
  const [workout] = createResource(() => workoutId, fetchWorkout)
  
  const [name, setName] = createSignal('')
  const [error, setError] = createSignal('')
  const [isSubmitting, setIsSubmitting] = createSignal(false)

  // Initialize form with workout data when loaded
  createEffect(() => {
    const w = workout()
    if (w) {
      setName(w.name)
    }
  })

  const handleSubmit = async (e: Event) => {
    e.preventDefault()
    setError('')

    // Validation
    if (!name().trim()) {
      setError('Workout name is required')
      return
    }

    setIsSubmitting(true)
    
    try {
      await apiPut(`/workouts/${workoutId}`, {
        name: name().trim(),
      })

      // Success - navigate to workouts page
      navigate('/workouts')
    } catch (err: any) {
      setError(err.message || 'Network error')
      setIsSubmitting(false)
    }
  }

  return (
    <div class="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
      <div class="p-6 border-b border-slate-200 bg-gradient-to-r from-primary-50 to-accent-50">
        <h2 class="text-xl font-bold text-slate-900">Edit Workout</h2>
        <p class="text-sm text-slate-600 mt-1">Modify your workout details</p>
      </div>

      {/* Auth Check */}
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
          <form onSubmit={handleSubmit} class="p-6 space-y-6">
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

            {/* Workout Name */}
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

            {/* Submit Buttons */}
            <div class="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={isSubmitting()}
                class="flex-1 px-6 py-3 bg-primary-500 text-white rounded-lg font-medium
                       hover:bg-primary-600 active:scale-[0.98] transition-all
                       disabled:opacity-50 disabled:cursor-not-allowed
                       flex items-center justify-center gap-2"
              >
                <Show when={isSubmitting()}>
                  <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                </Show>
                {isSubmitting() ? 'Updating...' : 'Update Workout'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/workouts')}
                disabled={isSubmitting()}
                class="px-6 py-3 bg-slate-100 text-slate-700 rounded-lg font-medium
                       hover:bg-slate-200 active:scale-[0.98] transition-all
                       disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
            </div>
          </form>
        </Show>
      </Show>
    </div>
  )
}
