import { Link, createFileRoute } from '@tanstack/react-router'
import type { ElementType } from 'react'
import {
  ArrowRight,
  BarChart3,
  BookOpenCheck,
  CheckCircle2,
  LineChart,
  LockKeyhole,
  NotebookPen,
  ShieldCheck,
  UploadCloud,
} from 'lucide-react'
import {
  BrandIcon,
  BrandLogoHorizontal,
} from '@/assets/logo'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

export const Route = createFileRoute('/')({
  component: LandingPage,
})

const productPillars = [
  {
    icon: UploadCloud,
    title: 'Import',
    body: 'Bring MT5 trade history into one journal without rebuilding every position manually.',
  },
  {
    icon: BarChart3,
    title: 'Analyze',
    body: 'Review pips, profit factor, drawdown, pairs, sessions and long versus short execution.',
  },
  {
    icon: NotebookPen,
    title: 'Journal',
    body: 'Capture the setup, plan quality, entry, exit, management and lesson behind each trade.',
  },
]

const reviewItems = [
  ['Performance', 'Net P&L, win rate, profit factor, pips won and lost.'],
  ['Risk', 'Drawdown, position size, losing patterns and account-level exposure.'],
  ['Execution', 'Entry grade, exit grade, plan adherence and trade management.'],
  ['Context', 'Pair, session, setup, notes, screenshots and economic news.'],
]

const workflow = [
  'Import or log trades',
  'Review account and pair performance',
  'Grade execution quality',
  'Write the session lesson',
  'Adjust the next trading plan',
]

function LandingPage() {
  return (
    <main className='min-h-svh bg-background text-foreground'>
      <header className='sticky top-0 z-40 border-b bg-background/85 backdrop-blur-md'>
        <div className='mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6'>
          <Link to='/' aria-label='FUADFX home' className='text-black dark:text-white'>
            <BrandLogoHorizontal className='h-7 w-[126px]' />
          </Link>
          <nav className='hidden items-center gap-7 text-sm text-muted-foreground md:flex'>
            <a href='#product' className='transition hover:text-foreground'>
              Product
            </a>
            <a href='#review' className='transition hover:text-foreground'>
              Review
            </a>
            <a href='#workflow' className='transition hover:text-foreground'>
              Workflow
            </a>
          </nav>
          <div className='flex items-center gap-2'>
            <Button variant='ghost' asChild>
              <Link to='/sign-in'>Login</Link>
            </Button>
            <Button asChild>
              <Link to='/sign-up'>
                Start
                <ArrowRight />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <section className='border-b'>
        <div className='mx-auto grid w-full max-w-6xl gap-12 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[0.82fr_1.18fr] lg:items-center lg:py-24'>
          <div>
            <Badge variant='outline' className='mb-6'>
              Forex journal for MT5 traders
            </Badge>
            <h1 className='max-w-3xl text-4xl font-semibold leading-tight sm:text-5xl lg:text-6xl'>
              A cleaner review system for every forex trade.
            </h1>
            <p className='mt-5 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg'>
              FUADFX helps traders import MT5 history, analyze performance,
              grade execution and turn each session into a practical next step.
            </p>
            <div className='mt-8 flex w-full max-w-sm flex-col gap-3 sm:w-auto sm:max-w-none sm:flex-row'>
              <Button size='lg' asChild>
                <Link to='/sign-up'>
                  Create account
                  <ArrowRight />
                </Link>
              </Button>
              <Button size='lg' variant='outline' asChild>
                <Link to='/sign-in'>Login to journal</Link>
              </Button>
            </div>
          </div>

          <div id='product'>
            <ProductPreview />
          </div>
        </div>
      </section>

      <section className='border-b'>
        <div className='mx-auto grid w-full max-w-6xl gap-0 px-4 py-10 sm:px-6 md:grid-cols-3'>
          {productPillars.map((pillar, index) => (
            <div
              key={pillar.title}
              className='border-b py-6 md:border-b-0 md:px-8 md:first:pl-0 md:last:pr-0 md:[&:not(:last-child)]:border-r'
            >
              <div className='mb-4 flex size-9 items-center justify-center rounded-md border bg-muted/40'>
                <pillar.icon className='size-4' />
              </div>
              <div className='text-sm text-muted-foreground'>
                0{index + 1}
              </div>
              <h2 className='mt-1 text-xl font-semibold'>{pillar.title}</h2>
              <p className='mt-3 text-sm leading-6 text-muted-foreground'>
                {pillar.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section id='review' className='border-b'>
        <div className='mx-auto grid w-full max-w-6xl gap-12 px-4 py-14 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:py-20'>
          <div>
            <Badge variant='secondary' className='mb-4'>
              What gets reviewed
            </Badge>
            <h2 className='text-3xl font-semibold tracking-tight sm:text-4xl'>
              Built around the questions traders ask after a session.
            </h2>
            <p className='mt-4 leading-7 text-muted-foreground'>
              The journal is structured around decision quality, not vanity
              dashboards. Each section should help answer what worked, what
              failed and what changes tomorrow.
            </p>
          </div>
          <div className='rounded-lg border'>
            {reviewItems.map(([title, body], index) => (
              <div
                key={title}
                className='grid gap-2 border-b p-5 last:border-b-0 sm:grid-cols-[160px_1fr]'
              >
                <div className='font-medium'>{title}</div>
                <p className='text-sm leading-6 text-muted-foreground'>
                  {body}
                </p>
                {index === 0 && (
                  <span className='sr-only'>Primary review categories</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id='workflow' className='border-b bg-muted/20'>
        <div className='mx-auto grid w-full max-w-6xl gap-12 px-4 py-14 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:py-20'>
          <div>
            <Badge variant='outline' className='mb-4'>
              Workflow
            </Badge>
            <h2 className='text-3xl font-semibold tracking-tight sm:text-4xl'>
              A repeatable process, not another dashboard to ignore.
            </h2>
            <p className='mt-4 leading-7 text-muted-foreground'>
              The app is organized so a trader can finish a daily review
              quickly, then come back at the end of the week with useful data.
            </p>
          </div>
          <div className='grid gap-3'>
            {workflow.map((step, index) => (
              <div
                key={step}
                className='flex items-center gap-4 rounded-md border bg-background p-4'
              >
                <div className='flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-sm font-medium'>
                  {index + 1}
                </div>
                <span className='font-medium'>{step}</span>
                <CheckCircle2 className='ml-auto size-4 text-primary' />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section>
        <div className='mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 lg:py-20'>
          <div className='grid gap-4 md:grid-cols-3'>
            <TrustItem
              icon={LockKeyhole}
              title='Secure login'
              body='Email and Google authentication through Supabase, with local and Vercel callback support.'
            />
            <TrustItem
              icon={ShieldCheck}
              title='Separate accounts'
              body='Review live, demo and prop firm accounts individually or together in portfolio view.'
            />
            <TrustItem
              icon={BookOpenCheck}
              title='Process memory'
              body='Keep grades, notes, tags and screenshots connected to the decisions behind each trade.'
            />
          </div>

          <Separator className='my-10' />

          <div className='flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-center'>
            <div>
              <div className='flex items-center gap-2 font-semibold'>
                <LineChart className='size-5' />
                Ready to build a cleaner trading review?
              </div>
              <p className='mt-2 text-sm text-muted-foreground'>
                Start with your next MT5 import and review the trades that matter.
              </p>
            </div>
            <div className='flex gap-2'>
              <Button variant='outline' asChild>
                <Link to='/sign-in'>Login</Link>
              </Button>
              <Button asChild>
                <Link to='/sign-up'>
                  Start journal
                  <ArrowRight />
                </Link>
              </Button>
            </div>
          </div>

          <footer className='mt-12 flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between'>
            <BrandLogoHorizontal className='h-6 w-[108px]' />
            <span>Built for review, discipline and consistency.</span>
          </footer>
        </div>
      </section>
    </main>
  )
}

function ProductPreview() {
  return (
    <div
      className='overflow-hidden rounded-lg border bg-card text-start'
      aria-label='FUADFX product preview'
    >
      <div className='flex items-center justify-between border-b px-4 py-3 sm:px-5'>
        <div className='flex items-center gap-2 font-semibold'>
          <BrandIcon className='size-6' />
          FUADFX Journal
        </div>
        <Badge variant='secondary'>Account review</Badge>
      </div>

      <div className='grid gap-0 lg:grid-cols-[0.92fr_1.08fr]'>
        <div className='border-b p-5 lg:border-r lg:border-b-0'>
          <div className='flex items-start justify-between gap-4'>
            <div>
              <div className='text-sm text-muted-foreground'>Closed P&L</div>
              <div className='mt-2 text-4xl font-semibold tracking-tight'>
                +$3,428
              </div>
              <div className='mt-1 text-sm text-muted-foreground'>
                Month-to-date sample account
              </div>
            </div>
            <Badge variant='outline'>MT5</Badge>
          </div>

          <div className='mt-6 grid grid-cols-2 gap-3'>
            <PreviewStat label='Win rate' value='58.5%' />
            <PreviewStat label='Profit factor' value='2.14' />
            <PreviewStat label='Net pips' value='+184' />
            <PreviewStat label='Plan followed' value='76%' />
          </div>
        </div>

        <div className='p-5'>
          <div className='mb-5'>
            <div className='font-semibold'>Pair review</div>
            <div className='text-sm text-muted-foreground'>
              Pips, direction and execution grade
            </div>
          </div>
          <div className='space-y-4'>
            <PairRow pair='EURUSD' pips='+184' grade='A' width='82%' />
            <PairRow pair='XAUUSD' pips='+96' grade='B+' width='64%' />
            <PairRow pair='GBPJPY' pips='-42' grade='C' width='38%' muted />
            <PairRow pair='USDJPY' pips='+73' grade='B' width='55%' />
          </div>
        </div>
      </div>
    </div>
  )
}

function PreviewStat({ label, value }: { label: string; value: string }) {
  return (
    <div className='rounded-md border bg-background p-3'>
      <div className='text-xs text-muted-foreground'>{label}</div>
      <div className='mt-1 text-lg font-semibold'>{value}</div>
    </div>
  )
}

function PairRow({
  pair,
  pips,
  grade,
  width,
  muted,
}: {
  pair: string
  pips: string
  grade: string
  width: string
  muted?: boolean
}) {
  return (
    <div className='grid gap-2'>
      <div className='flex items-center justify-between gap-3 text-sm'>
        <span className='font-medium'>{pair}</span>
        <div className='flex items-center gap-3'>
          <span className={muted ? 'text-destructive' : 'text-foreground'}>
            {pips}
          </span>
          <Badge variant='secondary'>{grade}</Badge>
        </div>
      </div>
      <div className='h-2 overflow-hidden rounded-full bg-muted'>
        <div
          className={muted ? 'h-full bg-destructive' : 'h-full bg-primary'}
          style={{ width }}
        />
      </div>
    </div>
  )
}

function TrustItem({
  icon: Icon,
  title,
  body,
}: {
  icon: ElementType
  title: string
  body: string
}) {
  return (
    <div className='rounded-lg border p-5'>
      <Icon className='mb-4 size-5' />
      <h3 className='font-semibold'>{title}</h3>
      <p className='mt-2 text-sm leading-6 text-muted-foreground'>{body}</p>
    </div>
  )
}
