import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type AccountType = 'live' | 'demo' | 'prop'
export type AccountCurrency = 'USD' | 'EUR' | 'GBP'

export type TradingAccount = {
  id: string
  name: string
  broker: string
  number: string
  type: AccountType
  currency: AccountCurrency
  startingBalance: number
  createdAt: string
  isArchived?: boolean
}

type ActiveAccountState = {
  activeAccountId: string | null
  setActive: (id: string | null) => void
}

export const useAccountsStore = create<ActiveAccountState>()(
  persist(
    (set) => ({
      activeAccountId: null,
      setActive: (id) => set({ activeAccountId: id }),
    }),
    { name: 'fuadfx-active-account' }
  )
)
