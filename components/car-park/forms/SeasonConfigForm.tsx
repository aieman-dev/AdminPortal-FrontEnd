"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { DatePicker } from "@/components/ui/date-picker" 
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { Car, CreditCard, FileText } from "lucide-react"
import { cn } from "@/lib/utils"
import { ParkingDetailData, CarParkPackage } from "@/type/car-park"

interface SeasonConfigFormProps {
    data: ParkingDetailData;
    packages: CarParkPackage[];
    isReadOnly: boolean;
    onDataChange: (updates: Partial<ParkingDetailData>) => void;
}

export function SeasonConfigForm({ 
    data, packages, isReadOnly, onDataChange 
}: SeasonConfigFormProps) {
    
    const inputClass = "h-9 bg-background border-input focus:border-indigo-500 focus:ring-indigo-500/20 text-sm shadow-sm transition-all";
    const labelClass = "text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block";
    const disabledStyle = "disabled:opacity-100 bg-gray-100 dark:bg-zinc-800/40 text-gray-500 dark:text-zinc-400 border-transparent cursor-not-allowed";
    const editableStyle = "bg-white dark:bg-zinc-950 border-gray-200 dark:border-zinc-800 focus-visible:ring-indigo-500";
    const inputStateClass = isReadOnly ? disabledStyle : editableStyle;

    const isReservedParking = data.parkingMode === "Reserved";

    return (
        <Card className="h-full shadow-sm bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800">
            <CardHeader className="bg-gray-50/50 dark:bg-zinc-800/50 border-b border-gray-200 dark:border-zinc-800 pb-4 px-6 pt-5">
                <CardTitle className="flex items-center gap-2 text-lg text-gray-900 dark:text-gray-100">
                    <Car className="h-5 w-5 text-indigo-600 dark:text-indigo-400" /> Parking Information
                </CardTitle>
                <CardDescription className="dark:text-gray-400">Parking configuration and registered plates</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
                
                {/* 1. LPR & BADGES ROW (Original Colored Box) */}
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
                            <Badge variant="secondary" className="bg-amber-100 text-amber-800 border-amber-200 shadow-sm dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800">Reserved</Badge>
                        ) : (
                            <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 border-emerald-200 shadow-sm dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800">Normal</Badge>
                        )}
                        {data.isHomestay ? (
                            <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200 shadow-sm dark:bg-amber-900/30 dark:text-blue-300 dark:border-blue-800">Homestay</Badge>
                        ) : (
                            <Badge variant="outline" className="text-gray-400 border-dashed bg-white/50 dark:bg-zinc-800/50 dark:text-gray-500">No Homestay</Badge>
                        )}
                        {data.isTandem ? (
                            <Badge variant="secondary" className="bg-purple-100 text-purple-700 border-purple-200 shadow-sm dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800">Tandem</Badge>
                        ) : (
                            <Badge variant="outline" className="text-gray-400 border-dashed bg-white/50 dark:bg-zinc-800/50 dark:text-gray-500">No Tandem</Badge>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2 md:col-span-2">
                        <Label className={labelClass}>Season Package</Label>
                        <Select value={data.seasonPackage} onValueChange={(val) => onDataChange({ seasonPackage: val })} disabled={isReadOnly}>
                            <SelectTrigger className={editableStyle}><SelectValue placeholder="Select a package" /></SelectTrigger>
                            <SelectContent>
                                {packages.map(pkg => (<SelectItem key={pkg.id} value={String(pkg.id)}>{pkg.name}</SelectItem>))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2 md:col-span-2">
                        <Label className={isReservedParking || isReadOnly ? "font-semibold" : "text-muted-foreground"}>Bay No</Label>
                        <Input 
                            value={data.bayNo} 
                            onChange={(e) => onDataChange({ bayNo: e.target.value })} 
                            disabled={!isReservedParking || isReadOnly} 
                            className={(!isReservedParking || isReadOnly) ? disabledStyle : editableStyle} 
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className={labelClass}>Effective Date</Label>
                        <DatePicker 
                            date={data.effectiveDate ? new Date(data.effectiveDate) : undefined} 
                            setDate={(d) => d && onDataChange({ effectiveDate: d.toISOString().split('T')[0] })} 
                            disabled={isReadOnly} 
                            className={`w-full ${inputStateClass}`} 
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className={labelClass}>Expiry Date</Label>
                        <DatePicker 
                            date={data.expiryDate ? new Date(data.expiryDate) : undefined} 
                            setDate={(d) => d && onDataChange({ expiryDate: d.toISOString().split('T')[0] })} 
                            disabled={isReadOnly} 
                            className={`w-full ${inputStateClass}`} 
                        />
                    </div>
                </div>

                <Separator className="dark:bg-zinc-800" />

                <div>
                    <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3 block">Registered Vehicles</Label>
                    <div className="space-y-3">
                        <div className="relative">
                            <Input value={data.plate1} className={`pl-9 font-bold uppercase ${inputStateClass}`} onChange={e => onDataChange({ plate1: e.target.value })} disabled={isReadOnly}/>
                            <div className="absolute left-3 top-2.5 text-xs font-bold text-indigo-500">01</div>
                        </div>
                        <div className="relative">
                            <Input value={data.plate2} className={`pl-9 uppercase ${inputStateClass}`} onChange={e => onDataChange({ plate2: e.target.value })} disabled={isReadOnly}/>
                            <div className="absolute left-3 top-2.5 text-xs font-bold text-gray-400">02</div>
                        </div>
                        <div className="relative">
                            <Input value={data.plate3} className={`pl-9 uppercase ${inputStateClass}`} onChange={e => onDataChange({ plate3: e.target.value })} disabled={isReadOnly}/>
                            <div className="absolute left-3 top-2.5 text-xs font-bold text-gray-400">03</div>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                     <div className="space-y-1.5">
                        <Label className={labelClass}>Amano Card No</Label>
                        <div className="relative">
                             <CreditCard className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                             <Input 
                                value={data.amanoCardNo} 
                                onChange={(e) => onDataChange({ amanoCardNo: e.target.value })} 
                                disabled={isReadOnly} 
                                className={cn(inputStateClass, "pl-9 font-mono")} 
                                placeholder="Scan Card ID"
                             />
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label className={labelClass}><FileText className="h-3 w-3 inline mr-1"/> Remarks</Label>
                    <Textarea 
                        value={data.remarks} 
                        onChange={e => onDataChange({ remarks: e.target.value })} 
                        className={`resize-none min-h-[80px] ${inputStateClass}`} 
                        disabled={isReadOnly}
                    />
                </div>
            </CardContent>
        </Card>
    );
}