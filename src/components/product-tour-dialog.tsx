import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from '@tanstack/react-router'
import {
  AreaChart,
  BarChart3,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Gauge,
  Wallet,
} from 'lucide-react'
import { useProductTourStore } from '@/stores/product-tour-store'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

const tourSteps = [
  {
    icon: Gauge,
    title: 'Read the dashboard first',
    body: 'Start here after onboarding. The top cards summarize net P&L, win rate, profit factor, best and worst trade, and the current review state of the active account.',
    action: 'Stay on dashboard',
    href: '/dashboard',
  },
  {
    icon: Wallet,
    title: 'Confirm the active account',
    body: 'Use the account selector in the sidebar to switch between live, demo, and prop accounts. Every dashboard number follows the selected account.',
    action: 'View portfolio',
    href: '/portfolio',
  },
  {
    icon: AreaChart,
    title: 'Use the equity curve',
    body: 'The curve shows whether the account is building smoothly or becoming unstable. Look for drawdown clusters, sharp recoveries, and flat periods before changing a strategy.',
    action: 'Open analytics',
    href: '/analytics',
  },
  {
    icon: ClipboardList,
    title: 'Review recent trades',
    body: 'Recent trades are the fastest way to spot what changed today: pair, session, direction, pips, P&L, and whether the result came from execution or market conditions.',
    action: 'Open trades',
    href: '/tasks',
  },
  {
    icon: BarChart3,
    title: 'Move from overview to diagnosis',
    body: 'Use the dashboard tabs to go deeper only after the overview makes sense. Analytics explains what is driving the numbers: pairs, sessions, strategy, risk and consistency.',
    action: 'Open analytics',
    href: '/analytics',
  },
  {
    icon: CheckCircle2,
    title: 'Turn data into one next action',
    body: 'Before the next session, decide one thing to keep, stop, or improve. FUADFX is most useful when the dashboard leads to a specific trading rule.',
    action: 'Open journal',
    href: '/chats',
  },
] as const

export function ProductTourDialog() {
  const location = useLocation()
  const completed = useProductTourStore((s) => s.completed)
  const complete = useProductTourStore((s) => s.complete)
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(0)
  const current = tourSteps[step]
  const Icon = current.icon
  const isLast = step === tourSteps.length - 1

  const progressLabel = useMemo(
    () => `${step + 1} of ${tourSteps.length}`,
    [step]
  )

  useEffect(() => {
    if (!completed && location.pathname === '/dashboard') {
      const timer = window.setTimeout(() => setOpen(true), 700)
      return () => window.clearTimeout(timer)
    }
  }, [completed, location.pathname])

  const finish = () => {
    complete()
    setOpen(false)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) finish()
        else setOpen(true)
      }}
    >
      <DialogContent className='overflow-hidden p-0 sm:max-w-xl'>
        <div className='border-b bg-muted/30 px-6 py-5'>
          <DialogHeader className='text-start'>
            <div className='mb-4 flex items-center justify-between gap-3'>
              <div className='flex size-11 items-center justify-center rounded-md border bg-background'>
                <Icon className='size-5' />
              </div>
              <span className='rounded-md border bg-background px-2.5 py-1 text-xs font-medium text-muted-foreground'>
                {progressLabel}
              </span>
            </div>
            <DialogTitle className='text-xl'>Dashboard guide</DialogTitle>
            <DialogDescription>
              Learn how to read your account after onboarding is complete.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className='space-y-5 px-6 py-5'>
          <div>
            <h3 className='text-lg font-semibold tracking-tight'>
              {current.title}
            </h3>
            <p className='mt-2 text-sm leading-6 text-muted-foreground'>
              {current.body}
            </p>
          </div>

          <div className='grid grid-cols-6 gap-1.5'>
            {tourSteps.map((item, index) => (
              <button
                key={item.title}
                type='button'
                aria-label={`Go to tour step ${index + 1}`}
                onClick={() => setStep(index)}
                className={
                  'h-1.5 rounded-full transition-colors ' +
                  (index <= step ? 'bg-foreground' : 'bg-muted')
                }
              />
            ))}
          </div>

          <div className='rounded-md border bg-muted/20 p-3 text-sm'>
            <div className='flex items-start gap-3'>
              <CheckCircle2 className='mt-0.5 size-4 shrink-0 text-emerald-500' />
              <p className='leading-6 text-muted-foreground'>
                Best workflow: read the dashboard first, identify what changed,
                then write one clear action before the next trading session.
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className='flex-row items-center justify-between gap-2 border-t bg-muted/20 px-6 py-4 sm:justify-between'>
          <Button type='button' variant='ghost' onClick={finish}>
            Skip
          </Button>

          <div className='flex items-center gap-2'>
            <Button
              type='button'
              variant='outline'
              disabled={step === 0}
              onClick={() => setStep((value) => Math.max(0, value - 1))}
            >
              <ChevronLeft className='size-4' />
              Back
            </Button>
            {isLast ? (
              <Button type='button' onClick={finish}>
                Done
              </Button>
            ) : (
              <Button
                type='button'
                onClick={() =>
                  setStep((value) => Math.min(tourSteps.length - 1, value + 1))
                }
              >
                Next
                <ChevronRight className='size-4' />
              </Button>
            )}
            <Button asChild type='button' variant='secondary' onClick={finish}>
              <Link to={current.href}>{current.action}</Link>
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
