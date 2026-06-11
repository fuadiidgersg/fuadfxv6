import { useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAccountsStore } from '@/stores/accounts-store'
import type { TradingAccount } from '@/stores/accounts-store'
import apiClient from '@/lib/api'

export const ACCOUNTS_KEY = ['accounts'] as const

export function useAccountsQuery() {
  return useQuery<TradingAccount[]>({
    queryKey: ACCOUNTS_KEY,
    queryFn: async () => {
      const { data } = await apiClient.get('/accounts')
      return data as TradingAccount[]
    },
    staleTime: 30 * 1000,
  })
}

export function useActiveAccount(): TradingAccount | null {
  const activeId = useAccountsStore((s) => s.activeAccountId)
  const { data: accounts = [] } = useAccountsQuery()

  return useMemo(() => {
    if (activeId) {
      const found = accounts.find((a) => a.id === activeId)
      if (found) return found
    }
    return accounts.find((a) => !a.isArchived) ?? null
  }, [activeId, accounts])
}

export function useCreateAccount() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (
      payload: Omit<TradingAccount, 'id' | 'createdAt' | 'isArchived'>
    ) => {
      const { data } = await apiClient.post('/accounts', payload)
      return data as TradingAccount
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ACCOUNTS_KEY }),
  })
}

export function useUpsertAccountFromImport() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: {
      broker?: string
      number?: string
      nameHint?: string
      currency?: TradingAccount['currency']
      startingBalance?: number
    }) => {
      const { data } = await apiClient.post('/accounts/upsert', payload)
      return data as TradingAccount
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ACCOUNTS_KEY }),
  })
}

export function useUpdateAccount() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      ...patch
    }: Partial<TradingAccount> & { id: string }) => {
      const { data } = await apiClient.put(`/accounts/${id}`, patch)
      return data as TradingAccount
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ACCOUNTS_KEY }),
  })
}

export function useDeleteAccount() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/accounts/${id}`)
      return id
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ACCOUNTS_KEY })
      qc.invalidateQueries({ queryKey: ['trades'] })
      qc.invalidateQueries({ queryKey: ['journals'] })
    },
  })
}
