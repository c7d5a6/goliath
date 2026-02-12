import { Router, Route, A } from '@solidjs/router'
import { Show, For, type Component, type ParentComponent } from 'solid-js'
import { AuthProvider, useAuth } from './auth'
import { I18nProvider, useI18n, localeLabels, type SupportedLocale } from './i18n'
import Home from './components/Home'
import Muscles from './components/Muscles'
import Exercises from './components/Exercises'
import AddExercise from './components/AddExercise'
import EditExercise from './components/EditExercise'
import Workouts from './components/Workouts'
import AddWorkout from './components/AddWorkout'
import EditWorkout from './components/EditWorkout'
import ExerciseLogs from './components/ExerciseLogs'
import Users from './components/Users'
import Login from './components/Login'

function LanguageSwitcher() {
  const { locale, setLocale } = useI18n()
  const locales = Object.keys(localeLabels) as SupportedLocale[]

  return (
    <select
      value={locale()}
      onChange={(e) => setLocale(e.currentTarget.value as SupportedLocale)}
      class="px-2 py-1 border border-slate-200 rounded-lg text-sm bg-white
             focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer"
    >
      <For each={locales}>
        {(l) => <option value={l}>{localeLabels[l]}</option>}
      </For>
    </select>
  )
}

const Layout: ParentComponent = (props) => {
  const auth = useAuth()
  const { t } = useI18n()

  return (
    <div class="min-h-screen p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <header class="max-w-6xl mx-auto mb-6">
        <div class="flex justify-between items-start">
          <div>
            <h1 class="text-2xl sm:text-3xl font-bold text-slate-900 flex items-center gap-3">
              <span class="text-2xl sm:text-3xl">💪</span>
              {t('app.title')}
            </h1>
          </div>

          {/* User Menu */}
          <div class="flex items-center gap-3">
            <LanguageSwitcher />
            <Show
              when={auth.user}
              fallback={
                <A
                  href="/login"
                  class="px-4 py-2 bg-primary-500 text-white rounded-lg text-sm font-medium
                         hover:bg-primary-600 active:scale-[0.98] transition-all shadow-md"
                >
                  {t('auth.signIn')}
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
                    {t('auth.signOut')}
                  </button>
                </div>
                <div class="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center text-white font-medium">
                  {auth.user?.email?.charAt(0).toUpperCase()}
                </div>
              </div>
            </Show>
          </div>
        </div>

        {/* Navigation */}
        <nav class="flex gap-2 mt-4 flex-wrap">
          <Show when={auth.user}>
            <A
              href="/workouts"
              class="px-4 py-2 rounded-lg text-sm font-medium transition-all"
              activeClass="bg-primary-500 text-white shadow-md"
              inactiveClass="bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            >
              {t('nav.workouts')}
            </A>
          </Show>
          <Show when={auth.user}>
            <A
              href="/exercise-logs"
              class="px-4 py-2 rounded-lg text-sm font-medium transition-all"
              activeClass="bg-primary-500 text-white shadow-md"
              inactiveClass="bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            >
              {t('nav.exerciseLog')}
            </A>
          </Show>
          <A
            href="/exercises"
            class="px-4 py-2 rounded-lg text-sm font-medium transition-all"
            activeClass="bg-primary-500 text-white shadow-md"
            inactiveClass="bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          >
            {t('nav.exercises')}
          </A>
          <A
            href="/muscles"
            class="px-4 py-2 rounded-lg text-sm font-medium transition-all"
            activeClass="bg-primary-500 text-white shadow-md"
            inactiveClass="bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          >
            {t('nav.muscles')}
          </A>
          <Show when={auth.isAdmin}>
            <A
              href="/users"
              class="px-4 py-2 rounded-lg text-sm font-medium transition-all"
              activeClass="bg-primary-500 text-white shadow-md"
              inactiveClass="bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            >
              {t('nav.users')}
            </A>
          </Show>
        </nav>
      </header>

      {/* Main Content */}
      <main class="max-w-6xl mx-auto">
        {props.children}
      </main>

      {/* Footer */}
      <footer class="max-w-6xl mx-auto mt-6 text-center text-slate-400 text-sm">
        {t('app.footer')}
      </footer>
    </div>
  )
}

const AppContent: Component = () => {
  return (
    <Router root={Layout}>
      <Route path="/login" component={Login} />
      <Route path="/" component={Home} />
      <Route path="/muscles" component={Muscles} />
      <Route path="/exercises" component={Exercises} />
      <Route path="/exercises/new" component={AddExercise} />
      <Route path="/exercises/:id/edit" component={EditExercise} />
      <Route path="/workouts" component={Workouts} />
      <Route path="/workouts/new" component={AddWorkout} />
      <Route path="/workouts/:id/edit" component={EditWorkout} />
      <Route path="/exercise-logs" component={ExerciseLogs} />
      <Route path="/users" component={Users} />
    </Router>
  )
}

function App() {
  return (
    <I18nProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </I18nProvider>
  )
}

export default App
