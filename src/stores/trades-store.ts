import { useMemo } from 'react'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Trade } from '@/features/trades/data/schema'
import { trades as seedTrades } from '@/features/trades/data/trades'
import { useAccountsStore } from './accounts-store'

export type ImportResult = {
  added: number
  duplicates: number
}

type TradesState = {
  trades: Trade[]
  addTradesForAccount: (
    accountId: string,
    accountName: string,
    incoming: Trade[]
  ) => ImportResult
  removeTrade: (id: string) => boolean
  removeTrades: (ids: string[]) => number
  clearTradesForAccount: (accountId: string) => number
  removeAccount: (accountId: string) => void
  reset: () => void
}

export const useTradesStore = create<TradesState>()(
  persist(
    (set, get) => ({
      trades: [],

      addTradesForAccount: (accountId, accountName, incoming) => {
        const existing = get().trades
        const existingIdsForAccount = new Set(
          existing.filter((t) => t.accountId === accountId).map((t) => t.id)
        )

        const seen = new Set<string>()
        const fresh: Trade[] = []
        let duplicates = 0

        for (const t of incoming) {
          if (existingIdsForAccount.has(t.id) || seen.has(t.id)) {
            duplicates++
            continue
          }
          seen.add(t.id)
          fresh.push({
            ...t,
            accountId,
            account: accountName,
          })
        }

        if (fresh.length === 0) return { added: 0, duplicates }

        set({ trades: [...existing, ...fresh] })
        return { added: fresh.length, duplicates }
      },

      removeTrade: (id) => {
        const before = get().trades.length
        set((state) => ({ trades: state.trades.filter((t) => t.id !== id) }))
        return get().trades.length < before
      },

      removeTrades: (ids) => {
        const ids_set = new Set(ids)
        const before = get().trades.length
        set((state) => ({
          trades: state.trades.filter((t) => !ids_set.has(t.id)),
        }))
        return before - get().trades.length
      },

      clearTradesForAccount: (accountId) => {
        const before = get().trades.length
        set((state) => ({
          trades: state.trades.filter((t) => t.accountId !== accountId),
        }))
        return before - get().trades.length
      },

      removeAccount: (accountId) =>
        set((state) => ({
          trades: state.trades.filter((t) => t.accountId !== accountId),
        })),

      reset: () => set({ trades: [] }),
    }),
    {
      name: 'fuadfx-trades',
      version: 2,
      migrate: (persisted, version) => {
        // v1 stored { imported: Trade[] } without accountId. Drop those —
        // they're unassigned to any account and we can't safely attribute them.
        if (!persisted || version < 2) {
          return { trades: [] } as Partial<TradesState>
        }
        return persisted as Partial<TradesState>
      },
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.trades = state.trades.map((t) => ({
            ...t,
            openedAt: new Date(t.openedAt),
            closedAt: new Date(t.closedAt),
          }))
        }
      },
    }
  )
)

/**
 * Returns trades for the currently-active account. If the user has not yet
 * created any accounts (e.g. brand-new sign-in, before importing), we fall
 * back to the demo seed trades so the dashboard isn't empty. The moment
 * any account exists, seed trades are dropped — only the active account's
 * real trades are shown. This matches the TradeZella / Tradervue pattern of
 * strict per-account isolation.
 */
export function useTrades(): Trade[] {
  const trades = useTradesStore((s) => s.trades)
  const accounts = useAccountsStore((s) => s.accounts)
  const activeId = useAccountsStore((s) => s.activeAccountId)

  return useMemo(() => {
    if (accounts.length === 0) return seedTrades
    if (!activeId) return []
    return trades.filter((t) => t.accountId === activeId)
  }, [trades, accounts.length, activeId])
}
