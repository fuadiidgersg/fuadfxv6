import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type ProductTourState = {
  completed: boolean
  dismissedAt?: string
  complete: () => void
  reset: () => void
}

export const useProductTourStore = create<ProductTourState>()(
  persist(
    (set) => ({
      completed: false,
      complete: () =>
        set({ completed: true, dismissedAt: new Date().toISOString() }),
      reset: () => set({ completed: false, dismissedAt: undefined }),
    }),
    { name: 'fuadfx-product-tour' }
  )
)
