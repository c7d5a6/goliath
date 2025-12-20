import { createSignal, Show } from 'solid-js'
import { useAuth } from '../auth'
import { useNavigate } from '@solidjs/router'

export default function Login() {
  const auth = useAuth()
  const navigate = useNavigate()
  
  const [email, setEmail] = createSignal('')
  const [password, setPassword] = createSignal('')
  const [error, setError] = createSignal('')
  const [loading, setLoading] = createSignal(false)
  const [mode, setMode] = createSignal<'login' | 'signup'>('login')

  const handleEmailAuth = async (e: Event) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (mode() === 'login') {
        await auth.signIn(email(), password())
      } else {
        await auth.signUp(email(), password())
      }
      navigate('/')
    } catch (err: any) {
      setError(err.message || 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setError('')
    setLoading(true)

    try {
      await auth.signInWithGoogle()
      navigate('/')
    } catch (err: any) {
      setError(err.message || 'Google sign-in failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div class="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary-50 to-accent-50">
      <div class="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8">
        {/* Header */}
        <div class="text-center mb-8">
          <h1 class="text-3xl font-bold text-slate-900 mb-2">
            💪 Goliath Fitness
          </h1>
          <p class="text-slate-600">
            {mode() === 'login' ? 'Sign in to your account' : 'Create a new account'}
          </p>
        </div>

        {/* Error Message */}
        <Show when={error()}>
          <div class="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
            {error()}
          </div>
        </Show>

        {/* Email/Password Form */}
        <form onSubmit={handleEmailAuth} class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">
              Email
            </label>
            <input
              type="email"
              required
              class="w-full px-4 py-3 border border-slate-200 rounded-lg text-sm
                     focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
                     transition-shadow"
              placeholder="you@example.com"
              value={email()}
              onInput={(e) => setEmail(e.currentTarget.value)}
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">
              Password
            </label>
            <input
              type="password"
              required
              minLength={6}
              class="w-full px-4 py-3 border border-slate-200 rounded-lg text-sm
                     focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
                     transition-shadow"
              placeholder="••••••••"
              value={password()}
              onInput={(e) => setPassword(e.currentTarget.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading()}
            class="w-full py-3 bg-primary-500 text-white rounded-lg font-medium
                   hover:bg-primary-600 active:scale-[0.98] transition-all
                   disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading() ? 'Please wait...' : mode() === 'login' ? 'Sign In' : 'Sign Up'}
          </button>
        </form>

        {/* Divider */}
        <div class="flex items-center my-6">
          <div class="flex-1 border-t border-slate-200"></div>
          <span class="px-4 text-sm text-slate-500">or</span>
          <div class="flex-1 border-t border-slate-200"></div>
        </div>

        {/* Google Sign In */}
        <button
          onClick={handleGoogleSignIn}
          disabled={loading()}
          class="w-full py-3 bg-white border-2 border-slate-200 text-slate-700 rounded-lg font-medium
                 hover:bg-slate-50 active:scale-[0.98] transition-all
                 disabled:opacity-50 disabled:cursor-not-allowed
                 flex items-center justify-center gap-2"
        >
          <svg class="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Continue with Google
        </button>

        {/* Toggle Mode */}
        <div class="mt-6 text-center text-sm text-slate-600">
          {mode() === 'login' ? (
            <>
              Don't have an account?{' '}
              <button
                onClick={() => setMode('signup')}
                class="text-primary-500 hover:text-primary-600 font-medium"
              >
                Sign up
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button
                onClick={() => setMode('login')}
                class="text-primary-500 hover:text-primary-600 font-medium"
              >
                Sign in
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

