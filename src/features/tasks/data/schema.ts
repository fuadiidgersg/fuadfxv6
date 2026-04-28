// Re-export the unified Trade schema so existing imports keep working.
export {
  tradeSchema as taskSchema,
  type Trade as Task,
} from '@/features/trades/data/schema'
