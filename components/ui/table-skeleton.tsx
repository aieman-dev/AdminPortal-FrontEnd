"use client"

import { Skeleton } from "@/components/ui/skeleton"
import { TableCell, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"

interface TableSkeletonProps {
  columnCount: number
  rowCount?: number
  showActionColumn?: boolean
}

export function TableSkeleton({ 
  columnCount, 
  rowCount = 5,
  showActionColumn = false
}: TableSkeletonProps) {
  return (
    <>
      {Array.from({ length: rowCount }).map((_, rowIndex) => (
        <TableRow key={`skeleton-row-${rowIndex}`}>
            {/* Optional Action Column (e.g. for expander) */}
            {showActionColumn && (
                <TableCell className="w-[48px] min-w-[48px] px-2 text-center">
                    <Skeleton className="h-4 w-4 rounded-full mx-auto" />
                </TableCell>
            )}
            
            {Array.from({ length: columnCount }).map((_, colIndex) => (
              <TableCell key={`skeleton-cell-${colIndex}`}>
                <Skeleton 
                    className="h-5 rounded-md opacity-70 animate-pulse" 
                    style={{ width: `${Math.random() * 30 + 60}%` }} 
                />
              </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  )
}