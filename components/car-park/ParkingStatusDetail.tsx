"use client"

import { 
    Save, Trash2, Ban, Car, User, Wallet, Unlock,
    ArrowRightLeft, Loader2, FileText, Smartphone, MapPin, AlertOctagon
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { DatePicker } from "@/components/ui/date-picker" 
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import { formatDateTime } from "@/lib/formatter"
import { CarParkPackage, ParkingDetailData, ParkingDetailStatus, CarParkPhase, CarParkUnit } from "@/type/car-park"
import { StatusBadge } from "@/components/themepark-support/it-poswf/status-badge"
import { cn } from "@/lib/utils"

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

    const disabledInputStyle = "disabled:opacity-100 bg-gray-100 dark:bg-zinc-800/40 text-gray-500 dark:text-zinc-400 border-transparent cursor-not-allowed focus-visible:ring-0";
    const editableInputStyle = "bg-white dark:bg-zinc-950 border-gray-200 dark:border-zinc-800 focus-visible:ring-indigo-500";
    const labelClass = "text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block";

    const isStaffType = data.type === "Staff";
    const isReservedParking = data.parkingMode === "Reserved";

    const checkIsParked = (statusStr: string) => {
        const s = (statusStr || "").toUpperCase();
        if (s.includes("AWAY") || s.includes("UNUSED")) return false;
        return s.includes("PARK") || s.includes("USED");
    };

    const isBlocked = (status.recordStatus || "").toLowerCase() === "blocked";
    const isReadOnly = isLoading || isBlocked; 
    const inputStateClass = isReadOnly ? disabledInputStyle : editableInputStyle;

    const renderStatusCard = (type: "qr" | "account", title: string, statusValue: string, subLabel: string) => {
        const isParked = checkIsParked(statusValue);
        const isBusy = submittingTarget === type;
        const buttonText = isParked ? "Assign Exit" : "Assign Entry";

        return (
            <Card className={`h-full border-l-[6px] shadow-sm transition-all ${isParked ? "border-l-red-500 bg-red-50/10" : "border-l-emerald-500 bg-emerald-50/10"}`}>
                <CardContent className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 h-full">
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest truncate">{title}</p>
                        <h3 className={`text-xl sm:text-2xl font-extrabold mt-1 sm:mt-2 truncate ${isParked ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                            {statusValue?.toUpperCase() || "-"}
                        </h3>
                        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1 font-medium truncate">{subLabel}</p>
                    </div>
                    <Button 
                        size="sm" variant="outline" 
                        onClick={() => onAssignEntry(type)} 
                        disabled={!!submittingTarget} 
                        className={`w-full sm:w-auto h-9 text-xs font-semibold shadow-sm shrink-0 ${isParked ? "bg-white text-red-700 hover:bg-red-50 border-red-200" : "bg-white text-emerald-700 hover:bg-emerald-50 border-emerald-200"}`}
                    >
                        {isBusy ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <ArrowRightLeft className="mr-2 h-3 w-3" />} 
                        {buttonText}
                    </Button>
                </CardContent>
            </Card>
        );
    };

    const renderWalletCard = () => (
        <Card className="h-full border-l-[6px] border-l-blue-500 bg-blue-50/10 shadow-sm">
            <CardContent className="p-5 flex flex-col justify-center h-full space-y-1">
                <div className="flex items-center gap-2 mb-1">
                    <Wallet className="h-4 w-4 text-blue-600" />
                    <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Wallet Balance</p>
                </div>
                <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-extrabold text-blue-700 dark:text-blue-400">
                        RM {(data.walletBalance || 0).toFixed(2)}
                    </span>
                    <span className="text-xs text-muted-foreground font-medium">Credits</span>
                </div>
            </CardContent>
        </Card>
    );

    if (isLoading) {
        return (
            <div className="space-y-8">
                <div className="flex justify-between"><Skeleton className="h-8 w-64" /><Skeleton className="h-8 w-32" /></div>
                <div className="grid grid-cols-3 gap-6"><Skeleton className="h-32" /><Skeleton className="h-32" /><Skeleton className="h-32" /></div>
                <div className="grid grid-cols-2 gap-8"><Skeleton className="h-[500px]" /><Skeleton className="h-[500px]" /></div>
            </div>
        )
    }

    return (
        <div className="space-y-8">
            {/* 1. HEADER */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-gray-900 dark:text-gray-100 flex flex-wrap items-center gap-3">
                        <span className="truncate max-w-[250px] md:max-w-none">{data.name}</span>
                        <StatusBadge 
                            status={status.recordStatus} 
                            className="text-xs md:text-sm px-3 py-1 align-middle"
                        />
                    </h1>
                    <p className="text-muted-foreground mt-2 text-sm md:text-base flex flex-wrap items-center gap-2">
                        <span className="font-mono bg-gray-100 dark:bg-zinc-800 px-2 py-0.5 rounded text-xs md:text-sm text-black dark:text-zinc-300 border border-gray-200 dark:border-zinc-700">
                            {data.email}
                        </span>
                        <span className="text-gray-400 hidden sm:inline">•</span> 
                        <span className="text-gray-600 dark:text-gray-400 text-xs md:text-sm">{data.type} Account</span>
                    </p>
                </div>
                
                {mode === "season" && (
                    <div className="grid grid-cols-2 sm:flex gap-3 w-full sm:w-auto">
                        <Button variant="ghost" onClick={onDelete} className="w-full sm:w-auto text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20">
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </Button>
                        {isBlocked ? (
                            <Button variant="outline" onClick={onUnblock} className="w-full sm:w-auto text-emerald-600 border-emerald-200 hover:bg-emerald-50 dark:border-emerald-900 dark:text-emerald-500 dark:hover:bg-emerald-900/20">
                                <Unlock className="mr-2 h-4 w-4" /> Unblock
                            </Button>
                        ) : (
                            <Button variant="outline" onClick={onBlock} className="w-full sm:w-auto text-amber-600 border-amber-200 hover:bg-amber-50 dark:border-amber-900 dark:text-amber-500 dark:hover:bg-amber-900/20">
                                <Ban className="mr-2 h-4 w-4" /> Block
                            </Button>
                        )}
                        <Button onClick={onSave} disabled={isSaving} className="col-span-2 sm:col-span-1 w-full sm:w-auto min-w-[140px] shadow-sm text-xs md:text-sm">
                            <Save className="mr-2 h-4 w-4" /> {isSaving ? "Saving..." : "Save"}
                        </Button>
                    </div>
                )}
            </div>

            {/* --- BLOCKED OVERLAY WRAPPER --- */}
            <div className="relative rounded-xl overflow-hidden min-h-[500px]">
                
                {/* THE OVERLAY: Visible only when blocked */}
                {isBlocked && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/10 dark:bg-black/40 backdrop-blur-[2px] transition-all duration-500">
                        {/* Modern Floating Card */}
                        <div className="relative bg-white dark:bg-zinc-950 p-8 rounded-3xl shadow-2xl border border-gray-100 dark:border-zinc-800 flex flex-col items-center text-center animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 max-w-sm mx-4">
                            
                            {/* Pulse Effect behind Icon */}
                            <div className="absolute top-8 left-1/2 -translate-x-1/2 w-16 h-16 bg-red-500/10 rounded-full animate-ping opacity-75" />
                            
                            {/* Icon */}
                            <div className="relative h-16 w-16 bg-red-50 dark:bg-red-900/20 rounded-2xl flex items-center justify-center mb-5 text-red-600 dark:text-red-400 shadow-sm ring-1 ring-red-100 dark:ring-red-900/40">
                                <Ban className="h-8 w-8" strokeWidth={2.5} />
                            </div>

                            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-50 tracking-tight">Account Suspended</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 leading-relaxed">
                                This season pass is currently blocked. <br/>
                                <span className="font-medium text-gray-700 dark:text-gray-300">Unblock</span> to edit details or manage access.
                            </p>
                        </div>
                    </div>
                )}

                <div className={cn("space-y-8 transition-all duration-300 p-1 pb-8", isBlocked && "opacity-20 grayscale filter blur-[1px] pointer-events-none select-none")}>
                
                    {/*  DYNAMIC STATUS BARS */}
                    <div className={`grid gap-6 items-stretch ${mode === 'superapp' ? 'grid-cols-1 md:grid-cols-3' : 'grid-cols-1 md:grid-cols-2'}`}>
                        <div className="w-full h-full">
                            {mode === "season" 
                                ? renderStatusCard("qr", "Parking Season Status", status.seasonStatus, ` ${status.lastExitSeason}`)
                                : renderStatusCard("account", "Parking IPoint Status", status.iPointStatus, ` ${status.lastExitIPoint}`)
                            }
                        </div>

                        {mode === "superapp" && (
                            <div className="w-full h-full">
                                {renderWalletCard()}
                            </div>
                        )}
                        
                        <Card className="h-full border-l-6 border-l-gray-300 shadow-sm">
                            <CardContent className="p-5 flex flex-col justify-center h-full text-sm text-gray-500 dark:text-gray-400 space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">Created</span>
                                    <div className="flex flex-col items-end">
                                        <span className="font-bold text-foreground text-xs md:text-sm">{status.createdBy}</span>
                                        <Badge variant="secondary" className="mt-1.5 font-normal text-[11px] bg-gray-100 dark:bg-zinc-800">
                                            {formatDateTime(status.createdOn)}
                                        </Badge>
                                    </div>
                                </div>
                                <Separator className="bg-gray-100 dark:bg-zinc-800" />
                                <div className="flex justify-between items-center">
                                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">Modified</span>
                                    <div className="flex flex-col items-end">
                                        <span className="font-bold text-foreground text-xs md:text-sm">{status.modifiedBy}</span>
                                        <Badge variant="secondary" className="mt-1.5 font-normal text-[11px] bg-gray-100 dark:bg-zinc-800">
                                            {formatDateTime(status.modifiedOn)}
                                        </Badge>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* 3. MAIN FORM GRID */}
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                        
                        {/* LEFT: USER PROFILE */}
                        <div className="space-y-6">
                            <Card className="h-full shadow-sm bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800">
                                <CardHeader className="bg-gray-50/50 dark:bg-zinc-800/50 border-b border-gray-200 dark:border-zinc-800 pb-4">
                                    <CardTitle className="flex items-center gap-2 text-lg text-gray-900 dark:text-gray-100">
                                        <User className="h-5 w-5 text-indigo-600 dark:text-indigo-400" /> User Information
                                    </CardTitle>
                                    <CardDescription className="dark:text-gray-400">Personal details are read-only.</CardDescription>
                                </CardHeader>
                                <CardContent className="p-6 space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label className={labelClass}>User Email</Label>
                                            <Input value={data.email} disabled className={disabledInputStyle} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className={labelClass}>Contact (Office)</Label>
                                            <Input value={data.contactOffice} disabled className={disabledInputStyle} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className={labelClass}>Full Name</Label>
                                            <Input value={data.name} disabled className={disabledInputStyle} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className={labelClass}>NRIC / Passport</Label>
                                            <Input value={data.nric} disabled className={disabledInputStyle} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className={labelClass}>Contact (H/P)</Label>
                                            <Input value={data.contactHp} disabled className={disabledInputStyle} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className={labelClass}>Company</Label>
                                            <Input value={data.company} disabled className={disabledInputStyle} />
                                        </div>
                                    </div>
                                    <Separator className="dark:bg-zinc-800" />
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label className={labelClass}>User Type</Label>
                                            <Select value={data.type} disabled> 
                                                <SelectTrigger className={disabledInputStyle}><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Staff">Staff</SelectItem>
                                                    <SelectItem value="Tenant">Tenant</SelectItem>
                                                    <SelectItem value="Non-Tenant">Non-Tenant</SelectItem>
                                                    <SelectItem value="Owner">Owner</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className={isStaffType ? "text-foreground font-semibold" : "text-muted-foreground"}>Staff ID</Label>
                                            <Input 
                                                value={data.staffId} 
                                                onChange={e => onDataChange({ staffId: e.target.value })} 
                                                disabled={!isStaffType || isReadOnly} 
                                                className={!isStaffType || isReadOnly ? disabledInputStyle : editableInputStyle}
                                            />
                                        </div>
                                    </div>
                                    
                                    {/* PHASE & UNIT SELECTION */}
                                    {mode === "season" && (
                                        <div className="bg-muted/20 p-4 rounded-lg border border-border/50">
                                            <Label className={labelClass}><MapPin className="h-3 w-3 inline mr-1" /> Location</Label>
                                            <div className="grid grid-cols-2 gap-4 mt-2">
                                                <div>
                                                    <label className="text-xs text-muted-foreground mb-1 block">Phase</label>
                                                    <Select 
                                                        value={data.phase} 
                                                        onValueChange={onPhaseChange}
                                                        disabled={!onPhaseChange || isReadOnly}
                                                    >
                                                        <SelectTrigger className={editableInputStyle}>
                                                            <SelectValue placeholder="Select Phase" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {phases.map(p => (
                                                                <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div>
                                                    <label className="text-xs text-muted-foreground mb-1 block">Unit No</label>
                                                    <Select 
                                                        value={data.unitNo} 
                                                        onValueChange={(val) => onDataChange({ unitNo: val })}
                                                        disabled={loadingUnits || !data.phase || isReadOnly}
                                                    >
                                                        <SelectTrigger className={isReadOnly ? disabledInputStyle : editableInputStyle}>
                                                            <SelectValue placeholder={loadingUnits ? "Loading..." : "Select Unit"} />
                                                        </SelectTrigger>
                                                        <SelectContent className="max-h-[200px]">
                                                            {units.map(u => (
                                                                <SelectItem key={u.id} value={String(u.id)}>{u.name}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                </CardContent>
                            </Card>
                        </div>

                        {/* RIGHT: DYNAMIC PANEL */}
                        <div className="space-y-6">
                            
                            {/* OPTION A: SEASON PARKING CONFIG */}
                            {mode === "season" && (
                                <Card className="h-full shadow-sm bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800">
                                    <CardHeader className="bg-gray-50/50 dark:bg-zinc-800/50 border-b border-gray-200 dark:border-zinc-800 pb-4">
                                        <CardTitle className="flex items-center gap-2 text-lg text-gray-900 dark:text-gray-100">
                                            <Car className="h-5 w-5 text-indigo-600 dark:text-indigo-400" /> Parking Information
                                        </CardTitle>
                                        <CardDescription className="dark:text-gray-400">Parking configuration and registered plates</CardDescription>
                                    </CardHeader>
                                    <CardContent className="p-6 space-y-6">
                                        <div className="flex flex-wrap items-center gap-4 p-4 bg-indigo-50/30 dark:bg-indigo-900/10 rounded-lg border border-indigo-100/50">
                                            <div className="flex items-center space-x-2 mr-4">
                                                <Checkbox 
                                                    id="isLpr" 
                                                    checked={data.isLpr} 
                                                    onCheckedChange={(c) => onDataChange({ isLpr: !!c})} 
                                                    disabled={isReadOnly}
                                                    className="data-[state=checked]:bg-indigo-600 border-indigo-400 dark:border-indigo-600 dark:data-[state=checked]:bg-indigo-500"
                                                />
                                                <Label htmlFor="isLpr" className="cursor-pointer font-semibold text-indigo-900 dark:text-indigo-200">Enable LPR</Label>
                                            </div>
                                            <div className="h-6 w-px bg-indigo-200 dark:bg-indigo-800 mx-2 hidden md:block"></div>
                                            <div className="flex flex-wrap gap-2">
                                                {data.parkingMode === "Reserved" ? (
                                                <Badge variant="secondary" className="bg-amber-100 text-amber-800 border-amber-200 shadow-sm dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800">
                                                    Reserved
                                                </Badge>
                                            ) : (
                                                <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 border-emerald-200 shadow-sm dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800">
                                                    Normal
                                                </Badge>
                                            )}
                                            {data.isHomestay ? (
                                                <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200 shadow-sm dark:bg-amber-900/30 dark:text-blue-300 dark:border-blue-800">
                                                    Homestay
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline" className="text-gray-400 border-dashed bg-white/50 dark:bg-zinc-800/50 dark:text-gray-500">
                                                    No Homestay
                                                </Badge>
                                            )}
                                            
                                            {data.isTandem ? (
                                            <Badge variant="secondary" className="bg-purple-100 text-purple-700 border-purple-200 shadow-sm dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800">
                                                Tandem
                                            </Badge>
                                            ) : (
                                                <Badge variant="outline" className="text-gray-400 border-dashed bg-white/50 dark:bg-zinc-800/50 dark:text-gray-500">
                                                    No Tandem
                                                </Badge>
                                            )}
                                        </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2 md:col-span-2">
                                                <Label className={labelClass}>Season Package</Label>
                                                <Select value={data.seasonPackage} onValueChange={(val) => onDataChange({ seasonPackage: val })} disabled={isReadOnly}>
                                                    <SelectTrigger className={editableInputStyle}><SelectValue placeholder="Select a package" /></SelectTrigger>
                                                    <SelectContent>
                                                        {packages.map(pkg => (<SelectItem key={pkg.id} value={String(pkg.id)}>{pkg.name}</SelectItem>))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2 md:col-span-2">
                                                <Label className={isReservedParking|| isReadOnly ? "font-semibold" : "text-muted-foreground"}>Bay No</Label>
                                                <Input value={data.bayNo} onChange={(e) => onDataChange({ bayNo: e.target.value })} disabled={!isReservedParking|| isReadOnly} className={(!isReservedParking || isReadOnly) ? disabledInputStyle : editableInputStyle} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className={labelClass}>Effective Date</Label>
                                                <DatePicker date={new Date(data.effectiveDate)} setDate={(d) => d && onDataChange({ effectiveDate: d.toISOString().split('T')[0] })} disabled={isReadOnly} className={`w-full ${inputStateClass}`} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className={labelClass}>Expiry Date</Label>
                                                <DatePicker date={new Date(data.expiryDate)} setDate={(d) => d && onDataChange({ expiryDate: d.toISOString().split('T')[0] })} disabled={isReadOnly} className={`w-full ${inputStateClass}`} />
                                            </div>
                                        </div>
                                        <Separator className="dark:bg-zinc-800" />
                                        <div>
                                            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3 block">Registered Vehicles</Label>
                                            <div className="space-y-3">
                                                <div className="relative"><Input value={data.plate1} className={`pl-9 font-bold uppercase ${inputStateClass}`} onChange={e => onDataChange({ plate1: e.target.value })} disabled={isReadOnly}/><div className="absolute left-3 top-2.5 text-xs font-bold text-indigo-500">01</div></div>
                                                <div className="relative"><Input value={data.plate2} className={`pl-9 uppercase ${inputStateClass}`} onChange={e => onDataChange({ plate2: e.target.value })} disabled={isReadOnly}/><div className="absolute left-3 top-2.5 text-xs font-bold text-gray-400">02</div></div>
                                                <div className="relative"><Input value={data.plate3} className={`pl-9 uppercase ${inputStateClass}`} onChange={e => onDataChange({ plate3: e.target.value })} disabled={isReadOnly}/><div className="absolute left-3 top-2.5 text-xs font-bold text-gray-400">03</div></div>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className={labelClass}><FileText className="h-3 w-3 inline mr-1"/> Remarks</Label>
                                            <Textarea value={data.remarks} onChange={e => onDataChange({ remarks: e.target.value })} className={`resize-none min-h-[80px] ${inputStateClass}`} disabled={isReadOnly}/>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* OPTION B: SUPERAPP VISITOR CONFIG */}
                            {mode === "superapp" && (
                                <Card className="h-full shadow-sm bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800">
                                    <CardHeader className="bg-gray-50/50 dark:bg-zinc-800/50 border-b border-gray-200 dark:border-zinc-800 pb-4">
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
                                                />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    </div>

                     {children && (
                            <div className="pt-2">
                                {children}
                            </div>
                        )}
                </div>
            </div>
        </div>
    )
}