import { CalendarIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  useDateRangeStore,
  PRESET_LABELS,
  type DatePreset,
} from '@/stores/date-range-store'
import { cn } from '@/lib/utils'
import { useState } from 'react'

export function DateRangeFilter({ className }: { className?: string }) {
  const { preset, startDate, endDate, setPreset, setCustomRange } = useDateRangeStore()
  const [open, setOpen] = useState(false)
  const [from, setFrom] = useState<Date | undefined>(
    startDate ? new Date(startDate) : undefined
  )
  const [to, setTo] = useState<Date | undefined>(
    endDate ? new Date(endDate) : undefined
  )

  function handlePreset(val: string) {
    if (val !== 'custom') {
      setPreset(val as DatePreset)
    } else {
      setOpen(true)
    }
  }

  function handleApply() {
    if (from && to) {
      setCustomRange(from.toISOString(), to.toISOString())
    }
    setOpen(false)
  }

  const label =
    preset === 'custom' && startDate && endDate
      ? `${new Date(startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} – ${new Date(endDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`
      : PRESET_LABELS[preset]

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Select value={preset} onValueChange={handlePreset}>
        <SelectTrigger className='h-8 w-36 text-xs'>
          <CalendarIcon className='mr-1.5 size-3.5 text-muted-foreground' />
          <SelectValue>{label}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {(Object.keys(PRESET_LABELS) as DatePreset[]).map((p) => (
            <SelectItem key={p} value={p} className='text-xs'>
              {PRESET_LABELS[p]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          {preset === 'custom' ? (
            <Button variant='outline' size='sm' className='h-8 text-xs'>
              {label}
            </Button>
          ) : (
            <span />
          )}
        </PopoverTrigger>
        <PopoverContent className='w-auto p-3' align='start'>
          <p className='mb-2 text-xs font-medium text-muted-foreground'>Select range</p>
          <div className='flex gap-2'>
            <div>
              <p className='mb-1 text-[11px] text-muted-foreground'>From</p>
              <Calendar
                mode='single'
                selected={from}
                onSelect={setFrom}
                disabled={(d) => (to ? d > to : false)}
                initialFocus
              />
            </div>
            <div>
              <p className='mb-1 text-[11px] text-muted-foreground'>To</p>
              <Calendar
                mode='single'
                selected={to}
                onSelect={setTo}
                disabled={(d) => (from ? d < from : false)}
              />
            </div>
          </div>
          <div className='mt-2 flex justify-end gap-2'>
            <Button
              variant='ghost'
              size='sm'
              className='h-7 text-xs'
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              size='sm'
              className='h-7 text-xs'
              onClick={handleApply}
              disabled={!from || !to}
            >
              Apply
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
