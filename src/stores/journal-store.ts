// Journal notes are now persisted in Supabase via the Express API.
// TanStack Query is the client-side cache. Types and compatibility
// hooks are re-exported here so existing imports keep working.
export { useNotesForActiveAccount } from '@/hooks/use-journals-query'

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
