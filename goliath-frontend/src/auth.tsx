import { createContext, useContext, createEffect, onCleanup, type ParentComponent } from 'solid-js'
import { createStore } from 'solid-js/store'
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User as FirebaseUser,
} from 'firebase/auth'
import { auth } from './firebase'

interface AuthState {
  user: FirebaseUser | null
  loading: boolean
  token: string | null
}

interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
  refreshToken: () => Promise<string | null>
}

const AuthContext = createContext<AuthContextType>()

export const AuthProvider: ParentComponent = (props) => {
  const [state, setState] = createStore<AuthState>({
    user: null,
    loading: true,
    token: null,
  })

  // Listen for auth state changes
  createEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('Auth state changed:', user?.email || 'signed out')
      if (user) {
        // User is signed in
        const token = await user.getIdToken()
        console.log('Got token:', token.substring(0, 20) + '...')
        setState('user', user)
        setState('token', token)
        setState('loading', false)
        // Store token in localStorage for persistence
        localStorage.setItem('firebase_token', token)
      } else {
        // User is signed out
        setState('user', null)
        setState('token', null)
        setState('loading', false)
        localStorage.removeItem('firebase_token')
      }
    })

    onCleanup(() => unsubscribe())
  })

  const signIn = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const token = await userCredential.user.getIdToken()
      setState({ token })
    } catch (error: any) {
      console.error('Sign in error:', error)
      throw new Error(error.message)
    }
  }

  const signUp = async (email: string, password: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const token = await userCredential.user.getIdToken()
      setState({ token })
    } catch (error: any) {
      console.error('Sign up error:', error)
      throw new Error(error.message)
    }
  }

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider()
      const userCredential = await signInWithPopup(auth, provider)
      const token = await userCredential.user.getIdToken()
      setState({ token })
    } catch (error: any) {
      console.error('Google sign in error:', error)
      throw new Error(error.message)
    }
  }

  const signOut = async () => {
    try {
      await firebaseSignOut(auth)
      setState({ user: null, token: null })
      localStorage.removeItem('firebase_token')
    } catch (error: any) {
      console.error('Sign out error:', error)
      throw new Error(error.message)
    }
  }

  const refreshToken = async (): Promise<string | null> => {
    if (state.user) {
      try {
        const token = await state.user.getIdToken(true)
        setState({ token })
        localStorage.setItem('firebase_token', token)
        return token
      } catch (error) {
        console.error('Token refresh error:', error)
        return null
      }
    }
    return null
  }

  const value: AuthContextType = {
    get user() { return state.user },
    get loading() { return state.loading },
    get token() { return state.token },
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    refreshToken,
  }

  return <AuthContext.Provider value={value}>{props.children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Helper function to get auth header
export const getAuthHeader = (): Record<string, string> => {
  const token = localStorage.getItem('firebase_token')
  if (token) {
    return { Authorization: `Bearer ${token}` }
  }
  return {}
}

