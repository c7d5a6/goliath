import { createSignal, createResource, For, Show, createMemo } from 'solid-js'
import './App.css'

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
  const response = await fetch('/api/muscles')
  if (!response.ok) {
    throw new Error(`Failed to fetch muscles: ${response.statusText}`)
  }
  return response.json()
}

function App() {
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
    <div class="app">
      <header class="header">
        <h1>
          <span class="icon">💪</span>
          Goliath Muscles
        </h1>
        <p class="subtitle">Complete muscle database with exercise area mappings</p>
        <Show when={data()}>
          <div class="stats">
            <span class="stat-badge">
              Muscles <span class="count">{data()!.count}</span>
            </span>
            <span class="stat-badge">
              Groups <span class="count">{muscleGroups()}</span>
            </span>
          </div>
        </Show>
      </header>

      <div class="table-container">
        <div class="search-box">
          <div class="search-wrapper">
            <span class="search-icon">🔍</span>
            <input
              type="text"
              class="search-input"
              placeholder="Search muscles, groups, or exercise areas..."
              value={search()}
              onInput={(e) => setSearch(e.currentTarget.value)}
            />
          </div>
        </div>

        <Show when={data.loading}>
          <div class="loading">
            <div class="spinner"></div>
            <span>Loading muscles...</span>
          </div>
        </Show>

        <Show when={data.error}>
          <div class="error">
            <div class="error-icon">⚠️</div>
            <p>Failed to load muscles</p>
            <p style={{ "font-size": "0.85rem", opacity: 0.8 }}>{data.error?.message}</p>
            <button class="retry-btn" onClick={() => refetch()}>
              Try Again
            </button>
          </div>
        </Show>

        <Show when={data() && !data.loading && !data.error}>
          <Show when={filteredMuscles().length === 0}>
            <div class="empty">
              <div class="empty-icon">🔍</div>
              <p>No muscles found matching "{search()}"</p>
            </div>
          </Show>

          <Show when={filteredMuscles().length > 0}>
            {/* Desktop Table View */}
            <div class="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Muscle</th>
                    <th>Muscle Group</th>
                    <th>Exercise Areas</th>
                  </tr>
                </thead>
                <tbody>
                  <For each={filteredMuscles()}>
                    {(muscle) => (
                      <tr>
                        <td style={{ color: 'var(--color-text-secondary)', "font-size": "0.85rem" }}>
                          {muscle.id}
                        </td>
                        <td>
                          <span class="muscle-name">{muscle.name}</span>
                        </td>
                        <td>
                          <span class="muscle-group">{muscle.muscle_group_name}</span>
                        </td>
                        <td>
                          <div class="exercise-areas">
                            <For each={muscle.exercise_areas}>
                              {(area) => <span class="exercise-area-tag">{area}</span>}
                            </For>
                            <Show when={muscle.exercise_areas.length === 0}>
                              <span style={{ color: 'var(--color-text-secondary)', "font-size": "0.85rem" }}>
                                —
                              </span>
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
            <div class="cards-view">
              <For each={filteredMuscles()}>
                {(muscle) => (
                  <div class="muscle-card">
                    <div class="card-header">
                      <span class="card-name">{muscle.name}</span>
                      <span class="card-id">#{muscle.id}</span>
                    </div>
                    <span class="muscle-group">{muscle.muscle_group_name}</span>
                    <Show when={muscle.exercise_areas.length > 0}>
                      <div class="card-areas">
                        <div class="card-areas-label">Exercise Areas</div>
                        <div class="exercise-areas">
                          <For each={muscle.exercise_areas}>
                            {(area) => <span class="exercise-area-tag">{area}</span>}
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

      <footer class="footer">
        Goliath Fitness Tracker · Built with SolidJS
      </footer>
    </div>
  )
}

export default App
