import { useState } from 'react'
import {
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { Download, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DataTablePagination,
  DataTableToolbar,
} from '@/components/data-table'
import { tasksColumns } from '@/features/tasks/components/tasks-columns'
import { TasksDialogs } from '@/features/tasks/components/tasks-dialogs'
import { TasksProvider } from '@/features/tasks/components/tasks-provider'
import { useTasks } from '@/features/tasks/components/tasks-provider'
import {
  directions,
  pairs,
  statuses,
  strategies,
} from '@/features/tasks/data/data'
import { useTrades } from '@/stores/trades-store'

function TradesTableInner() {
  const trades = useTrades()
  const { setOpen } = useTasks()
  const [rowSelection, setRowSelection] = useState({})
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'closedAt', desc: true },
  ])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    pips: false,
    rMultiple: false,
    entry: false,
    exit: false,
  })
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 8 })

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: trades,
    columns: tasksColumns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      globalFilter,
      pagination,
    },
    enableRowSelection: false,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    globalFilterFn: (row, _columnId, filterValue) => {
      const id = String(row.getValue('id')).toLowerCase()
      const pair = String(row.getValue('pair')).toLowerCase()
      const search = String(filterValue).toLowerCase()
      return id.includes(search) || pair.includes(search)
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  })

  // Hide the selection column on this compact view
  const visibleColumns = tasksColumns.filter((c) => c.id !== 'select')

  return (
    <div className='flex flex-col gap-3'>
      <DataTableToolbar
        table={table}
        searchPlaceholder='Search trades...'
        filters={[
          { columnId: 'status', title: 'Status', options: statuses },
          { columnId: 'pair', title: 'Pair', options: pairs },
          { columnId: 'strategy', title: 'Strategy', options: strategies },
          { columnId: 'direction', title: 'Side', options: directions },
        ]}
      />
      <div className='overflow-hidden rounded-md border'>
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers
                  .filter((h) => h.column.id !== 'select')
                  .map((header) => (
                    <TableHead
                      key={header.id}
                      colSpan={header.colSpan}
                      className={cn(
                        header.column.columnDef.meta?.className,
                        header.column.columnDef.meta?.thClassName
                      )}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row
                    .getVisibleCells()
                    .filter((c) => c.column.id !== 'select')
                    .map((cell) => (
                      <TableCell
                        key={cell.id}
                        className={cn(
                          cell.column.columnDef.meta?.className,
                          cell.column.columnDef.meta?.tdClassName
                        )}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={visibleColumns.length}
                  className='h-40 text-center'
                >
                  {trades.length === 0 ? (
                    <div className='flex flex-col items-center gap-3 py-6'>
                      <div>
                        <p className='font-medium'>No trades logged yet</p>
                        <p className='text-sm text-muted-foreground'>
                          Import an MT5 report or log your first trade manually.
                        </p>
                      </div>
                      <div className='flex flex-wrap justify-center gap-2'>
                        <Button size='sm' onClick={() => setOpen('import')}>
                          <Download className='size-4' />
                          Import MT5
                        </Button>
                        <Button
                          size='sm'
                          variant='outline'
                          onClick={() => setOpen('create')}
                        >
                          <Plus className='size-4' />
                          Log trade
                        </Button>
                      </div>
                    </div>
                  ) : (
                    'No trades match your filters.'
                  )}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {trades.length > 0 && <DataTablePagination table={table} />}
    </div>
  )
}

export function DashboardTrades() {
  return (
    <TasksProvider>
      <TradesTableInner />
      <TasksDialogs />
    </TasksProvider>
  )
}
