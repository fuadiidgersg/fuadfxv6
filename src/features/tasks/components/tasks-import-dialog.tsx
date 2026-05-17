import { useState } from 'react'
import { CheckCircle2, FileText, Loader2, Trash2, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { parseMT5Html } from '@/lib/mt5-import'
import {
  useAccountsStore,
  useActiveAccount,
} from '@/stores/accounts-store'
import { useTradesStore } from '@/stores/trades-store'
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

type TaskImportDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type Mt5Preview = ReturnType<typeof parseMT5Html> | null

export function TasksImportDialog({
  open,
  onOpenChange,
}: TaskImportDialogProps) {
  const upsertFromImport = useAccountsStore((s) => s.upsertFromImport)
  const addTradesForAccount = useTradesStore((s) => s.addTradesForAccount)
  const clearTradesForAccount = useTradesStore((s) => s.clearTradesForAccount)
  const activeAccount = useActiveAccount()
  const tradesCountForActive = useTradesStore((s) =>
    activeAccount
      ? s.trades.filter((t) => t.accountId === activeAccount.id).length
      : 0
  )
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [htmlFile, setHtmlFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<Mt5Preview>(null)
  const [parsing, setParsing] = useState(false)
  const [tab, setTab] = useState<'mt5' | 'csv'>('mt5')

  const reset = () => {
    setCsvFile(null)
    setHtmlFile(null)
    setPreview(null)
    setParsing(false)
    setTab('mt5')
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
      if (zeros > 24) {
        return new TextDecoder('utf-16le').decode(bytes)
      }
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
      const result = parseMT5Html(text)
      setPreview(result)
      if (result.trades.length === 0) {
        toast.warning(
          'No trades were found in this HTML file. Make sure you exported the "Detailed Report" or "History" from MT5.'
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

  const handleImportMt5 = () => {
    if (!preview || preview.trades.length === 0) return
    const accountId = upsertFromImport({
      broker: preview.broker,
      number: preview.account,
      nameHint: preview.account
        ? `${preview.broker ?? 'MT5'} ${preview.account}`
        : preview.broker,
    })
    const accountName =
      useAccountsStore.getState().accounts.find((a) => a.id === accountId)
        ?.name ?? 'MT5 Import'
    const res = addTradesForAccount(accountId, accountName, preview.trades)
    if (res.added === 0 && res.duplicates > 0) {
      toast.message(
        `All ${res.duplicates} trades were already in "${accountName}".`
      )
    } else if (res.duplicates > 0) {
      toast.success(
        `Imported ${res.added} into "${accountName}" (${res.duplicates} duplicate${res.duplicates === 1 ? '' : 's'} skipped).`
      )
    } else {
      toast.success(
        `Imported ${res.added} trade${res.added === 1 ? '' : 's'} into "${accountName}".`
      )
    }
    reset()
    onOpenChange(false)
  }

  const handleImportCsv = () => {
    if (!csvFile) return
    toast.message(
      'CSV import isn\u2019t wired to a parser yet \u2014 use the MT5 HTML import for now.',
      { description: csvFile.name }
    )
    reset()
    onOpenChange(false)
  }

  const handleClearActive = () => {
    if (!activeAccount) return
    const removed = clearTradesForAccount(activeAccount.id)
    toast.success(
      `Removed ${removed} trade${removed === 1 ? '' : 's'} from "${activeAccount.name}".`
    )
  }

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
          <DialogTitle>Import Trades</DialogTitle>
          <DialogDescription>
            Bring in your trade history from MetaTrader 5 or a CSV statement.
            Trades are assigned to the account detected in the file (or the
            current account if none is detected).
          </DialogDescription>
        </DialogHeader>

        <Tabs value={tab} onValueChange={(v) => setTab(v as 'mt5' | 'csv')}>
          <TabsList className='grid w-full grid-cols-2'>
            <TabsTrigger value='mt5'>MT5 (HTML)</TabsTrigger>
            <TabsTrigger value='csv'>CSV</TabsTrigger>
          </TabsList>

          <TabsContent value='mt5' className='space-y-3 pt-3'>
            <div className='rounded-md border bg-muted/30 p-3 text-xs leading-relaxed text-muted-foreground'>
              In MT5, open <strong>Toolbox → History</strong>, right-click and
              choose <strong>Report → HTML (Detailed)</strong>. Drop the saved
              file below.
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
                  <span className='text-end tabular-nums text-foreground'>
                    {preview.totalRows}
                  </span>
                  <span>Trades detected</span>
                  <span className='text-end tabular-nums font-semibold text-emerald-600'>
                    {preview.trades.length}
                  </span>
                  <span>Skipped (non-trade rows)</span>
                  <span className='text-end tabular-nums text-foreground'>
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
                  {preview.broker && (
                    <>
                      <span>Broker</span>
                      <span className='text-end text-foreground'>
                        {preview.broker}
                      </span>
                    </>
                  )}
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
                                'px-2 py-1 text-end tabular-nums font-semibold ' +
                                (t.pnl >= 0
                                  ? 'text-emerald-600'
                                  : 'text-red-600')
                              }
                            >
                              {t.pnl >= 0 ? '+' : ''}
                              {t.pnl.toFixed(2)}
                            </td>
                            <td className='px-2 py-1 text-end text-muted-foreground'>
                              {t.closedAt.toISOString().slice(0, 10)}
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

          <TabsContent value='csv' className='space-y-3 pt-3'>
            <div className='grid gap-2'>
              <Label htmlFor='csv-file'>CSV statement</Label>
              <Input
                id='csv-file'
                type='file'
                accept='.csv,text/csv'
                className='h-9 py-1.5'
                onChange={(e) => setCsvFile(e.target.files?.[0] ?? null)}
              />
              {csvFile && (
                <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                  <CheckCircle2 className='size-4 text-emerald-500' />
                  {csvFile.name}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className='flex-row items-center justify-between gap-2 sm:justify-between'>
          <Button
            type='button'
            variant='ghost'
            size='sm'
            disabled={!activeAccount || tradesCountForActive === 0}
            onClick={handleClearActive}
            className='text-muted-foreground hover:text-destructive'
          >
            <Trash2 className='size-4' />
            Clear {tradesCountForActive > 0 ? `(${tradesCountForActive})` : ''}{' '}
            in current
          </Button>

          <div className='flex items-center gap-2'>
            <DialogClose asChild>
              <Button variant='outline'>Close</Button>
            </DialogClose>
            {tab === 'mt5' ? (
              <Button
                onClick={handleImportMt5}
                disabled={!preview || preview.trades.length === 0 || parsing}
              >
                <Upload className='size-4' />
                Import {preview?.trades.length ?? 0} trades
              </Button>
            ) : (
              <Button onClick={handleImportCsv} disabled={!csvFile}>
                <Upload className='size-4' />
                Import CSV
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
