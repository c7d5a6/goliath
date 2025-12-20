import { createSignal, createResource, For, Show, createMemo } from 'solid-js'
import { apiGet } from '../api'

interface User {
  id: number
  version: number
  created_when: string
  created_by: string | null
  modified_when: string
  modified_by: string | null
  email: string
  role: string
}

interface UsersResponse {
  users: User[]
  count: number
}

async function fetchUsers(): Promise<UsersResponse> {
  return apiGet<UsersResponse>('/users')
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export default function Users() {
  const [data, { refetch }] = createResource(fetchUsers)
  const [search, setSearch] = createSignal('')

  const filteredUsers = createMemo(() => {
    const users = data()?.users ?? []
    const query = search().toLowerCase().trim()
    if (!query) return users
    return users.filter(
      (u) =>
        u.email.toLowerCase().includes(query) ||
        u.role.toLowerCase().includes(query) ||
        u.id.toString().includes(query)
    )
  })

  const adminCount = createMemo(() => {
    const users = data()?.users ?? []
    return users.filter((u) => u.role === 'ADMIN').length
  })

  const userCount = createMemo(() => {
    const users = data()?.users ?? []
    return users.filter((u) => u.role === 'USER').length
  })

  return (
    <>
      {/* Stats */}
      <Show when={data()}>
        <div class="flex gap-3 mb-6 flex-wrap">
          <span class="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-full text-sm font-medium shadow-sm">
            Total Users
            <span class="bg-primary-500 text-white px-2 py-0.5 rounded-full text-xs font-semibold">
              {data()!.count}
            </span>
          </span>
          <span class="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-full text-sm font-medium shadow-sm">
            Admins
            <span class="bg-red-500 text-white px-2 py-0.5 rounded-full text-xs font-semibold">
              {adminCount()}
            </span>
          </span>
          <span class="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-full text-sm font-medium shadow-sm">
            Users
            <span class="bg-blue-500 text-white px-2 py-0.5 rounded-full text-xs font-semibold">
              {userCount()}
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
              placeholder="Search users by email, role, or ID..."
              value={search()}
              onInput={(e) => setSearch(e.currentTarget.value)}
            />
          </div>
        </div>

        {/* Loading State */}
        <Show when={data.loading}>
          <div class="flex flex-col items-center justify-center py-16 text-slate-500">
            <div class="spinner mb-4"></div>
            <span>Loading users...</span>
          </div>
        </Show>

        {/* Error State */}
        <Show when={data.error}>
          <div class="py-12 px-4 text-center text-red-600">
            <div class="text-4xl mb-2">⚠️</div>
            <p class="font-medium">Failed to load users</p>
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
          <Show when={filteredUsers().length === 0}>
            <div class="py-16 px-4 text-center text-slate-500">
              <div class="text-4xl mb-2 opacity-50">🔍</div>
              <p>No users found matching "{search()}"</p>
            </div>
          </Show>

          <Show when={filteredUsers().length > 0}>
            {/* Desktop Table View */}
            <div class="hidden sm:block overflow-x-auto">
              <table class="w-full text-sm">
                <thead class="bg-gradient-to-b from-slate-50 to-slate-100 sticky top-0">
                  <tr>
                    <th class="px-4 py-3 text-left font-semibold text-slate-700 border-b-2 border-slate-200 text-xs uppercase tracking-wide">
                      #
                    </th>
                    <th class="px-4 py-3 text-left font-semibold text-slate-700 border-b-2 border-slate-200 text-xs uppercase tracking-wide">
                      Email
                    </th>
                    <th class="px-4 py-3 text-left font-semibold text-slate-700 border-b-2 border-slate-200 text-xs uppercase tracking-wide">
                      Role
                    </th>
                    <th class="px-4 py-3 text-left font-semibold text-slate-700 border-b-2 border-slate-200 text-xs uppercase tracking-wide">
                      Created
                    </th>
                    <th class="px-4 py-3 text-left font-semibold text-slate-700 border-b-2 border-slate-200 text-xs uppercase tracking-wide">
                      Modified
                    </th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  <For each={filteredUsers()}>
                    {(user) => (
                      <tr class="hover:bg-primary-50 transition-colors">
                        <td class="px-4 py-3 text-slate-400 text-sm">
                          {user.id}
                        </td>
                        <td class="px-4 py-3">
                          <span class="font-semibold text-slate-900">{user.email}</span>
                        </td>
                        <td class="px-4 py-3">
                          <span
                            class={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                              user.role === 'ADMIN'
                                ? 'bg-red-50 text-red-600'
                                : 'bg-blue-50 text-blue-600'
                            }`}
                          >
                            {user.role}
                          </span>
                        </td>
                        <td class="px-4 py-3 text-slate-600 text-sm">
                          {formatDate(user.created_when)}
                        </td>
                        <td class="px-4 py-3 text-slate-600 text-sm">
                          {formatDate(user.modified_when)}
                        </td>
                      </tr>
                    )}
                  </For>
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View */}
            <div class="sm:hidden p-4 space-y-3">
              <For each={filteredUsers()}>
                {(user) => (
                  <div class="bg-white border border-slate-200 rounded-lg p-4 active:bg-primary-50 transition-colors">
                    <div class="flex justify-between items-start gap-3 mb-3">
                      <span class="font-semibold text-slate-900">{user.email}</span>
                      <span class="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded flex-shrink-0">
                        #{user.id}
                      </span>
                    </div>
                    <div class="flex items-center gap-2 mb-3">
                      <span
                        class={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                          user.role === 'ADMIN'
                            ? 'bg-red-50 text-red-600'
                            : 'bg-blue-50 text-blue-600'
                        }`}
                      >
                        {user.role}
                      </span>
                    </div>
                    <div class="space-y-1 text-xs text-slate-500">
                      <div>
                        <span class="text-slate-400">Created:</span> {formatDate(user.created_when)}
                      </div>
                      <div>
                        <span class="text-slate-400">Modified:</span> {formatDate(user.modified_when)}
                      </div>
                    </div>
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

