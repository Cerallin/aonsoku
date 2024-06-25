import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import clsx from 'clsx/lite'
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  useReactTable,
  Row,
  RowData,
  getPaginationRowModel,
  getFilteredRowModel,
} from '@tanstack/react-table'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/app/components/ui/table'
import { ColumnFilter } from '@/types/columnFilter'
import { DataTablePagination } from '@/app/components/ui/data-table-pagination'
import { Input } from '@/app/components/ui/input'

declare module '@tanstack/react-table' {
  interface TableMeta<TData extends RowData> {
    handlePlaySong: ((row: Row<TData>) => void) | undefined
  }
}

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  onRowClick?: (row: Row<TData>) => void
  handlePlaySong?: (row: Row<TData>) => void
  columnFilter?: ColumnFilter[]
  showPagination?: boolean
  showSearch?: boolean
  searchColumn?: string
}

export function DataTable<TData, TValue>({
  columns,
  data,
  onRowClick,
  handlePlaySong,
  columnFilter,
  showPagination = false,
  showSearch = false,
  searchColumn,
}: DataTableProps<TData, TValue>) {
  const { t } = useTranslation()
  const newColumns = columns.filter((column) => {
    return columnFilter?.includes(column.id as ColumnFilter)
  })

  const [columnSearch, setColumnSearch] = useState<ColumnFiltersState>([])

  const table = useReactTable({
    data,
    columns: columnFilter ? newColumns : columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: showPagination ? getPaginationRowModel() : undefined,
    onColumnFiltersChange: setColumnSearch,
    getFilteredRowModel: showSearch ? getFilteredRowModel() : undefined,
    meta: {
      handlePlaySong,
    },
    state: {
      columnFilters: columnSearch,
    },
  })

  return (
    <>
      {showSearch && searchColumn && (
        <div className="flex items-center mb-4">
          <Input
            placeholder={t('sidebar.search')}
            value={
              (table.getColumn(searchColumn)?.getFilterValue() as string) ?? ''
            }
            onChange={(event) =>
              table.getColumn(searchColumn)?.setFilterValue(event.target.value)
            }
            className="max-w-xs"
          />
        </div>
      )}
      <div className="rounded-md border">
        <Table className="cursor-default">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const smallerHeaders = ['index', 'starred', 'actions']
                  return (
                    <TableHead
                      key={header.id}
                      className={clsx(
                        'p-2',
                        smallerHeaders.includes(header.id) && 'w-8',
                        header.id === 'albumCount' && 'w-48',
                        header.id === 'artist' && 'hidden 2xl:table-cell',
                      )}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
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
                  onClick={() => onRowClick?.(row)}
                  className="group/tablerow"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={clsx(
                        'p-2 max-w-[600px]',
                        cell.column.id === 'artist' && 'hidden 2xl:table-cell',
                      )}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center p-2"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {showPagination && <DataTablePagination table={table} />}
    </>
  )
}
