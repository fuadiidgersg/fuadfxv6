import { useState } from 'react'
import {
  Bot,
  CheckCircle2,
  Clipboard,
  Download,
  FileText,
  KeyRound,
  Loader2,
  Server,
  Trash2,
  Upload,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAccountsStore } from '@/stores/accounts-store'
import { useAuthStore } from '@/stores/auth-store'
import { useTradingSettings } from '@/stores/trading-settings-store'
import { getApiErrorMessage } from '@/lib/api'
import { parseMT5Html } from '@/lib/mt5-import'
import {
  useAccountsQuery,
  useActiveAccount,
  useUpsertAccountFromImport,
} from '@/hooks/use-accounts-query'
import {
  useAllTradesQuery,
  useBulkCreateTrades,
  useClearTradesForAccount,
} from '@/hooks/use-trades-query'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { TradeStrategy } from '@/features/trades/data/schema'

type TaskImportDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImported?: () => void | Promise<void>
}

type Mt5Preview = ReturnType<typeof parseMT5Html> | null

export function TasksImportDialog({
  open,
  onOpenChange,
  onImported,
}: TaskImportDialogProps) {
  const activeAccountId = useAccountsStore((s) => s.activeAccountId)
  const setActiveAccount = useAccountsStore((s) => s.setActive)
  const accessToken = useAuthStore((s) => s.auth.accessToken)
  const activeAccount = useActiveAccount()
  const { data: accounts = [] } = useAccountsQuery()
  const autoAssignImportedStrategy = useTradingSettings(
    (s) => s.autoAssignImportedStrategy
  )
  const importedTradeStrategy = useTradingSettings(
    (s) => s.importedTradeStrategy
  )
  const { data: allTrades = [] } = useAllTradesQuery()
  const upsertAccount = useUpsertAccountFromImport()
  const bulkCreate = useBulkCreateTrades()
  const clearTrades = useClearTradesForAccount()

  const tradesCountForActive = activeAccountId
    ? allTrades.filter((t) => t.accountId === activeAccountId).length
    : 0

  const [htmlFile, setHtmlFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<Mt5Preview>(null)
  const [parsing, setParsing] = useState(false)
  const [importing, setImporting] = useState(false)
  const [syncMethod, setSyncMethod] = useState<'ea' | 'manual'>('ea')

  const apiEndpoint =
    import.meta.env.VITE_API_URL?.replace(/\/$/, '') ??
    'https://fuadfx-api.onrender.com'
  const eaPostUrl = `${apiEndpoint}/trades/bulk`
  const eaDownloadUrl = '/downloads/FuadFXTradeSyncEA.mq5'

  const reset = () => {
    setHtmlFile(null)
    setPreview(null)
    setParsing(false)
  }

  const copyText = async (label: string, value?: string | null) => {
    if (!value) {
      toast.error(`${label} is not available yet.`)
      return
    }

    try {
      await navigator.clipboard.writeText(value)
      toast.success(`${label} copied.`)
    } catch {
      toast.error(`Could not copy ${label.toLowerCase()}.`)
    }
  }

  const decodeMT5File = async (file: File): Promise<string> => {
    const buf = await file.arrayBuffer()
    const bytes = new Uint8Array(buf)
    if (bytes.length >= 2 && bytes[0] === 0xff && bytes[1] === 0xfe) {
      return new TextDecoder('utf-16le').decode(bytes.subarray(2))
    }
    if (bytes.length >= 2 && bytes[0] === 0xfe && bytes[1] === 0xff) {
      return new TextDecoder('utf-16be').decode(bytes.subarray(2))
    }
    if (
      bytes.length >= 3 &&
      bytes[0] === 0xef &&
      bytes[1] === 0xbb &&
      bytes[2] === 0xbf
    ) {
      return new TextDecoder('utf-8').decode(bytes.subarray(3))
    }
    if (bytes.length > 64) {
      let zeros = 0
      for (let i = 1; i < 64; i += 2) if (bytes[i] === 0) zeros++
      if (zeros > 24) return new TextDecoder('utf-16le').decode(bytes)
    }
    return new TextDecoder('utf-8').decode(bytes)
  }

  const handleHtml = async (file: File | null) => {
    setHtmlFile(file)
    setPreview(null)
    if (!file) return
    setParsing(true)
    try {
      const text = await decodeMT5File(file)
      const result = parseMT5Html(text, {
        strategy: autoAssignImportedStrategy
          ? (importedTradeStrategy as TradeStrategy)
          : 'Unassigned',
      })
      setPreview(result)
      if (result.trades.length === 0) {
        toast.warning(
          'No trades were found. Export the MT5 History or Detailed HTML report and try again.'
        )
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Could not read this HTML file.'
      )
    } finally {
      setParsing(false)
    }
  }

  const handleImportMt5 = async () => {
    if (!preview || preview.trades.length === 0) return
    setImporting(true)
    try {
      const account = await upsertAccount.mutateAsync({
        broker: preview.broker,
        number: preview.account,
        nameHint:
          preview.accountName ??
          (preview.account
            ? `${preview.broker ?? 'MT5'} ${preview.account}`
            : preview.broker),
        currency: preview.currency,
        startingBalance: preview.startingBalance,
      })
      setActiveAccount(account.id)

      const res = await bulkCreate.mutateAsync({
        trades: preview.trades,
        accountId: account.id,
      })

      if (res.added === 0 && res.duplicates > 0) {
        toast.message(
          `All ${res.duplicates} trades were already in "${account.name}". Switched to that account.`
        )
      } else if (res.duplicates > 0) {
        toast.success(
          `Imported ${res.added} into "${account.name}" (${res.duplicates} duplicate${res.duplicates === 1 ? '' : 's'} skipped).`
        )
      } else {
        toast.success(
          `Imported ${res.added} trade${res.added === 1 ? '' : 's'} into "${account.name}".`
        )
      }
      reset()
      onOpenChange(false)
      await onImported?.()
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Import failed. Please try again.'))
    } finally {
      setImporting(false)
    }
  }

  const handleClearActive = async () => {
    if (!activeAccountId) return
    try {
      const result = await clearTrades.mutateAsync(activeAccountId)
      toast.success(
        `Removed ${result.deleted} trade${result.deleted === 1 ? '' : 's'} from the current account.`
      )
    } catch {
      toast.error('Failed to clear trades.')
    }
  }

  const isBusy = parsing || importing || clearTrades.isPending

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        onOpenChange(val)
        if (!val) reset()
      }}
    >
      <DialogContent className='gap-3 sm:max-w-lg'>
        <DialogHeader className='text-start'>
          <DialogTitle>Connect MT5 Account</DialogTitle>
          <DialogDescription>
            Choose automatic EA sync for ongoing closed trades, or upload an
            MT5 HTML report for a one-time bulk import.
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={syncMethod}
          onValueChange={(value) => setSyncMethod(value as 'ea' | 'manual')}
          className='gap-3'
        >
          <TabsList className='grid w-full grid-cols-2'>
            <TabsTrigger value='ea'>
              <Bot className='size-4' />
              EA sync
            </TabsTrigger>
            <TabsTrigger value='manual'>
              <Upload className='size-4' />
              Manual upload
            </TabsTrigger>
          </TabsList>

          <TabsContent value='ea' className='space-y-3'>
            <div className='rounded-md border bg-muted/30 p-3 text-sm'>
              <div className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
                <div>
                  <div className='mb-2 flex items-center gap-2 font-medium'>
                    <CheckCircle2 className='size-4 text-emerald-600' />
                    Best for ongoing MT5 syncing
                  </div>
                  <p className='text-muted-foreground'>
                    Install the FUADFX Expert Advisor in MT5. It uploads closed
                    trades to your selected account and stores ticket history
                    locally so restarts do not duplicate trades.
                  </p>
                </div>
                <Button asChild size='sm'>
                  <a href={eaDownloadUrl} download>
                    <Download className='size-4' />
                    Download EA
                  </a>
                </Button>
              </div>
            </div>

            <div className='grid gap-2 rounded-md border p-3 text-sm'>
              <div className='flex items-center justify-between gap-3'>
                <div>
                  <div className='font-medium'>Selected account</div>
                  <div className='text-xs text-muted-foreground'>
                    {activeAccount
                      ? `${activeAccount.name} - ${activeAccount.broker || 'Broker not set'}`
                      : accounts.length
                        ? 'Select an account from the sidebar first.'
                        : 'Create an account before using EA sync.'}
                  </div>
                </div>
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  disabled={!activeAccount?.id}
                  onClick={() => copyText('Account ID', activeAccount?.id)}
                >
                  <Clipboard className='size-4' />
                  Copy ID
                </Button>
              </div>

              <div className='flex items-center justify-between gap-3 border-t pt-3'>
                <div className='min-w-0'>
                  <div className='flex items-center gap-2 font-medium'>
                    <Server className='size-4' />
                    API endpoint
                  </div>
                  <div className='truncate text-xs text-muted-foreground'>
                    {eaPostUrl}
                  </div>
                </div>
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  onClick={() => copyText('API endpoint', eaPostUrl)}
                >
                  <Clipboard className='size-4' />
                  Copy
                </Button>
              </div>

              <div className='flex items-center justify-between gap-3 border-t pt-3'>
                <div>
                  <div className='flex items-center gap-2 font-medium'>
                    <KeyRound className='size-4' />
                    Auth token
                  </div>
                  <div className='text-xs text-muted-foreground'>
                    Temporary session token until permanent EA API keys are
                    added.
                  </div>
                </div>
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  disabled={!accessToken}
                  onClick={() => copyText('Auth token', accessToken)}
                >
                  <Clipboard className='size-4' />
                  Copy token
                </Button>
              </div>
            </div>

            <div className='grid gap-2 rounded-md border bg-card p-3 text-xs leading-relaxed text-muted-foreground'>
              <div>
                1. Download <strong>FuadFXTradeSyncEA.mq5</strong> and compile
                it in MetaEditor.
              </div>
              <div>
                2. In MT5, allow WebRequest for{' '}
                <span className='font-medium text-foreground'>
                  {apiEndpoint}
                </span>
                .
              </div>
              <div>
                3. Paste the endpoint, auth token and account ID into the EA
                inputs, then attach it to any chart.
              </div>
              <div>
                4. Keep MT5 running on your PC or a Forex VPS. Render keeps the
                API online, but MT5 keeps the EA active.
              </div>
            </div>
          </TabsContent>

          <TabsContent value='manual' className='space-y-3'>
          <div className='rounded-md border bg-muted/30 p-3 text-xs leading-relaxed text-muted-foreground'>
            In MT5, open <strong>Toolbox - History</strong>, right-click and
            choose <strong>Report - HTML (Detailed)</strong>. Upload the saved
            .htm or .html file below to connect the account immediately.
          </div>

          <div className='grid gap-2'>
            <Label htmlFor='mt5-html'>MT5 statement (.htm or .html)</Label>
            <Input
              id='mt5-html'
              type='file'
              accept='.htm,.html,text/html'
              className='h-9 py-1.5'
              onChange={(e) => handleHtml(e.target.files?.[0] ?? null)}
            />
          </div>

          {parsing && (
            <div className='flex items-center gap-2 text-sm text-muted-foreground'>
              <Loader2 className='size-4 animate-spin' />
              Parsing your statement...
            </div>
          )}

          {!parsing && htmlFile && preview && (
            <div className='rounded-md border p-3 text-sm'>
              <div className='mb-2 flex items-center gap-2 font-medium'>
                <FileText className='size-4' />
                {htmlFile.name}
              </div>
              <div className='grid grid-cols-2 gap-y-1 text-xs text-muted-foreground'>
                <span>Rows scanned</span>
                <span className='text-end text-foreground tabular-nums'>
                  {preview.totalRows}
                </span>
                <span>Trades detected</span>
                <span className='text-end font-semibold text-emerald-600 tabular-nums'>
                  {preview.trades.length}
                </span>
                <span>Skipped rows</span>
                <span className='text-end text-foreground tabular-nums'>
                  {preview.skipped}
                </span>
                {preview.account && (
                  <>
                    <span>Account</span>
                    <span className='text-end text-foreground'>
                      {preview.account}
                    </span>
                  </>
                )}
                {preview.accountName && (
                  <>
                    <span>Name</span>
                    <span className='text-end text-foreground'>
                      {preview.accountName}
                    </span>
                  </>
                )}
                {preview.broker && (
                  <>
                    <span>Broker</span>
                    <span className='text-end text-foreground'>
                      {preview.broker}
                    </span>
                  </>
                )}
                {preview.currency && (
                  <>
                    <span>Currency</span>
                    <span className='text-end text-foreground'>
                      {preview.currency}
                    </span>
                  </>
                )}
                {preview.leverage && (
                  <>
                    <span>Leverage</span>
                    <span className='text-end text-foreground'>
                      {preview.leverage}
                    </span>
                  </>
                )}
                {preview.balance !== undefined && (
                  <>
                    <span>Statement balance</span>
                    <span className='text-end text-foreground tabular-nums'>
                      {preview.balance.toLocaleString(undefined, {
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </>
                )}
                {preview.startingBalance !== undefined && (
                  <>
                    <span>Derived starting balance</span>
                    <span className='text-end text-foreground tabular-nums'>
                      {preview.startingBalance.toLocaleString(undefined, {
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </>
                )}
                <span>Strategy</span>
                <span className='text-end text-foreground'>
                  {autoAssignImportedStrategy
                    ? importedTradeStrategy
                    : 'Unassigned'}
                </span>
              </div>

              {preview.trades.length > 0 && (
                <div className='mt-3 max-h-40 overflow-y-auto rounded border'>
                  <table className='w-full text-xs'>
                    <thead className='bg-muted text-muted-foreground'>
                      <tr>
                        <th className='px-2 py-1 text-start'>Pair</th>
                        <th className='px-2 py-1 text-start'>Side</th>
                        <th className='px-2 py-1 text-end'>Lots</th>
                        <th className='px-2 py-1 text-end'>P&L</th>
                        <th className='px-2 py-1 text-end'>Closed</th>
                      </tr>
                    </thead>
                    <tbody>
                      {preview.trades.slice(0, 6).map((t) => (
                        <tr key={t.id} className='border-t'>
                          <td className='px-2 py-1 font-medium'>{t.pair}</td>
                          <td className='px-2 py-1 capitalize'>
                            {t.direction}
                          </td>
                          <td className='px-2 py-1 text-end tabular-nums'>
                            {t.lotSize.toFixed(2)}
                          </td>
                          <td
                            className={
                              'px-2 py-1 text-end font-semibold tabular-nums ' +
                              (t.pnl >= 0 ? 'text-emerald-600' : 'text-red-600')
                            }
                          >
                            {t.pnl >= 0 ? '+' : ''}
                            {t.pnl.toFixed(2)}
                          </td>
                          <td className='px-2 py-1 text-end text-muted-foreground'>
                            {t.closedAt instanceof Date
                              ? t.closedAt.toISOString().slice(0, 10)
                              : String(t.closedAt).slice(0, 10)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {preview.trades.length > 6 && (
                    <div className='border-t bg-muted/30 px-2 py-1 text-center text-xs text-muted-foreground'>
                      + {preview.trades.length - 6} more
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          </TabsContent>
        </Tabs>

        <DialogFooter className='flex-row items-center justify-between gap-2 sm:justify-between'>
          {syncMethod === 'manual' ? (
            <Button
              type='button'
              variant='ghost'
              size='sm'
              disabled={
                !activeAccountId || tradesCountForActive === 0 || isBusy
              }
              onClick={handleClearActive}
              className='text-muted-foreground hover:text-destructive'
            >
              <Trash2 className='size-4' />
              Clear {tradesCountForActive > 0
                ? `(${tradesCountForActive})`
                : ''}{' '}
              in current
            </Button>
          ) : (
            <div />
          )}

          <div className='flex items-center gap-2'>
            <DialogClose asChild>
              <Button variant='outline' disabled={isBusy}>
                Close
              </Button>
            </DialogClose>
            {syncMethod === 'manual' && (
              <Button
                onClick={handleImportMt5}
                disabled={!preview || preview.trades.length === 0 || isBusy}
              >
                {importing ? (
                  <Loader2 className='size-4 animate-spin' />
                ) : (
                  <Upload className='size-4' />
                )}
                {importing
                  ? 'Importing...'
                  : `Import ${preview?.trades.length ?? 0} trades`}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
