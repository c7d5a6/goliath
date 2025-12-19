import { createSignal, createResource, For, Show } from 'solid-js'
import { useNavigate } from '@solidjs/router'

interface Muscle {
  id: number
  name: string
  muscle_group_name: string
}

interface SelectedMuscle extends Muscle {
  percentage: number
}

async function fetchMuscles() {
  const response = await fetch('/api/muscles')
  if (!response.ok) throw new Error('Failed to fetch muscles')
  const data = await response.json()
  return data.muscles as Muscle[]
}

async function fetchExerciseTypes() {
  const response = await fetch('/api/exercise-types')
  if (!response.ok) throw new Error('Failed to fetch exercise types')
  const data = await response.json()
  return data.types as string[]
}

export default function AddExercise() {
  const navigate = useNavigate()
  const [muscles] = createResource(fetchMuscles)
  const [types] = createResource(fetchExerciseTypes)
  
  const [name, setName] = createSignal('')
  const [selectedType, setSelectedType] = createSignal('')
  const [selectedMuscles, setSelectedMuscles] = createSignal<SelectedMuscle[]>([])
  const [error, setError] = createSignal('')
  const [isSubmitting, setIsSubmitting] = createSignal(false)
  const [searchMuscle, setSearchMuscle] = createSignal('')

  const filteredMuscles = () => {
    const all = muscles() || []
    const selected = selectedMuscles().map(m => m.id)
    const query = searchMuscle().toLowerCase()
    
    return all
      .filter(m => !selected.includes(m.id))
      .filter(m => 
        !query || 
        m.name.toLowerCase().includes(query) || 
        m.muscle_group_name.toLowerCase().includes(query)
      )
      .slice(0, 10) // Limit to 10 results
  }

  const totalPercentage = () => {
    return selectedMuscles().reduce((sum, m) => sum + m.percentage, 0)
  }

  const addMuscle = (muscle: Muscle) => {
    setSelectedMuscles([...selectedMuscles(), { ...muscle, percentage: 20 }])
    setSearchMuscle('')
  }

  const removeMuscle = (id: number) => {
    setSelectedMuscles(selectedMuscles().filter(m => m.id !== id))
  }

  const updatePercentage = (id: number, stars: number) => {
    const percentage = stars * 20 // 1 star = 20%, 5 stars = 100%
    setSelectedMuscles(
      selectedMuscles().map(m => m.id === id ? { ...m, percentage } : m)
    )
  }

  const handleSubmit = async (e: Event) => {
    e.preventDefault()
    setError('')

    // Validation
    if (!name().trim()) {
      setError('Exercise name is required')
      return
    }
    if (!selectedType()) {
      setError('Exercise type is required')
      return
    }
    if (selectedMuscles().length === 0) {
      setError('At least one muscle must be selected')
      return
    }

    setIsSubmitting(true)
    
    try {
      const response = await fetch('/api/exercises', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name().trim(),
          type: selectedType(),
          muscles: selectedMuscles().map(m => ({
            muscle_id: m.id,
            percentage: m.percentage,
          })),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to create exercise')
        setIsSubmitting(false)
        return
      }

      // Success - navigate to exercises page
      navigate('/exercises')
    } catch (err: any) {
      setError(err.message || 'Network error')
      setIsSubmitting(false)
    }
  }

  return (
    <div class="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
      <div class="p-6 border-b border-slate-200 bg-gradient-to-r from-primary-50 to-accent-50">
        <h2 class="text-xl font-bold text-slate-900">Create New Exercise</h2>
        <p class="text-sm text-slate-600 mt-1">Add a new exercise to the database</p>
      </div>

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

        {/* Exercise Name */}
        <div>
          <label class="block text-sm font-semibold text-slate-700 mb-2">
            Exercise Name *
          </label>
          <input
            type="text"
            value={name()}
            onInput={(e) => setName(e.currentTarget.value)}
            placeholder="e.g., Bench Press"
            class="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm bg-white 
                   focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
                   placeholder:text-slate-400"
            required
          />
        </div>

        {/* Exercise Type */}
        <div>
          <label class="block text-sm font-semibold text-slate-700 mb-2">
            Exercise Type *
          </label>
          <Show when={types.loading}>
            <div class="text-sm text-slate-500">Loading types...</div>
          </Show>
          <Show when={types()}>
            <select
              value={selectedType()}
              onChange={(e) => setSelectedType(e.currentTarget.value)}
              class="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm bg-white 
                     focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required
            >
              <option value="">Select exercise type...</option>
              <For each={types()}>
                {(type) => <option value={type}>{type}</option>}
              </For>
            </select>
          </Show>
        </div>

        {/* Muscle Selection */}
        <div>
          <label class="block text-sm font-semibold text-slate-700 mb-2">
            Targeted Muscles * (Total: {totalPercentage()}%)
          </label>
          
          {/* Selected Muscles */}
          <div class="space-y-2 mb-4">
            <Show when={selectedMuscles().length === 0}>
              <div class="text-sm text-slate-400 italic py-3 text-center bg-slate-50 rounded-lg border border-dashed border-slate-200">
                No muscles selected. Search and add muscles below.
              </div>
            </Show>
            <For each={selectedMuscles()}>
              {(muscle) => (
                <div class="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div class="flex-1">
                    <div class="font-medium text-slate-900 text-sm">{muscle.name}</div>
                    <div class="text-xs text-slate-500">{muscle.muscle_group_name}</div>
                  </div>
                  
                  {/* Star Rating */}
                  <div class="flex gap-1">
                    <For each={[1, 2, 3, 4, 5]}>
                      {(star) => (
                        <button
                          type="button"
                          onClick={() => updatePercentage(muscle.id, star)}
                          class={`text-2xl transition-transform hover:scale-110 ${
                            star <= muscle.percentage / 20 ? 'opacity-100' : 'opacity-30'
                          }`}
                        >
                          ⭐
                        </button>
                      )}
                    </For>
                  </div>
                  
                  <div class="text-sm font-semibold text-primary-600 w-12 text-right">
                    {muscle.percentage}%
                  </div>
                  
                  <button
                    type="button"
                    onClick={() => removeMuscle(muscle.id)}
                    class="text-red-500 hover:text-red-700 text-xl"
                  >
                    ✕
                  </button>
                </div>
              )}
            </For>
          </div>

          {/* Add Muscle Search */}
          <div>
            <div class="relative mb-2">
              <input
                type="text"
                value={searchMuscle()}
                onInput={(e) => setSearchMuscle(e.currentTarget.value)}
                placeholder="Search muscles to add..."
                class="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm bg-white 
                       focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
                       placeholder:text-slate-400"
              />
            </div>
            
            <Show when={searchMuscle() && filteredMuscles().length > 0}>
              <div class="border border-slate-200 rounded-lg divide-y divide-slate-100 max-h-60 overflow-y-auto">
                <For each={filteredMuscles()}>
                  {(muscle) => (
                    <button
                      type="button"
                      onClick={() => addMuscle(muscle)}
                      class="w-full px-4 py-2.5 text-left hover:bg-primary-50 transition-colors flex items-center justify-between group"
                    >
                      <div>
                        <div class="text-sm font-medium text-slate-900">{muscle.name}</div>
                        <div class="text-xs text-slate-500">{muscle.muscle_group_name}</div>
                      </div>
                      <span class="text-primary-500 opacity-0 group-hover:opacity-100 transition-opacity">
                        + Add
                      </span>
                    </button>
                  )}
                </For>
              </div>
            </Show>
            
            <Show when={searchMuscle() && filteredMuscles().length === 0}>
              <div class="text-sm text-slate-400 italic py-2 text-center">
                No muscles found
              </div>
            </Show>
          </div>
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
            {isSubmitting() ? 'Creating...' : 'Create Exercise'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/exercises')}
            disabled={isSubmitting()}
            class="px-6 py-3 bg-slate-100 text-slate-700 rounded-lg font-medium
                   hover:bg-slate-200 active:scale-[0.98] transition-all
                   disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
        </div>
    </div>
  )
}

