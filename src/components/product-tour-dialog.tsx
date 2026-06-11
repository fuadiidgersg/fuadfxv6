import { useEffect, useMemo, useState } from 'react'
import { Link } from '@tanstack/react-router'
import {
  AreaChart,
  BookOpenText,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Gauge,
  Settings2,
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
    title: 'Start with your command center',
    body: 'The dashboard gives you a clean read on account performance, recent trades, equity movement, and the next review action before you trade again.',
    action: 'Open dashboard',
    href: '/dashboard',
  },
  {
    icon: ClipboardList,
    title: 'Log and review every trade',
    body: 'Use Trades to add MT5 history, review entries and exits, track pips, notes, mistakes, strategy, session, and the execution details that explain the result.',
    action: 'Open trades',
    href: '/tasks',
  },
  {
    icon: AreaChart,
    title: 'Find the edge in the data',
    body: 'Analytics turns closed trades into trader-friendly evidence: win rate, drawdown, pips won and lost, pair behavior, session quality, expectancy, and strategy performance.',
    action: 'Open analytics',
    href: '/analytics',
  },
  {
    icon: BookOpenText,
    title: 'Build the trading journal habit',
    body: 'Journal your prep, post-session review, recurring mistakes, weekly lessons, and rule breaks so the numbers connect back to behavior.',
    action: 'Open journal',
    href: '/chats',
  },
  {
    icon: Wallet,
    title: 'Separate accounts and objectives',
    body: 'Portfolio helps you compare live, demo, and prop accounts without mixing results, so each account has its own performance story.',
    action: 'Open portfolio',
    href: '/portfolio',
  },
  {
    icon: Settings2,
    title: 'Tune FUADFX to your workflow',
    body: 'Set your timezone, currency, risk preferences, display mode, and import behavior before you rely on the journal for serious review.',
    action: 'Open settings',
    href: '/settings',
  },
] as const

export function ProductTourDialog() {
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
    if (!completed) {
      const timer = window.setTimeout(() => setOpen(true), 700)
      return () => window.clearTimeout(timer)
    }
  }, [completed])

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
            <DialogTitle className='text-xl'>Welcome to FUADFX</DialogTitle>
            <DialogDescription>
              A quick tour for using FUADFX as your MT5 companion.
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
                Best workflow: pick an account, review trades, check analytics,
                then write one lesson before the next session.
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
