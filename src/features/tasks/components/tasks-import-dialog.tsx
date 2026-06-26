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

  const apiEndpoint =
    import.meta.env.VITE_API_URL?.replace(/\/$/, '') ??
    'https://fuadfx-api.onrender.com'
  const eaDownloadUrl = '/downloads/FuadFXTradeSyncEA.ex5'

  const reset = () => {
    setHtmlFile(null)
    setPreview(null)
    setParsing(false)
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

  const psString = (value: string | number | undefined | null) =>
    `'${String(value ?? '').replace(/'/g, "''")}'`

  const installerFileName = () => {
    const number = activeAccount?.number?.replace(/[^a-zA-Z0-9_-]/g, '')
    return `FUADFX-MT5-Installer${number ? `-${number}` : ''}.cmd`
  }

  const toPowerShellEncodedCommand = (script: string) => {
    let binary = ''
    for (let i = 0; i < script.length; i++) {
      const code = script.charCodeAt(i)
      binary += String.fromCharCode(code & 0xff, code >> 8)
    }
    return btoa(binary)
  }

  const buildPowerShellInstaller = (token: string) => {
    const origin =
      typeof window !== 'undefined'
        ? window.location.origin
        : 'https://fuadfx.vercel.app'
    const eaUrl = `${origin.replace(/\/$/, '')}${eaDownloadUrl}`
    const apiUrl = `${apiEndpoint}/trades/bulk`

    return `$ErrorActionPreference = 'Stop'

$ApiUrl = ${psString(apiUrl)}
$BearerToken = ${psString(token)}
$AccountId = ${psString(activeAccount?.id)}
$AccountNumber = ${psString(activeAccount?.number)}
$BrokerServer = ${psString(activeAccount?.broker)}
$EaUrl = ${psString(eaUrl)}
$EaName = 'FuadFXTradeSyncEA.ex5'
$WebRequestUrl = ${psString(apiEndpoint)}

function Write-Step($Message) {
  Write-Host "[FUADFX] $Message" -ForegroundColor Cyan
}

function Get-SafeName($Value) {
  if ([string]::IsNullOrWhiteSpace($Value)) { return '' }
  return ($Value -replace '[\\\\/:*?"<>|\\s]+', '_')
}

$terminalRoot = Join-Path $env:APPDATA 'MetaQuotes\\Terminal'
$commonFiles = Join-Path $terminalRoot 'Common\\Files'
New-Item -ItemType Directory -Force -Path $commonFiles | Out-Null

$config = @"
api_url=$ApiUrl
bearer_token=$BearerToken
account_id=$AccountId
lookback_days=365
sync_every_seconds=60
batch_size=50
sync_on_init=true
debug_logs=true
sync_open_positions_later=false
"@

$defaultConfigPath = Join-Path $commonFiles 'FUADFX_MT5_Sync_Config.ini'
Set-Content -Path $defaultConfigPath -Value $config -Encoding ASCII
Write-Step "Wrote account sync config."

$safeServer = Get-SafeName $BrokerServer
if (-not [string]::IsNullOrWhiteSpace($AccountNumber) -and -not [string]::IsNullOrWhiteSpace($safeServer)) {
  $accountConfigPath = Join-Path $commonFiles ('FUADFX_MT5_Sync_' + $AccountNumber + '_' + $safeServer + '.ini')
  Set-Content -Path $accountConfigPath -Value $config -Encoding ASCII
}

if (-not (Test-Path $terminalRoot)) {
  throw "MetaTrader data folder was not found at $terminalRoot. Open MT5 once, then run this installer again."
}

$terminals = @(Get-ChildItem -Path $terminalRoot -Directory |
  Where-Object { Test-Path (Join-Path $_.FullName 'MQL5') } |
  Sort-Object LastWriteTime -Descending)

if (-not $terminals) {
  throw "No MT5 terminal folders were found. Open MT5 once, then run this installer again."
}

function Get-TerminalInstallInfo($Terminal) {
  $originPath = Join-Path $Terminal.FullName 'origin.txt'
  $installPath = ''
  if (Test-Path $originPath) {
    $installPath = (Get-Content $originPath -ErrorAction SilentlyContinue | Select-Object -First 1)
  }
  if ([string]::IsNullOrWhiteSpace($installPath)) {
    $installPath = $Terminal.FullName
  }

  $exePath = ''
  foreach ($candidate in @(
    (Join-Path $installPath 'terminal64.exe'),
    (Join-Path $installPath 'terminal.exe')
  )) {
    if (Test-Path $candidate) {
      $exePath = $candidate
      break
    }
  }

  $displayName = Split-Path $installPath -Leaf
  if ([string]::IsNullOrWhiteSpace($displayName)) {
    $displayName = 'MetaTrader 5'
  }

  [pscustomobject]@{
    Terminal = $Terminal
    Name = $displayName
    InstallPath = $installPath
    DataPath = $Terminal.FullName
    ExePath = $exePath
    LastUsed = $Terminal.LastWriteTime
  }
}

function Show-TerminalPicker($Items) {
  Add-Type -AssemblyName System.Windows.Forms
  Add-Type -AssemblyName System.Drawing
  [System.Windows.Forms.Application]::EnableVisualStyles()

  $form = New-Object System.Windows.Forms.Form
  $form.Text = 'Choose MetaTrader 5 installation'
  $form.StartPosition = 'CenterScreen'
  $form.Width = 780
  $form.Height = 460
  $form.FormBorderStyle = 'FixedDialog'
  $form.MaximizeBox = $false
  $form.MinimizeBox = $false

  $label = New-Object System.Windows.Forms.Label
  $label.Text = 'Select where FUADFX should install the MT5 sync EA.'
  $label.AutoSize = $true
  $label.Left = 16
  $label.Top = 16
  $label.Font = New-Object System.Drawing.Font($label.Font.FontFamily, 10, [System.Drawing.FontStyle]::Bold)
  $form.Controls.Add($label)

  $hint = New-Object System.Windows.Forms.Label
  $hint.Text = 'You can select one or more MT5 installations.'
  $hint.AutoSize = $true
  $hint.Left = 16
  $hint.Top = 42
  $hint.ForeColor = [System.Drawing.Color]::DimGray
  $form.Controls.Add($hint)

  $imageList = New-Object System.Windows.Forms.ImageList
  $imageList.ImageSize = New-Object System.Drawing.Size(24, 24)
  $imageList.ColorDepth = [System.Windows.Forms.ColorDepth]::Depth32Bit

  $list = New-Object System.Windows.Forms.ListView
  $list.Left = 16
  $list.Top = 72
  $list.Width = 730
  $list.Height = 280
  $list.View = [System.Windows.Forms.View]::Details
  $list.CheckBoxes = $true
  $list.FullRowSelect = $true
  $list.HideSelection = $false
  $list.SmallImageList = $imageList
  [void]$list.Columns.Add('MT5', 190)
  [void]$list.Columns.Add('Install folder', 265)
  [void]$list.Columns.Add('Last used', 120)
  [void]$list.Columns.Add('Data folder', 520)

  for ($i = 0; $i -lt @($Items).Count; $i++) {
    $info = $Items[$i]
    if (-not [string]::IsNullOrWhiteSpace($info.ExePath)) {
      try {
        $icon = [System.Drawing.Icon]::ExtractAssociatedIcon($info.ExePath)
        if ($icon) {
          [void]$imageList.Images.Add($icon)
        } else {
          [void]$imageList.Images.Add([System.Drawing.SystemIcons]::Application)
        }
      } catch {
        [void]$imageList.Images.Add([System.Drawing.SystemIcons]::Application)
      }
    } else {
      [void]$imageList.Images.Add([System.Drawing.SystemIcons]::Application)
    }

    $row = New-Object System.Windows.Forms.ListViewItem($info.Name, $i)
    $row.Tag = $info
    [void]$row.SubItems.Add($info.InstallPath)
    [void]$row.SubItems.Add($info.LastUsed.ToString('yyyy-MM-dd HH:mm'))
    [void]$row.SubItems.Add($info.DataPath)
    [void]$list.Items.Add($row)
  }

  if ($list.Items.Count -gt 0) {
    $list.Items[0].Checked = $true
  }
  $form.Controls.Add($list)

  $selectAll = New-Object System.Windows.Forms.Button
  $selectAll.Text = 'Select all'
  $selectAll.Left = 16
  $selectAll.Top = 366
  $selectAll.Width = 90
  $selectAll.Add_Click({
    foreach ($item in $list.Items) {
      $item.Checked = $true
    }
  })
  $form.Controls.Add($selectAll)

  $install = New-Object System.Windows.Forms.Button
  $install.Text = 'Install'
  $install.Left = 556
  $install.Top = 366
  $install.Width = 90
  $install.DialogResult = [System.Windows.Forms.DialogResult]::OK
  $form.AcceptButton = $install
  $form.Controls.Add($install)

  $cancel = New-Object System.Windows.Forms.Button
  $cancel.Text = 'Cancel'
  $cancel.Left = 656
  $cancel.Top = 366
  $cancel.Width = 90
  $cancel.DialogResult = [System.Windows.Forms.DialogResult]::Cancel
  $form.CancelButton = $cancel
  $form.Controls.Add($cancel)

  $result = $form.ShowDialog()
  if ($result -ne [System.Windows.Forms.DialogResult]::OK) {
    return @()
  }

  $selected = @()
  foreach ($item in $list.CheckedItems) {
    $selected += $item.Tag.Terminal
  }
  return $selected
}

$terminalInfos = @($terminals | ForEach-Object { Get-TerminalInstallInfo $_ })
$selectedTerminals = @()
if (@($terminals).Count -eq 1) {
  $selectedTerminals = @($terminalInfos[0].Terminal)
  Write-Step "Found one MT5 terminal: $($terminalInfos[0].InstallPath)"
} else {
  $selectedTerminals = @(Show-TerminalPicker $terminalInfos)

  if (-not $selectedTerminals) {
    throw 'No MT5 terminal selected.'
  }
}

$tempEa = Join-Path $env:TEMP $EaName
Write-Step "Downloading the FUADFX MT5 Expert Advisor."
Invoke-WebRequest -Uri $EaUrl -OutFile $tempEa -UseBasicParsing

foreach ($terminal in $selectedTerminals) {
  $experts = Join-Path $terminal.FullName 'MQL5\\Experts\\FUADFX'
  New-Item -ItemType Directory -Force -Path $experts | Out-Null
  Copy-Item -Path $tempEa -Destination (Join-Path $experts $EaName) -Force
  Write-Step "Installed EA into $experts"
}

$readme = @"
FUADFX MT5 Sync installed.

Required MT5 security step:
1. Open MT5.
2. Go to Tools > Options > Expert Advisors.
3. Enable "Allow WebRequest for listed URL".
4. Add this URL exactly:
   $WebRequestUrl
5. Restart MT5 if it was open, then attach FUADFX\\FuadFXTradeSyncEA to any chart.

The EA is already bound to this FUADFX account:
$AccountId
"@

$readmePath = Join-Path ([Environment]::GetFolderPath('Desktop')) 'FUADFX MT5 Sync Setup.txt'
Set-Content -Path $readmePath -Value $readme -Encoding UTF8
Set-Clipboard -Value $WebRequestUrl

Write-Host ''
Write-Host 'FUADFX MT5 Sync is installed.' -ForegroundColor Green
Write-Host "The WebRequest URL has been copied to your clipboard: $WebRequestUrl" -ForegroundColor Yellow
Write-Host "Setup notes saved to: $readmePath"
Write-Host ''
Read-Host 'Press Enter to close'
`
  }

  const buildWindowsInstaller = (token: string) => {
    const encoded = toPowerShellEncodedCommand(buildPowerShellInstaller(token))
    return `@echo off
title FUADFX MT5 Sync Installer
powershell.exe -NoProfile -ExecutionPolicy Bypass -EncodedCommand ${encoded}
if errorlevel 1 (
  echo.
  echo FUADFX installer failed. Please send the error above to support.
  pause
)
`
  }

  const handleDownloadInstaller = async () => {
    if (!activeAccount?.id) {
      toast.error('Create or select an account before downloading the installer.')
      return
    }

    try {
      const key = await createApiKey.mutateAsync({
        accountId: activeAccount.id,
        name: `${activeAccount.name} MT5 installer`,
      })
      downloadBlob(
        installerFileName(),
        new Blob([buildWindowsInstaller(key.token)], {
          type: 'application/x-msdownload;charset=utf-8',
        })
      )
      toast.success('Account-specific Windows installer downloaded.')
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
          <DialogTitle>Fill Journal From MT5</DialogTitle>
          <DialogDescription>
            Sync closed trades with the FUADFX EA, or upload an MT5 detailed
            report when you want a quick historical import.
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
                  <div className='font-medium'>Account-specific MT5 sync</div>
                  <div className='text-xs text-muted-foreground'>
                    {activeAccount
                      ? `Journal: ${activeAccount.name}`
                      : 'Select or create an account first.'}
                  </div>
                </div>
                <div className='flex flex-wrap gap-2'>
                  <Button asChild size='sm' variant='outline'>
                    <a href={eaDownloadUrl} download>
                      <Download className='size-4' />
                      Raw EA
                    </a>
                  </Button>
                  <Button
                    type='button'
                    size='sm'
                    disabled={!activeAccount?.id || createApiKey.isPending}
                    onClick={handleDownloadInstaller}
                  >
                    {createApiKey.isPending ? (
                      <Loader2 className='size-4 animate-spin' />
                    ) : (
                      <Download className='size-4' />
                    )}
                    Windows installer
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
                      Active sync keys
                    </div>
                    <div className='text-xs text-muted-foreground'>
                      Each installer is bound to this journal account.
                    </div>
                  </div>
                </div>

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
              <div>1. Download and run the Windows installer.</div>
              <div>2. Allow WebRequest for {apiEndpoint} in MT5.</div>
              <div>3. Attach FUADFX/FuadFXTradeSyncEA to any chart.</div>
            </div>
          </TabsContent>

          <TabsContent value='manual' className='space-y-3'>
          <div className='rounded-md border bg-muted/30 p-3 text-xs leading-relaxed text-muted-foreground'>
            In MT5, open <strong>Toolbox - History</strong>, right-click and
            choose <strong>Report - HTML (Detailed)</strong>. Upload the saved
            .htm or .html file to fill the journal immediately.
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
