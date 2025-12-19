import { Router, Route, A } from '@solidjs/router'
import Muscles from './components/Muscles'
import Exercises from './components/Exercises'

function Layout(props: any) {
  return (
    <div class="min-h-screen p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <header class="max-w-6xl mx-auto mb-6">
        <h1 class="text-2xl sm:text-3xl font-bold text-slate-900 flex items-center gap-3">
          <span class="text-2xl sm:text-3xl">💪</span>
          Goliath Fitness
        </h1>
        <p class="text-slate-500 mt-1">
          Complete database of muscles and exercises
        </p>

        {/* Navigation */}
        <nav class="flex gap-2 mt-4">
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

function App() {
  return (
    <Router root={Layout}>
      <Route path="/" component={Muscles} />
      <Route path="/exercises" component={Exercises} />
    </Router>
  )
}

export default App
