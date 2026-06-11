import { useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAccountsStore } from '@/stores/accounts-store'
import type { JournalNote } from '@/stores/journal-store'
import apiClient from '@/lib/api'

export const JOURNALS_KEY = ['journals'] as const

export function useJournalsQuery() {
  return useQuery<JournalNote[]>({
    queryKey: JOURNALS_KEY,
    queryFn: async () => {
      const { data } = await apiClient.get('/journals')
      return data as JournalNote[]
    },
    staleTime: 30 * 1000,
  })
}

export function useNotesForActiveAccount(): JournalNote[] {
  const activeId = useAccountsStore((s) => s.activeAccountId)
  const { data: notes = [] } = useJournalsQuery()
  return useMemo(
    () => (activeId ? notes.filter((n) => n.accountId === activeId) : []),
    [notes, activeId]
  )
}

export function useCreateJournal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: {
      accountId: string
      title?: string
      body?: string
      mood?: string
      tags?: string[]
      createdAt?: string
    }) => {
      const { data } = await apiClient.post('/journals', payload)
      return data as JournalNote
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: JOURNALS_KEY }),
  })
}

export function useUpdateJournal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      ...patch
    }: Partial<JournalNote> & { id: string }) => {
      const { data } = await apiClient.put(`/journals/${id}`, patch)
      return data as JournalNote
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: JOURNALS_KEY }),
  })
}

export function useDeleteJournal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/journals/${id}`)
      return id
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: JOURNALS_KEY }),
  })
}
