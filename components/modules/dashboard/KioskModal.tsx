// components/dashboard/KioskModal.tsx
"use client"

import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SquareTerminal, CheckCircle2, XCircle, RefreshCw, Loader2, FilterX } from "lucide-react";
import { KioskStatus } from "@/type/dashboard";
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface Props {
    isOpen: boolean;
    onClose: () => void;
    data: KioskStatus[];
    onRefresh?: () => Promise<void> | void;
}

export function KioskModal({ isOpen, onClose, data, onRefresh }: Props) {
    const [seconds, setSeconds] = useState(30);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [filter, setFilter] = useState<'all' | 'online' | 'offline'>('all');
    const onlineCount = data.filter(k => k.isActive).length;
    const offlineCount = data.length - onlineCount;

    const toggleFilter = (type: 'online' | 'offline') => {
        setFilter(prev => prev === type ? 'all' : type);
    };

    const filteredData = useMemo(() => {
        if (filter === 'all') return data;
        return data.filter(k => filter === 'online' ? k.isActive : !k.isActive);
    }, [data, filter]);

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

                {/* 4. Clickable Status Summary Cards */}
                <div className="grid grid-cols-2 gap-4 mb-2">
                    <button
                        onClick={() => toggleFilter('online')}
                        className={cn(
                            "flex justify-between items-center p-3 rounded-lg border transition-all duration-200 outline-none",
                            // Active State
                            filter === 'online' 
                                ? "bg-green-50 border-green-500 ring-2 ring-green-500/20 shadow-sm" 
                                : "bg-green-50/50 border-green-100 hover:border-green-300 hover:bg-green-50",
                            // Dimmed State (when other is active)
                            filter === 'offline' && "opacity-50 grayscale-[0.5]"
                        )}
                    >
                        <span className="text-green-700 font-medium text-sm">Online</span>
                        <span className="text-green-700 font-bold text-xl">{onlineCount}</span>
                    </button>

                    <button 
                        onClick={() => toggleFilter('offline')}
                        className={cn(
                            "flex justify-between items-center p-3 rounded-lg border transition-all duration-200 outline-none",
                            // Active State
                            filter === 'offline' 
                                ? "bg-red-50 border-red-500 ring-2 ring-red-500/20 shadow-sm" 
                                : "bg-red-50/50 border-red-100 hover:border-red-300 hover:bg-red-50",
                            // Dimmed State (when other is active)
                            filter === 'online' && "opacity-50 grayscale-[0.5]"
                        )}
                    >
                        <span className="text-red-700 font-medium text-sm">Offline</span>
                        <span className="text-red-700 font-bold text-xl">{offlineCount}</span>
                    </button>
                </div>

                {/* 5. Clear Filter Helper (Optional UX touch) */}
                {filter !== 'all' && (
                    <div className="flex justify-end -mt-2 mb-2">
                        <Button variant="link" size="sm" onClick={() => setFilter('all')} className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground">
                            <FilterX className="mr-1 h-3 w-3" /> Clear Filter
                        </Button>
                    </div>
                )}

                <ScrollArea className="h-[400px] pr-4">
                    <div className={cn("space-y-3 transition-opacity duration-300", isRefreshing ? "opacity-50 pointer-events-none" : "opacity-100")}>
                        {filteredData.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                                <p>No {filter} kiosks found.</p>
                            </div>
                        ) : (
                            filteredData.map((k, i) => (
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
                            ))
                        )}
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    )
}