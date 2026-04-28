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

type UpsertImportInput = {
  broker?: string
  number?: string
  nameHint?: string
  type?: AccountType
  currency?: AccountCurrency
}

type AccountsState = {
  accounts: TradingAccount[]
  activeAccountId: string | null
  addAccount: (
    input: Omit<TradingAccount, 'id' | 'createdAt' | 'isArchived'>
  ) => string
  upsertFromImport: (input: UpsertImportInput) => string
  setActive: (id: string | null) => void
  rename: (id: string, name: string) => void
  setArchived: (id: string, archived: boolean) => void
  remove: (id: string) => void
  reset: () => void
}

function makeId(): string {
  return `acc_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

function inferTypeFromBroker(broker?: string): AccountType {
  const b = (broker ?? '').toLowerCase()
  if (/ftmo|topstep|funded|prop|myforex|fundednext|the5ers|e8/.test(b))
    return 'prop'
  if (/demo|practice|sandbox/.test(b)) return 'demo'
  return 'live'
}

export const useAccountsStore = create<AccountsState>()(
  persist(
    (set, get) => ({
      accounts: [],
      activeAccountId: null,

      addAccount: (input) => {
        const id = makeId()
        const account: TradingAccount = {
          id,
          createdAt: new Date().toISOString(),
          ...input,
        }
        set((state) => ({
          accounts: [...state.accounts, account],
          activeAccountId: state.activeAccountId ?? id,
        }))
        return id
      },

      upsertFromImport: (input) => {
        const broker = (input.broker ?? '').trim() || 'MT5 Broker'
        const number = (input.number ?? '').trim()
        const existing = get().accounts.find(
          (a) =>
            !a.isArchived &&
            a.broker.toLowerCase() === broker.toLowerCase() &&
            number.length > 0 &&
            a.number === number
        )
        if (existing) {
          set({ activeAccountId: existing.id })
          return existing.id
        }
        const id = makeId()
        const name =
          input.nameHint?.trim() ||
          (number ? `${broker} ${number}` : broker)
        const account: TradingAccount = {
          id,
          name,
          broker,
          number: number || '—',
          type: input.type ?? inferTypeFromBroker(broker),
          currency: input.currency ?? 'USD',
          startingBalance: 0,
          createdAt: new Date().toISOString(),
        }
        set((state) => ({
          accounts: [...state.accounts, account],
          activeAccountId: id,
        }))
        return id
      },

      setActive: (id) => set({ activeAccountId: id }),

      rename: (id, name) =>
        set((state) => ({
          accounts: state.accounts.map((a) =>
            a.id === id ? { ...a, name: name.trim() || a.name } : a
          ),
        })),

      setArchived: (id, archived) =>
        set((state) => {
          const accounts = state.accounts.map((a) =>
            a.id === id ? { ...a, isArchived: archived } : a
          )
          let activeAccountId = state.activeAccountId
          if (archived && state.activeAccountId === id) {
            activeAccountId =
              accounts.find((a) => !a.isArchived)?.id ?? null
          }
          return { accounts, activeAccountId }
        }),

      remove: (id) =>
        set((state) => {
          const accounts = state.accounts.filter((a) => a.id !== id)
          let activeAccountId = state.activeAccountId
          if (state.activeAccountId === id) {
            activeAccountId =
              accounts.find((a) => !a.isArchived)?.id ?? null
          }
          return { accounts, activeAccountId }
        }),

      reset: () => set({ accounts: [], activeAccountId: null }),
    }),
    {
      name: 'fuadfx-accounts',
    }
  )
)

export function useActiveAccount(): TradingAccount | null {
  const accounts = useAccountsStore((s) => s.accounts)
  const activeId = useAccountsStore((s) => s.activeAccountId)
  if (!activeId) return null
  return accounts.find((a) => a.id === activeId) ?? null
}
