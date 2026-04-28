# Fuadfx

A trading journal app for forex traders, built on a Shadcn admin dashboard chassis.

## Stack
- **Framework**: React 19 + Vite 8
- **Routing**: TanStack Router (file-based, with autoCodeSplitting)
- **Data**: TanStack Query, Zustand
- **UI**: Shadcn UI (Radix primitives) + Tailwind CSS v4
- **Charts**: Recharts
- **Forms/Validation**: react-hook-form + zod
- **Mock data**: `@faker-js/faker` (180 seeded trades)
- **Auth (optional)**: Clerk (`@clerk/react`) — enabled only if `VITE_CLERK_PUBLISHABLE_KEY` is set; otherwise the `/clerk` route shows a guidance page.
- **Language**: TypeScript
- **Package manager**: pnpm

## Pages
| Route | Feature folder | What it does |
| --- | --- | --- |
| `/` | `features/dashboard` | KPI cards, equity curve, recent trades, monthly P&L, risk snapshot, analytics tab |
| `/tasks` | `features/tasks` | Trade Journal — full CRUD table with filters by symbol/side/strategy/status, KPIs, log-trade drawer, CSV import dialog |
| `/analytics` | `features/analytics` | Deep analytics — equity curve, P&L by pair/session/day, win/loss pie, strategy table |
| `/calendar` | `features/calendar` | Month-view P&L heatmap with daily and weekly aggregates |
| `/apps` | `features/apps` | Strategy Playbook — card grid of trading strategies you toggle active/inactive |
| `/users` | `features/accounts` | Trading Accounts — broker/prop accounts with equity, balance, P&L |
| `/chats` | `features/chats` | Journal Notes — per-account journal entries (title, body, mood, tags) with editor + searchable list |
| `/news` | `features/news` | Economic News calendar with high/medium/low impact filters |
| `/settings/*` | `features/settings` | Profile, account, appearance, notifications, display |
| `/onboarding` | `features/onboarding` | 3-step new-user onboarding (profile → MT5 HTML import → finish). Sign-up redirects here. |

The legacy `/users` and `/apps` URLs are kept for routing simplicity but are rebranded as Accounts and Strategies in the UI.

## Trade data model
Located in `src/features/trades/data/`:
- `schema.ts` — `Trade` zod schema (pair, direction, entry/exit, SL/TP, lot size, P&L, pips, R-multiple, strategy, session, status, dates, account, tags, notes, plus optional timeframe, emotion, mistakes, lessons, riskAmount, screenshotUrl)
- `trades.ts` — 180 deterministically-seeded faker trades
- `stats.ts` — helpers: `computeStats`, `equityCurve`, `dailyPnl`, `groupByPair/Strategy/Session/DayOfWeek`

### Trade & accounts stores
- `src/stores/accounts-store.ts` — persisted Zustand store of `TradingAccount[]` (`{ id, name, broker, number, type, currency, startingBalance, createdAt, isArchived? }`) plus `activeAccountId`. Exposes `addAccount`, `upsertFromImport` (matches an existing account by `broker + number`, otherwise creates one and sets it active — the de-dupe path for re-uploading the same MT5 statement), `setActive`, `rename`, `setArchived`, `remove`, plus the `useActiveAccount()` selector hook. Persists under `fuadfx-accounts`.
- `src/stores/trades-store.ts` — persisted store of all real trades. `addTradesForAccount(accountId, accountName, trades)` writes trades stamped with `accountId` (plus the readable `account` name) and de-duplicates by trade `id` per account. `clearTradesForAccount(id)` and `removeAccount(id)` wipe trades for one account. `useTrades()` hook returns trades for the active account only — strict TradeZella-style isolation. If `accounts.length === 0`, the hook falls back to the demo seed trades so the dashboard is never empty pre-onboarding; the moment any account exists, seeds are dropped. Persisted under `fuadfx-trades` (v2; legacy v1 `imported` data is dropped on migration since it had no account attribution).

### Auth & account UX
- `_authenticated` route has a `beforeLoad` guard that reads the `accessToken` cookie via `useAuthStore.getState()` and `throw redirect({ to: '/sign-in', search: { redirect: location.href } })` when missing. The sign-in page already honors the `redirect` search param.
- `src/components/layout/account-switcher.tsx` is the sidebar header dropdown (replaces the old static `team-switcher.tsx`). Lists active accounts with type icon (Live=Wallet, Prop=CandlestickChart, Demo=LineChart), a dot marker for the active one, an Archived section, and an "Add account" item that opens a `CreateAccountDialog` (also reused from the Accounts page's "Add Account" button).
- `src/features/accounts/index.tsx` is fully live-data-driven: cards show real per-account `tradeCount`, `pnl`, and `equity` (= `startingBalance + pnl`) from the trades store. Each card has a 3-dot menu with Set active / Rename / Archive / Clear trades / Delete account (delete also removes that account's trades). Empty state prompts "Add your first account".
- Onboarding step 2 and the trade-journal MT5 import dialog both call `upsertFromImport({ broker, number })` so the parsed broker/account from the MT5 HTML auto-creates (or finds) the right account, then add the trades to it via `addTradesForAccount`.

### Journal store
`src/stores/journal-store.ts` — persisted Zustand store of `JournalNote[]` (`{ id, accountId, title, body, mood: great|good|neutral|frustrated|tilted, tags, createdAt, updatedAt }`). `useNotesForActiveAccount()` filters by `activeAccountId`. Actions: `addNote`, `updateNote`, `removeNote`, `removeNotesForAccount` (called when an account is deleted on the Trading Accounts page so its notes are wiped too). Persisted under `fuadfx-journal`.

### Analytics page
`src/features/analytics/index.tsx` shows: 8 KPI tiles (Net P&L, Profit Factor, Expectancy, Avg R + Max Drawdown $/%, Best/Worst trade, Longest streaks, Avg hold time), Equity Curve (line), Drawdown (red area chart), P&L by Pair / Session / Day of Week / Hour of Day (bar charts), Win/Loss pie, R-Multiple distribution, Long vs Short tiles with win-rate bars, Lot Size distribution, Trade Volume by Month, Monthly P&L, Risk Snapshot (avg win/loss, expectancy, open positions, total pips, win/loss streaks, hold time), and a Strategy Performance table. Stats helpers live in `src/features/trades/data/stats.ts` (`drawdownSeries`, `groupByDirection`, `groupByHour`, `rMultipleDistribution`, `holdTimeStats`, `lotSizeDistribution`, `tradesByMonth`).

### MT5 import
`src/lib/mt5-import.ts` parses MetaTrader 5 "Detailed Report" HTML exports. The import dialog (`tasks-import-dialog.tsx`) accepts `.htm`/`.html` files, shows a parsed preview (rows scanned, trades detected, account, broker, sample table) and writes them into the trades store. Symbol normalization handles broker suffixes and metals (XAUUSD, XAGUSD).

## Project layout
- `src/`
  - `routes/_authenticated/` — TanStack Router file routes (`routeTree.gen.ts` is generated)
  - `features/{dashboard,tasks,analytics,calendar,apps,accounts,chats,news,settings,...}`
  - `components/`, `context/`, `hooks/`, `stores/`, `lib/`, `config/`, `styles/`
- `public/` — static assets
- `vite.config.ts` — Vite + Tailwind + TanStack Router plugin config

## Replit setup
- **Workflow**: `Start application` runs `pnpm dev` on port `5000` (webview).
- **Vite dev server**: bound to `0.0.0.0:5000` with `allowedHosts: true` so the Replit iframe proxy can reach it. `.local/`, `.git/`, and `node_modules/` are excluded from the file watcher.
- **Deployment**: configured as `static` — build with `pnpm run build`, publish from `dist/`.

## Optional environment variables
- `VITE_CLERK_PUBLISHABLE_KEY` — only needed if you want to use the Clerk auth demo at `/clerk`.
