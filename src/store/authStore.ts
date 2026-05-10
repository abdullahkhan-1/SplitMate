import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { Profile } from '@/types'

interface AuthState {
  user: Profile | null
  loading: boolean
  setUser: (user: Profile | null) => void
  signIn: (email: string, password: string) => Promise<string | null>
  signUp: (email: string, password: string, username: string, fullName: string) => Promise<string | null>
  signOut: () => Promise<void>
  initialize: () => Promise<void>
}

const fetchProfile = async (userId: string): Promise<Profile | null> => {
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  return data ?? null
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true, // start as true until initialize() completes

  setUser: (user) => set({ user }),

  initialize: async () => {
    set({ loading: true })

    // Check for existing session on page load
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user) {
      const profile = await fetchProfile(session.user.id)
      set({ user: profile, loading: false })
    } else {
      set({ user: null, loading: false })
    }

    // Listen for login/logout events
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const profile = await fetchProfile(session.user.id)
        set({ user: profile })
      } else {
        set({ user: null })
      }
    })
  },

  signIn: async (email, password) => {
    set({ loading: true })
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      set({ loading: false })
      return error.message
    }
    if (data.user) {
      const profile = await fetchProfile(data.user.id)
      set({ user: profile, loading: false })
    }
    return null
  },

  signUp: async (email, password, username, fullName) => {
    set({ loading: true })

    // Check username is not taken
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username)
      .single()

    if (existing) {
      set({ loading: false })
      return 'Username is already taken'
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username, full_name: fullName },
      },
    })

    if (error) {
      set({ loading: false })
      return error.message
    }

    if (data.user) {
      // Wait briefly for the DB trigger to create the profile
      await new Promise((r) => setTimeout(r, 800))
      const profile = await fetchProfile(data.user.id)
      set({ user: profile, loading: false })
    } else {
      set({ loading: false })
      return 'Check your email to confirm your account'
    }

    return null
  },

  signOut: async () => {
    await supabase.auth.signOut()
    set({ user: null })
  },
}))