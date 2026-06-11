import { useEffect, useState } from 'react'
import { getRouteApi } from '@tanstack/react-router'
import {
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
import { useTableUrlState } from '@/hooks/use-table-url-state'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { DataTablePagination, DataTableToolbar } from '@/components/data-table'
import { directions, pairs, statuses, strategies } from '../data/data'
import { type Task as Trade } from '../data/schema'
import { DataTableBulkActions } from './data-table-bulk-actions'
import { tasksColumns as columns } from './tasks-columns'
import { useTasks } from './tasks-provider'

const route = getRouteApi('/_authenticated/tasks/')

type DataTableProps = {
  data: Trade[]
}

export function TasksTable({ data }: DataTableProps) {
  const { setOpen } = useTasks()
  const [rowSelection, setRowSelection] = useState({})
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'closedAt', desc: true },
  ])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    id: false,
  })

  const {
    globalFilter,
    onGlobalFilterChange,
    columnFilters,
    onColumnFiltersChange,
    pagination,
    onPaginationChange,
    ensurePageInRange,
  } = useTableUrlState({
    search: route.useSearch(),
    navigate: route.useNavigate(),
    pagination: { defaultPage: 1, defaultPageSize: 10 },
    globalFilter: { enabled: true, key: 'filter' },
    columnFilters: [
      { columnId: 'status', searchKey: 'status', type: 'array' },
      { columnId: 'pair', searchKey: 'pair', type: 'array' },
      { columnId: 'strategy', searchKey: 'strategy', type: 'array' },
      { columnId: 'direction', searchKey: 'direction', type: 'array' },
    ],
  })

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      globalFilter,
      pagination,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
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
    onPaginationChange,
    onGlobalFilterChange,
    onColumnFiltersChange,
  })

  const pageCount = table.getPageCount()
  useEffect(() => {
    ensurePageInRange(pageCount)
  }, [pageCount, ensurePageInRange])

  return (
    <div
      className={cn(
        'max-sm:has-[div[role="toolbar"]]:mb-16',
        'flex flex-1 flex-col gap-4'
      )}
    >
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
        <Table className='min-w-xl'>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
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
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                >
                  {row.getVisibleCells().map((cell) => (
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
                  colSpan={columns.length}
                  className='h-40 text-center'
                >
                  {data.length === 0 ? (
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
      {data.length > 0 && (
        <DataTablePagination table={table} className='mt-auto' />
      )}
      <DataTableBulkActions table={table} />
    </div>
  )
}
