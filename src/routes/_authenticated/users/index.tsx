import { createFileRoute } from '@tanstack/react-router'
import { Accounts } from '@/features/accounts'

export const Route = createFileRoute('/_authenticated/users/')({
  component: Accounts,
})
