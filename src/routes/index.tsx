import { Link, createFileRoute } from '@tanstack/react-router'
import type { ElementType } from 'react'
import {
  ArrowRight,
  BarChart3,
  BookOpenCheck,
  Brain,
  Gauge,
  LineChart,
  LockKeyhole,
  NotebookPen,
  PlayCircle,
  Radar,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import { BrandIcon, BrandLogoHorizontal } from '@/assets/logo'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

export const Route = createFileRoute('/')({
  component: LandingPage,
})

const proofMetrics = [
  ['124', 'Trades reviewed'],
  ['2.14', 'Profit factor'],
  ['72%', 'Backtest match'],
  ['4.8%', 'Risk drift'],
] as const

const featureGroups = [
  {
    icon: LineChart,
    title: 'Performance without the MT5 clutter',
    body: 'Understand win rate, drawdown, pips, direction, sessions and pair behavior in a cleaner review layer built for decision-making.',
  },
  {
    icon: Brain,
    title: 'Behavior review beside the numbers',
    body: 'Connect execution grades, emotion, screenshots and notes to the trades that produced the result.',
  },
  {
    icon: Radar,
    title: 'Backtest your real trading behavior',
    body: 'Compare setups and strategy tags against actual outcomes so you can prove what deserves more risk.',
  },
] as const

const workflow = [
  {
    icon: BarChart3,
    title: 'Analyze',
    body: 'Turn MT5 history into clear performance, risk and edge signals.',
  },
  {
    icon: NotebookPen,
    title: 'Review',
    body: 'Study context, execution quality, emotions and trade management.',
  },
  {
    icon: BookOpenCheck,
    title: 'Backtest',
    body: 'Validate setups against past behavior before changing the plan.',
  },
] as const

const insightRows = [
  ['EURUSD', 'London', '+184', 'A'],
  ['XAUUSD', 'NY', '+96', 'B+'],
  ['GBPJPY', 'Asia', '-42', 'C'],
  ['USDJPY', 'London', '+73', 'B'],
] as const

function LandingPage() {
  return (
    <main className='min-h-svh overflow-x-hidden bg-background text-foreground'>
      <header className='sticky top-0 z-40 px-3 pt-3 sm:px-4'>
        <div className='mx-auto flex h-16 w-full max-w-7xl items-center justify-between rounded-xl border bg-background/80 px-3 shadow-sm backdrop-blur-xl sm:px-4 lg:px-5'>
          <div className='flex items-center gap-8'>
            <Link
              to='/'
              aria-label='FUADFX home'
              className='flex h-10 items-center rounded-lg px-2 text-black transition hover:bg-muted/60 dark:text-white'
            >
              <BrandLogoHorizontal className='h-7 w-[126px]' />
            </Link>
            <nav className='hidden items-center rounded-lg border bg-muted/30 p-1 text-sm text-muted-foreground md:flex'>
              <a
                href='#platform'
                className='rounded-md px-3 py-1.5 transition hover:bg-background hover:text-foreground'
              >
                Platform
              </a>
              <a
                href='#workflow'
                className='rounded-md px-3 py-1.5 transition hover:bg-background hover:text-foreground'
              >
                Workflow
              </a>
              <a
                href='#security'
                className='rounded-md px-3 py-1.5 transition hover:bg-background hover:text-foreground'
              >
                Security
              </a>
            </nav>
          </div>
          <div className='flex items-center gap-2'>
            <Button variant='ghost' className='hidden sm:inline-flex' asChild>
              <Link to='/sign-in'>Login</Link>
            </Button>
            <Button className='rounded-lg' asChild>
              <Link to='/sign-up'>
                Start
                <ArrowRight />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <section className='relative border-b'>
        <div className='absolute inset-0 -z-10 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-[size:72px_72px] opacity-25' />
        <div className='mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24'>
          <div className='mx-auto max-w-4xl text-center'>
            <Badge variant='outline' className='mb-6 rounded-full px-4 py-1'>
              Modern MT5 companion for serious traders
            </Badge>
            <h1 className='text-balance text-5xl font-semibold leading-tight tracking-tight sm:text-6xl lg:text-7xl'>
              MT5 shows the trades. FUADFX shows the edge.
            </h1>
            <p className='mx-auto mt-6 max-w-2xl text-balance text-base leading-7 text-muted-foreground sm:text-lg'>
              A premium analysis, review and backtesting workspace for MT5
              traders who want their trading data to feel clear, modern and
              actionable.
            </p>
            <div className='mt-9 flex flex-col justify-center gap-3 sm:flex-row'>
              <Button size='lg' asChild>
                <Link to='/sign-up'>
                  Start reviewing
                  <ArrowRight />
                </Link>
              </Button>
              <Button size='lg' variant='outline' asChild>
                <Link to='/sign-in'>
                  <PlayCircle />
                  Login with Google
                </Link>
              </Button>
            </div>
          </div>

          <div className='mt-14'>
            <ProductPreview />
          </div>

          <div className='mx-auto mt-10 grid max-w-5xl gap-px overflow-hidden rounded-xl border bg-border sm:grid-cols-2 lg:grid-cols-4'>
            {proofMetrics.map(([value, label]) => (
              <div key={label} className='bg-background p-5 text-center'>
                <div className='text-2xl font-semibold tracking-tight'>
                  {value}
                </div>
                <div className='mt-1 text-sm text-muted-foreground'>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id='platform' className='border-b'>
        <div className='mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24'>
          <div className='grid gap-12 lg:grid-cols-[0.7fr_1.3fr] lg:items-start'>
            <div className='lg:sticky lg:top-24'>
              <Badge variant='secondary'>Platform</Badge>
              <h2 className='mt-5 text-balance text-3xl font-semibold tracking-tight sm:text-5xl'>
                The analysis layer MT5 should have had.
              </h2>
              <p className='mt-5 leading-7 text-muted-foreground'>
                MT5 is powerful for execution, but its reports were not designed
                for fast visual review. FUADFX turns that data into a modern
                decision workspace.
              </p>
            </div>

            <div className='grid gap-4'>
              {featureGroups.map((feature, index) => (
                <FeatureRow key={feature.title} index={index + 1} {...feature} />
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id='workflow' className='border-b bg-muted/25'>
        <div className='mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24'>
          <SectionIntro
            eyebrow='Workflow'
            title='Analyze, review, backtest, improve.'
            body='A repeatable loop for traders who want to understand their edge instead of guessing from raw MT5 history.'
          />
          <div className='mt-12 grid gap-4 md:grid-cols-3'>
            {workflow.map((step, index) => (
              <div
                key={step.title}
                className='group rounded-xl border bg-background p-6 transition hover:border-foreground/30'
              >
                <div className='flex items-start justify-between'>
                  <step.icon className='size-9' strokeWidth={1.5} />
                  <span className='flex size-9 items-center justify-center rounded-full border text-sm font-medium'>
                    {index + 1}
                  </span>
                </div>
                <h3 className='mt-8 text-xl font-semibold'>{step.title}</h3>
                <p className='mt-3 text-sm leading-6 text-muted-foreground'>
                  {step.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id='security'>
        <div className='mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24'>
          <div className='grid gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:items-center'>
            <div>
              <Badge variant='secondary'>Launch-ready foundation</Badge>
              <h2 className='mt-5 text-balance text-3xl font-semibold tracking-tight sm:text-5xl'>
                Serious trading review, protected by a clean auth flow.
              </h2>
              <p className='mt-5 leading-7 text-muted-foreground'>
                FUADFX keeps the public product story, Supabase Google login and
                protected dashboard separated so traders land in the right place
                with less friction.
              </p>
            </div>
            <div className='grid gap-4 sm:grid-cols-3'>
              <TrustItem
                icon={LockKeyhole}
                title='Google Auth'
                body='Login is handled through Supabase OAuth.'
              />
              <TrustItem
                icon={ShieldCheck}
                title='Protected App'
                body='Dashboard pages require an active session.'
              />
              <TrustItem
                icon={Sparkles}
                title='Auto-Sync Ready'
                body='The product direction is built for future sync.'
              />
            </div>
          </div>

          <Separator className='my-12' />

          <div className='overflow-hidden rounded-xl border bg-card'>
            <div className='grid gap-8 p-6 sm:p-8 lg:grid-cols-[1fr_auto] lg:items-center lg:p-10'>
              <div>
                <Badge variant='outline'>Built for the next generation of MT5 review</Badge>
                <h2 className='mt-5 text-balance text-3xl font-semibold tracking-tight'>
                  See your trading data clearly before the next session.
                </h2>
                <p className='mt-3 max-w-2xl text-sm leading-6 text-muted-foreground'>
                  Review performance, behavior and strategy evidence in a
                  modern workspace designed around the way traders actually
                  improve.
                </p>
              </div>
              <Button size='lg' asChild>
                <Link to='/sign-up'>
                  Create account
                  <ArrowRight />
                </Link>
              </Button>
            </div>
          </div>

          <footer className='mt-12 flex flex-col gap-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between'>
            <BrandLogoHorizontal className='h-6 w-[108px]' />
            <span>Built for analysis, review, backtesting and discipline.</span>
          </footer>
        </div>
      </section>
    </main>
  )
}

function SectionIntro({
  eyebrow,
  title,
  body,
}: {
  eyebrow: string
  title: string
  body: string
}) {
  return (
    <div className='mx-auto max-w-3xl text-center'>
      <Badge variant='outline'>{eyebrow}</Badge>
      <h2 className='mt-5 text-balance text-3xl font-semibold tracking-tight sm:text-5xl'>
        {title}
      </h2>
      <p className='mt-4 text-balance leading-7 text-muted-foreground'>
        {body}
      </p>
    </div>
  )
}

function ProductPreview() {
  return (
    <div className='mx-auto max-w-6xl overflow-hidden rounded-2xl border bg-card shadow-sm'>
      <div className='flex items-center justify-between border-b px-4 py-3 sm:px-5'>
        <div className='flex items-center gap-2 font-semibold'>
          <BrandIcon className='size-6' />
          FUADFX Companion
        </div>
        <Badge variant='secondary'>Analysis view</Badge>
      </div>

      <div className='grid lg:grid-cols-[0.28fr_0.72fr]'>
        <aside className='border-b bg-muted/20 p-4 lg:border-r lg:border-b-0'>
          <div className='space-y-2'>
            {['Overview', 'Pairs', 'Risk', 'Backtest'].map((item, index) => (
              <div
                key={item}
                className={`rounded-md px-3 py-2 text-sm ${
                  index === 0
                    ? 'bg-background font-medium'
                    : 'text-muted-foreground'
                }`}
              >
                {item}
              </div>
            ))}
          </div>
        </aside>

        <div className='p-5'>
          <div className='grid gap-4 lg:grid-cols-[0.82fr_1.18fr]'>
            <div>
              <div className='rounded-xl border bg-background p-5'>
                <div className='text-sm text-muted-foreground'>Edge snapshot</div>
                <div className='mt-2 text-4xl font-semibold tracking-tight'>
                  +$3,428
                </div>
                <div className='mt-1 text-sm text-muted-foreground'>
                  Performance, risk and behavior in one place
                </div>
                <div className='mt-6 grid grid-cols-2 gap-3'>
                  <Metric label='Profit factor' value='2.14' />
                  <Metric label='Win rate' value='58.5%' />
                  <Metric label='Backtest match' value='72%' />
                  <Metric label='Risk drift' value='4.8%' />
                </div>
              </div>
              <div className='mt-4 rounded-xl border bg-background p-5'>
                <div className='mb-3 flex items-center justify-between'>
                  <div className='font-semibold'>Behavior score</div>
                  <Gauge className='size-5 text-muted-foreground' />
                </div>
                <div className='h-2 overflow-hidden rounded-full bg-muted'>
                  <div className='h-full w-[76%] bg-primary' />
                </div>
                <p className='mt-3 text-sm text-muted-foreground'>
                  Plan followed on 76% of reviewed trades.
                </p>
              </div>
            </div>

            <div className='rounded-xl border bg-background p-5'>
              <div className='mb-5 flex items-start justify-between gap-4'>
                <div>
                  <div className='font-semibold'>Backtest candidates</div>
                  <div className='text-sm text-muted-foreground'>
                    Pair, session, outcome and execution grade
                  </div>
                </div>
                <BarChart3 className='size-5 text-muted-foreground' />
              </div>
              <div className='space-y-3'>
                {insightRows.map(([pair, session, pips, grade]) => (
                  <InsightRow
                    key={`${pair}-${session}`}
                    pair={pair}
                    session={session}
                    pips={pips}
                    grade={grade}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function FeatureRow({
  icon: Icon,
  title,
  body,
  index,
}: {
  icon: ElementType
  title: string
  body: string
  index: number
}) {
  return (
    <div className='grid gap-5 rounded-xl border bg-card p-6 sm:grid-cols-[auto_1fr] lg:p-8'>
      <div className='flex size-11 items-center justify-center rounded-lg border bg-background'>
        <Icon className='size-5' strokeWidth={1.5} />
      </div>
      <div>
        <div className='text-sm text-muted-foreground'>0{index}</div>
        <h3 className='mt-1 text-xl font-semibold'>{title}</h3>
        <p className='mt-3 leading-7 text-muted-foreground'>{body}</p>
      </div>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className='rounded-md border bg-card p-3'>
      <div className='text-xs text-muted-foreground'>{label}</div>
      <div className='mt-1 text-lg font-semibold'>{value}</div>
    </div>
  )
}

function InsightRow({
  pair,
  session,
  pips,
  grade,
}: {
  pair: string
  session: string
  pips: string
  grade: string
}) {
  const loss = pips.startsWith('-')

  return (
    <div className='grid grid-cols-[1fr_auto_auto] items-center gap-3 rounded-lg border p-3 text-sm'>
      <div>
        <div className='font-medium'>{pair}</div>
        <div className='text-xs text-muted-foreground'>{session}</div>
      </div>
      <span className={loss ? 'text-destructive' : 'text-foreground'}>
        {pips}
      </span>
      <Badge variant='secondary'>{grade}</Badge>
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
    <div className='rounded-xl border bg-card p-5'>
      <Icon className='mb-5 size-5' strokeWidth={1.5} />
      <h3 className='font-semibold'>{title}</h3>
      <p className='mt-2 text-sm leading-6 text-muted-foreground'>{body}</p>
    </div>
  )
}
