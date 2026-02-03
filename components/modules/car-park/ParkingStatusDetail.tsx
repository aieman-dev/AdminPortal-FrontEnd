"use client"

import { 
    Save, Trash2, Ban, User, Unlock, Loader2, MoreVertical
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { StatusBadge } from "@/components/shared-components/status-badge"
import { formatDateTime } from "@/lib/formatter"
import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// --- Sub-Components ---
import { CarParkConfigForm } from "@/components/modules/car-park/forms/CarParkConfigForm"
import { AccountProfileCard } from "@/components/modules/car-park/cards/AccountProfileCard"
import { StatusCard, WalletCard } from "@/components/modules/car-park/cards/StatusCards"
import { MetaDataCard } from "@/components/modules/car-park/cards/MetaDataCard"
import { BlockedOverlay } from "@/components/modules/car-park/overlays/BlockOverlay"

import { CarParkPackage, ParkingDetailData, ParkingDetailStatus, CarParkPhase, CarParkUnit } from "@/type/car-park"

interface ParkingStatusDetailProps {
    mode: "season" | "superapp"; 
    data: ParkingDetailData;
    status: ParkingDetailStatus;
    packages: CarParkPackage[];
    phases: CarParkPhase[]; 
    units: CarParkUnit[];   
    loadingUnits?: boolean; 
    isLoading: boolean;
    isSaving: boolean;
    submittingTarget: "qr" | "account" | null;
    onDataChange: (updates: Partial<ParkingDetailData>) => void;
    onPhaseChange?: (phaseId: string) => void; 
    onSave: () => void;
    onAssignEntry: (target: "qr" | "account") => void;
    onDelete?: () => void;
    onBlock?: () => void;
    onUnblock?: () => void;
    children?: React.ReactNode;
}

export function ParkingStatusDetail({
    mode,
    data,
    status,
    packages,
    phases,
    units,
    loadingUnits = false,
    isLoading,
    isSaving,
    submittingTarget,
    onDataChange,
    onPhaseChange,
    onSave,
    onAssignEntry,
    onDelete,
    onBlock,
    onUnblock,
    children
}: ParkingStatusDetailProps) {

    const isBlocked = (status.recordStatus || "").toLowerCase() === "blocked";
    const isReadOnly = isLoading || isBlocked; 

    const checkIsParked = (statusStr: string) => {
        const s = (statusStr || "").toUpperCase();
        return (s.includes("PARK") || s.includes("USED")) && !s.includes("AWAY") && !s.includes("UNUSED");
    };

    if (isLoading) return <DetailSkeleton mode={mode} />;

    return (
        <div className="flex flex-col space-y-6 pb-20 animate-in fade-in slide-in-from-bottom-2 duration-500 relative">
            
            {/* 1. HEADER & ACTIONS */}
            <div className={cn("flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4 relative z-50 bg-background/50 backdrop-blur-sm -mx-2 px-2 rounded-lg")}>
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold text-foreground tracking-tight">{data.name || "Unknown User"}</h1>
                        <StatusBadge status={status.recordStatus} className="h-6 text-xs px-2.5" />
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="bg-gray-100 dark:bg-zinc-800 px-2 py-0.5 rounded text-xs border font-mono truncate">{data.email}</span>
                        <span className="text-border hidden md:inline">|</span>
                        <span className="hidden md:inline">SuperApp {mode === "season" ? "Season" : "Visitor"}</span>
                    </div>
                </div>

                {/* ACTIONS - Responsive */}
                <div className="flex items-center gap-2 w-full md:w-auto">
                    
                    {/* PRIMARY ACTION (Always Visible) */}
                    <Button onClick={onSave} disabled={isSaving || isBlocked} className="flex-1 md:flex-none bg-indigo-600 hover:bg-indigo-700 text-white h-10 shadow-sm">
                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Save Changes
                    </Button>

                    {/* SECONDARY ACTIONS (Desktop: Buttons, Mobile: Dropdown) */}
                    {mode === "season" && (
                        <>
                            {/* Desktop View */}
                            <div className="hidden md:flex gap-2">
                                {isBlocked ? (
                                    <Button variant="outline" onClick={onUnblock} className="text-emerald-600 border-emerald-200 bg-emerald-50 hover:bg-emerald-100">
                                        <Unlock className="mr-2 h-4 w-4" /> Unblock
                                    </Button>
                                ) : (
                                    <Button variant="outline" onClick={onBlock} className="text-amber-600 border-amber-200 hover:bg-amber-50">
                                        <Ban className="mr-2 h-4 w-4" /> Block
                                    </Button>
                                )}
                                <Button variant="ghost" onClick={onDelete} className="text-red-600 hover:bg-red-50">
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>

                            {/* Mobile View - Dropdown */}
                            <div className="md:hidden">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" size="icon" className="h-10 w-10">
                                            <MoreVertical className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        {isBlocked ? (
                                            <DropdownMenuItem onClick={onUnblock} className="text-emerald-600">
                                                <Unlock className="mr-2 h-4 w-4" /> Unblock Access
                                            </DropdownMenuItem>
                                        ) : (
                                            <DropdownMenuItem onClick={onBlock} className="text-amber-600">
                                                <Ban className="mr-2 h-4 w-4" /> Block Access
                                            </DropdownMenuItem>
                                        )}
                                        <DropdownMenuItem onClick={onDelete} className="text-red-600 focus:text-red-600">
                                            <Trash2 className="mr-2 h-4 w-4" /> Delete Pass
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* --- BLOCKED OVERLAY --- */}
            {isBlocked && <BlockedOverlay />}

            {/* 2. TOP ROW: STATUS CARDS */}
            <div className={cn(
                "grid gap-6 items-stretch transition-all duration-300",
                mode === 'superapp' ? 'grid-cols-1 md:grid-cols-3' : 'grid-cols-1 md:grid-cols-2',
                isBlocked && "opacity-20 pointer-events-none grayscale filter blur-[1px] select-none"
            )}>
                <div className="w-full h-full">
                     <StatusCard 
                        title={mode === "season" ? "Season Pass Status" : "Access Status"}
                        status={mode === "season" ? status.seasonStatus : status.iPointStatus}
                        lastExit={mode === "season" ? status.lastExitSeason : status.lastExitIPoint}
                        isParked={checkIsParked(mode === "season" ? status.seasonStatus : status.iPointStatus)}
                        onAssign={() => onAssignEntry(mode === "season" ? "qr" : "account")}
                        isBusy={!!submittingTarget}
                    />
                </div>

                {mode === "superapp" && (
                    <div className="w-full h-full">
                        <WalletCard balance={data.walletBalance || 0} />
                    </div>
                )}
                
                <div className="w-full h-full">
                    <MetaDataCard status={status} />
                </div>
            </div>

            {/* 3. BOTTOM ROW: FORMS */}
            <div className={cn("grid grid-cols-1 xl:grid-cols-2 gap-8", isBlocked && "opacity-50 pointer-events-none")}>
                
                {/* LEFT: PROFILE */}
                <div className="space-y-6">
                    <AccountProfileCard 
                        data={data} 
                        mode={mode} 
                        isReadOnly={isReadOnly}
                        onDataChange={onDataChange}
                        phases={phases}
                        units={units}
                        loadingUnits={loadingUnits}
                        onPhaseChange={onPhaseChange}
                    />
                </div>

                {/* RIGHT: CONFIG */}
                <div className="space-y-6">
                    <CarParkConfigForm 
                        mode={mode}
                        data={data}
                        packages={packages}
                        isReadOnly={isReadOnly}
                        onDataChange={onDataChange}
                    />
                </div>
            </div>
            
            {/* 4. HISTORY TABLE (Full Width Below) */}
            <div className={cn("pt-4", isBlocked && "opacity-50 pointer-events-none")}>
                {children}
            </div>

        </div>
    )
}

function DetailSkeleton({ mode }: { mode: "season" | "superapp" }) {
    return (
        <div className="space-y-6 animate-pulse">
            
            {/* Header Skeleton */}
            <div className="flex justify-between items-center pb-4 border-b">
                <div className="space-y-2">
                    <Skeleton className="h-8 w-64 rounded-md" />
                    <Skeleton className="h-4 w-40 rounded-md" />
                </div>
                <div className="flex gap-2">
                    <Skeleton className="h-9 w-24 rounded-md" />
                    <Skeleton className="h-9 w-32 rounded-md" />
                </div>
            </div>

            {/* TOP ROW: Status Cards (Dynamic 2 or 3 Columns) */}
            <div className={`grid gap-6 ${mode === 'superapp' ? 'grid-cols-1 md:grid-cols-3' : 'grid-cols-1 md:grid-cols-2'}`}>
                {/* 1. Status Card */}
                <div className="h-40 rounded-xl border p-5 space-y-4">
                    <div className="flex justify-between">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-8 w-24" />
                    </div>
                    <Skeleton className="h-10 w-full mt-4 rounded-md" />
                </div>

                {/* 2. Wallet Card (Only for SuperApp) */}
                {mode === 'superapp' && (
                     <div className="h-40 rounded-xl border p-5 space-y-4 flex flex-col justify-center">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-8 w-32" />
                    </div>
                )}

                {/* 3. Metadata Card */}
                <div className="h-40 rounded-xl border p-5 space-y-4 flex flex-col justify-center">
                    <div className="flex justify-between items-center">
                        <Skeleton className="h-4 w-16" />
                        <div className="flex flex-col items-end gap-1"><Skeleton className="h-4 w-24" /><Skeleton className="h-3 w-20" /></div>
                    </div>
                    <div className="h-px bg-muted w-full my-2" />
                    <div className="flex justify-between items-center">
                        <Skeleton className="h-4 w-16" />
                        <div className="flex flex-col items-end gap-1"><Skeleton className="h-4 w-24" /><Skeleton className="h-3 w-20" /></div>
                    </div>
                </div>
            </div>

            {/* BOTTOM ROW: Profile & Config (Always 2 Columns) */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {/* User Profile */}
                <div className="min-h-[400px] rounded-xl border p-6 space-y-6">
                    <Skeleton className="h-6 w-40 mb-4" />
                    <div className="grid grid-cols-2 gap-6">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="space-y-2">
                                <Skeleton className="h-3 w-20" />
                                <Skeleton className="h-9 w-full rounded-md" />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Config Form */}
                <div className="min-h-[400px] rounded-xl border p-6 space-y-6">
                    <Skeleton className="h-6 w-48 mb-4" />
                    {mode === "season" && (
                         <div className="flex gap-4 mb-4">
                            <Skeleton className="h-6 w-32 rounded-full" />
                            <Skeleton className="h-6 w-20 rounded-full" />
                        </div>
                    )}
                    <div className="space-y-4">
                        <Skeleton className="h-9 w-full" />
                        <Skeleton className="h-24 w-full rounded-md" />
                    </div>
                </div>
            </div>
            
            {/* History Table */}
            <div className="h-64 rounded-xl border p-4">
                <Skeleton className="h-full w-full" />
            </div>
        </div>
    )
}