import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useAccountsStore } from './accounts-store'

export type JournalMood =
  | 'great'
  | 'good'
  | 'neutral'
  | 'frustrated'
  | 'tilted'

export type JournalNote = {
  id: string
  accountId: string
  title: string
  body: string
  mood: JournalMood
  tags: string[]
  createdAt: string
  updatedAt: string
}

type JournalState = {
  notes: JournalNote[]
  addNote: (
    accountId: string,
    init?: Partial<Omit<JournalNote, 'id' | 'accountId' | 'createdAt' | 'updatedAt'>>
  ) => string
  updateNote: (
    id: string,
    patch: Partial<Omit<JournalNote, 'id' | 'accountId' | 'createdAt'>>
  ) => void
  removeNote: (id: string) => void
  removeNotesForAccount: (accountId: string) => void
}

const newId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `note_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

export const useJournalStore = create<JournalState>()(
  persist(
    (set) => ({
      notes: [],
      addNote: (accountId, init) => {
        const id = newId()
        const now = new Date().toISOString()
        const note: JournalNote = {
          id,
          accountId,
          title: init?.title ?? 'New journal entry',
          body: init?.body ?? '',
          mood: init?.mood ?? 'neutral',
          tags: init?.tags ?? [],
          createdAt: now,
          updatedAt: now,
        }
        set((s) => ({ notes: [note, ...s.notes] }))
        return id
      },
      updateNote: (id, patch) =>
        set((s) => ({
          notes: s.notes.map((n) =>
            n.id === id
              ? { ...n, ...patch, updatedAt: new Date().toISOString() }
              : n
          ),
        })),
      removeNote: (id) =>
        set((s) => ({ notes: s.notes.filter((n) => n.id !== id) })),
      removeNotesForAccount: (accountId) =>
        set((s) => ({ notes: s.notes.filter((n) => n.accountId !== accountId) })),
    }),
    { name: 'fuadfx-journal', version: 1 }
  )
)

export function useNotesForActiveAccount(): JournalNote[] {
  const activeId = useAccountsStore((s) => s.activeAccountId)
  return useJournalStore((s) =>
    activeId ? s.notes.filter((n) => n.accountId === activeId) : []
  )
}

export const moodLabels: Record<JournalMood, string> = {
  great: 'Great',
  good: 'Good',
  neutral: 'Neutral',
  frustrated: 'Frustrated',
  tilted: 'Tilted',
}

export const moodColors: Record<JournalMood, string> = {
  great: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
  good: 'bg-sky-500/15 text-sky-700 dark:text-sky-400',
  neutral: 'bg-slate-500/15 text-slate-700 dark:text-slate-300',
  frustrated: 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
  tilted: 'bg-red-500/15 text-red-700 dark:text-red-400',
}
