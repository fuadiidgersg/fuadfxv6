# FUADFX MT5 Trade Sync EA

`FuadFXTradeSyncEA.mq5` is a MetaTrader 5 Expert Advisor that syncs closed trade history to the FUADFX journal API.

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

1. Copy `FuadFXTradeSyncEA.mq5` to:

   ```text
   MQL5/Experts/FUADFX/FuadFXTradeSyncEA.mq5
   ```

2. Compile it in MetaEditor.

3. In MT5, open:

   ```text
   Tools > Options > Expert Advisors
   ```

4. Enable:

   ```text
   Allow WebRequest for listed URL
   ```

5. Add your API host, for example:

   ```text
   https://fuadfx-api.onrender.com
   ```

6. In FUADFX, open Trades > Connect MT5 > EA sync.

7. Generate an EA API key for the selected account.

8. Paste the API endpoint, account ID and EA API key into the EA inputs.

9. Attach the EA to any chart.

## Inputs

- `InpApiUrl`: API endpoint. Use `https://fuadfx-api.onrender.com/trades/bulk` for the current API.
- `InpBearerToken`: FUADFX EA API key generated from the Connect MT5 dialog.
- `InpAccountId`: FUADFX account UUID to receive the trades.
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
