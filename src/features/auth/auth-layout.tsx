import { BrandLogoHorizontal } from '@/assets/logo'

type AuthLayoutProps = {
  children: React.ReactNode
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className='container grid h-svh max-w-none items-center justify-center'>
      <div className='mx-auto flex w-full flex-col justify-center space-y-2 py-8 sm:p-8'>
        <div className='mb-5 flex items-center justify-center text-black dark:text-white'>
          <BrandLogoHorizontal className='h-12 w-[220px]' />
        </div>
        {children}
      </div>
    </div>
  )
}
