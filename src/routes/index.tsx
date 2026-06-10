import { Link, createFileRoute } from '@tanstack/react-router'
import type { ElementType } from 'react'
import {
  ArrowRight,
  BarChart3,
  BookOpenCheck,
  CheckCircle2,
  FileSpreadsheet,
  Gauge,
  LineChart,
  LockKeyhole,
  NotebookPen,
  ShieldCheck,
  Tags,
  UploadCloud,
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
  ['Net pips', '+184'],
  ['Drawdown', '4.8%'],
] as const

const features = [
  {
    icon: UploadCloud,
    title: 'MT5 imports that stay reviewable',
    body: 'Upload account history and keep symbol, direction, close time, pips and P&L structured for fast review.',
  },
  {
    icon: BarChart3,
    title: 'Analytics traders actually use',
    body: 'Track profit factor, pips won and lost, drawdown, pair performance, sessions and long versus short behavior.',
  },
  {
    icon: NotebookPen,
    title: 'Journal the decision behind the result',
    body: 'Add notes, screenshots, emotion, execution grade and lessons so the next plan is based on evidence.',
  },
  {
    icon: Tags,
    title: 'Strategy tagging stays optional',
    body: 'Imported trades do not need forced strategy labels. Turn strategy prompts on only when it fits the workflow.',
  },
] as const

const workflow = [
  {
    icon: FileSpreadsheet,
    title: 'Import',
    body: 'Bring MT5 statement data into a clean trading record.',
  },
  {
    icon: Gauge,
    title: 'Review',
    body: 'Check risk, pips, sessions, pairs and execution quality.',
  },
  {
    icon: BookOpenCheck,
    title: 'Improve',
    body: 'Write one practical lesson before the next session.',
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
              Forex journal for disciplined traders
            </Badge>
            <h1 className='max-w-4xl text-balance text-5xl font-semibold leading-tight tracking-tight sm:text-6xl lg:text-7xl'>
              Turn every trade into a cleaner decision.
            </h1>
            <p className='mt-6 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg'>
              FUADFX is a premium forex journal for importing MT5 trades,
              analyzing performance and building a repeatable review process
              around execution, risk and psychology.
            </p>
            <div className='mt-9 flex w-full max-w-sm flex-col gap-3 sm:w-auto sm:max-w-none sm:flex-row'>
              <Button size='lg' asChild>
                <Link to='/sign-up'>
                  Start journaling
                  <ArrowRight />
                </Link>
              </Button>
              <Button size='lg' variant='outline' asChild>
                <Link to='/sign-in'>Login with Google</Link>
              </Button>
            </div>
            <div className='mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm text-muted-foreground'>
              {['Supabase Google Auth', 'MT5 imports', 'Pips analytics'].map(
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
            title='Everything a trader needs after the trade closes.'
            body='The landing page now leads with the real product promise: fast imports, accurate review metrics and a journal that improves behavior.'
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
            title='A simple loop traders can repeat every day.'
            body='Import the evidence, review what happened, then write the one rule that improves the next session.'
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
                Ready to review trades with more discipline?
              </h2>
              <p className='mt-2 text-sm text-muted-foreground'>
                Start with your next MT5 import and build the review habit.
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
            <span>Built for import, review and execution discipline.</span>
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
            FUADFX Journal
          </div>
          <Badge variant='secondary'>Account review</Badge>
        </div>

        <div className='grid gap-0 lg:grid-cols-[0.82fr_1.18fr]'>
          <div className='border-b p-5 lg:border-r lg:border-b-0'>
            <div className='text-sm text-muted-foreground'>Closed P&L</div>
            <div className='mt-2 text-4xl font-semibold tracking-tight'>
              +$3,428
            </div>
            <div className='mt-1 text-sm text-muted-foreground'>
              Month-to-date sample account
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
                <div className='font-semibold'>Pair performance</div>
                <div className='text-sm text-muted-foreground'>
                  Direction, pips and execution grade
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
