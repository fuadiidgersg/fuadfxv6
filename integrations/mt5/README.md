# FUADFX MT5 Trade Sync EA

`FuadFXTradeSyncEA.ex5` is a compiled MetaTrader 5 Expert Advisor that syncs closed trade history to the FUADFX journal API. FUADFX downloads it with the selected account ID and EA key embedded in the filename, so users do not need to paste inputs manually. The source file, `FuadFXTradeSyncEA.mq5`, is kept in this folder for development.

## What It Syncs

Closed trades only in this first version:

- Symbol
- Volume
- Entry price
- Exit price
- Open time
- Close time
- Profit including commission and swap
- Commission
- Swap
- SL
- TP
- Account number
- Broker server
- Magic number
- MT5 position ID
- Entry/exit deal tickets
- Entry/exit order tickets

The current journal API stores the normal journal fields and keeps MT5 metadata in `notes` and `tags`. The EA also sends a nested `mt5` object so a future dedicated API endpoint can persist ticket IDs, commission, swap, and magic number into first-class columns.

## Setup

1. In FUADFX, open Trades > Connect MT5 > EA sync.

2. Select the trading account and download the account-specific EA.

3. In MT5, open:

   ```text
   File > Open Data Folder
   ```

4. Copy the downloaded `.ex5` file to:

   ```text
   MQL5/Experts/FUADFX/
   ```

5. In MT5, open:

   ```text
   Tools > Options > Expert Advisors
   ```

6. Enable:

   ```text
   Allow WebRequest for listed URL
   ```

7. Add your API host:

   ```text
   https://fuadfx-api.onrender.com
   ```

8. Attach the EA to any chart.

If you edit the source `.mq5` file, compile it in MetaEditor to produce a new `.ex5`.

## Inputs

- `InpApiUrl`: Optional override. The default API endpoint is used automatically.
- `InpBearerToken`: Optional override. Account-specific downloads read this from the filename.
- `InpAccountId`: Optional override. Account-specific downloads read this from the filename.
- `InpLookbackDays`: How far back to scan on first run.
- `InpSyncEverySeconds`: Timer interval.
- `InpBatchSize`: Max trades per upload.
- `InpSyncOpenPositionsLater`: Reserved for future open-position sync.

## Duplicate Protection

The EA stores sync state in the MT5 common files folder:

```text
FUADFX_MT5_Sync_<account>_<server>.csv
```

It stores:

- Last synced close time
- MT5 position IDs
- Deal ticket IDs
- Order ticket IDs

This prevents duplicate uploads after MT5 restarts. The current server also deduplicates imports by symbol, direction, open time, close time, and profit as a second layer.

## Notes

MT5 WebRequest cannot call arbitrary URLs until the host is allowlisted in terminal settings. If uploads fail with `MT5 error=4014`, the URL is usually missing from the allowlist.
