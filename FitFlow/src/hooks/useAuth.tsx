// src/hooks/useAuth.tsx
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react'
import { supabase } from '../lib/api'
import AsyncStorage from '@react-native-async-storage/async-storage'

interface AuthCtx {
  user: any | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<any>
  signUp: (email: string, password: string) => Promise<any>
  signOut: () => Promise<void>
  hasOnboarded: boolean
  setHasOnboarded: (v: boolean) => void
}

const AuthContext = createContext<AuthCtx | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]       = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [hasOnboarded, setHasOnboarded] = useState(false)

  // on mount: check session + onboarding flag
 useEffect(() => {
  const getInitialSession = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    setUser(session?.user ?? null)

    const flag = await AsyncStorage.getItem('hasOnboarded')
    setHasOnboarded(flag === 'true')

    setLoading(false)
  }

  getInitialSession()

  const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
    setUser(session?.user ?? null)
  })

  return () => {
    listener?.subscription?.unsubscribe()
  }
}, [])

  // wrap signIn/up/out as before...
  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    setUser(data.user)
    return data.user
  }

  const signUp = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) throw error
    setUser(data.user)
    return data.user
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setHasOnboarded(false)
    await AsyncStorage.removeItem('hasOnboarded')
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn,
        signUp,
        signOut,
        hasOnboarded,
        setHasOnboarded,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}