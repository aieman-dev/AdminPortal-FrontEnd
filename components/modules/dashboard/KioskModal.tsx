// components/dashboard/KioskModal.tsx
"use client"

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SquareTerminal, CheckCircle2, XCircle, RefreshCw, Loader2 } from "lucide-react";
import { KioskStatus } from "@/type/dashboard";
import { cn } from "@/lib/utils"

interface Props {
    isOpen: boolean;
    onClose: () => void;
    data: KioskStatus[];
    onRefresh?: () => Promise<void> | void;
}

export function KioskModal({ isOpen, onClose, data, onRefresh }: Props) {
    const [seconds, setSeconds] = useState(30);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const onlineCount = data.filter(k => k.isActive).length;

    const handleAutoRefresh = async () => {
        if (!onRefresh) return;
        setIsRefreshing(true);
    
        const minLoadTime = new Promise(resolve => setTimeout(resolve, 800));
        
        await Promise.all([onRefresh(), minLoadTime]);
        
        setIsRefreshing(false);
        setSeconds(30);
    };

    // --- TIMER LOGIC ---
    useEffect(() => {
        if (!isOpen) return;

        const interval = setInterval(() => {
            setSeconds((prev) => {
                if (prev <= 1) {
                    handleAutoRefresh(); 
                    return 30;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [isOpen, onRefresh]);
    
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <div className="flex items-center justify-between pr-4">
                        <DialogTitle className="flex items-center gap-2">
                            <SquareTerminal className="h-5 w-5 text-indigo-600" /> Kiosk Status Monitor
                        </DialogTitle>
                    </div>

                    <div className="flex items-center justify-between mt-1">
                        <DialogDescription>Real-time status of all deployed kiosks.</DialogDescription>
                        
                        <div className={cn(
                            "flex items-center gap-2 text-xs font-medium px-2 py-1 rounded-md transition-colors duration-300",
                            isRefreshing 
                                ? "bg-indigo-100 text-indigo-700" 
                                : "bg-muted/50 text-muted-foreground" 
                        )}>
                            {isRefreshing ? (
                                <>
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                    <span>Syncing...</span>
                                </>
                            ) : (
                                <>
                                    <RefreshCw className="h-3 w-3" /> 
                                    <span>Refreshing in {seconds}s</span>
                                </>
                            )}
                        </div>
                    </div>
                </DialogHeader>

                {/* Status Summary */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-green-50 p-3 rounded-lg border border-green-100 flex justify-between">
                        <span className="text-green-700 font-medium">Online</span>
                        <span className="text-green-700 font-bold text-xl">{onlineCount}</span>
                    </div>
                    <div className="bg-red-50 p-3 rounded-lg border border-red-100 flex justify-between">
                        <span className="text-red-700 font-medium">Offline</span>
                        <span className="text-red-700 font-bold text-xl">{data.length - onlineCount}</span>
                    </div>
                </div>

                <ScrollArea className="h-[400px] pr-4">
                    <div className={cn("space-y-3 transition-opacity duration-300", isRefreshing ? "opacity-50 pointer-events-none" : "opacity-100")}>
                        {data.map((k, i) => (
                            <div key={i} className="flex justify-between items-center p-3 border rounded-lg hover:bg-muted/30 transition-colors">
                                <div>
                                    <div className="font-medium">{k.kioskName}</div>
                                    <div className="text-xs text-muted-foreground">{k.ip}</div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`text-xs font-medium ${k.isActive ? 'text-green-600' : 'text-red-600'}`}>
                                        {k.status}
                                    </span>
                                    {k.isActive ? 
                                        <CheckCircle2 className="h-4 w-4 text-green-500" /> : 
                                        <XCircle className="h-4 w-4 text-red-500" />
                                    }
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    )
}