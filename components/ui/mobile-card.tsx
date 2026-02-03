// components/ui/mobile-card.tsx
import React, { ReactNode } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { TableColumn } from "@/components/shared-components/data-table"

interface MobileCardProps<T> {
    row: T
    columns: TableColumn<T>[]
    onClick?: () => void
}

export function MobileCard<T>({ 
    row, 
    columns, 
    onClick 
}: MobileCardProps<T>) {
    return (
        <Card className="mb-3 hover:shadow-md transition-shadow active:scale-[0.99] cursor-pointer bg-card overflow-hidden" onClick={onClick}>
            <CardContent className="p-4 space-y-3">
                {columns.map((col, idx) => {
                    const value = typeof col.accessor === "function" 
                        ? col.accessor(row) 
                        : row[col.accessor as keyof T];
                    const content = col.cell ? col.cell(value, row) : (value as ReactNode);
                    if (idx === 0) {
                        return (
                            <div key={idx} className="font-semibold text-base border-b border-border pb-2 mb-2 text-foreground break-words">
                                {content}
                            </div>
                        );
                    }
                    return (
                        <div key={idx} className="flex justify-between items-start text-sm gap-4">
                            <span className="text-muted-foreground shrink-0 text-xs uppercase tracking-wide pt-0.5 max-w-[30%]">
                                {col.header}
                            </span>
                            
                            {/* FIX: Added flex-1, min-w-0, and break-words to constrain content width */}
                            <div className="text-right font-medium text-foreground break-words flex-1 min-w-0">
                                {content}
                            </div>
                        </div>
                    );
                })}
            </CardContent>
        </Card>
    );
}