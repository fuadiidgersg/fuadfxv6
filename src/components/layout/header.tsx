import {
  Children,
  isValidElement,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { cn } from '@/lib/utils'
import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { MarketClock } from '@/components/layout/market-clock'
import { Search } from '@/components/search'

type HeaderProps = React.HTMLAttributes<HTMLElement> & {
  fixed?: boolean
  ref?: React.Ref<HTMLElement>
}

export function Header({ className, fixed, children, ...props }: HeaderProps) {
  const [offset, setOffset] = useState(0)
  const orderedChildren = useMemo(() => {
    const items = Children.toArray(children)
    let inserted = false
    const withClock: ReactNode[] = []

    for (const child of items) {
      withClock.push(child)
      if (isValidElement(child) && child.type === Search) {
        inserted = true
        withClock.push(
          <div key='market-clock' className='ms-2 me-3 shrink-0'>
            <MarketClock />
          </div>
        )
      }
    }

    if (!inserted) {
      withClock.push(
        <div key='market-clock' className='ms-auto shrink-0'>
          <MarketClock />
        </div>
      )
    }

    return withClock
  }, [children])

  useEffect(() => {
    const onScroll = () => {
      setOffset(document.body.scrollTop || document.documentElement.scrollTop)
    }

    // Add scroll listener to the body
    document.addEventListener('scroll', onScroll, { passive: true })

    // Clean up the event listener on unmount
    return () => document.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={cn(
        'z-50 h-16',
        fixed && 'header-fixed peer/header sticky top-0 w-[inherit]',
        offset > 10 && fixed ? 'shadow' : 'shadow-none',
        className
      )}
      {...props}
    >
      <div
        className={cn(
          'relative flex h-full items-center gap-3 p-4 sm:gap-4',
          offset > 10 &&
            fixed &&
            'after:absolute after:inset-0 after:-z-10 after:bg-background/20 after:backdrop-blur-lg'
        )}
      >
        <SidebarTrigger variant='outline' className='max-md:scale-125' />
        <Separator orientation='vertical' className='h-6' />
        {orderedChildren}
      </div>
    </header>
  )
}
