"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { formatDateTime } from "@/lib/formatter"
import { ParkingDetailStatus } from "@/type/car-park"

export function MetaDataCard({ status }: { status: ParkingDetailStatus }) {
    return (
        <Card className="h-full border-l-4 border-l-gray-300 shadow-sm">
            <CardContent className="p-6 flex flex-col justify-center h-full text-sm text-gray-500 dark:text-gray-400 space-y-4">
                
                <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Created</span>
                    <div className="flex flex-col items-end">
                        <span className="font-bold text-foreground text-sm">{status.createdBy || "System"}</span>
                        <span className="text-xs font-mono mt-0.5">{formatDateTime(status.createdOn)}</span>
                    </div>
                </div>
                
                <Separator className="bg-border/50" />
                
                <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Modified</span>
                    <div className="flex flex-col items-end">
                        <span className="font-bold text-foreground text-sm">{status.modifiedBy || "-"}</span>
                        <span className="text-xs font-mono mt-0.5">{formatDateTime(status.modifiedOn)}</span>
                    </div>
                </div>

            </CardContent>
        </Card>
    )
}