import { createFileRoute } from '@tanstack/react-router'
import { Charts } from '@/features/charts'

export const Route = createFileRoute('/_authenticated/charts/')({
  component: Charts,
})
