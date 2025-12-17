import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { EmptyState } from "@/components/portal/empty-state"
import { SearchX } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton" // Import Skeleton
import type { ReactNode } from "react"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis
} from "@/components/ui/pagination"

export interface TableColumn<T> {
  header: string
  accessor: keyof T | ((row: T) => ReactNode)
  cell?: (value: any, row: T) => ReactNode
}

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}

interface DataTableProps<T> {
  columns: TableColumn<T>[]
  data: T[]
  keyExtractor: (row: T, index: number) => string 
  emptyMessage?: string
  pagination?: PaginationProps;
  isLoading?: boolean; // New Prop
}

export function DataTable<T>({ 
  columns, 
  data, 
  keyExtractor, 
  emptyMessage = "No data available", 
  pagination,
  isLoading = false // Default to false
}: DataTableProps<T>) {

  // 1. Handle Empty State (Only if NOT loading and NO data)
  if (!isLoading && data.length === 0) {
    return (
      <div className="border rounded-md bg-background">
        <EmptyState 
          icon={SearchX} 
          title="No Results Found" 
          description={emptyMessage} 
        />
      </div>
    )
  }

  // Helper for pagination
  const getPageNumbers = () => {
    if (!pagination) return [];
    const { currentPage, totalPages } = pagination;
    const pages: (number | string)[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, '...', totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    return pages;
  };

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column, index) => (
                <TableHead key={index}>{column.header}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* 2. Handle Loading State */}
            {isLoading ? (
               Array.from({ length: 5 }).map((_, rowIndex) => (
                  <TableRow key={`skeleton-row-${rowIndex}`}>
                    {columns.map((_, colIndex) => (
                      <TableCell key={`skeleton-cell-${colIndex}`}>
                        <Skeleton className="h-4 w-full rounded-full opacity-50" />
                      </TableCell>
                    ))}
                  </TableRow>
               ))
            ) : (
              // 3. Render Data
              data.map((row, index) => (
                <TableRow key={keyExtractor(row, index)}>
                  {columns.map((column, colIndex) => {
                    const value = typeof column.accessor === "function" ? column.accessor(row) : (row[column.accessor] as any)
                    const cellContent = column.cell ? column.cell(value, row) : value

                    return <TableCell key={colIndex}>{cellContent}</TableCell>
                  })}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Render Pagination only if not loading and pages exist */}
      {!isLoading && pagination && pagination.totalPages > 1 && (
        <Pagination>
            <PaginationContent>
                <PaginationItem>
                    <PaginationPrevious 
                        onClick={() => pagination.onPageChange(Math.max(1, pagination.currentPage - 1))}
                        isActive={pagination.currentPage > 1}
                        className={pagination.currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                </PaginationItem>
                {getPageNumbers().map((page, i) => (
                    <PaginationItem key={i}>
                        {page === '...' ? (
                            <PaginationEllipsis />
                        ) : (
                            <PaginationLink
                                isActive={pagination.currentPage === page}
                                onClick={() => pagination.onPageChange(page as number)}
                                className="cursor-pointer"
                            >
                                {page}
                            </PaginationLink>
                        )}
                    </PaginationItem>
                ))}
                <PaginationItem>
                    <PaginationNext 
                        onClick={() => pagination.onPageChange(Math.min(pagination.totalPages, pagination.currentPage + 1))}
                        isActive={pagination.currentPage < pagination.totalPages}
                        className={pagination.currentPage === pagination.totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                </PaginationItem>
            </PaginationContent>
        </Pagination>
      )}
    </div>
  )
}