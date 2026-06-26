import { Link } from '@tanstack/react-router'
import { Bot, ClipboardPlus, Settings, UserCog } from 'lucide-react'
import { useAuthStore } from '@/stores/auth-store'
import { useProfileStore } from '@/stores/profile-store'
import useDialogState from '@/hooks/use-dialog-state'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { SignOutDialog } from '@/components/sign-out-dialog'
import { TasksDialogs } from '@/features/tasks/components/tasks-dialogs'
import {
  TasksProvider,
  useTasks,
} from '@/features/tasks/components/tasks-provider'

export function ProfileDropdown() {
  return (
    <TasksProvider>
      <ProfileDropdownInner />
      <TasksDialogs />
    </TasksProvider>
  )
}

function ProfileDropdownInner() {
  const [open, setOpen] = useDialogState()
  const { setOpen: setTaskDialogOpen } = useTasks()
  const user = useAuthStore((s) => s.auth.user)
  const profile = useProfileStore((s) => s.profile)

  const displayName =
    profile?.displayName ||
    user?.user_metadata?.name ||
    user?.email?.split('@')[0] ||
    'User'
  const email = profile?.email || user?.email || ''
  const avatar = profile?.avatarUrl || user?.user_metadata?.avatar_url
  const initials = displayName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant='ghost' className='relative h-8 w-8 rounded-full'>
            <Avatar className='h-8 w-8'>
              <AvatarImage src={avatar} alt={displayName} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className='w-64' align='end' forceMount>
          <DropdownMenuLabel className='font-normal'>
            <div className='flex flex-col gap-1.5'>
              <p className='text-sm leading-none font-medium'>{displayName}</p>
              <p className='text-xs leading-none text-muted-foreground'>
                {email}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem onSelect={() => setTaskDialogOpen('import')}>
              <Bot className='me-2 size-4' />
              Sync MT5
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setTaskDialogOpen('create')}>
              <ClipboardPlus className='me-2 size-4' />
              New journal entry
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to='/settings'>
                <UserCog className='me-2 size-4' />
                Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to='/settings'>
                <Settings className='me-2 size-4' />
                Journal settings
              </Link>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant='destructive' onClick={() => setOpen(true)}>
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <SignOutDialog open={!!open} onOpenChange={setOpen} />
    </>
  )
}
