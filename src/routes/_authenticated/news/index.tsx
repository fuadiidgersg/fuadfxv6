import { createFileRoute } from '@tanstack/react-router'
import { News } from '@/features/news'

export const Route = createFileRoute('/_authenticated/news/')({
  component: News,
})
