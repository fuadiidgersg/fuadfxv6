import { toast } from 'sonner'
import { useTradesStore } from '@/stores/trades-store'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { TasksImportDialog } from './tasks-import-dialog'
import { TasksMutateDrawer } from './tasks-mutate-drawer'
import { useTasks } from './tasks-provider'

export function TasksDialogs() {
  const { open, setOpen, currentRow, setCurrentRow } = useTasks()
  const removeTrade = useTradesStore((s) => s.removeTrade)
  return (
    <>
      <TasksMutateDrawer
        key={`task-create-${open === 'create'}`}
        open={open === 'create'}
        onOpenChange={() => setOpen('create')}
      />

      <TasksImportDialog
        key='tasks-import'
        open={open === 'import'}
        onOpenChange={() => setOpen('import')}
      />

      {currentRow && (
        <>
          <TasksMutateDrawer
            key={`task-update-${currentRow.id}`}
            open={open === 'update'}
            onOpenChange={() => {
              setOpen('update')
              setTimeout(() => {
                setCurrentRow(null)
              }, 500)
            }}
            currentRow={currentRow}
          />

          <ConfirmDialog
            key='task-delete'
            destructive
            open={open === 'delete'}
            onOpenChange={() => {
              setOpen('delete')
              setTimeout(() => {
                setCurrentRow(null)
              }, 500)
            }}
            handleConfirm={() => {
              const ok = removeTrade(currentRow.id)
              setOpen(null)
              setTimeout(() => {
                setCurrentRow(null)
              }, 500)
              if (ok) {
                toast.success('Trade deleted.')
              } else {
                toast.error('Could not delete trade.')
              }
            }}
            className='max-w-md'
            title={`Delete this trade?`}
            desc={
              <>
                You are about to delete trade{' '}
                <strong>{currentRow.pair}</strong> ({currentRow.direction}) on{' '}
                <strong>{currentRow.account}</strong>. <br />
                This action cannot be undone.
              </>
            }
            confirmText='Delete'
          />
        </>
      )}
    </>
  )
}
