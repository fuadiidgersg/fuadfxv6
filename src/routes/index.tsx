import { Link, createFileRoute } from '@tanstack/react-router'
import {
  ArrowRight,
  BarChart3,
  BookOpenCheck,
  CheckCircle2,
  LineChart,
  LockKeyhole,
  NotebookPen,
  ShieldCheck,
  Target,
  UploadCloud,
} from 'lucide-react'
import {
  BrandIcon,
  BrandLogoHorizontal,
  BrandLogoStacked,
} from '@/assets/logo'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

export const Route = createFileRoute('/')({
  component: LandingPage,
})

const heroMetrics = [
  ['Net pips', '+184'],
  ['Profit factor', '2.14'],
  ['Plan followed', '76%'],
  ['Max drawdown', '4.2%'],
]

const features = [
  {
    icon: UploadCloud,
    title: 'MT5 import',
    body: 'Import trade history, swaps, commissions, lots and pips without turning your review into admin work.',
  },
  {
    icon: BarChart3,
    title: 'Trader analytics',
    body: 'Review profit factor, drawdown, pips won and lost, session quality, pairs and long versus short performance.',
  },
  {
    icon: NotebookPen,
    title: 'Structured journal',
    body: 'Grade entry, exit, plan quality, market condition and management so each trade has useful context.',
  },
  {
    icon: Target,
    title: 'Strategy review',
    body: 'See which setups deserve more size, which mistakes are expensive, and what to improve next week.',
  },
]

const workflow = [
  'Import MT5 history',
  'Review risk, pips and pairs',
  'Grade execution quality',
  'Write the session lesson',
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
            <a href='#features' className='transition hover:text-foreground'>
              Features
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
        <div className='mx-auto flex w-full max-w-6xl flex-col items-center px-4 py-14 text-center sm:px-6 sm:py-20 lg:py-24'>
          <Badge variant='outline' className='mb-6'>
            Forex journal for disciplined traders
          </Badge>
          <BrandLogoStacked className='mb-7 h-24 w-[146px]' />
          <h1 className='max-w-4xl text-4xl font-semibold leading-tight sm:text-5xl lg:text-6xl'>
            Review trades like a professional forex desk.
          </h1>
          <p className='mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg'>
            FUADFX turns MT5 history into clean analytics, structured journal
            notes and repeatable review workflows for serious forex traders.
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

          <div id='product' className='mt-12 w-full'>
            <ProductPreview />
          </div>
        </div>
      </section>

      <section className='border-b'>
        <div className='mx-auto grid w-full max-w-6xl gap-6 px-4 py-8 sm:grid-cols-4 sm:px-6'>
          {heroMetrics.map(([label, value]) => (
            <div key={label} className='text-center sm:text-start'>
              <div className='text-2xl font-semibold tracking-tight'>{value}</div>
              <div className='mt-1 text-sm text-muted-foreground'>{label}</div>
            </div>
          ))}
        </div>
      </section>

      <section id='features' className='border-b'>
        <div className='mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 lg:py-20'>
          <div className='grid gap-10 lg:grid-cols-[0.78fr_1.22fr]'>
            <div>
              <Badge variant='secondary' className='mb-4'>
                Built for the review loop
              </Badge>
              <h2 className='text-3xl font-semibold tracking-tight sm:text-4xl'>
                Everything a forex journal needs, without clutter.
              </h2>
              <p className='mt-4 leading-7 text-muted-foreground'>
                The page is shaped around what traders actually check after a
                session: risk, pips, execution quality, mistakes, setups and
                the next action.
              </p>
            </div>
            <div className='grid gap-x-8 gap-y-9 sm:grid-cols-2'>
              {features.map((feature) => (
                <div key={feature.title} className='flex gap-4'>
                  <div className='mt-1 flex size-9 shrink-0 items-center justify-center rounded-md border bg-muted/40'>
                    <feature.icon className='size-4' />
                  </div>
                  <div>
                    <h3 className='font-semibold'>{feature.title}</h3>
                    <p className='mt-2 text-sm leading-6 text-muted-foreground'>
                      {feature.body}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id='workflow' className='border-b bg-muted/20'>
        <div className='mx-auto grid w-full max-w-6xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1fr_1.1fr] lg:py-20'>
          <div>
            <Badge variant='outline' className='mb-4'>
              Workflow
            </Badge>
            <h2 className='text-3xl font-semibold tracking-tight sm:text-4xl'>
              A calm process after every trading session.
            </h2>
            <p className='mt-4 leading-7 text-muted-foreground'>
              The app keeps the workflow simple enough to repeat every day,
              while still collecting the detail needed for serious improvement.
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
                <CheckCircle2 className='ml-auto size-4 text-emerald-600' />
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
      className='mx-auto max-w-5xl overflow-hidden rounded-lg border bg-card text-start'
      aria-label='FUADFX product preview'
    >
      <div className='flex items-center justify-between border-b px-4 py-3 sm:px-5'>
        <div className='flex items-center gap-2 font-semibold'>
          <BrandIcon className='size-6' />
          FUADFX Journal
        </div>
        <Badge variant='secondary'>Live account review</Badge>
      </div>

      <div className='grid gap-0 lg:grid-cols-[0.9fr_1.1fr]'>
        <div className='border-b p-5 lg:border-r lg:border-b-0'>
          <div className='flex items-start justify-between gap-4'>
            <div>
              <div className='text-sm text-muted-foreground'>Net P&L</div>
              <div className='mt-2 text-4xl font-semibold tracking-tight text-emerald-600'>
                +$3,428
              </div>
              <div className='mt-1 text-sm text-muted-foreground'>
                41 closed trades this month
              </div>
            </div>
            <Badge variant='outline'>MT5 import</Badge>
          </div>

          <div className='mt-6 grid grid-cols-2 gap-3'>
            <PreviewStat label='Win rate' value='58.5%' />
            <PreviewStat label='Profit factor' value='2.14' />
            <PreviewStat label='Pips won' value='+612' />
            <PreviewStat label='Pips lost' value='-428' />
          </div>
        </div>

        <div className='p-5'>
          <div className='mb-5'>
            <div className='font-semibold'>Performance by pair</div>
            <div className='text-sm text-muted-foreground'>
              Pips, risk and execution quality
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

function TrustItem({
  icon: Icon,
  title,
  body,
}: {
  icon: React.ElementType
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
