import { type SVGProps } from 'react'
import { cn } from '@/lib/utils'

export function Logo({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      id='fuadfx-logo'
      viewBox='0 0 32 32'
      xmlns='http://www.w3.org/2000/svg'
      role='img'
      aria-label='Fuadfx'
      className={cn('size-7', className)}
      {...props}
    >
      <title>Fuadfx</title>
      <defs>
        <linearGradient
          id='fuadfx-bg'
          x1='0'
          y1='0'
          x2='32'
          y2='32'
          gradientUnits='userSpaceOnUse'
        >
          <stop offset='0' stopColor='#10b981' />
          <stop offset='1' stopColor='#0284c7' />
        </linearGradient>
      </defs>

      {/* Rounded square badge with brand gradient */}
      <rect width='32' height='32' rx='8' fill='url(#fuadfx-bg)' />

      {/* Subtle top sheen */}
      <rect
        width='32'
        height='14'
        rx='8'
        fill='white'
        fillOpacity='0.08'
      />

      {/* Stylized F monogram */}
      <g fill='white'>
        <rect x='7' y='8' width='4' height='17' rx='1.5' />
        <rect x='7' y='8' width='13' height='4' rx='1.5' />
        <rect x='7' y='14.5' width='9' height='3.5' rx='1.5' />
      </g>

      {/* Upward trend arrow accent (forex bullish nod) */}
      <g
        stroke='white'
        strokeWidth='2'
        strokeLinecap='round'
        strokeLinejoin='round'
        fill='none'
      >
        <path d='M19 22 L25 16' />
        <path d='M21 16 L25 16 L25 20' />
      </g>
    </svg>
  )
}
