import {
  ArrowDown,
  ArrowUp,
  CircleCheck,
  CircleX,
  CircleMinus,
  CircleDot,
} from 'lucide-react'
import {
  DIRECTIONS,
  PAIRS,
  SESSIONS,
  STATUSES,
  STRATEGIES,
} from '@/features/trades/data/schema'

export const directions = [
  { value: 'long' as const, label: 'Long', icon: ArrowUp },
  { value: 'short' as const, label: 'Short', icon: ArrowDown },
]

export const statuses = [
  { value: 'win' as const, label: 'Win', icon: CircleCheck },
  { value: 'loss' as const, label: 'Loss', icon: CircleX },
  { value: 'breakeven' as const, label: 'Breakeven', icon: CircleMinus },
  { value: 'open' as const, label: 'Open', icon: CircleDot },
]

export const pairs = PAIRS.map((p) => ({ value: p, label: p }))
export const strategies = STRATEGIES.map((s) => ({ value: s, label: s }))
export const sessions = SESSIONS.map((s) => ({ value: s, label: s }))

// re-exported for legacy code paths if any
export { DIRECTIONS, STATUSES, PAIRS, STRATEGIES, SESSIONS }
