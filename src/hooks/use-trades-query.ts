import { useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAccountsStore } from '@/stores/accounts-store'
import apiClient from '@/lib/api'
import type { Trade } from '@/features/trades/data/schema'
import { useAccountsQuery } from './use-accounts-query'

export const TRADES_KEY = ['trades'] as const

function parseTrade(t: any): Trade {
  return {
    ...t,
    openedAt: new Date(t.openedAt),
    closedAt: new Date(t.closedAt),
  } as Trade
}

export function useAllTradesQuery() {
  return useQuery<Trade[]>({
    queryKey: TRADES_KEY,
    queryFn: async () => {
      const { data } = await apiClient.get('/trades')
      return (data as any[]).map(parseTrade)
    },
    staleTime: 20 * 1000,
  })
}

export function useTrades(): Trade[] {
  const { data: allTrades = [] } = useAllTradesQuery()
  const { data: accounts = [] } = useAccountsQuery()
  const activeId = useAccountsStore((s) => s.activeAccountId)

  return useMemo(() => {
    const accountId = activeId ?? accounts.find((a) => !a.isArchived)?.id
    if (!accountId) return []
    return allTrades.filter((t) => t.accountId === accountId)
  }, [allTrades, activeId, accounts])
}

export function useCreateTrade() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (trade: Omit<Trade, 'id'> & { id?: string }) => {
      const { data } = await apiClient.post('/trades', trade)
      return parseTrade(data)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: TRADES_KEY }),
  })
}

export function useBulkCreateTrades() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      trades,
      accountId,
    }: {
      trades: Trade[]
      accountId: string
    }) => {
      const { data } = await apiClient.post('/trades/bulk', {
        trades,
        accountId,
      })
      return data as { added: number; duplicates: number }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: TRADES_KEY }),
  })
}

export function useUpdateTrade() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...trade }: Trade) => {
      const { data } = await apiClient.put(`/trades/${id}`, trade)
      return parseTrade(data)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: TRADES_KEY }),
  })
}

export function useDeleteTrade() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/trades/${id}`)
      return id
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: TRADES_KEY }),
  })
}

export function useDeleteTrades() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (ids: string[]) => {
      const { data } = await apiClient.delete('/trades/bulk', {
        data: { ids },
      })
      return data as { deleted: number }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: TRADES_KEY }),
  })
}

export function useClearTradesForAccount() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (accountId: string) => {
      const { data: allTrades } = await apiClient.get(
        `/trades?accountId=${accountId}`
      )
      const ids = (allTrades as Trade[]).map((t) => t.id)
      if (ids.length === 0) return { deleted: 0 }
      const { data } = await apiClient.delete('/trades/bulk', {
        data: { ids },
      })
      return data as { deleted: number }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: TRADES_KEY }),
  })
}
