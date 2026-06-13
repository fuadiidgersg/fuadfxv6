import { type QueryClient } from '@tanstack/react-query'
import { createRootRouteWithContext, Outlet } from '@tanstack/react-router'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import { Toaster } from '@/components/ui/sonner'
import { NavigationProgress } from '@/components/navigation-progress'
import { GeneralError } from '@/features/errors/general-error'
import { NotFoundError } from '@/features/errors/not-found-error'

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient
}>()({
  component: () => {
    return (
      <>
        <NavigationProgress />
        <Outlet />
        <Toaster duration={5000} />
        {import.meta.env.MODE === 'development' && (
          <>
            <ReactQueryDevtools buttonPosition='bottom-left' />
            <TanStackRouterDevtools position='bottom-right' />
          </>
        )}
      </>
    )
  },
  pendingComponent: () => (
    <div className='flex min-h-svh items-center justify-center bg-background text-foreground'>
      <div className='space-y-2 text-center'>
        <div className='mx-auto size-8 animate-spin rounded-full border-2 border-muted border-t-foreground' />
        <p className='text-sm text-muted-foreground'>Loading FUADFX...</p>
      </div>
    </div>
  ),
  notFoundComponent: NotFoundError,
  errorComponent: GeneralError,
})
