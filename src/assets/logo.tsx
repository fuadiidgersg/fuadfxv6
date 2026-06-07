import type { CSSProperties, HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

type BrandLogoProps = HTMLAttributes<HTMLSpanElement>

const brandAsset = {
  icon: '/brand/fuadfx-icon-currentColor.svg',
  horizontal: '/brand/fuadfx-logo-horizontal-currentColor.svg',
  stacked: '/brand/fuadfx-logo-stacked-currentColor.svg',
} as const

function MaskedLogo({
  asset,
  className,
  style,
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
        'inline-block shrink-0 bg-current text-black dark:text-white',
        className
      )}
      style={
        {
          WebkitMask: `url(${asset}) center / contain no-repeat`,
          mask: `url(${asset}) center / contain no-repeat`,
          ...style,
        } as CSSProperties
      }
      {...props}
    />
  )
}

export function BrandIcon({ className, ...props }: BrandLogoProps) {
  return (
    <MaskedLogo
      asset={brandAsset.icon}
      label='FUADFX icon'
      className={cn('size-7', className)}
      {...props}
    />
  )
}

export function BrandLogoHorizontal({ className, ...props }: BrandLogoProps) {
  return (
    <MaskedLogo
      asset={brandAsset.horizontal}
      label='FUADFX'
      className={cn('h-7 w-[126px]', className)}
      {...props}
    />
  )
}

export function BrandLogoStacked({ className, ...props }: BrandLogoProps) {
  return (
    <MaskedLogo
      asset={brandAsset.stacked}
      label='FUADFX'
      className={cn('h-28 w-[170px]', className)}
      {...props}
    />
  )
}

export function Logo(props: BrandLogoProps) {
  return <BrandIcon {...props} />
}
