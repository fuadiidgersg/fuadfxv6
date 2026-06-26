import { type ColumnDef } from '@tanstack/react-table'
import { ArrowDownRight, ArrowUpRight, CheckCircle2, CircleAlert } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { DataTableColumnHeader } from '@/components/data-table'
import { directions, statuses } from '../data/data'
import { type Task as Trade } from '../data/schema'
import { DataTableRowActions } from './data-table-row-actions'

function tagValue(tags: string[] = [], key: string) {
  return (
    tags.find((tag) => tag.startsWith(`${key}:`))?.slice(key.length + 1) ?? ''
  )
}

function labelize(value: string) {
  return value
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

export const tasksColumns: ColumnDef<Trade>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && 'indeterminate')
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label='Select all'
        className='translate-y-0.5'
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label='Select row'
        className='translate-y-0.5'
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'id',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Ticket' />
    ),
    cell: ({ row }) => {
      const id = String(row.getValue('id'))
      const shortId = id.length > 14 ? `${id.slice(0, 6)}...${id.slice(-4)}` : id
      return (
        <div className='max-w-36 truncate font-mono text-xs text-muted-foreground' title={id}>
          {shortId}
        </div>
      )
    },
    enableSorting: false,
  },
  {
    id: 'review',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Review' />
    ),
    cell: ({ row }) => {
      const trade = row.original
      const hasReview =
        trade.strategy !== 'Unassigned' &&
        Boolean(trade.notes?.trim()) &&
        Boolean(
          tagValue(trade.tags, 'entry') ||
            tagValue(trade.tags, 'exit') ||
            tagValue(trade.tags, 'plan') ||
            tagValue(trade.tags, 'manage')
        )

      return hasReview ? (
        <Badge variant='secondary' className='gap-1 font-normal'>
          <CheckCircle2 className='size-3' />
          Done
        </Badge>
      ) : (
        <Badge variant='outline' className='gap-1 font-normal text-amber-600'>
          <CircleAlert className='size-3' />
          Review
        </Badge>
      )
    },
    enableSorting: false,
  },
  {
    accessorKey: 'pair',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Symbol' />
    ),
    meta: { className: 'ps-1', tdClassName: 'ps-4' },
    cell: ({ row }) => (
      <div className='flex items-center gap-2 font-medium'>
        {row.getValue('pair')}
      </div>
    ),
    filterFn: (row, id, value) => value.includes(row.getValue(id)),
  },
  {
    accessorKey: 'direction',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Side' />
    ),
    cell: ({ row }) => {
      const dir = directions.find((d) => d.value === row.getValue('direction'))
      const isLong = row.getValue('direction') === 'long'
      const Icon = isLong ? ArrowUpRight : ArrowDownRight
      return (
        <div className='flex items-center gap-1.5'>
          <Icon
            className={cn(
              'size-4',
              isLong ? 'text-emerald-600' : 'text-red-600'
            )}
          />
          <span className='text-sm capitalize'>{dir?.label}</span>
        </div>
      )
    },
    filterFn: (row, id, value) => value.includes(row.getValue(id)),
  },
  {
    accessorKey: 'lotSize',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Lots' />
    ),
    cell: ({ row }) => (
      <div className='tabular-nums'>
        {(row.getValue('lotSize') as number).toFixed(2)}
      </div>
    ),
  },
  {
    accessorKey: 'entry',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Entry' />
    ),
    cell: ({ row }) => (
      <div className='text-sm tabular-nums'>
        {(row.getValue('entry') as number).toFixed(5)}
      </div>
    ),
  },
  {
    accessorKey: 'exit',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Exit' />
    ),
    cell: ({ row }) => (
      <div className='text-sm tabular-nums'>
        {(row.getValue('exit') as number).toFixed(5)}
      </div>
    ),
  },
  {
    accessorKey: 'pips',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Pips' />
    ),
    cell: ({ row }) => {
      const v = row.getValue('pips') as number
      return (
        <div
          className={cn(
            'text-sm font-medium tabular-nums',
            v >= 0 ? 'text-emerald-600' : 'text-red-600'
          )}
        >
          {v >= 0 ? '+' : ''}
          {v.toFixed(1)}
        </div>
      )
    },
  },
  {
    accessorKey: 'pnl',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='P&L' />
    ),
    cell: ({ row }) => {
      const v = row.getValue('pnl') as number
      return (
        <div
          className={cn(
            'text-sm font-semibold tabular-nums',
            v >= 0 ? 'text-emerald-600' : 'text-red-600'
          )}
        >
          {v >= 0 ? '+' : ''}${v.toFixed(2)}
        </div>
      )
    },
  },
  {
    accessorKey: 'rMultiple',
    header: ({ column }) => <DataTableColumnHeader column={column} title='R' />,
    cell: ({ row }) => {
      const v = row.getValue('rMultiple') as number
      return (
        <Badge variant='outline' className='tabular-nums'>
          {v >= 0 ? '+' : ''}
          {v.toFixed(2)}R
        </Badge>
      )
    },
  },
  {
    id: 'executionGrade',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Grade' />
    ),
    cell: ({ row }) => {
      const entry = tagValue(row.original.tags, 'entry')
      const exit = tagValue(row.original.tags, 'exit')
      if (!entry && !exit)
        return <span className='text-muted-foreground'>-</span>
      return (
        <Badge variant='outline' className='font-normal tabular-nums'>
          {entry || '-'} / {exit || '-'}
        </Badge>
      )
    },
  },
  {
    id: 'planAdherence',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Plan' />
    ),
    cell: ({ row }) => {
      const plan = tagValue(row.original.tags, 'plan')
      if (!plan) return <span className='text-muted-foreground'>-</span>
      return (
        <Badge
          variant={
            plan === 'broken'
              ? 'destructive'
              : plan === 'followed'
                ? 'default'
                : 'secondary'
          }
          className='font-normal'
        >
          {labelize(plan)}
        </Badge>
      )
    },
  },
  {
    accessorKey: 'strategy',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Strategy' />
    ),
    cell: ({ row }) => (
      <Badge variant='secondary' className='font-normal'>
        {row.getValue('strategy')}
      </Badge>
    ),
    filterFn: (row, id, value) => value.includes(row.getValue(id)),
  },
  {
    accessorKey: 'status',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Status' />
    ),
    cell: ({ row }) => {
      const status = statuses.find((s) => s.value === row.getValue('status'))
      if (!status) return null
      return (
        <div className='flex w-24 items-center gap-2'>
          <status.icon
            className={cn(
              'size-4',
              status.value === 'win' && 'text-emerald-600',
              status.value === 'loss' && 'text-red-600',
              status.value === 'breakeven' && 'text-muted-foreground',
              status.value === 'open' && 'text-blue-500'
            )}
          />
          <span className='text-sm'>{status.label}</span>
        </div>
      )
    },
    filterFn: (row, id, value) => value.includes(row.getValue(id)),
  },
  {
    accessorKey: 'closedAt',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Closed' />
    ),
    cell: ({ row }) => {
      const d = row.getValue('closedAt') as Date
      return (
        <div className='text-sm text-muted-foreground'>
          {d.toLocaleDateString()}
        </div>
      )
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => <DataTableRowActions row={row} />,
  },
]
