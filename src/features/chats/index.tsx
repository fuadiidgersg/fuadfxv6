import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { format, formatDistanceToNow } from 'date-fns'
import {
  BookOpen,
  Loader2,
  Plus,
  Search as SearchIcon,
  Trash2,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { useActiveAccount } from '@/hooks/use-accounts-query'
import {
  useCreateJournal,
  useUpdateJournal,
  useDeleteJournal,
  useNotesForActiveAccount,
} from '@/hooks/use-journals-query'
import {
  type JournalMood,
  moodColors,
  moodLabels,
} from '@/stores/journal-store'

const moodOptions: JournalMood[] = [
  'great',
  'good',
  'neutral',
  'frustrated',
  'tilted',
]

export function Chats() {
  const account = useActiveAccount()
  const notes = useNotesForActiveAccount()
  const createJournal = useCreateJournal()
  const updateJournal = useUpdateJournal()
  const deleteJournal = useDeleteJournal()

  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [tagDraft, setTagDraft] = useState('')

  // Local draft for the editor — synced to server after a short delay
  const [draftTitle, setDraftTitle] = useState('')
  const [draftBody, setDraftBody] = useState('')
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const filtered = useMemo(() => {
    const sorted = [...notes].sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )
    if (!query.trim()) return sorted
    const q = query.toLowerCase()
    return sorted.filter(
      (n) =>
        n.title.toLowerCase().includes(q) ||
        n.body.toLowerCase().includes(q) ||
        n.tags.some((t) => t.toLowerCase().includes(q))
    )
  }, [notes, query])

  const effectiveSelectedId =
    selectedId && filtered.some((n) => n.id === selectedId)
      ? selectedId
      : (filtered[0]?.id ?? null)

  const selected = filtered.find((n) => n.id === effectiveSelectedId) ?? null

  // Keep draft in sync when the selected note changes (from server refresh)
  useEffect(() => {
    if (selected) {
      setDraftTitle(selected.title)
      setDraftBody(selected.body)
    }
  }, [selected?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const scheduleSave = useCallback(
    (patch: { title?: string; body?: string }) => {
      if (!selected) return
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
      saveTimerRef.current = setTimeout(() => {
        updateJournal.mutate({ id: selected.id, ...patch })
      }, 800)
    },
    [selected, updateJournal]
  )

  const handleNew = async () => {
    if (!account) return
    try {
      const note = await createJournal.mutateAsync({
        accountId: account.id,
        title: 'New journal entry',
      })
      setSelectedId(note.id)
    } catch {
      toast.error('Failed to create journal entry.')
    }
  }

  const handleDelete = async () => {
    if (!selected) return
    try {
      await deleteJournal.mutateAsync(selected.id)
      setSelectedId(null)
    } catch {
      toast.error('Failed to delete journal entry.')
    }
  }

  const handleAddTag = () => {
    if (!selected || !tagDraft.trim()) return
    const t = tagDraft.trim()
    if (selected.tags.includes(t)) {
      setTagDraft('')
      return
    }
    updateJournal.mutate({ id: selected.id, tags: [...selected.tags, t] })
    setTagDraft('')
  }

  const handleRemoveTag = (tag: string) => {
    if (!selected) return
    updateJournal.mutate({
      id: selected.id,
      tags: selected.tags.filter((x) => x !== tag),
    })
  }

  const handleMoodChange = (mood: JournalMood) => {
    if (!selected) return
    updateJournal.mutate({ id: selected.id, mood })
  }

  return (
    <>
      <Header>
        <Search className='me-auto' />
        <ThemeSwitch />
        <ConfigDrawer />
        <ProfileDropdown />
      </Header>

      <Main fixed>
        <section className='flex h-full gap-6'>
          {/* Left column — note list */}
          <div className='flex w-full flex-col gap-2 sm:w-64 lg:w-80'>
            <div className='sticky top-0 z-10 -mx-4 bg-background px-4 pb-3 shadow-md sm:static sm:z-auto sm:mx-0 sm:p-0 sm:shadow-none'>
              <div className='flex items-center justify-between py-2'>
                <div className='flex items-center gap-2'>
                  <BookOpen size={20} className='text-muted-foreground' />
                  <h1 className='text-2xl font-bold'>Journal Notes</h1>
                </div>
                <Button
                  size='icon'
                  variant='ghost'
                  className='rounded-lg'
                  onClick={handleNew}
                  disabled={!account || createJournal.isPending}
                  aria-label='New note'
                >
                  {createJournal.isPending ? (
                    <Loader2 size={20} className='animate-spin' />
                  ) : (
                    <Plus size={20} />
                  )}
                </Button>
              </div>

              <label
                className={cn(
                  'flex h-10 w-full items-center rounded-md border border-border ps-2',
                  'focus-within:ring-1 focus-within:ring-ring focus-within:outline-hidden'
                )}
              >
                <SearchIcon size={15} className='me-2 stroke-slate-500' />
                <span className='sr-only'>Search journal</span>
                <input
                  type='text'
                  className='w-full flex-1 bg-inherit text-sm focus-visible:outline-hidden'
                  placeholder='Search entries...'
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </label>
            </div>

            <ScrollArea className='-mx-3 h-full overflow-scroll p-3'>
              {!account ? (
                <p className='px-2 py-6 text-center text-sm text-muted-foreground'>
                  Add a trading account to start journaling.
                </p>
              ) : filtered.length === 0 ? (
                <div className='flex flex-col items-center gap-2 px-2 py-6 text-center text-sm text-muted-foreground'>
                  <p>No entries yet.</p>
                  <Button size='sm' variant='outline' onClick={handleNew}>
                    <Plus className='me-1 size-3.5' /> Create your first note
                  </Button>
                </div>
              ) : (
                filtered.map((note) => (
                  <button
                    key={note.id}
                    type='button'
                    onClick={() => setSelectedId(note.id)}
                    className={cn(
                      'group mb-1 flex w-full flex-col gap-1 rounded-md px-3 py-2 text-start text-sm hover:bg-accent hover:text-accent-foreground',
                      effectiveSelectedId === note.id && 'sm:bg-muted'
                    )}
                  >
                    <div className='flex items-center justify-between gap-2'>
                      <span className='line-clamp-1 font-medium'>
                        {note.title || 'Untitled'}
                      </span>
                      <span
                        className={cn(
                          'shrink-0 rounded-full px-2 py-[1px] text-[10px] font-medium uppercase tracking-wide',
                          moodColors[note.mood]
                        )}
                      >
                        {moodLabels[note.mood]}
                      </span>
                    </div>
                    <span className='line-clamp-2 text-xs text-muted-foreground group-hover:text-accent-foreground/90'>
                      {note.body || 'Empty entry — add your reflections.'}
                    </span>
                    <span className='text-[11px] text-muted-foreground'>
                      {format(new Date(note.updatedAt), 'd MMM yyyy · HH:mm')}
                    </span>
                  </button>
                ))
              )}
            </ScrollArea>
          </div>

          {/* Right column — editor */}
          {selected ? (
            <div className='absolute inset-0 start-full z-50 hidden w-full flex-1 flex-col rounded-md border bg-background shadow-xs sm:static sm:z-auto sm:flex'>
              <div className='flex flex-none items-start justify-between gap-3 border-b bg-card p-4 sm:rounded-t-md'>
                <div className='flex flex-1 flex-col gap-2'>
                  <Input
                    value={draftTitle}
                    onChange={(e) => {
                      setDraftTitle(e.target.value)
                      scheduleSave({ title: e.target.value })
                    }}
                    placeholder='Title…'
                    className='h-9 border-none bg-transparent px-0 text-base font-semibold shadow-none focus-visible:ring-0 md:text-lg'
                  />
                  <p className='text-xs text-muted-foreground'>
                    {account?.name ?? 'No account'} · created{' '}
                    {format(new Date(selected.createdAt), 'd MMM yyyy')} ·
                    edited{' '}
                    {formatDistanceToNow(new Date(selected.updatedAt))} ago
                  </p>
                </div>
                <div className='flex items-center gap-2'>
                  <Select
                    value={selected.mood}
                    onValueChange={(v) => handleMoodChange(v as JournalMood)}
                  >
                    <SelectTrigger className='h-8 w-[130px]'>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {moodOptions.map((m) => (
                        <SelectItem key={m} value={m}>
                          {moodLabels[m]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    size='icon'
                    variant='ghost'
                    onClick={handleDelete}
                    disabled={deleteJournal.isPending}
                    aria-label='Delete note'
                  >
                    {deleteJournal.isPending ? (
                      <Loader2 className='size-4 animate-spin' />
                    ) : (
                      <Trash2 className='size-4 text-destructive' />
                    )}
                  </Button>
                </div>
              </div>

              <div className='flex flex-1 flex-col gap-3 overflow-y-auto p-4'>
                <div className='flex flex-wrap items-center gap-2'>
                  {selected.tags.map((t) => (
                    <Badge
                      key={t}
                      variant='secondary'
                      className='gap-1 pe-1 text-xs'
                    >
                      {t}
                      <button
                        type='button'
                        aria-label={`Remove ${t}`}
                        onClick={() => handleRemoveTag(t)}
                        className='ms-0.5 rounded p-0.5 hover:bg-foreground/10'
                      >
                        <X className='size-3' />
                      </button>
                    </Badge>
                  ))}
                  <div className='flex items-center gap-1'>
                    <Input
                      value={tagDraft}
                      onChange={(e) => setTagDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          handleAddTag()
                        }
                      }}
                      placeholder='Add tag…'
                      className='h-7 w-32 text-xs'
                    />
                    <Button
                      size='sm'
                      variant='ghost'
                      className='h-7 px-2 text-xs'
                      onClick={handleAddTag}
                      disabled={!tagDraft.trim()}
                    >
                      Add
                    </Button>
                  </div>
                </div>

                <Textarea
                  value={draftBody}
                  onChange={(e) => {
                    setDraftBody(e.target.value)
                    scheduleSave({ body: e.target.value })
                  }}
                  placeholder='What did you see? What did you trade? What did you learn?'
                  className='min-h-[280px] flex-1 resize-none border-none bg-transparent text-sm leading-relaxed shadow-none focus-visible:ring-0'
                />
              </div>
            </div>
          ) : (
            <div className='absolute inset-0 start-full z-50 hidden w-full flex-1 flex-col items-center justify-center gap-6 rounded-md border bg-card shadow-xs sm:static sm:z-auto sm:flex'>
              <div className='flex size-16 items-center justify-center rounded-full border-2 border-border'>
                <BookOpen className='size-8' />
              </div>
              <div className='space-y-2 text-center'>
                <h1 className='text-xl font-semibold'>Your journal</h1>
                <p className='max-w-sm text-sm text-muted-foreground'>
                  {account
                    ? 'Capture your trading thoughts, mistakes and lessons. Notes are saved per active account.'
                    : 'Create or import a trading account first to start journaling.'}
                </p>
              </div>
              {account && (
                <Button onClick={handleNew} disabled={createJournal.isPending}>
                  <Plus className='me-1 size-4' /> New entry
                </Button>
              )}
            </div>
          )}
        </section>
      </Main>
    </>
  )
}
