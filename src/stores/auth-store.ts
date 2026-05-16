import { create } from 'zustand'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase/client'

interface AuthState {
  auth: {
    user: User | null
    session: Session | null
    accessToken: string
    isLoading: boolean
    setUser: (user: User | null) => void
    setSession: (session: Session | null) => void
    setAccessToken: (accessToken: string) => void
    resetAccessToken: () => void
    reset: () => void
    initialize: () => Promise<void>
  }
}

export const useAuthStore = create<AuthState>()((set) => ({
  auth: {
    user: null,
    session: null,
    accessToken: '',
    isLoading: true,

    setUser: (user) =>
      set((state) => ({ auth: { ...state.auth, user } })),

    setSession: (session) =>
      set((state) => ({
        auth: {
          ...state.auth,
          session,
          user: session?.user ?? null,
          accessToken: session?.access_token ?? '',
        },
      })),

    setAccessToken: (accessToken) =>
      set((state) => ({ auth: { ...state.auth, accessToken } })),

    resetAccessToken: () =>
      set((state) => ({ auth: { ...state.auth, accessToken: '' } })),

    reset: () =>
      set((state) => ({
        auth: { ...state.auth, user: null, session: null, accessToken: '' },
      })),

    initialize: async () => {
      const { data } = await supabase.auth.getSession()
      const session = data.session
      set((state) => ({
        auth: {
          ...state.auth,
          session,
          user: session?.user ?? null,
          accessToken: session?.access_token ?? '',
          isLoading: false,
        },
      }))

      supabase.auth.onAuthStateChange((_event, session) => {
        set((state) => ({
          auth: {
            ...state.auth,
            session,
            user: session?.user ?? null,
            accessToken: session?.access_token ?? '',
          },
        }))
      })
    },
  },
}))
