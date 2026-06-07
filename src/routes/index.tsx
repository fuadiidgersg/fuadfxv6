import { Link, createFileRoute } from '@tanstack/react-router'
import {
  ArrowRight,
  BarChart3,
  BookOpenCheck,
  Brain,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  DollarSign,
  LineChart,
  LockKeyhole,
  NotebookPen,
  ShieldCheck,
  Sparkles,
  Target,
  UploadCloud,
} from 'lucide-react'
import { Logo } from '@/assets/logo'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

export const Route = createFileRoute('/')({
  component: LandingPage,
})

const productHighlights = [
  {
    icon: UploadCloud,
    title: 'MT5 import built for forex',
    body: 'Bring in trade history, account activity, commissions, swaps, pips and symbols without rebuilding the log by hand.',
  },
  {
    icon: BarChart3,
    title: 'Analytics traders actually review',
    body: 'Track net profit, win rate, profit factor, drawdown, pips won and lost, lot size, sessions, pairs and long versus short execution.',
  },
  {
    icon: NotebookPen,
    title: 'Journal the decision, not just the result',
    body: 'Grade entries, exits, plan quality, market condition and management quality beside every trade and session review.',
  },
  {
    icon: Target,
    title: 'Find your repeatable edge',
    body: 'Separate clean setups from expensive mistakes with strategy tags, process notes and weekly review templates.',
  },
]

const traderWorkflow = [
  'Import MT5 history',
  'Review pips and risk',
  'Grade execution',
  'Write session notes',
  'Adjust the trading plan',
]

const metrics = [
  ['Pips', 'Won and lost by pair'],
  ['Risk', 'Drawdown and expectancy'],
  ['Process', 'Entry, exit and plan grades'],
  ['Timing', 'Session and day analysis'],
]

const launchFeatures = [
  'Multi-account portfolio view',
  'Strategy and setup tracking',
  'Economic news workspace',
  'Daily and weekly journal templates',
  'Screenshot notes for chart context',
  'Light and dark mode shadcn interface',
]

function LandingPage() {
  return (
    <main className='min-h-svh bg-background text-foreground'>
      <header className='sticky top-0 z-40 border-b bg-background/90 backdrop-blur'>
        <div className='mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8'>
          <Link to='/' className='flex items-center gap-2 font-semibold'>
            <Logo className='size-8' />
            <span>Fuadfx</span>
          </Link>
          <nav className='hidden items-center gap-6 text-sm text-muted-foreground md:flex'>
            <a href='#features' className='hover:text-foreground'>
              Features
            </a>
            <a href='#workflow' className='hover:text-foreground'>
              Workflow
            </a>
            <a href='#security' className='hover:text-foreground'>
              Security
            </a>
          </nav>
          <div className='flex items-center gap-2'>
            <Button variant='ghost' asChild>
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
      </header>

      <section className='border-b'>
        <div className='mx-auto grid w-full max-w-7xl gap-10 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[0.92fr_1.08fr] lg:px-8 lg:py-20'>
          <div className='flex flex-col justify-center'>
            <Badge variant='outline' className='mb-5 w-fit gap-2'>
              <Sparkles className='size-3.5' />
              Forex journal for disciplined traders
            </Badge>
            <h1 className='max-w-3xl text-4xl font-semibold leading-tight sm:text-5xl lg:text-6xl'>
              Turn every forex trade into a cleaner decision next time.
            </h1>
            <p className='mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg'>
              Fuadfx combines MT5 imports, Myfxbook-style performance metrics,
              pips analysis, portfolio tracking and structured review so your
              trading journal becomes a process, not a spreadsheet.
            </p>
            <div className='mt-8 flex flex-col gap-3 sm:flex-row'>
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
            <div className='mt-8 grid max-w-xl grid-cols-2 gap-4 text-sm sm:grid-cols-4'>
              {metrics.map(([label, value]) => (
                <div key={label} className='border-l pl-3'>
                  <div className='font-semibold'>{label}</div>
                  <div className='mt-1 text-muted-foreground'>{value}</div>
                </div>
              ))}
            </div>
          </div>

          <ProductPreview />
        </div>
      </section>

      <section id='features' className='border-b'>
        <div className='mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8'>
          <div className='max-w-2xl'>
            <Badge variant='secondary' className='mb-4'>
              What serious journals include
            </Badge>
            <h2 className='text-3xl font-semibold'>Built around the review loop traders repeat every week.</h2>
            <p className='mt-3 text-muted-foreground'>
              Research across TradeZella, Edgewonk, TraderSync and Myfxbook
              shows the same launch bar: easy importing, setup tracking,
              mistake review, risk analytics and reports that lead to action.
            </p>
          </div>
          <div className='mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
            {productHighlights.map((feature) => (
              <article key={feature.title} className='rounded-lg border bg-card p-5 text-card-foreground shadow-sm'>
                <feature.icon className='mb-4 size-5 text-primary' />
                <h3 className='font-semibold'>{feature.title}</h3>
                <p className='mt-2 text-sm leading-6 text-muted-foreground'>{feature.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id='workflow' className='border-b bg-muted/30'>
        <div className='mx-auto grid w-full max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8'>
          <div>
            <Badge variant='outline' className='mb-4 gap-2'>
              <ClipboardCheck className='size-3.5' />
              Trader workflow
            </Badge>
            <h2 className='text-3xl font-semibold'>From raw history to a better trading plan.</h2>
            <p className='mt-3 text-muted-foreground'>
              The product is structured for the real rhythm of forex trading:
              import, inspect, grade, write, then improve the next session.
            </p>
          </div>
          <div className='grid gap-3'>
            {traderWorkflow.map((step, index) => (
              <div key={step} className='flex items-center gap-4 rounded-lg border bg-background p-4 shadow-sm'>
                <div className='flex size-9 shrink-0 items-center justify-center rounded-md border bg-muted text-sm font-semibold'>
                  {index + 1}
                </div>
                <div className='font-medium'>{step}</div>
                <CheckCircle2 className='ml-auto size-5 text-emerald-600' />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className='border-b'>
        <div className='mx-auto grid w-full max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-3 lg:px-8'>
          <div className='lg:col-span-1'>
            <Badge variant='secondary' className='mb-4'>
              Launch-ready scope
            </Badge>
            <h2 className='text-3xl font-semibold'>A complete forex journal foundation.</h2>
          </div>
          <div className='grid gap-3 sm:grid-cols-2 lg:col-span-2'>
            {launchFeatures.map((feature) => (
              <div key={feature} className='flex items-center gap-3 rounded-md border p-3 text-sm'>
                <CheckCircle2 className='size-4 text-emerald-600' />
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id='security'>
        <div className='mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8'>
          <div className='grid gap-4 md:grid-cols-3'>
            <div className='rounded-lg border p-5'>
              <LockKeyhole className='mb-4 size-5 text-primary' />
              <h3 className='font-semibold'>Secure login</h3>
              <p className='mt-2 text-sm leading-6 text-muted-foreground'>
                Email and Google authentication through Supabase, with Vercel
                and local callback support.
              </p>
            </div>
            <div className='rounded-lg border p-5'>
              <ShieldCheck className='mb-4 size-5 text-primary' />
              <h3 className='font-semibold'>Account separation</h3>
              <p className='mt-2 text-sm leading-6 text-muted-foreground'>
                Keep prop firm, live and demo accounts separate while reviewing
                portfolio performance together.
              </p>
            </div>
            <div className='rounded-lg border p-5'>
              <Brain className='mb-4 size-5 text-primary' />
              <h3 className='font-semibold'>Process memory</h3>
              <p className='mt-2 text-sm leading-6 text-muted-foreground'>
                Journal entries, tags and grades give every trading week a
                clear record of what changed.
              </p>
            </div>
          </div>

          <Separator className='my-10' />

          <div className='flex flex-col items-start justify-between gap-5 rounded-lg border bg-card p-6 shadow-sm sm:flex-row sm:items-center'>
            <div>
              <div className='flex items-center gap-2 font-semibold'>
                <LineChart className='size-5 text-primary' />
                Ready to review your trades with structure?
              </div>
              <p className='mt-2 text-sm text-muted-foreground'>
                Login or create an account to import trades and start the review loop.
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

          <footer className='mt-8 flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between'>
            <div className='flex items-center gap-2'>
              <Logo className='size-6' />
              <span>Fuadfx trading journal</span>
            </div>
            <div className='flex items-center gap-4'>
              <CalendarDays className='size-4' />
              <BookOpenCheck className='size-4' />
              <span>Built for review, discipline and consistency.</span>
            </div>
          </footer>
        </div>
      </section>
    </main>
  )
}

function ProductPreview() {
  return (
    <div
      className='relative min-h-[360px] overflow-hidden rounded-lg border bg-card p-4 shadow-sm'
      aria-label='Fuadfx product preview'
    >
      <div className='flex items-center justify-between border-b pb-3 text-sm'>
        <div className='flex items-center gap-2 font-semibold'>
          <Logo className='size-7' />
          Fuadfx Journal
        </div>
        <Badge variant='secondary'>Live account review</Badge>
      </div>

      <div className='grid gap-4 pt-4 lg:grid-cols-[0.86fr_1.14fr]'>
        <div className='space-y-3'>
          <div className='rounded-md border bg-background p-4'>
            <div className='flex items-center justify-between text-sm'>
              <span className='text-muted-foreground'>Net P&L</span>
              <DollarSign className='size-4 text-emerald-600' />
            </div>
            <div className='mt-2 text-3xl font-semibold text-emerald-600'>
              +$3,428
            </div>
            <div className='mt-1 text-sm text-muted-foreground'>
              41 closed trades this month
            </div>
          </div>
          <div className='grid grid-cols-2 gap-3'>
            <PreviewStat label='Win rate' value='58.5%' />
            <PreviewStat label='Profit factor' value='2.14' />
            <PreviewStat label='Pips won' value='+612' />
            <PreviewStat label='Pips lost' value='-428' />
          </div>
        </div>

        <div className='rounded-md border bg-background p-4'>
          <div className='mb-4 flex items-center justify-between'>
            <div>
              <div className='font-semibold'>Performance by pair</div>
              <div className='text-sm text-muted-foreground'>
                Pips, risk and execution quality
              </div>
            </div>
            <Badge variant='outline'>MT5 import</Badge>
          </div>
          <div className='space-y-4'>
            <PairRow pair='EURUSD' pips='+184' grade='A' width='82%' />
            <PairRow pair='XAUUSD' pips='+96' grade='B+' width='64%' />
            <PairRow pair='GBPJPY' pips='-42' grade='C' width='38%' muted />
            <PairRow pair='USDJPY' pips='+73' grade='B' width='55%' />
          </div>
        </div>
      </div>

      <div className='mt-4 grid gap-3 rounded-md border bg-background p-4 sm:grid-cols-3'>
        <PreviewStat label='Best session' value='London' />
        <PreviewStat label='Plan followed' value='76%' />
        <PreviewStat label='Max drawdown' value='4.2%' />
      </div>
    </div>
  )
}

function PreviewStat({ label, value }: { label: string; value: string }) {
  return (
    <div className='rounded-md border bg-card p-3'>
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
          <span className={muted ? 'text-red-500' : 'text-emerald-600'}>
            {pips}
          </span>
          <Badge variant='secondary'>{grade}</Badge>
        </div>
      </div>
      <div className='h-2 overflow-hidden rounded-full bg-muted'>
        <div
          className={muted ? 'h-full bg-red-500' : 'h-full bg-emerald-500'}
          style={{ width }}
        />
      </div>
    </div>
  )
}
