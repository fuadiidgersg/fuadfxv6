-- =============================================
-- FuadFX — Migration v2: Extend schema for full frontend Trade type
-- Run this in your Supabase SQL Editor AFTER schema.sql
-- =============================================

-- ── TRADES: add FuadFX-specific columns ──────────────────────────────────────
ALTER TABLE public.trades
  ADD COLUMN IF NOT EXISTS direction       TEXT,          -- 'long' | 'short'
  ADD COLUMN IF NOT EXISTS pips            NUMERIC,
  ADD COLUMN IF NOT EXISTS r_multiple      NUMERIC,
  ADD COLUMN IF NOT EXISTS risk_amount     NUMERIC,
  ADD COLUMN IF NOT EXISTS session         TEXT,          -- 'Asian' | 'London' | 'New York' | 'Overlap'aa
  ADD COLUMN IF NOT EXISTS timeframe       TEXT,          -- 'M1' | 'M5' | 'H1' etc
  ADD COLUMN IF NOT EXISTS trade_outcome   TEXT,          -- 'win' | 'loss' | 'breakeven' | 'open'
  ADD COLUMN IF NOT EXISTS account_name    TEXT,
  ADD COLUMN IF NOT EXISTS mistakes        TEXT,
  ADD COLUMN IF NOT EXISTS lessons         TEXT;

-- Backfill direction from type for existing rows
UPDATE public.trades
  SET direction = CASE WHEN type = 'buy' THEN 'long' ELSE 'short' END
  WHERE direction IS NULL;

-- Backfill trade_outcome from status for existing rows
UPDATE public.trades
  SET trade_outcome = CASE
    WHEN status = 'open' THEN 'open'
    WHEN profit > 0 THEN 'win'
    WHEN profit < 0 THEN 'loss'
    ELSE 'breakeven'
  END
  WHERE trade_outcome IS NULL;

-- ── ACCOUNTS: add extra columns ───────────────────────────────────────────────
ALTER TABLE public.accounts
  ADD COLUMN IF NOT EXISTS account_number   TEXT,
  ADD COLUMN IF NOT EXISTS is_archived      BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS starting_balance NUMERIC DEFAULT 0;

-- Backfill starting_balance from balance
UPDATE public.accounts
  SET starting_balance = balance
  WHERE starting_balance = 0 AND balance > 0;

-- ── JOURNALS: add tags ────────────────────────────────────────────────────────
ALTER TABLE public.journals
  ADD COLUMN IF NOT EXISTS tags TEXT[];

-- ── Indexes ───────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_trades_direction      ON public.trades(direction);
CREATE INDEX IF NOT EXISTS idx_trades_trade_outcome  ON public.trades(trade_outcome);
CREATE INDEX IF NOT EXISTS idx_accounts_is_archived  ON public.accounts(is_archived);
