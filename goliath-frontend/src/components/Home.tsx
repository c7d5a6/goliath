import { Show } from 'solid-js'
import { Navigate } from '@solidjs/router'
import { useAuth } from '../auth'

export default function Home() {
  const auth = useAuth()

  return (
    <Show
      when={!auth.loading}
      fallback={
        <div class="flex items-center justify-center py-16">
          <div class="spinner"></div>
        </div>
      }
    >
      <Show
        when={auth.user}
        fallback={<Navigate href="/exercises" />}
      >
        <Navigate href="/workouts" />
      </Show>
    </Show>
  )
}
