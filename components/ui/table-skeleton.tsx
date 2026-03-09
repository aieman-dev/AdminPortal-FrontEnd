"use client"

import { Skeleton } from "@/components/ui/skeleton"
import { TableCell, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"

interface TableSkeletonProps {
  columnCount: number
  rowCount?: number
  showActionColumn?: boolean
  rowClassName?: string 
  cellClassName?: string
}

export function TableSkeleton({ 
  columnCount, 
  rowCount = 5,
  showActionColumn = false,
  rowClassName,
  cellClassName = "py-4"
}: TableSkeletonProps) {
  return (
    <>
      {Array.from({ length: rowCount }).map((_, rowIndex) => (
        <TableRow key={`skeleton-row-${rowIndex}`} className={rowClassName}>
            {showActionColumn && (
                <TableCell className={cn("w-[48px] min-w-[48px] px-2 text-center", cellClassName)}>
                    <Skeleton className="h-4 w-4 rounded-full mx-auto" />
                </TableCell>
            )}
            
            {Array.from({ length: columnCount }).map((_, colIndex) => (
              <TableCell key={`skeleton-cell-${colIndex}`} className={cellClassName}>
                <div className="space-y-2">
                    {/* Primary Skeleton Bar */}
                    <Skeleton 
                        className="h-4 rounded-md opacity-70" 
                        style={{ width: `${Math.random() * 30 + 50}%` }} // Random width between 50-80%
                    />
                    {/* Optional Secondary Bar to simulate two-line data */}
                    {rowIndex % 2 === 0 && colIndex === 1 && (
                        <Skeleton className="h-3 w-1/3 rounded-md opacity-40" />
                    )}
                </div>
              </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  )
}