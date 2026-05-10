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
    .maybeSingle()
  return data ?? null
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,

  setUser: (user) => set({ user }),

  initialize: async () => {
    set({ loading: true })

    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user) {
      const profile = await fetchProfile(session.user.id)
      set({ user: profile, loading: false })
    } else {
      set({ user: null, loading: false })
    }

    // Fires when user clicks confirmation link in email → establishes session
    supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const profile = await fetchProfile(session.user.id)
        set({ user: profile, loading: false })
      } else {
        set({ user: null, loading: false })
      }
    })
  },

  signIn: async (email, password) => {
    set({ loading: true })
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      set({ loading: false })
      if (error.message.toLowerCase().includes('email not confirmed')) {
        return 'Please verify your email first — check your inbox (and spam folder).'
      }
      if (error.message.toLowerCase().includes('invalid login')) {
        return 'Wrong email or password.'
      }
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

    // Check username uniqueness
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username)
      .maybeSingle()

    if (existing) {
      set({ loading: false })
      return 'Username already taken — try a different one.'
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username, full_name: fullName },
        // This tells Supabase where to redirect after email confirmation
        // Must match a URL in your Supabase → Auth → URL Configuration → Redirect URLs
        emailRedirectTo: window.location.origin,
      },
    })

    if (error) {
      set({ loading: false })
      return error.message
    }

    if (!data.session) {
      // Email confirmation is ON — user must verify before logging in
      set({ loading: false })
      return 'CHECK_EMAIL'
    }

    // Email confirmation is OFF — log them in directly
    await new Promise((r) => setTimeout(r, 800))
    const profile = await fetchProfile(data.user!.id)
    set({ user: profile, loading: false })
    return null
  },

  signOut: async () => {
    await supabase.auth.signOut()
    sessionStorage.removeItem('sm_verify')
    set({ user: null })
  },
}))