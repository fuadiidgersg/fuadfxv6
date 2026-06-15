import { useState } from 'react'
import {
  Bot,
  Download,
  FileText,
  KeyRound,
  Loader2,
  Trash2,
  Upload,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAccountsStore } from '@/stores/accounts-store'
import { useTradingSettings } from '@/stores/trading-settings-store'
import { getApiErrorMessage } from '@/lib/api'
import { parseMT5Html } from '@/lib/mt5-import'
import {
  useApiKeysQuery,
  useCreateApiKey,
  useRevokeApiKey,
} from '@/hooks/use-api-keys-query'
import {
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
  const activeAccount = useActiveAccount()
  const {
    data: apiKeys = [],
    isLoading: apiKeysLoading,
    isError: apiKeysFailed,
    error: apiKeysError,
  } = useApiKeysQuery(activeAccount?.id)
  const createApiKey = useCreateApiKey()
  const revokeApiKey = useRevokeApiKey()
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
  const [newApiToken, setNewApiToken] = useState('')

  const apiEndpoint =
    import.meta.env.VITE_API_URL?.replace(/\/$/, '') ??
    'https://fuadfx-api.onrender.com'
  const eaPostUrl = `${apiEndpoint}/trades/bulk`
  const eaDownloadUrl = '/downloads/FuadFXTradeSyncEA.ex5'

  const reset = () => {
    setHtmlFile(null)
    setPreview(null)
    setParsing(false)
  }

  const downloadText = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    downloadBlob(filename, blob)
  }

  const downloadBlob = (filename: string, blob: Blob) => {
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  }

  const crcTable = (() => {
    const table = new Uint32Array(256)
    for (let i = 0; i < 256; i++) {
      let c = i
      for (let j = 0; j < 8; j++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
      table[i] = c >>> 0
    }
    return table
  })()

  const crc32 = (bytes: Uint8Array) => {
    let crc = 0xffffffff
    for (const byte of bytes) crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8)
    return (crc ^ 0xffffffff) >>> 0
  }

  const zipBytes = (files: { name: string; data: Uint8Array }[]) => {
    const encoder = new TextEncoder()
    const chunks: Uint8Array[] = []
    const central: Uint8Array[] = []
    let offset = 0
    const now = new Date()
    const dosTime =
      (now.getHours() << 11) | (now.getMinutes() << 5) | Math.floor(now.getSeconds() / 2)
    const dosDate =
      ((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate()

    const header = (size: number, signature: number) => {
      const bytes = new Uint8Array(size)
      new DataView(bytes.buffer).setUint32(0, signature, true)
      return { bytes, view: new DataView(bytes.buffer) }
    }

    for (const file of files) {
      const name = encoder.encode(file.name)
      const crc = crc32(file.data)
      const local = header(30 + name.length, 0x04034b50)
      local.view.setUint16(4, 20, true)
      local.view.setUint16(10, dosTime, true)
      local.view.setUint16(12, dosDate, true)
      local.view.setUint32(14, crc, true)
      local.view.setUint32(18, file.data.length, true)
      local.view.setUint32(22, file.data.length, true)
      local.view.setUint16(26, name.length, true)
      local.bytes.set(name, 30)
      chunks.push(local.bytes, file.data)

      const dir = header(46 + name.length, 0x02014b50)
      dir.view.setUint16(4, 20, true)
      dir.view.setUint16(6, 20, true)
      dir.view.setUint16(12, dosTime, true)
      dir.view.setUint16(14, dosDate, true)
      dir.view.setUint32(16, crc, true)
      dir.view.setUint32(20, file.data.length, true)
      dir.view.setUint32(24, file.data.length, true)
      dir.view.setUint16(28, name.length, true)
      dir.view.setUint32(42, offset, true)
      dir.bytes.set(name, 46)
      central.push(dir.bytes)
      offset += local.bytes.length + file.data.length
    }

    const centralOffset = offset
    const centralSize = central.reduce((sum, chunk) => sum + chunk.length, 0)
    const end = header(22, 0x06054b50)
    end.view.setUint16(8, files.length, true)
    end.view.setUint16(10, files.length, true)
    end.view.setUint32(12, centralSize, true)
    end.view.setUint32(16, centralOffset, true)
    chunks.push(...central, end.bytes)
    return new Blob(
      chunks.map((chunk) => {
        const copy = new Uint8Array(chunk.byteLength)
        copy.set(chunk)
        return copy.buffer
      }),
      { type: 'application/zip' }
    )
  }

  const buildEaPreset = (token: string) =>
    [
      `InpApiUrl=${eaPostUrl}`,
      `InpBearerToken=${token}`,
      `InpAccountId=${activeAccount?.id ?? ''}`,
      'InpLookbackDays=30',
      'InpSyncEverySeconds=60',
      'InpBatchSize=50',
      'InpSyncOnInit=true',
      'InpDebugLogs=true',
      'InpSyncOpenPositionsLater=false',
      '',
    ].join('\r\n')

  const accountFileSlug = () =>
    (activeAccount?.name ?? 'FUADFX')
      .replace(/[^a-z0-9]+/gi, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40) || 'FUADFX'

  const downloadEaPreset = (token: string) => {
    downloadText(`FuadFXTradeSyncEA-${accountFileSlug()}.set`, buildEaPreset(token))
    toast.success('MT5 setup file downloaded.')
  }

  const handleDownloadConfiguredPackage = async () => {
    if (!activeAccount?.id) {
      toast.error('Create or select an account before downloading the package.')
      return
    }

    try {
      const key = await createApiKey.mutateAsync({
        accountId: activeAccount.id,
        name: `${activeAccount.name} MT5 EA`,
      })
      setNewApiToken(key.token)
      const eaResponse = await fetch(eaDownloadUrl)
      if (!eaResponse.ok) throw new Error('Could not download the EA file.')
      const eaBytes = new Uint8Array(await eaResponse.arrayBuffer())
      const setBytes = new TextEncoder().encode(buildEaPreset(key.token))
      const slug = accountFileSlug()
      const zip = zipBytes([
        { name: 'FuadFXTradeSyncEA.ex5', data: eaBytes },
        { name: `FuadFXTradeSyncEA-${slug}.set`, data: setBytes },
      ])
      downloadBlob(`FuadFX-${slug}-MT5-EA.zip`, zip)
      toast.success('Account-specific EA package downloaded.')
    } catch (err) {
      toast.error(keyErrorMessage(err))
    }
  }

  const keyErrorMessage = (err: unknown) => {
    const message = getApiErrorMessage(err, 'Could not generate EA API key.')
    if (
      message.toLowerCase().includes('api_keys') ||
      message.toLowerCase().includes('schema cache')
    ) {
      return 'EA keys are not installed in Supabase yet. Run migration v4 first.'
    }
    return message
  }

  const handleRevokeEaKey = async (key: (typeof apiKeys)[number]) => {
    try {
      await revokeApiKey.mutateAsync(key)
      if (newApiToken.endsWith(key.last4)) setNewApiToken('')
      toast.success('EA API key revoked.')
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Could not revoke EA API key.'))
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
            <div className='grid gap-2 rounded-md border p-3 text-sm'>
              <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
                <div>
                  <div className='font-medium'>Account-specific MT5 EA</div>
                  <div className='text-xs text-muted-foreground'>
                    {activeAccount
                      ? `Bound to: ${activeAccount.name}`
                      : 'Select or create an account first.'}
                  </div>
                </div>
                <div className='flex flex-wrap gap-2'>
                  <Button asChild size='sm' variant='outline'>
                    <a href={eaDownloadUrl} download>
                      <Download className='size-4' />
                      Download EA
                    </a>
                  </Button>
                  <Button
                    type='button'
                    size='sm'
                    disabled={!activeAccount?.id || createApiKey.isPending}
                    onClick={handleDownloadConfiguredPackage}
                  >
                    {createApiKey.isPending ? (
                      <Loader2 className='size-4 animate-spin' />
                    ) : (
                      <Download className='size-4' />
                    )}
                    Download account EA
                  </Button>
                </div>
              </div>
            </div>

            <div className='grid gap-2 rounded-md border p-3 text-sm'>
              <div className='grid gap-3'>
                <div className='flex items-center justify-between gap-3'>
                  <div>
                    <div className='flex items-center gap-2 font-medium'>
                      <KeyRound className='size-4' />
                      Active EA keys
                    </div>
                    <div className='text-xs text-muted-foreground'>
                      Generate a new setup file if you need to reconnect MT5.
                    </div>
                  </div>
                </div>

                {newApiToken && (
                  <div className='rounded-md border bg-muted/30 p-2'>
                    <div className='mb-1 text-xs font-medium text-foreground'>
                      Account EA package generated. The key is shown once.
                    </div>
                    <div className='flex items-center gap-2'>
                      <code className='min-w-0 flex-1 truncate rounded bg-background px-2 py-1 text-xs'>
                        {newApiToken}
                      </code>
                      <Button
                        type='button'
                        variant='outline'
                        size='sm'
                        onClick={() => downloadEaPreset(newApiToken)}
                      >
                        <Download className='size-4' />
                        Setup
                      </Button>
                    </div>
                  </div>
                )}

                <div className='grid gap-2'>
                  {apiKeysFailed && (
                    <div className='text-xs text-destructive'>
                      {keyErrorMessage(apiKeysError)}
                    </div>
                  )}
                  {!apiKeysFailed && apiKeysLoading && (
                    <div className='flex items-center gap-2 text-xs text-muted-foreground'>
                      <Loader2 className='size-3 animate-spin' />
                      Loading active EA keys...
                    </div>
                  )}
                  {!apiKeysFailed && !apiKeysLoading && apiKeys.length === 0 && (
                    <div className='text-xs text-muted-foreground'>
                      No active EA key for this account yet.
                    </div>
                  )}
                  {apiKeys.map((key) => (
                    <div
                      key={key.id}
                      className='flex items-center justify-between gap-2 rounded-md border px-2 py-1.5 text-xs'
                    >
                      <div className='min-w-0'>
                        <div className='truncate font-medium'>{key.name}</div>
                        <div className='text-muted-foreground'>
                          Ends {key.last4}
                          {key.lastUsedAt
                            ? ` - last used ${new Date(key.lastUsedAt).toLocaleDateString()}`
                            : ' - never used'}
                        </div>
                      </div>
                      <Button
                        type='button'
                        variant='ghost'
                        size='sm'
                        disabled={revokeApiKey.isPending}
                        onClick={() => handleRevokeEaKey(key)}
                        className='text-muted-foreground hover:text-destructive'
                      >
                        Revoke
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className='grid gap-1.5 rounded-md border bg-card p-3 text-xs text-muted-foreground'>
              <div>1. Copy the EA to MQL5/Experts/FUADFX.</div>
              <div>2. Load FuadFXTradeSyncEA.set in the EA inputs.</div>
              <div>3. Allow WebRequest for {apiEndpoint}.</div>
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
