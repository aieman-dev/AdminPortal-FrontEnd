"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { User, MapPin } from "lucide-react"
import { ParkingDetailData, CarParkPhase, CarParkUnit } from "@/type/car-park"

interface AccountProfileCardProps {
    data: ParkingDetailData;
    mode: "season" | "superapp";
    isReadOnly: boolean;
    onDataChange: (updates: Partial<ParkingDetailData>) => void;
    // Location Props
    phases?: CarParkPhase[];
    units?: CarParkUnit[];
    loadingUnits?: boolean;
    onPhaseChange?: (phaseId: string) => void;
}

export function AccountProfileCard({ 
    data, mode, isReadOnly, onDataChange,
    phases = [], units = [], loadingUnits = false, onPhaseChange 
}: AccountProfileCardProps) {
    
    const inputClass = "h-9 bg-background border-input focus:border-indigo-500 focus:ring-indigo-500/20 text-sm shadow-sm transition-all";
    const disabledStyle = "disabled:opacity-100 bg-gray-100 dark:bg-zinc-800/40 text-gray-500 dark:text-zinc-400 border-transparent cursor-not-allowed";
    const editableStyle = "bg-white dark:bg-zinc-950 border-gray-200 dark:border-zinc-800 focus-visible:ring-indigo-500";
    
    const isStaffType = data.userType === "Staff";
    const labelClass = "text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block";

    return (
        <Card className="h-full shadow-sm bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800">
            <CardHeader className="bg-gray-50/50 dark:bg-zinc-800/50 border-b border-gray-200 dark:border-zinc-800 pb-4 px-6 pt-5">
                <CardTitle className="flex items-center gap-2 text-lg text-gray-900 dark:text-gray-100">
                    <User className="h-5 w-5 text-indigo-600 dark:text-indigo-400" /> User Information
                </CardTitle>
                <CardDescription className="dark:text-gray-400">Personal details are read-only.</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label className={labelClass}>User Email</Label>
                        <Input value={data.email} disabled className={disabledStyle} />
                    </div>
                    <div className="space-y-2">
                        <Label className={labelClass}>Contact (Office)</Label>
                        <Input value={data.contactOffice} disabled className={disabledStyle} />
                    </div>
                    <div className="space-y-2">
                        <Label className={labelClass}>Full Name</Label>
                        <Input value={data.name} disabled className={disabledStyle} />
                    </div>
                    <div className="space-y-2">
                        <Label className={labelClass}>NRIC / Passport</Label>
                        <Input value={data.nric} disabled className={disabledStyle} />
                    </div>
                    <div className="space-y-2">
                        <Label className={labelClass}>Contact (H/P)</Label>
                        <Input value={data.contactHp} disabled className={disabledStyle} />
                    </div>
                    <div className="space-y-2">
                        <Label className={labelClass}>Company</Label>
                        <Input value={data.company} disabled className={disabledStyle} />
                    </div>
                </div>
                
                <Separator className="dark:bg-zinc-800" />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label className={labelClass}>User Type</Label>
                        <Select value={data.userType} disabled> 
                            <SelectTrigger className={disabledStyle}><SelectValue /></SelectTrigger>
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
                            className={!isStaffType || isReadOnly ? disabledStyle : editableStyle}
                        />
                    </div>
                </div>
                
                {/* PHASE & UNIT SELECTION (Original Logic) */}
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
                                    <SelectTrigger className={editableStyle}>
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
                                    <SelectTrigger className={isReadOnly ? disabledStyle : editableStyle}>
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
    )
}