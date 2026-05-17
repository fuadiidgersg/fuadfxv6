import { useState } from 'react'
import {
  Building2,
  CandlestickChart,
  ChevronsUpDown,
  CircleDot,
  LineChart,
  Plus,
  Wallet,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  useAccountsStore,
  type AccountCurrency,
  type AccountType,
} from '@/stores/accounts-store'
import { Button } from '@/components/ui/button'
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
  DropdownMenuLabel,
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
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'

function TypeIcon({
  type,
  className,
}: {
  type: AccountType | null | undefined
  className?: string
}) {
  if (type === 'prop') return <CandlestickChart className={className} />
  if (type === 'demo') return <LineChart className={className} />
  return <Wallet className={className} />
}

export function AccountSwitcher() {
  const { isMobile } = useSidebar()
  const accounts = useAccountsStore((s) => s.accounts)
  const activeId = useAccountsStore((s) => s.activeAccountId)
  const setActive = useAccountsStore((s) => s.setActive)
  const [createOpen, setCreateOpen] = useState(false)

  const visible = accounts.filter((a) => !a.isArchived)
  const active = accounts.find((a) => a.id === activeId) ?? null

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size='lg'
                className='data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground'
              >
                <div className='flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground'>
                  <TypeIcon type={active?.type} className='size-4' />
                </div>
                <div className='grid flex-1 text-start text-sm leading-tight'>
                  <span className='truncate font-semibold'>
                    {active?.name ?? 'No account yet'}
                  </span>
                  <span className='truncate text-xs text-muted-foreground'>
                    {active
                      ? `${active.broker} · ${active.type}`
                      : 'Add your first account'}
                  </span>
                </div>
                <ChevronsUpDown className='ms-auto' />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className='w-(--radix-dropdown-menu-trigger-width) min-w-64 rounded-lg'
              align='start'
              side={isMobile ? 'bottom' : 'right'}
              sideOffset={4}
            >
              <DropdownMenuLabel className='text-xs text-muted-foreground'>
                Trading accounts
              </DropdownMenuLabel>
              {visible.length === 0 && (
                <div className='px-2 py-3 text-xs text-muted-foreground'>
                  No accounts yet. Create one to start journaling.
                </div>
              )}
              {visible.map((a) => {
                const isActive = a.id === activeId
                return (
                  <DropdownMenuItem
                    key={a.id}
                    onClick={() => setActive(a.id)}
                    className='gap-2 p-2'
                  >
                    <div className='flex size-6 items-center justify-center rounded-sm border'>
                      <TypeIcon type={a.type} className='size-4 shrink-0' />
                    </div>
                    <div className='flex min-w-0 flex-1 flex-col'>
                      <span className='truncate text-sm font-medium'>
                        {a.name}
                      </span>
                      <span className='truncate text-xs text-muted-foreground'>
                        {a.broker} · {a.number}
                      </span>
                    </div>
                    {isActive && (
                      <CircleDot className='ms-auto size-3 text-emerald-500' />
                    )}
                  </DropdownMenuItem>
                )
              })}
              {accounts.some((a) => a.isArchived) && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel className='text-xs text-muted-foreground'>
                    <Building2 className='me-1 inline size-3' />
                    Archived
                  </DropdownMenuLabel>
                  {accounts
                    .filter((a) => a.isArchived)
                    .map((a) => (
                      <DropdownMenuItem
                        key={a.id}
                        onClick={() => setActive(a.id)}
                        className='gap-2 p-2 opacity-60'
                      >
                        <div className='flex size-6 items-center justify-center rounded-sm border'>
                          <Building2 className='size-4 shrink-0' />
                        </div>
                        <span className='truncate text-sm'>{a.name}</span>
                      </DropdownMenuItem>
                    ))}
                </>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setCreateOpen(true)}
                className='gap-2 p-2'
              >
                <div className='flex size-6 items-center justify-center rounded-md border bg-background'>
                  <Plus className='size-4' />
                </div>
                <div className='font-medium text-muted-foreground'>
                  Add account
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>

      <CreateAccountDialog open={createOpen} onOpenChange={setCreateOpen} />
    </>
  )
}

export function CreateAccountDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
}) {
  const addAccount = useAccountsStore((s) => s.addAccount)
  const setActive = useAccountsStore((s) => s.setActive)

  const [name, setName] = useState('')
  const [broker, setBroker] = useState('')
  const [number, setNumber] = useState('')
  const [type, setType] = useState<AccountType>('live')
  const [currency, setCurrency] = useState<AccountCurrency>('USD')
  const [startingBalance, setStartingBalance] = useState('10000')

  const reset = () => {
    setName('')
    setBroker('')
    setNumber('')
    setType('live')
    setCurrency('USD')
    setStartingBalance('10000')
  }

  function handleCreate() {
    if (!name.trim() || !broker.trim()) {
      toast.error('Please enter a name and broker.')
      return
    }
    const balance = Number(startingBalance) || 0
    const id = addAccount({
      name: name.trim(),
      broker: broker.trim(),
      number: number.trim() || '—',
      type,
      currency,
      startingBalance: balance,
    })
    setActive(id)
    toast.success(`Account "${name.trim()}" created.`)
    reset()
    onOpenChange(false)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v)
        if (!v) reset()
      }}
    >
      <DialogContent className='sm:max-w-md'>
        <DialogHeader className='text-start'>
          <DialogTitle>Add a trading account</DialogTitle>
          <DialogDescription>
            Trades stay isolated to the account you log them under. You can
            switch between accounts any time.
          </DialogDescription>
        </DialogHeader>

        <div className='grid gap-3'>
          <div className='grid gap-1.5'>
            <Label htmlFor='acc-name'>Account name</Label>
            <Input
              id='acc-name'
              placeholder='e.g. FTMO 100k Challenge'
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className='grid gap-3 sm:grid-cols-2'>
            <div className='grid gap-1.5'>
              <Label htmlFor='acc-broker'>Broker</Label>
              <Input
                id='acc-broker'
                placeholder='IC Markets, FTMO, OANDA…'
                value={broker}
                onChange={(e) => setBroker(e.target.value)}
              />
            </div>
            <div className='grid gap-1.5'>
              <Label htmlFor='acc-number'>Account number</Label>
              <Input
                id='acc-number'
                placeholder='Optional'
                value={number}
                onChange={(e) => setNumber(e.target.value)}
              />
            </div>
          </div>
          <div className='grid gap-3 sm:grid-cols-3'>
            <div className='grid gap-1.5'>
              <Label>Type</Label>
              <Select
                value={type}
                onValueChange={(v) => setType(v as AccountType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='live'>Live</SelectItem>
                  <SelectItem value='demo'>Demo</SelectItem>
                  <SelectItem value='prop'>Prop firm</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className='grid gap-1.5'>
              <Label>Currency</Label>
              <Select
                value={currency}
                onValueChange={(v) => setCurrency(v as AccountCurrency)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='USD'>USD</SelectItem>
                  <SelectItem value='EUR'>EUR</SelectItem>
                  <SelectItem value='GBP'>GBP</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className='grid gap-1.5'>
              <Label htmlFor='acc-balance'>Starting balance</Label>
              <Input
                id='acc-balance'
                type='number'
                inputMode='decimal'
                min={0}
                value={startingBalance}
                onChange={(e) => setStartingBalance(e.target.value)}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreate}>
            <Plus className='size-4' />
            Create account
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
