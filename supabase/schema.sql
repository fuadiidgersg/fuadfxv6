-- =============================================
-- FUADFX — Supabase Schema
-- Run this in your Supabase SQL Editor
-- =============================================

-- Profiles (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  timezone TEXT DEFAULT 'UTC',
  currency TEXT DEFAULT 'USD',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trading Accounts
CREATE TABLE IF NOT EXISTS public.accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  broker TEXT,
  account_number TEXT,
  currency TEXT DEFAULT 'USD',
  balance NUMERIC DEFAULT 0,
  category TEXT CHECK (category IN ('live', 'demo', 'prop')) DEFAULT 'live',
  profit_target NUMERIC,
  max_drawdown_limit NUMERIC,
  starting_balance NUMERIC DEFAULT 0,
  is_archived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trades
CREATE TABLE IF NOT EXISTS public.trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  ticket TEXT,
  symbol TEXT NOT NULL,
  direction TEXT,
  type TEXT CHECK (type IN ('buy', 'sell')) NOT NULL,
  lots NUMERIC NOT NULL DEFAULT 0,
  open_price NUMERIC,
  close_price NUMERIC,
  open_time TIMESTAMPTZ,
  close_time TIMESTAMPTZ,
  profit NUMERIC DEFAULT 0,
  commission NUMERIC DEFAULT 0,
  swap NUMERIC DEFAULT 0,
  stop_loss NUMERIC,
  take_profit NUMERIC,
  status TEXT CHECK (status IN ('open', 'closed', 'pending')) DEFAULT 'closed',
  notes TEXT,
  emotion TEXT,
  strategy TEXT,
  tags TEXT[],
  screenshot_url TEXT,
  pips NUMERIC,
  r_multiple NUMERIC,
  risk_amount NUMERIC,
  session TEXT,
  timeframe TEXT,
  trade_outcome TEXT,
  account_name TEXT,
  mistakes TEXT,
  lessons TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Journals
CREATE TABLE IF NOT EXISTS public.journals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  title TEXT,
  content TEXT NOT NULL,
  mood TEXT,
  tags TEXT[],
  date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_trades_user_id ON public.trades(user_id);
CREATE INDEX IF NOT EXISTS idx_trades_account_id ON public.trades(account_id);
CREATE INDEX IF NOT EXISTS idx_trades_close_time ON public.trades(close_time DESC);
CREATE INDEX IF NOT EXISTS idx_trades_symbol ON public.trades(symbol);
CREATE INDEX IF NOT EXISTS idx_trades_direction ON public.trades(direction);
CREATE INDEX IF NOT EXISTS idx_trades_trade_outcome ON public.trades(trade_outcome);
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON public.accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_accounts_is_archived ON public.accounts(is_archived);
CREATE INDEX IF NOT EXISTS idx_journals_user_id ON public.journals(user_id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
