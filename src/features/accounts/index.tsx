import { useMemo, useState } from 'react'
import {
  ArrowDownRight,
  ArrowUpRight,
  Archive,
  ArchiveRestore,
  Building2,
  CandlestickChart,
  CheckCircle2,
  CircleDot,
  LineChart,
  MoreHorizontal,
  Pause,
  Pencil,
  Plus,
  Trash2,
  Wallet,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  useAccountsStore,
  type AccountType,
  type TradingAccount,
} from '@/stores/accounts-store'
import { useTradesStore } from '@/stores/trades-store'
import { useJournalStore } from '@/stores/journal-store'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { CreateAccountDialog } from '@/components/layout/account-switcher'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'

const currencySymbol: Record<TradingAccount['currency'], string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
}

function iconForType(type: AccountType) {
  if (type === 'prop') return CandlestickChart
  if (type === 'demo') return LineChart
  return Wallet
}

export function Accounts() {
  const accounts = useAccountsStore((s) => s.accounts)
  const activeId = useAccountsStore((s) => s.activeAccountId)
  const setActive = useAccountsStore((s) => s.setActive)
  const renameAccount = useAccountsStore((s) => s.rename)
  const setArchived = useAccountsStore((s) => s.setArchived)
  const removeAccount = useAccountsStore((s) => s.remove)

  const allTrades = useTradesStore((s) => s.trades)
  const clearTradesForAccount = useTradesStore((s) => s.clearTradesForAccount)
  const removeAccountTrades = useTradesStore((s) => s.removeAccount)
  const removeAccountNotes = useJournalStore((s) => s.removeNotesForAccount)

  const [search, setSearch] = useState('')
  const [type, setType] = useState<'all' | AccountType>('all')
  const [createOpen, setCreateOpen] = useState(false)
  const [renameTarget, setRenameTarget] = useState<TradingAccount | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [confirmDelete, setConfirmDelete] = useState<TradingAccount | null>(
    null
  )

  const stats = useMemo(() => {
    const byAccount = new Map<
      string,
      { tradeCount: number; pnl: number; lastAt: number | null }
    >()
    for (const t of allTrades) {
      if (!t.accountId) continue
      const cur = byAccount.get(t.accountId) ?? {
        tradeCount: 0,
        pnl: 0,
        lastAt: null as number | null,
      }
      cur.tradeCount += 1
      cur.pnl += t.pnl
      const ts = new Date(t.closedAt).getTime()
      if (!cur.lastAt || ts > cur.lastAt) cur.lastAt = ts
      byAccount.set(t.accountId, cur)
    }
    return byAccount
  }, [allTrades])

  const filtered = accounts
    .filter((a) => (type === 'all' ? true : a.type === type))
    .filter(
      (a) =>
        a.name.toLowerCase().includes(search.toLowerCase()) ||
        a.broker.toLowerCase().includes(search.toLowerCase())
    )

  const totals = accounts.reduce(
    (acc, a) => {
      if (a.isArchived) return acc
      const usd =
        a.currency === 'USD' ? 1 : a.currency === 'EUR' ? 1.08 : 1.27
      const s = stats.get(a.id)
      const equity = a.startingBalance + (s?.pnl ?? 0)
      acc.equity += equity * usd
      acc.balance += a.startingBalance * usd
      acc.pnl += (s?.pnl ?? 0) * usd
      acc.tradeCount += s?.tradeCount ?? 0
      return acc
    },
    { equity: 0, balance: 0, pnl: 0, tradeCount: 0 }
  )

  function openRename(a: TradingAccount) {
    setRenameTarget(a)
    setRenameValue(a.name)
  }
  function commitRename() {
    if (!renameTarget) return
    renameAccount(renameTarget.id, renameValue)
    toast.success('Account renamed.')
    setRenameTarget(null)
  }

  function handleClear(a: TradingAccount) {
    const removed = clearTradesForAccount(a.id)
    toast.success(
      `Cleared ${removed} trade${removed === 1 ? '' : 's'} from "${a.name}".`
    )
  }

  function handleDelete() {
    if (!confirmDelete) return
    removeAccountTrades(confirmDelete.id)
    removeAccountNotes(confirmDelete.id)
    removeAccount(confirmDelete.id)
    toast.success(`Deleted account "${confirmDelete.name}".`)
    setConfirmDelete(null)
  }

  return (
    <>
      <Header fixed>
        <Search className='me-auto' />
        <ThemeSwitch />
        <ConfigDrawer />
        <ProfileDropdown />
      </Header>

      <Main className='flex flex-1 flex-col gap-6'>
        <div className='flex flex-wrap items-end justify-between gap-2'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>
              Trading Accounts
            </h2>
            <p className='text-muted-foreground'>
              Live, demo and prop firm accounts you trade across. Trades stay
              isolated per account.
            </p>
          </div>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className='me-1 size-4' />
            Add Account
          </Button>
        </div>

        <div className='grid gap-3 sm:grid-cols-3'>
          <Card>
            <CardHeader className='pb-2'>
              <CardTitle className='text-xs font-medium text-muted-foreground'>
                Total Equity (USD)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold tabular-nums'>
                $
                {totals.equity.toLocaleString(undefined, {
                  maximumFractionDigits: 0,
                })}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className='pb-2'>
              <CardTitle className='text-xs font-medium text-muted-foreground'>
                Total Starting Balance (USD)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold tabular-nums'>
                $
                {totals.balance.toLocaleString(undefined, {
                  maximumFractionDigits: 0,
                })}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className='pb-2'>
              <CardTitle className='text-xs font-medium text-muted-foreground'>
                Net P&L · {totals.tradeCount} trade
                {totals.tradeCount === 1 ? '' : 's'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className={cn(
                  'text-2xl font-bold tabular-nums',
                  totals.pnl >= 0 ? 'text-emerald-600' : 'text-red-600'
                )}
              >
                {totals.pnl >= 0 ? '+' : ''}$
                {totals.pnl.toLocaleString(undefined, {
                  maximumFractionDigits: 0,
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className='flex flex-wrap items-center gap-2'>
          <Input
            placeholder='Filter by name or broker...'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className='h-9 w-60'
          />
          <Select
            value={type}
            onValueChange={(v) => setType(v as typeof type)}
          >
            <SelectTrigger className='w-36'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All types</SelectItem>
              <SelectItem value='live'>Live</SelectItem>
              <SelectItem value='demo'>Demo</SelectItem>
              <SelectItem value='prop'>Prop firm</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Separator className='shadow-sm' />

        {filtered.length === 0 ? (
          <Card className='border-dashed'>
            <CardHeader className='items-center text-center'>
              <div className='mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-muted'>
                <Wallet className='size-5' />
              </div>
              <CardTitle className='text-base'>No accounts yet</CardTitle>
              <CardDescription>
                Create a trading account or import an MT5 statement to get
                started.
              </CardDescription>
            </CardHeader>
            <CardContent className='flex justify-center'>
              <Button onClick={() => setCreateOpen(true)}>
                <Plus className='me-1 size-4' />
                Add your first account
              </Button>
            </CardContent>
          </Card>
        ) : (
          <ul className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
            {filtered.map((a) => {
              const Icon = iconForType(a.type)
              const sym = currencySymbol[a.currency]
              const s = stats.get(a.id)
              const pnl = s?.pnl ?? 0
              const equity = a.startingBalance + pnl
              const positive = pnl >= 0
              const isActive = a.id === activeId
              const StatusIcon = a.isArchived
                ? Building2
                : isActive
                  ? CircleDot
                  : Pause
              return (
                <li key={a.id}>
                  <Card
                    className={cn(
                      'transition hover:shadow-md',
                      isActive && 'ring-1 ring-emerald-500/50'
                    )}
                  >
                    <CardHeader className='pb-3'>
                      <div className='flex items-start justify-between gap-2'>
                        <div className='flex items-center gap-2'>
                          <div className='flex size-9 items-center justify-center rounded-lg bg-muted'>
                            <Icon className='size-4' />
                          </div>
                          <div>
                            <CardTitle className='text-base'>
                              {a.name}
                            </CardTitle>
                            <CardDescription className='text-xs'>
                              {a.broker} · {a.number}
                            </CardDescription>
                          </div>
                        </div>
                        <div className='flex items-center gap-1'>
                          <Badge
                            variant={isActive ? 'default' : 'secondary'}
                            className='gap-1 capitalize'
                          >
                            <StatusIcon className='size-3' />
                            {a.isArchived
                              ? 'archived'
                              : isActive
                                ? 'active'
                                : 'idle'}
                          </Badge>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant='ghost'
                                size='icon'
                                className='size-7'
                              >
                                <MoreHorizontal className='size-4' />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align='end'>
                              <DropdownMenuItem
                                onClick={() => setActive(a.id)}
                                disabled={isActive || a.isArchived}
                              >
                                <CheckCircle2 className='me-2 size-4' />
                                Set active
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openRename(a)}>
                                <Pencil className='me-2 size-4' />
                                Rename
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  setArchived(a.id, !a.isArchived)
                                }
                              >
                                {a.isArchived ? (
                                  <>
                                    <ArchiveRestore className='me-2 size-4' />
                                    Unarchive
                                  </>
                                ) : (
                                  <>
                                    <Archive className='me-2 size-4' />
                                    Archive
                                  </>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleClear(a)}
                                disabled={(s?.tradeCount ?? 0) === 0}
                                className='text-muted-foreground'
                              >
                                <Trash2 className='me-2 size-4' />
                                Clear trades
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => setConfirmDelete(a)}
                                className='text-red-600 focus:text-red-600'
                              >
                                <Trash2 className='me-2 size-4' />
                                Delete account
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className='space-y-3'>
                      <div className='flex items-end justify-between'>
                        <div>
                          <div className='text-xs text-muted-foreground'>
                            Equity
                          </div>
                          <div className='text-xl font-bold tabular-nums'>
                            {sym}
                            {equity.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </div>
                        </div>
                        <div
                          className={cn(
                            'flex items-center gap-1 text-sm font-medium tabular-nums',
                            positive ? 'text-emerald-600' : 'text-red-600'
                          )}
                        >
                          {positive ? (
                            <ArrowUpRight className='size-4' />
                          ) : (
                            <ArrowDownRight className='size-4' />
                          )}
                          {positive ? '+' : ''}
                          {sym}
                          {Math.abs(pnl).toFixed(2)}
                        </div>
                      </div>
                      <div className='grid grid-cols-3 gap-2 border-t pt-3 text-xs'>
                        <div>
                          <div className='text-muted-foreground'>Starting</div>
                          <div className='font-medium tabular-nums'>
                            {sym}
                            {a.startingBalance.toLocaleString()}
                          </div>
                        </div>
                        <div>
                          <div className='text-muted-foreground'>Trades</div>
                          <div className='font-medium tabular-nums'>
                            {s?.tradeCount ?? 0}
                          </div>
                        </div>
                        <div>
                          <div className='text-muted-foreground'>Type</div>
                          <div className='font-medium capitalize'>
                            {a.type}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </li>
              )
            })}
          </ul>
        )}
      </Main>

      <CreateAccountDialog open={createOpen} onOpenChange={setCreateOpen} />

      <Dialog
        open={!!renameTarget}
        onOpenChange={(v) => !v && setRenameTarget(null)}
      >
        <DialogContent className='sm:max-w-sm'>
          <DialogHeader className='text-start'>
            <DialogTitle>Rename account</DialogTitle>
            <DialogDescription>
              Choose a name that helps you tell this account apart from your
              others.
            </DialogDescription>
          </DialogHeader>
          <div className='grid gap-1.5'>
            <Label htmlFor='rename-input'>Name</Label>
            <Input
              id='rename-input'
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitRename()
              }}
            />
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setRenameTarget(null)}>
              Cancel
            </Button>
            <Button onClick={commitRename}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!confirmDelete}
        onOpenChange={(v) => !v && setConfirmDelete(null)}
      >
        <DialogContent className='sm:max-w-sm'>
          <DialogHeader className='text-start'>
            <DialogTitle>Delete account?</DialogTitle>
            <DialogDescription>
              This permanently removes "{confirmDelete?.name}" and all{' '}
              {(confirmDelete && stats.get(confirmDelete.id)?.tradeCount) ?? 0}{' '}
              trade(s) logged under it. This can't be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant='outline' onClick={() => setConfirmDelete(null)}>
              Cancel
            </Button>
            <Button variant='destructive' onClick={handleDelete}>
              <Trash2 className='size-4' />
              Delete account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
