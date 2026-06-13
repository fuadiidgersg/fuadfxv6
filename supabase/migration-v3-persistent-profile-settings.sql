-- =============================================
-- FuadFX migration v3
-- Persistent onboarding, profile and trading settings
-- Run this in Supabase SQL Editor after schema.sql and migration-v2.sql.
-- =============================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS experience TEXT
    CHECK (experience IS NULL OR experience IN ('beginner', 'intermediate', 'advanced', 'pro')),
  ADD COLUMN IF NOT EXISTS preferred_pair TEXT DEFAULT 'EUR/USD',
  ADD COLUMN IF NOT EXISTS starting_capital NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS onboarding_complete BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS onboarded_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS trading_settings JSONB DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_profiles_onboarding_complete
  ON public.profiles(onboarding_complete);

CREATE INDEX IF NOT EXISTS idx_profiles_trading_settings
  ON public.profiles USING GIN (trading_settings);

UPDATE public.profiles
SET
  experience = COALESCE(experience, 'beginner'),
  preferred_pair = COALESCE(preferred_pair, 'EUR/USD'),
  starting_capital = COALESCE(starting_capital, 0),
  onboarding_complete = COALESCE(onboarding_complete, FALSE),
  trading_settings = COALESCE(trading_settings, '{}'::jsonb)
WHERE
  experience IS NULL
  OR preferred_pair IS NULL
  OR starting_capital IS NULL
  OR onboarding_complete IS NULL
  OR trading_settings IS NULL;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    avatar_url,
    experience,
    preferred_pair,
    starting_capital,
    onboarding_complete,
    trading_settings
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url',
    'beginner',
    'EUR/USD',
    0,
    FALSE,
    '{}'::jsonb
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    full_name = COALESCE(public.profiles.full_name, EXCLUDED.full_name),
    avatar_url = COALESCE(public.profiles.avatar_url, EXCLUDED.avatar_url),
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
