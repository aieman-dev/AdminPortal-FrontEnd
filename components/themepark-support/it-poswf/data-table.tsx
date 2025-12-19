// components/themepark-support/it-poswf/data-table.tsx
import React, { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { EmptyState } from "@/components/portal/empty-state"
import { SearchX, ChevronRight, ChevronDown } from "lucide-react" // Import Chevrons
import { Skeleton } from "@/components/ui/skeleton"
import type { ReactNode } from "react"
import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils" 
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
  className?: string
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
  emptyTitle?: string;
  emptyIcon?: LucideIcon;
  pagination?: PaginationProps;
  isLoading?: boolean;
  renderSubComponent?: (row: T) => ReactNode; // NEW: Render function for expandable rows
}

export function DataTable<T>({ 
  columns, 
  data, 
  keyExtractor, 
  emptyMessage = "No data available", 
  emptyTitle = "No Results Found",
  emptyIcon = SearchX,
  pagination,
  isLoading = false,
  renderSubComponent
}: DataTableProps<T>) {

  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleRow = (rowId: string) => {
    const newSet = new Set(expandedRows);
    if (newSet.has(rowId)) newSet.delete(rowId);
    else newSet.add(rowId);
    setExpandedRows(newSet);
  };

  if (!isLoading && data.length === 0) {
    return (
      <div className="border rounded-md bg-background">
        <EmptyState 
          icon={emptyIcon} 
          title={emptyTitle} 
          description={emptyMessage} 
        />
      </div>
    )
  }

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
    <div className="space-y-4 animate-in fade-in duration-500">
      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              {renderSubComponent && <TableHead className="w-[50px]"></TableHead>}
              {columns.map((column, index) => (
                <TableHead key={index} className={column.className}>{column.header}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, rowIndex) => (
                <TableRow key={`skeleton-row-${rowIndex}`}>
                    {renderSubComponent && <TableCell><Skeleton className="h-4 w-4 rounded-full" /></TableCell>}
                    {columns.map((_, colIndex) => (
                      <TableCell key={`skeleton-cell-${colIndex}`}>
                        <Skeleton className="h-5 w-full rounded-md opacity-50 animate-pulse" />
                      </TableCell>
                  ))}
                </TableRow>
              ))
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length + (renderSubComponent ? 1 : 0)} className="p-0">
                        <EmptyState 
                            icon={emptyIcon} 
                            title={emptyTitle} 
                            description={emptyMessage} 
                        />
                    </TableCell>
              </TableRow>
            ) : (
              data.map((row, index) => {
                const rowKey = keyExtractor(row, index);
                const isExpanded = expandedRows.has(rowKey);

                return (
                  <React.Fragment key={rowKey}>
                    <TableRow 
                        className={cn(
                            "transition-colors border-b hover:bg-muted/30 animate-in fade-in slide-in-from-top-1 duration-300",
                            renderSubComponent ? "cursor-pointer" : "",
                            isExpanded ? "bg-muted/20 border-b-0" : ""
                        )}
                        onClick={() => renderSubComponent && toggleRow(rowKey)}
                    >
                      {renderSubComponent && (
                          <TableCell>
                              {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                          </TableCell>
                      )}

                      {columns.map((column, colIndex) => {
                        const value = typeof column.accessor === "function" ? column.accessor(row) : (row[column.accessor] as any)
                        const cellContent = column.cell ? column.cell(value, row) : value
                        return <TableCell key={colIndex} className={column.className}>{cellContent}</TableCell>
                      })}
                    </TableRow>

                    {/* Sub-Component Row */}
                    {isExpanded && renderSubComponent && (
                        <TableRow className="bg-muted/10 hover:bg-muted/10 border-t-0 shadow-inner animate-in fade-in slide-in-from-top-1 duration-200">
                            <TableCell colSpan={columns.length + 1} className="p-0">
                                {renderSubComponent(row)}
                            </TableCell>
                        </TableRow>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

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