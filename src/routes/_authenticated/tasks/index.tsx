import z from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import { Tasks } from '@/features/tasks'
import { directions, pairs, statuses, strategies } from '@/features/tasks/data/data'

const tradesSearchSchema = z.object({
  page: z.number().optional().catch(1),
  pageSize: z.number().optional().catch(10),
  status: z
    .array(z.enum(statuses.map((s) => s.value)))
    .optional()
    .catch([]),
  pair: z
    .array(z.enum(pairs.map((p) => p.value)))
    .optional()
    .catch([]),
  strategy: z
    .array(z.enum(strategies.map((s) => s.value)))
    .optional()
    .catch([]),
  direction: z
    .array(z.enum(directions.map((d) => d.value)))
    .optional()
    .catch([]),
  filter: z.string().optional().catch(''),
  new: z.boolean().optional().catch(false),
})

export const Route = createFileRoute('/_authenticated/tasks/')({
  validateSearch: tradesSearchSchema,
  component: Tasks,
})
