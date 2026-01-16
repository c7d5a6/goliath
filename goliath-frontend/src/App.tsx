import { Router, Route, A } from '@solidjs/router'
import { Show, type Component, type ParentComponent } from 'solid-js'
import { AuthProvider, useAuth } from './auth'
import Muscles from './components/Muscles'
import Exercises from './components/Exercises'
import AddExercise from './components/AddExercise'
import EditExercise from './components/EditExercise'
import Workouts from './components/Workouts'
import AddWorkout from './components/AddWorkout'
import EditWorkout from './components/EditWorkout'
import Users from './components/Users'
import Login from './components/Login'

const Layout: ParentComponent = (props) => {
  const auth = useAuth()

  return (
    <div class="min-h-screen p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <header class="max-w-6xl mx-auto mb-6">
        <div class="flex justify-between items-start">
          <div>
            <h1 class="text-2xl sm:text-3xl font-bold text-slate-900 flex items-center gap-3">
              <span class="text-2xl sm:text-3xl">💪</span>
              Goliath Fitness
            </h1>
            <p class="text-slate-500 mt-1">
              Complete database of muscles and exercises
            </p>
          </div>

          {/* User Menu */}
          <Show
            when={auth.user}
            fallback={
              <A
                href="/login"
                class="px-4 py-2 bg-primary-500 text-white rounded-lg text-sm font-medium
                       hover:bg-primary-600 active:scale-[0.98] transition-all shadow-md"
              >
                Sign In
              </A>
            }
          >
            <div class="flex items-center gap-3">
              <div class="text-right text-sm">
                <div class="font-medium text-slate-700">{auth.user?.email}</div>
                <button
                  onClick={() => auth.signOut()}
                  class="text-slate-500 hover:text-slate-700 text-xs"
                >
                  Sign out
                </button>
              </div>
              <div class="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center text-white font-medium">
                {auth.user?.email?.charAt(0).toUpperCase()}
              </div>
            </div>
          </Show>
        </div>

        {/* Navigation */}
        <nav class="flex gap-2 mt-4 flex-wrap">
          <A
            href="/"
            class="px-4 py-2 rounded-lg text-sm font-medium transition-all"
            activeClass="bg-primary-500 text-white shadow-md"
            inactiveClass="bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            end
          >
            💪 Muscles
          </A>
          <A
            href="/exercises"
            class="px-4 py-2 rounded-lg text-sm font-medium transition-all"
            activeClass="bg-primary-500 text-white shadow-md"
            inactiveClass="bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          >
            🏋️ Exercises
          </A>
          <A
            href="/workouts"
            class="px-4 py-2 rounded-lg text-sm font-medium transition-all"
            activeClass="bg-primary-500 text-white shadow-md"
            inactiveClass="bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          >
            📋 Workouts
          </A>
          <A
            href="/users"
            class="px-4 py-2 rounded-lg text-sm font-medium transition-all"
            activeClass="bg-primary-500 text-white shadow-md"
            inactiveClass="bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          >
            👥 Users
          </A>
        </nav>
      </header>

      {/* Main Content */}
      <main class="max-w-6xl mx-auto">
        {props.children}
      </main>

      {/* Footer */}
      <footer class="max-w-6xl mx-auto mt-6 text-center text-slate-400 text-sm">
        Goliath Fitness Tracker · Built with SolidJS + Tailwind
      </footer>
    </div>
  )
}

const AppContent: Component = () => {
  return (
    <Router root={Layout}>
      <Route path="/login" component={Login} />
      <Route path="/" component={Muscles} />
      <Route path="/exercises" component={Exercises} />
      <Route path="/users" component={Users} />
      <Route path="/exercises/new" component={AddExercise} />
      <Route path="/exercises/:id/edit" component={EditExercise} />
      <Route path="/workouts" component={Workouts} />
      <Route path="/workouts/new" component={AddWorkout} />
      <Route path="/workouts/:id/edit" component={EditWorkout} />
      <Route path="/users" component={Users} />
    </Router>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App
