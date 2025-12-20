import { createSignal, createResource, For, Show, createMemo } from 'solid-js'
import { apiGet } from '../api'

interface Muscle {
  id: number
  name: string
  muscle_group_id: number
  muscle_group_name: string
  exercise_areas: string[]
}

interface MusclesResponse {
  muscles: Muscle[]
  count: number
}

async function fetchMuscles(): Promise<MusclesResponse> {
  return apiGet<MusclesResponse>('/muscles')
}

export default function Muscles() {
  const [data, { refetch }] = createResource(fetchMuscles)
  const [search, setSearch] = createSignal('')

  const filteredMuscles = createMemo(() => {
    const muscles = data()?.muscles ?? []
    const query = search().toLowerCase().trim()
    if (!query) return muscles
    return muscles.filter(
      (m) =>
        m.name.toLowerCase().includes(query) ||
        m.muscle_group_name.toLowerCase().includes(query) ||
        m.exercise_areas.some((area) => area.toLowerCase().includes(query))
    )
  })

  const muscleGroups = createMemo(() => {
    const muscles = data()?.muscles ?? []
    return new Set(muscles.map((m) => m.muscle_group_name)).size
  })

  return (
    <>
      {/* Stats */}
      <Show when={data()}>
        <div class="flex gap-3 mb-6 flex-wrap">
          <span class="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-full text-sm font-medium shadow-sm">
            Muscles
            <span class="bg-primary-500 text-white px-2 py-0.5 rounded-full text-xs font-semibold">
              {data()!.count}
            </span>
          </span>
          <span class="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-full text-sm font-medium shadow-sm">
            Groups
            <span class="bg-primary-500 text-white px-2 py-0.5 rounded-full text-xs font-semibold">
              {muscleGroups()}
            </span>
          </span>
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
              placeholder="Search muscles, groups, or exercise areas..."
              value={search()}
              onInput={(e) => setSearch(e.currentTarget.value)}
            />
          </div>
        </div>

        {/* Loading State */}
        <Show when={data.loading}>
          <div class="flex flex-col items-center justify-center py-16 text-slate-500">
            <div class="spinner mb-4"></div>
            <span>Loading muscles...</span>
          </div>
        </Show>

        {/* Error State */}
        <Show when={data.error}>
          <div class="py-12 px-4 text-center text-red-600">
            <div class="text-4xl mb-2">⚠️</div>
            <p class="font-medium">Failed to load muscles</p>
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
          <Show when={filteredMuscles().length === 0}>
            <div class="py-16 px-4 text-center text-slate-500">
              <div class="text-4xl mb-2 opacity-50">🔍</div>
              <p>No muscles found matching "{search()}"</p>
            </div>
          </Show>

          <Show when={filteredMuscles().length > 0}>
            {/* Desktop Table View */}
            <div class="hidden sm:block overflow-x-auto">
              <table class="w-full text-sm">
                <thead class="bg-gradient-to-b from-slate-50 to-slate-100 sticky top-0">
                  <tr>
                    <th class="px-4 py-3 text-left font-semibold text-slate-700 border-b-2 border-slate-200 text-xs uppercase tracking-wide">
                      #
                    </th>
                    <th class="px-4 py-3 text-left font-semibold text-slate-700 border-b-2 border-slate-200 text-xs uppercase tracking-wide">
                      Muscle
                    </th>
                    <th class="px-4 py-3 text-left font-semibold text-slate-700 border-b-2 border-slate-200 text-xs uppercase tracking-wide">
                      Muscle Group
                    </th>
                    <th class="px-4 py-3 text-left font-semibold text-slate-700 border-b-2 border-slate-200 text-xs uppercase tracking-wide">
                      Exercise Areas
                    </th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  <For each={filteredMuscles()}>
                    {(muscle) => (
                      <tr class="hover:bg-primary-50 transition-colors">
                        <td class="px-4 py-3 text-slate-400 text-sm">
                          {muscle.id}
                        </td>
                        <td class="px-4 py-3">
                          <span class="font-semibold text-slate-900">{muscle.name}</span>
                        </td>
                        <td class="px-4 py-3">
                          <span class="inline-block px-3 py-1 bg-accent-50 text-accent-500 rounded-full text-xs font-medium">
                            {muscle.muscle_group_name}
                          </span>
                        </td>
                        <td class="px-4 py-3">
                          <div class="flex flex-wrap gap-1.5">
                            <For each={muscle.exercise_areas}>
                              {(area) => (
                                <span class="inline-block px-2 py-0.5 bg-primary-50 text-primary-600 rounded text-xs font-medium">
                                  {area}
                                </span>
                              )}
                            </For>
                            <Show when={muscle.exercise_areas.length === 0}>
                              <span class="text-slate-400 text-sm">—</span>
                            </Show>
                          </div>
                        </td>
                      </tr>
                    )}
                  </For>
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View */}
            <div class="sm:hidden p-4 space-y-3">
              <For each={filteredMuscles()}>
                {(muscle) => (
                  <div class="bg-white border border-slate-200 rounded-lg p-4 active:bg-primary-50 transition-colors">
                    <div class="flex justify-between items-start gap-3 mb-3">
                      <span class="font-semibold text-slate-900">{muscle.name}</span>
                      <span class="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded flex-shrink-0">
                        #{muscle.id}
                      </span>
                    </div>
                    <span class="inline-block px-3 py-1 bg-accent-50 text-accent-500 rounded-full text-xs font-medium">
                      {muscle.muscle_group_name}
                    </span>
                    <Show when={muscle.exercise_areas.length > 0}>
                      <div class="mt-3">
                        <div class="text-[10px] uppercase tracking-wide text-slate-400 mb-1.5">
                          Exercise Areas
                        </div>
                        <div class="flex flex-wrap gap-1.5">
                          <For each={muscle.exercise_areas}>
                            {(area) => (
                              <span class="inline-block px-2 py-0.5 bg-primary-50 text-primary-600 rounded text-xs font-medium">
                                {area}
                              </span>
                            )}
                          </For>
                        </div>
                      </div>
                    </Show>
                  </div>
                )}
              </For>
            </div>
          </Show>
        </Show>
      </div>
    </>
  )
}


