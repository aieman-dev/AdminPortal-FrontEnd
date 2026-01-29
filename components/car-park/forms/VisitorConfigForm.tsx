"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Smartphone, FileText } from "lucide-react"
import { ParkingDetailData } from "@/type/car-park"

interface VisitorConfigFormProps {
    data: ParkingDetailData;
    isReadOnly: boolean;
    onDataChange: (updates: Partial<ParkingDetailData>) => void;
}

export function VisitorConfigForm({ data, isReadOnly, onDataChange }: VisitorConfigFormProps) {
    const editableInputStyle = "bg-white dark:bg-zinc-950 border-gray-200 dark:border-zinc-800 focus-visible:ring-indigo-500";
    const labelClass = "text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block";
    
    return (
        <Card className="h-full shadow-sm bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800">
            <CardHeader className="bg-gray-50/50 dark:bg-zinc-800/50 border-b border-gray-200 dark:border-zinc-800 pb-4 px-6 pt-5">
                <CardTitle className="flex items-center gap-2 text-lg text-gray-900 dark:text-gray-100">
                    <Smartphone className="h-5 w-5 text-blue-600 dark:text-blue-400" /> SuperApp Details
                </CardTitle>
                <CardDescription className="dark:text-gray-400">Mobile app usage and internal notes</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label className={labelClass}><FileText className="h-3 w-3 inline mr-1"/> Internal Notes</Label>
                        <Textarea 
                            value={data.remarks} 
                            onChange={e => onDataChange({ remarks: e.target.value })} 
                            className={`resize-none min-h-[150px] ${editableInputStyle}`} 
                            placeholder="Add notes about this visitor..." 
                            disabled={isReadOnly}
                        />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}