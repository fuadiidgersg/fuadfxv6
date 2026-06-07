import { createFileRoute, Link } from '@tanstack/react-router'
import {
  BookOpen,
  CheckCircle2,
  FileText,
  LifeBuoy,
  Settings,
  Upload,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'

export const Route = createFileRoute('/_authenticated/help-center/')({
  component: HelpCenter,
})

const guides = [
  {
    title: 'Import MT5 trades',
    description:
      'Export a Detailed HTML report from MT5 History, upload it from Trades, and review the detected account before importing.',
    icon: Upload,
    action: 'Open imports',
    to: '/tasks' as const,
    search: { import: true },
  },
  {
    title: 'Complete trade reviews',
    description:
      'Use entry grade, exit grade, plan adherence, market condition, management review, mistakes, lessons, and screenshots.',
    icon: CheckCircle2,
    action: 'Review trades',
    to: '/tasks' as const,
  },
  {
    title: 'Use journal templates',
    description:
      'Create Daily prep, Post-session review, Mistake review, and Weekly review entries from the Journal page.',
    icon: BookOpen,
    action: 'Open journal',
    to: '/chats' as const,
  },
  {
    title: 'Configure trading settings',
    description:
      'Set timezone, account currency, risk targets, prop firm rules, and import strategy behavior before going live.',
    icon: Settings,
    action: 'Open settings',
    to: '/settings/trading' as const,
  },
]

function HelpCenter() {
  return (
    <>
      <Header fixed>
        <Search className='me-auto' />
        <ThemeSwitch />
        <ConfigDrawer />
        <ProfileDropdown />
      </Header>

      <Main className='flex flex-1 flex-col gap-6'>
        <div>
          <h2 className='text-2xl font-bold tracking-tight'>Help Center</h2>
          <p className='text-muted-foreground'>
            Quick launch guide for importing, reviewing, and improving your
            trading journal.
          </p>
        </div>

        <div className='grid gap-4 md:grid-cols-2'>
          {guides.map((guide) => (
            <Card key={guide.title}>
              <CardHeader className='flex flex-row items-start gap-3 space-y-0'>
                <div className='rounded-md border p-2'>
                  <guide.icon className='size-4 text-muted-foreground' />
                </div>
                <div>
                  <CardTitle className='text-base'>{guide.title}</CardTitle>
                  <CardDescription className='mt-1'>
                    {guide.description}
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <Button asChild size='sm' variant='outline'>
                  <Link to={guide.to} search={guide.search as never}>
                    {guide.action}
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2 text-base'>
              <LifeBuoy className='size-4' />
              Launch Checklist
            </CardTitle>
            <CardDescription>
              Run through this before relying on the production app.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className='grid gap-3 text-sm md:grid-cols-2'>
              {[
                'Vercel has VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, and VITE_API_URL.',
                'Render has SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and allowed frontend origins.',
                'Supabase auth redirect URLs include production and localhost callback URLs.',
                'MT5 import preview shows the correct account, broker, trade count, lots, P&L, and strategy.',
                'Imported trades are reviewed and assigned a real playbook only after import.',
                'Analytics Process Review has enough reviewed trades to measure discipline.',
              ].map((item) => (
                <div key={item} className='flex gap-2 rounded-md border p-3'>
                  <FileText className='mt-0.5 size-4 shrink-0 text-muted-foreground' />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </Main>
    </>
  )
}
