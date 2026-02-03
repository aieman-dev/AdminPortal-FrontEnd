"use client"

import React, { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { EmptyState } from "@/components/portal/empty-state"
import { SearchX, ChevronRight, ChevronDown, ArrowUpDown } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { TableSkeleton } from "@/components/ui/table-skeleton"
import type { ReactNode } from "react"
import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils" 
import { PaginationControls } from "@/components/ui/pagination-controls"
import { Card, CardContent } from "@/components/ui/card"
import { MobileCard } from "@/components/ui/mobile-card"

export interface TableColumn<T> {
  header: string
  accessor: keyof T | ((row: T) => ReactNode)
  cell?: (value: any, row: T) => ReactNode
  className?: string
  sortable?: boolean 
}

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    totalRecords?: number; 
    pageSize?: number;
}

interface SortConfig {
    key: string;
    direction: 'asc' | 'desc';
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
  skeletonRowCount?: number;
  renderSubComponent?: (row: T) => ReactNode;
  onSort?: (key: string) => void;
  sortConfig?: SortConfig | null;
  onRowClick?: (row: T) => void;
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
  skeletonRowCount = 5,
  renderSubComponent,
  onSort,
  sortConfig,
  onRowClick
}: DataTableProps<T>) {

  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleRow = (rowId: string) => {
    const newSet = new Set(expandedRows);
    if (newSet.has(rowId)) newSet.delete(rowId);
    else newSet.add(rowId);
    setExpandedRows(newSet);
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      {/* === 2. DESKTOP VIEW (Hidden on Mobile) === */}
      <div className="overflow-x-auto rounded-md border bg-card">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              {renderSubComponent && <TableHead className="w-[48px] min-w-[48px] px-2"></TableHead>}
              
              {columns.map((column, index) => (
                <TableHead 
                    key={index} 
                    className={cn(
                        column.className,
                        column.sortable && "cursor-pointer hover:bg-muted/80 select-none"
                    )}
                    onClick={() => column.sortable && onSort && typeof column.accessor === 'string' && onSort(column.accessor as string)}
                >
                    <div className={cn(
                        "flex items-center gap-1",
                        column.className?.includes("text-right") && "justify-end",
                        column.className?.includes("text-center") && "justify-center"
                    )}>
                        {column.header}
                        {column.sortable && (
                            <ArrowUpDown className={cn(
                                "h-3 w-3 transition-opacity",
                                sortConfig?.key === (column.accessor as string)
                                    ? "text-primary opacity-100" 
                                    : "text-muted-foreground opacity-30"
                            )} />
                        )}
                    </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableSkeleton 
                columnCount={columns.length} 
                rowCount={skeletonRowCount} 
                showActionColumn={!!renderSubComponent}
              />
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length + (renderSubComponent ? 1 : 0)} className="p-0 h-60">
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
                    style={{ 
                                animationDelay: `${index * 0.05}s`, 
                                animationFillMode: 'both' 
                            }}
                        className={cn(
                            "animate-in fade-in slide-in-from-bottom-2 duration-300",
                            "transition-all border-b hover:bg-muted/30",
                            (onRowClick || renderSubComponent) ? "cursor-pointer" : "",
                            isExpanded 
                                ? "bg-muted/30 border-b-0 border-l-4 border-l-primary" 
                                : "border-l-4 border-l-transparent"
                        )}
                        onClick={() => {
                          if (renderSubComponent) toggleRow(rowKey);
                          if (onRowClick) onRowClick(row);
                        }}
                    >
                      
                      {renderSubComponent && (
                          <TableCell className="w-[48px] min-w-[48px] px-2 text-center">
                              {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                          </TableCell>
                      )}

                      {columns.map((column, colIndex) => {
                        const value = typeof column.accessor === "function" 
                            ? column.accessor(row) 
                            : row[column.accessor as keyof T];
                            
                        const cellContent = column.cell ? column.cell(value, row) : (value as ReactNode);
                        
                        return <TableCell key={colIndex} className={column.className}>{cellContent}</TableCell>
                      })}
                    </TableRow>

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

      {/* === 3. MOBILE VIEW (Visible < md) === */}
      <div className="md:hidden">
          {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="mb-4 p-4 border rounded-lg bg-card space-y-3">
                      <Skeleton className="h-6 w-1/2 mb-2" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                  </div>
              ))
          ) : data.length === 0 ? (
              <div className="py-12 border border-dashed rounded-lg bg-muted/10">
                  <EmptyState icon={emptyIcon} title={emptyTitle} description={emptyMessage} />
              </div>
          ) : (
              data.map((row, index) => (
                  <div key={keyExtractor(row, index)} className="relative">
                      <MobileCard 
                          row={row} 
                          columns={columns} 
                          onClick={() => {
                              if (renderSubComponent) toggleRow(keyExtractor(row, index));
                              if (onRowClick) onRowClick(row);
                          }}
                      />
                      {/* Mobile Expansion (Accordion Style) */}
                      {renderSubComponent && expandedRows.has(keyExtractor(row, index)) && (
                          <div className="ml-4 pl-4 border-l-2 border-primary mb-6 animate-in slide-in-from-top-2">
                              {renderSubComponent(row)}
                          </div>
                      )}
                  </div>
              ))
          )}
      </div>

      {/* === 4. PAGINATION CONTROLS === */}
      {!isLoading && pagination && pagination.totalPages > 1 && (
        <PaginationControls 
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            onPageChange={pagination.onPageChange}
            totalRecords={pagination.totalRecords}
            pageSize={pagination.pageSize || 10} 
        />
      )}
    </div>
  )
}