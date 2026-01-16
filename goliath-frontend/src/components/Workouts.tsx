import { createSignal, createResource, For, Show, createMemo } from 'solid-js'
import { A } from '@solidjs/router'
import { apiGet, apiDelete } from '../api'
import { useAuth } from '../auth'

interface Workout {
  id: number
  name: string
  created_when: string
  modified_when: string
}

interface WorkoutsResponse {
  workouts: Workout[]
  count: number
}

async function fetchWorkouts(): Promise<WorkoutsResponse> {
  return apiGet<WorkoutsResponse>('/workouts')
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

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    } catch {
      return dateStr
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
              {/* Desktop Table View */}
              <div class="hidden sm:block overflow-x-auto">
                <table class="w-full text-sm">
                  <thead class="bg-gradient-to-b from-slate-50 to-slate-100 sticky top-0">
                    <tr>
                      <th class="px-4 py-3 text-left font-semibold text-slate-700 border-b-2 border-slate-200 text-xs uppercase tracking-wide">
                        #
                      </th>
                      <th class="px-4 py-3 text-left font-semibold text-slate-700 border-b-2 border-slate-200 text-xs uppercase tracking-wide">
                        Workout Name
                      </th>
                      <th class="px-4 py-3 text-left font-semibold text-slate-700 border-b-2 border-slate-200 text-xs uppercase tracking-wide">
                        Created
                      </th>
                      <th class="px-4 py-3 text-left font-semibold text-slate-700 border-b-2 border-slate-200 text-xs uppercase tracking-wide">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-100">
                    <For each={filteredWorkouts()}>
                      {(workout) => (
                        <tr class="hover:bg-primary-50 transition-colors">
                          <td class="px-4 py-3 text-slate-400 text-sm">
                            {workout.id}
                          </td>
                          <td class="px-4 py-3">
                            <A 
                              href={`/workouts/${workout.id}/edit`}
                              class="font-semibold text-primary-600 hover:text-primary-700 hover:underline transition-colors cursor-pointer"
                            >
                              {workout.name}
                            </A>
                          </td>
                          <td class="px-4 py-3 text-slate-600 text-sm">
                            {formatDate(workout.created_when)}
                          </td>
                          <td class="px-4 py-3">
                            <button
                              onClick={() => handleDelete(workout.id, workout.name)}
                              disabled={deletingId() === workout.id}
                              class="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded transition-colors
                                     disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {deletingId() === workout.id ? 'Deleting...' : 'Delete'}
                            </button>
                          </td>
                        </tr>
                      )}
                    </For>
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards View */}
              <div class="sm:hidden p-4 space-y-3">
                <For each={filteredWorkouts()}>
                  {(workout) => (
                    <div class="bg-white border border-slate-200 rounded-lg p-4 hover:border-primary-300 hover:shadow-md transition-all">
                      <div class="flex justify-between items-start gap-3 mb-3">
                        <A 
                          href={`/workouts/${workout.id}/edit`}
                          class="font-semibold text-primary-600 flex-1"
                        >
                          {workout.name}
                        </A>
                        <span class="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded flex-shrink-0">
                          #{workout.id}
                        </span>
                      </div>
                      <div class="text-xs text-slate-500 mb-3">
                        Created: {formatDate(workout.created_when)}
                      </div>
                      <button
                        onClick={() => handleDelete(workout.id, workout.name)}
                        disabled={deletingId() === workout.id}
                        class="w-full px-3 py-2 text-sm text-red-600 bg-red-50 hover:bg-red-100 rounded transition-colors
                               disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {deletingId() === workout.id ? 'Deleting...' : 'Delete Workout'}
                      </button>
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
