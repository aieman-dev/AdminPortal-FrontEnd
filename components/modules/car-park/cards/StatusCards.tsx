"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowRightLeft, Loader2, Wallet } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatCurrency } from "@/lib/formatter"

interface StatusCardProps {
    title: string;
    status: string;
    lastExit: string;
    isParked: boolean;
    onAssign: () => void;
    isBusy: boolean;
}

export function StatusCard({ title, status, lastExit, isParked, onAssign, isBusy }: StatusCardProps) {
    const buttonText = isParked ? "Assign Exit" : "Assign Entry";

    return (
        <Card className={cn("h-full border-l-[6px] shadow-sm transition-all", isParked ? "border-l-amber-500 bg-amber-50/10" : "border-l-emerald-500 bg-emerald-50/10")}>
            <CardContent className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 h-full">
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest truncate">{title}</p>
                    <h3 className={cn("text-xl sm:text-2xl font-extrabold mt-1 sm:mt-2 truncate", isParked ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400")}>
                        {status?.toUpperCase() || "N/A"}
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1 font-medium truncate">
                        Last Exit: {lastExit}
                    </p>
                </div>
                <Button 
                    size="sm" variant="outline" 
                    onClick={onAssign} 
                    disabled={isBusy} 
                    className={cn("w-full sm:w-auto h-9 text-xs font-semibold shadow-sm shrink-0", isParked ? "bg-white text-amber-700 hover:bg-amber-50 border-amber-200" : "bg-white text-emerald-700 hover:bg-emerald-50 border-emerald-200")}
                >
                    {isBusy ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <ArrowRightLeft className="mr-2 h-3 w-3" />} 
                    {buttonText}
                </Button>
            </CardContent>
        </Card>
    )
}

export function WalletCard({ balance }: { balance: number }) {
    return (
        <Card className="h-full border-l-[6px] border-l-blue-500 bg-blue-50/10 shadow-sm">
            <CardContent className="p-5 flex flex-col justify-center h-full space-y-1">
                <div className="flex items-center gap-2 mb-1">
                    <Wallet className="h-4 w-4 text-blue-600" />
                    <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Wallet Balance</p>
                </div>
                <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-extrabold text-blue-700 dark:text-blue-400">
                        {formatCurrency(balance)}
                    </span>
                    <span className="text-xs text-muted-foreground font-medium">Credits</span>
                </div>
            </CardContent>
        </Card>
    )
}