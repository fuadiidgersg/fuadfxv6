// Trades are now persisted in Supabase via the Express API.
// TanStack Query is the client-side cache. This file re-exports
// compatibility hooks so existing imports keep working.
export { useTrades } from '@/hooks/use-trades-query'
export type { Trade } from '@/features/trades/data/schema'
export type ImportResult = { added: number; duplicates: number }
