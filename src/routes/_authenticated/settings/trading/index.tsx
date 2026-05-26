import { createFileRoute } from '@tanstack/react-router'
import { SettingsTrading } from '@/features/settings/trading'

export const Route = createFileRoute('/_authenticated/settings/trading/')({
  component: SettingsTrading,
})
