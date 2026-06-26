import { Bot, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTasks } from './tasks-provider'

export function TasksPrimaryButtons() {
  const { setOpen } = useTasks()
  return (
    <div className='flex gap-2'>
      <Button
        variant='outline'
        className='space-x-1'
        onClick={() => setOpen('import')}
      >
        <span>Sync MT5</span> <Bot size={18} />
      </Button>
      <Button className='space-x-1' onClick={() => setOpen('create')}>
        <span>New journal entry</span> <Plus size={18} />
      </Button>
    </div>
  )
}
