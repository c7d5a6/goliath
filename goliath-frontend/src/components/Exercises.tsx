import { createSignal, createResource, For, Show, createMemo } from 'solid-js'
import { A } from '@solidjs/router'

interface ExerciseMuscle {
  muscle_id: number
  muscle_name: string
  percentage: number
}

interface Exercise {
  id: number
  name: string
  type: string
  muscles: ExerciseMuscle[]
}

interface ExercisesResponse {
  exercises: Exercise[]
  count: number
}

async function fetchExercises(): Promise<ExercisesResponse> {
  const response = await fetch('/api/exercises')
  if (!response.ok) {
    throw new Error(`Failed to fetch exercises: ${response.statusText}`)
  }
  return response.json()
}

const typeColors: Record<string, { bg: string; text: string }> = {
  Reps: { bg: 'bg-blue-50', text: 'text-blue-600' },
  Eccentric: { bg: 'bg-purple-50', text: 'text-purple-600' },
  Isometric: { bg: 'bg-orange-50', text: 'text-orange-600' },
}

export default function Exercises() {
  const [data, { refetch }] = createResource(fetchExercises)
  const [search, setSearch] = createSignal('')

  const filteredExercises = createMemo(() => {
    const exercises = data()?.exercises ?? []
    const query = search().toLowerCase().trim()
    if (!query) return exercises
    return exercises.filter(
      (e) =>
        e.name.toLowerCase().includes(query) ||
        e.type.toLowerCase().includes(query) ||
        e.muscles.some((m) => m.muscle_name.toLowerCase().includes(query))
    )
  })

  const exercisesByType = createMemo(() => {
    const exercises = data()?.exercises ?? []
    const types = new Map<string, number>()
    exercises.forEach((e) => {
      types.set(e.type, (types.get(e.type) || 0) + 1)
    })
    return types
  })

  return (
    <div class="relative">
      {/* Stats */}
      <Show when={data()}>
        <div class="flex gap-3 mb-6 flex-wrap">
          <span class="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-full text-sm font-medium shadow-sm">
            Exercises
            <span class="bg-primary-500 text-white px-2 py-0.5 rounded-full text-xs font-semibold">
              {data()!.count}
            </span>
          </span>
          <For each={Array.from(exercisesByType().entries())}>
            {([type, count]) => (
              <span class="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-full text-sm font-medium shadow-sm">
                {type}
                <span class="bg-accent-500 text-white px-2 py-0.5 rounded-full text-xs font-semibold">
                  {count}
                </span>
              </span>
            )}
          </For>
        </div>
      </Show>

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
              placeholder="Search exercises, types, or muscles..."
              value={search()}
              onInput={(e) => setSearch(e.currentTarget.value)}
            />
          </div>
        </div>

        {/* Loading State */}
        <Show when={data.loading}>
          <div class="flex flex-col items-center justify-center py-16 text-slate-500">
            <div class="spinner mb-4"></div>
            <span>Loading exercises...</span>
          </div>
        </Show>

        {/* Error State */}
        <Show when={data.error}>
          <div class="py-12 px-4 text-center text-red-600">
            <div class="text-4xl mb-2">⚠️</div>
            <p class="font-medium">Failed to load exercises</p>
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
          <Show when={filteredExercises().length === 0}>
            <div class="py-16 px-4 text-center text-slate-500">
              <div class="text-4xl mb-2 opacity-50">🔍</div>
              <p>No exercises found matching "{search()}"</p>
            </div>
          </Show>

          <Show when={filteredExercises().length > 0}>
            {/* Desktop Table View */}
            <div class="hidden sm:block overflow-x-auto">
              <table class="w-full text-sm">
                <thead class="bg-gradient-to-b from-slate-50 to-slate-100 sticky top-0">
                  <tr>
                    <th class="px-4 py-3 text-left font-semibold text-slate-700 border-b-2 border-slate-200 text-xs uppercase tracking-wide">
                      #
                    </th>
                    <th class="px-4 py-3 text-left font-semibold text-slate-700 border-b-2 border-slate-200 text-xs uppercase tracking-wide">
                      Exercise
                    </th>
                    <th class="px-4 py-3 text-left font-semibold text-slate-700 border-b-2 border-slate-200 text-xs uppercase tracking-wide">
                      Type
                    </th>
                    <th class="px-4 py-3 text-left font-semibold text-slate-700 border-b-2 border-slate-200 text-xs uppercase tracking-wide">
                      Targeted Muscles
                    </th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  <For each={filteredExercises()}>
                    {(exercise) => {
                      const colors = typeColors[exercise.type] || { bg: 'bg-gray-50', text: 'text-gray-600' }
                      return (
                        <tr class="hover:bg-primary-50 transition-colors">
                          <td class="px-4 py-3 text-slate-400 text-sm">
                            {exercise.id}
                          </td>
                          <td class="px-4 py-3">
                            <span class="font-semibold text-slate-900">{exercise.name}</span>
                          </td>
                          <td class="px-4 py-3">
                            <span class={`inline-block px-3 py-1 ${colors.bg} ${colors.text} rounded-full text-xs font-medium`}>
                              {exercise.type}
                            </span>
                          </td>
                          <td class="px-4 py-3">
                            <div class="flex flex-wrap gap-1.5">
                              <For each={exercise.muscles}>
                                {(muscle) => (
                                  <span class="inline-flex items-center gap-1.5 px-2 py-0.5 bg-accent-50 text-accent-600 rounded text-xs font-medium">
                                    {muscle.muscle_name}
                                    <span class="text-[10px] font-semibold bg-accent-100 px-1 rounded">
                                      {muscle.percentage}%
                                    </span>
                                  </span>
                                )}
                              </For>
                              <Show when={exercise.muscles.length === 0}>
                                <span class="text-slate-400 text-sm">—</span>
                              </Show>
                            </div>
                          </td>
                        </tr>
                      )
                    }}
                  </For>
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View */}
            <div class="sm:hidden p-4 space-y-3">
              <For each={filteredExercises()}>
                {(exercise) => {
                  const colors = typeColors[exercise.type] || { bg: 'bg-gray-50', text: 'text-gray-600' }
                  return (
                    <div class="bg-white border border-slate-200 rounded-lg p-4 active:bg-primary-50 transition-colors">
                      <div class="flex justify-between items-start gap-3 mb-3">
                        <span class="font-semibold text-slate-900">{exercise.name}</span>
                        <span class="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded flex-shrink-0">
                          #{exercise.id}
                        </span>
                      </div>
                      <span class={`inline-block px-3 py-1 ${colors.bg} ${colors.text} rounded-full text-xs font-medium`}>
                        {exercise.type}
                      </span>
                      <Show when={exercise.muscles.length > 0}>
                        <div class="mt-3">
                          <div class="text-[10px] uppercase tracking-wide text-slate-400 mb-1.5">
                            Targeted Muscles
                          </div>
                          <div class="flex flex-wrap gap-1.5">
                            <For each={exercise.muscles}>
                              {(muscle) => (
                                <span class="inline-flex items-center gap-1.5 px-2 py-0.5 bg-accent-50 text-accent-600 rounded text-xs font-medium">
                                  {muscle.muscle_name}
                                  <span class="text-[10px] font-semibold bg-accent-100 px-1 rounded">
                                    {muscle.percentage}%
                                  </span>
                                </span>
                              )}
                            </For>
                          </div>
                        </div>
                      </Show>
                    </div>
                  )
                }}
              </For>
            </div>
          </Show>
        </Show>
      </div>

      {/* Floating Action Button */}
      <A
        href="/exercises/new"
        class="fixed bottom-6 right-6 w-14 h-14 bg-accent-500 text-white rounded-full shadow-lg
               flex items-center justify-center text-2xl hover:bg-accent-600 hover:scale-110
               active:scale-95 transition-all z-50"
        title="Add new exercise"
      >
        ➕
      </A>
    </div>
  )
}


