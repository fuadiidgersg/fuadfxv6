import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

type BrandLogoProps = HTMLAttributes<HTMLSpanElement>

const brandAsset = {
  icon: {
    light: '/brand/fuadfx-icon-exact-black.png',
    dark: '/brand/fuadfx-icon-exact-white.png',
  },
  horizontal: {
    light: '/brand/fuadfx-wordmark-exact-black.png',
    dark: '/brand/fuadfx-wordmark-exact-white.png',
  },
  stacked: {
    light: '/brand/fuadfx-wordmark-exact-black.png',
    dark: '/brand/fuadfx-wordmark-exact-white.png',
  },
} as const

function BrandImage({
  asset,
  className,
  label,
  ...props
}: BrandLogoProps & {
  asset: (typeof brandAsset)[keyof typeof brandAsset]
  label: string
}) {
  return (
    <span
      role='img'
      aria-label={label}
      className={cn(
        'relative inline-block shrink-0 overflow-hidden',
        className
      )}
      {...props}
    >
      <img
        src={asset.light}
        alt=''
        aria-hidden='true'
        className='block size-full object-contain dark:hidden'
        draggable={false}
      />
      <img
        src={asset.dark}
        alt=''
        aria-hidden='true'
        className='hidden size-full object-contain dark:block'
        draggable={false}
      />
    </span>
  )
}

export function BrandIcon({ className, ...props }: BrandLogoProps) {
  return (
    <BrandImage
      asset={brandAsset.icon}
      label='FUADFX icon'
      className={cn('size-7', className)}
      {...props}
    />
  )
}

export function BrandLogoHorizontal({ className, ...props }: BrandLogoProps) {
  return (
    <BrandImage
      asset={brandAsset.horizontal}
      label='FUADFX'
      className={cn('h-6 w-[190px]', className)}
      {...props}
    />
  )
}

export function BrandLogoStacked({ className, ...props }: BrandLogoProps) {
  return (
    <BrandImage
      asset={brandAsset.horizontal}
      label='FUADFX'
      className={cn('h-7 w-[222px]', className)}
      {...props}
    />
  )
}

export function Logo(props: BrandLogoProps) {
  return <BrandIcon {...props} />
}
