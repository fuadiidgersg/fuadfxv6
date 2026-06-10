import { Link, createFileRoute } from '@tanstack/react-router'
import type { ElementType } from 'react'
import {
  ArrowRight,
  BarChart3,
  BookOpenCheck,
  CheckCircle2,
  Gauge,
  LineChart,
  LockKeyhole,
  NotebookPen,
  ShieldCheck,
  Tags,
} from 'lucide-react'
import { BrandIcon, BrandLogoHorizontal } from '@/assets/logo'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

export const Route = createFileRoute('/')({
  component: LandingPage,
})

const metrics = [
  ['Profit factor', '2.14'],
  ['Win rate', '58.5%'],
  ['Backtest match', '72%'],
  ['Risk drift', '4.8%'],
] as const

const features = [
  {
    icon: LineChart,
    title: 'Modern analysis for MT5 traders',
    body: 'See performance, pips, drawdown, pairs and execution behavior in a cleaner interface than MT5 reports.',
  },
  {
    icon: BarChart3,
    title: 'Know what is helping or hurting your edge',
    body: 'Compare sessions, symbols, direction, risk and consistency so the story behind the numbers is obvious.',
  },
  {
    icon: NotebookPen,
    title: 'Review the decision behind the result',
    body: 'Add notes, screenshots, emotion, execution grade and lessons so each trade improves the next one.',
  },
  {
    icon: Tags,
    title: 'Backtest ideas against real behavior',
    body: 'Review setups, strategy tags and trade context to validate what deserves more risk and what should be removed.',
  },
] as const

const workflow = [
  {
    icon: LineChart,
    title: 'Analyze',
    body: 'Turn MT5 account history into clear performance and risk insight.',
  },
  {
    icon: Gauge,
    title: 'Review',
    body: 'Check risk, pips, sessions, pairs and execution quality.',
  },
  {
    icon: BookOpenCheck,
    title: 'Backtest',
    body: 'Compare ideas against past trades before changing your plan.',
  },
] as const

function LandingPage() {
  return (
    <main className='min-h-svh overflow-x-hidden bg-background text-foreground'>
      <header className='sticky top-0 z-40 border-b bg-background/90 backdrop-blur-xl'>
        <div className='mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8'>
          <Link to='/' aria-label='FUADFX home' className='text-black dark:text-white'>
            <BrandLogoHorizontal className='h-7 w-[126px]' />
          </Link>
          <nav className='hidden items-center gap-8 text-sm text-muted-foreground md:flex'>
            <a href='#platform' className='transition hover:text-foreground'>
              Platform
            </a>
            <a href='#workflow' className='transition hover:text-foreground'>
              Workflow
            </a>
            <a href='#security' className='transition hover:text-foreground'>
              Security
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

      <section className='relative border-b'>
        <div className='mx-auto grid w-full max-w-7xl gap-12 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[0.86fr_1.14fr] lg:px-8 lg:py-24'>
          <div className='flex flex-col justify-center'>
            <Badge variant='outline' className='mb-6 w-fit rounded-full px-4 py-1'>
              Modern MT5 companion for serious traders
            </Badge>
            <h1 className='max-w-4xl text-balance text-5xl font-semibold leading-tight tracking-tight sm:text-6xl lg:text-7xl'>
              MT5 shows the trades. FUADFX shows the edge.
            </h1>
            <p className='mt-6 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg'>
              FUADFX is a premium companion for MT5 traders who want to
              analyze, review and backtest their trading data without fighting
              outdated reports, scattered notes or hard-to-read account history.
            </p>
            <div className='mt-9 flex w-full max-w-sm flex-col gap-3 sm:w-auto sm:max-w-none sm:flex-row'>
              <Button size='lg' asChild>
                <Link to='/sign-up'>
                  Start reviewing
                  <ArrowRight />
                </Link>
              </Button>
              <Button size='lg' variant='outline' asChild>
                <Link to='/sign-in'>Login with Google</Link>
              </Button>
            </div>
            <div className='mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm text-muted-foreground'>
              {['MT5 companion', 'Review workspace', 'Backtest-ready insights'].map(
                (item) => (
                  <span key={item} className='flex items-center gap-2'>
                    <CheckCircle2 className='size-4 text-foreground' />
                    {item}
                  </span>
                )
              )}
            </div>
          </div>

          <ProductPreview />
        </div>
      </section>

      <section id='platform' className='border-b'>
        <div className='mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20'>
          <SectionIntro
            eyebrow='Platform'
            title='The analysis layer MT5 should have had.'
            body='MT5 is powerful for execution, but its reporting experience makes it hard to study your own behavior. FUADFX turns trading data into a workspace for clarity, review and better decisions.'
          />
          <div className='mt-10 grid gap-px overflow-hidden rounded-xl border bg-border md:grid-cols-2'>
            {features.map((feature) => (
              <FeaturePanel key={feature.title} {...feature} />
            ))}
          </div>
        </div>
      </section>

      <section id='workflow' className='border-b bg-muted/25'>
        <div className='mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20'>
          <SectionIntro
            eyebrow='Workflow'
            title='Analyze, review, backtest, improve.'
            body='A simple loop for traders who want to understand their edge instead of guessing from raw MT5 history.'
          />
          <div className='mt-10 grid gap-4 md:grid-cols-3'>
            {workflow.map((step, index) => (
              <div key={step.title} className='rounded-lg border bg-background p-6'>
                <div className='flex items-start justify-between'>
                  <step.icon className='size-8' strokeWidth={1.5} />
                  <span className='flex size-9 items-center justify-center rounded-full border text-sm font-medium'>
                    {index + 1}
                  </span>
                </div>
                <h3 className='mt-8 text-lg font-semibold'>{step.title}</h3>
                <p className='mt-3 text-sm leading-6 text-muted-foreground'>
                  {step.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id='security'>
        <div className='mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20'>
          <div className='grid gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:items-center'>
            <div>
              <Badge variant='secondary'>Launch ready foundation</Badge>
              <h2 className='mt-5 text-3xl font-semibold tracking-tight sm:text-5xl'>
                Built around secure auth and a focused trading record.
              </h2>
              <p className='mt-5 leading-7 text-muted-foreground'>
                FUADFX keeps public marketing, Supabase Google login and the
                protected dashboard separated so traders land in the right place
                without compromising the product flow.
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
                icon={LineChart}
                title='Trader Metrics'
                body='Performance and journal data stay connected.'
              />
            </div>
          </div>

          <Separator className='my-12' />

          <div className='flex flex-col items-start justify-between gap-6 rounded-lg border bg-card p-6 sm:flex-row sm:items-center lg:p-8'>
            <div>
              <h2 className='text-2xl font-semibold tracking-tight'>
                Ready to see your MT5 data clearly?
              </h2>
              <p className='mt-2 text-sm text-muted-foreground'>
                Build the review habit now, with auto-sync designed into the
                future direction of the platform.
              </p>
            </div>
            <Button size='lg' asChild>
              <Link to='/sign-up'>
                Create account
                <ArrowRight />
              </Link>
            </Button>
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
    <div className='relative flex items-center'>
      <div className='w-full overflow-hidden rounded-xl border bg-card shadow-sm'>
        <div className='flex items-center justify-between border-b px-4 py-3 sm:px-5'>
          <div className='flex items-center gap-2 font-semibold'>
            <BrandIcon className='size-6' />
            FUADFX Companion
          </div>
          <Badge variant='secondary'>Analysis view</Badge>
        </div>

        <div className='grid gap-0 lg:grid-cols-[0.82fr_1.18fr]'>
          <div className='border-b p-5 lg:border-r lg:border-b-0'>
            <div className='text-sm text-muted-foreground'>Edge snapshot</div>
            <div className='mt-2 text-4xl font-semibold tracking-tight'>
              +$3,428
            </div>
            <div className='mt-1 text-sm text-muted-foreground'>
              Performance, risk and behavior in one place
            </div>
            <div className='mt-6 grid grid-cols-2 gap-3'>
              {metrics.map(([label, value]) => (
                <div key={label} className='rounded-md border bg-background p-3'>
                  <div className='text-xs text-muted-foreground'>{label}</div>
                  <div className='mt-1 text-lg font-semibold'>{value}</div>
                </div>
              ))}
            </div>
          </div>

          <div className='p-5'>
            <div className='mb-5 flex items-start justify-between gap-4'>
              <div>
                <div className='font-semibold'>Backtest candidates</div>
                <div className='text-sm text-muted-foreground'>
                  Pair, outcome and execution grade
                </div>
              </div>
              <BarChart3 className='size-5 text-muted-foreground' />
            </div>
            <div className='space-y-4'>
              <PairRow pair='EURUSD' pips='+184' grade='A' width='82%' />
              <PairRow pair='XAUUSD' pips='+96' grade='B+' width='64%' />
              <PairRow pair='GBPJPY' pips='-42' grade='C' width='38%' loss />
              <PairRow pair='USDJPY' pips='+73' grade='B' width='55%' />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function FeaturePanel({
  icon: Icon,
  title,
  body,
}: {
  icon: ElementType
  title: string
  body: string
}) {
  return (
    <div className='bg-background p-6 lg:p-8'>
      <div className='flex size-10 items-center justify-center rounded-md border bg-muted/40'>
        <Icon className='size-5' strokeWidth={1.5} />
      </div>
      <h3 className='mt-6 text-xl font-semibold'>{title}</h3>
      <p className='mt-3 text-sm leading-6 text-muted-foreground'>{body}</p>
    </div>
  )
}

function PairRow({
  pair,
  pips,
  grade,
  width,
  loss,
}: {
  pair: string
  pips: string
  grade: string
  width: string
  loss?: boolean
}) {
  return (
    <div className='grid gap-2'>
      <div className='flex items-center justify-between gap-3 text-sm'>
        <span className='font-medium'>{pair}</span>
        <div className='flex items-center gap-3'>
          <span className={loss ? 'text-destructive' : 'text-foreground'}>
            {pips}
          </span>
          <Badge variant='secondary'>{grade}</Badge>
        </div>
      </div>
      <div className='h-2 overflow-hidden rounded-full bg-muted'>
        <div
          className={loss ? 'h-full bg-destructive' : 'h-full bg-primary'}
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
    <div className='rounded-lg border bg-card p-5'>
      <Icon className='mb-5 size-5' strokeWidth={1.5} />
      <h3 className='font-semibold'>{title}</h3>
      <p className='mt-2 text-sm leading-6 text-muted-foreground'>{body}</p>
    </div>
  )
}
