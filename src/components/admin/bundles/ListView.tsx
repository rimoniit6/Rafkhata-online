import DataTable, { type BulkAction, type ColumnDef } from '@/components/shared/DataTable'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Package, Plus } from 'lucide-react'
import type { BundleRecord } from './types'

export interface ListViewProps {
  loading: boolean
  bundles: BundleRecord[]
  total: number
  page: number
  setPage: (page: number) => void
  perPage: number
  setPerPage: (size: number) => void
  selection: {
    selectedIds: string[]
    toggleOne: (id: string) => void
    toggleAll: () => void
    allVisibleSelected: boolean
    someVisibleSelected: boolean
  }
  columns: ColumnDef<BundleRecord>[]
  bulkActions: BulkAction[]
  filters: React.ReactNode
  openCreate: () => void
}

export default function ListView({
  loading, bundles, total, page, setPage, perPage, setPerPage,
  selection, columns, bulkActions, filters, openCreate,
}: ListViewProps) {
  if (loading && bundles.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-44" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Skeleton key={i} className="h-56 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/20">
              <Package className="h-5 w-5" />
            </div>
            বান্ডেল ব্যবস্থাপনা
          </h1>
          <p className="text-muted-foreground text-sm mt-2 ml-12">মোট {total}টি বান্ডেল</p>
        </div>
        <Button
          className="gap-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 shadow-lg shadow-amber-600/20 transition-all hover:shadow-xl hover:shadow-amber-600/30"
          onClick={openCreate}
        >
          <Plus className="h-4 w-4" /> নতুন বান্ডেল
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={bundles}
        total={total}
        page={page}
        pageSize={perPage}
        onPageChange={setPage}
        onPageSizeChange={setPerPage}
        loading={loading}
        selectable
        selectedIds={selection.selectedIds}
        onToggleOne={selection.toggleOne}
        onToggleAll={selection.toggleAll}
        allVisibleSelected={selection.allVisibleSelected}
        someVisibleSelected={selection.someVisibleSelected}
        bulkActions={bulkActions}
        emptyMessage="কোনো বান্ডেল পাওয়া যায়নি"
        filters={filters}
      />
    </div>
  )
}
