"use client"

import React from "react"
import { UseFormReturn } from "react-hook-form"
import { CarParkFormValues } from "@/lib/schemas/car-park"
import { 
    User, Car, MapPin, Hash, Briefcase, Users, CreditCard, FileText, 
    Smartphone,
    Home,
    ScanLine
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { DatePicker } from "@/components/ui/date-picker"
import { cn } from "@/lib/utils"
import { CarParkPhase, CarParkUnit, CarParkPackage, CarParkDepartment } from "@/type/car-park"

interface CarParkFormProps {
    form: UseFormReturn<CarParkFormValues>;
    phases: CarParkPhase[];
    units: CarParkUnit[];
    packages: CarParkPackage[];
    departments?: CarParkDepartment[];
    loadingUnits?: boolean;
    loadingPhases?: boolean;
    onPhaseChange: (phaseId: string) => void;
    readOnlyUser?: boolean; 
}

export function CarParkForm({ 
    form, 
    phases, 
    units, 
    packages, 
    departments = [],
    loadingUnits = false,
    loadingPhases = false,
    onPhaseChange,
    readOnlyUser = false
}: CarParkFormProps) {
    
    const { register, watch, setValue, formState: { errors } } = form;

    const userType = watch("userType");
    const parkingType = watch("parkingType");
    const isTandemChecked = watch("isTandem");

    // Watch toggles for styling
    const isMobileQr = watch("isMobileQr");
    const isHomestay = watch("isHomestay");
    const isLpr = watch("isLpr");

    // Styles
    const inputClass = "h-9 bg-white dark:bg-zinc-950 border-gray-200 dark:border-zinc-800 focus:border-indigo-500 focus:ring-indigo-500/20 text-sm shadow-sm transition-all";
    const labelClass = "text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block";
    const disabledClass = "bg-gray-100 dark:bg-zinc-800/50 text-gray-500 cursor-not-allowed";

    return (
        <div className="space-y-8 pb-10">
            {/* === CARD 1: PRIMARY HOLDER INFO === */}
            <Card className="border-0 shadow-lg bg-card/50 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both">
                <CardHeader className="px-8 pt-8 pb-4 border-b border-border/40">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-lg font-semibold flex items-center gap-3 text-indigo-600 dark:text-indigo-400">
                            <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                                <User className="h-5 w-5" />
                            </div>
                            Primary Holder Information
                        </CardTitle>
                        {readOnlyUser && <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 px-3 py-1">Review Mode</Badge>}
                    </div>
                </CardHeader>
                
                <CardContent className="p-8 grid gap-8">
                    {/* Account Email */}
                    <div>
                        <Label className={labelClass}>Account Email</Label>
                        <Input 
                            {...register("userEmail")} 
                            readOnly 
                            className={cn(inputClass, "bg-gray-50/50 border-dashed text-gray-500 cursor-not-allowed")} 
                        />
                        {errors.userEmail && <span className="text-[10px] text-red-500 font-medium mt-1">{errors.userEmail.message}</span>}
                    </div>

                    {/* Personal Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div>
                            <Label className={labelClass}>Full Name <span className="text-red-500">*</span></Label>
                            <Input {...register("name")} className={inputClass} placeholder="Full Name" disabled={readOnlyUser} />
                            {errors.name && <span className="text-[10px] text-red-500 font-medium mt-1 block">{errors.name.message}</span>}
                        </div>
                        <div>
                            <Label className={labelClass}>NRIC / Passport <span className="text-red-500">*</span></Label>
                            <Input {...register("nric")} className={inputClass} placeholder="ID Number" disabled={readOnlyUser} />
                            {errors.nric && <span className="text-[10px] text-red-500 font-medium mt-1 block">{errors.nric.message}</span>}
                        </div>
                        <div>
                            <Label className={labelClass}>Company Name</Label>
                            <Input {...register("companyName")} className={inputClass} placeholder="Company (Optional)" disabled={readOnlyUser} />
                        </div>
                    </div>

                    {/* Contact Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <Label className={labelClass}>Mobile No. (H/P) <span className="text-red-500">*</span></Label>
                            <Input {...register("mobileContact")} type="tel" className={inputClass} placeholder="+60..." disabled={readOnlyUser} />
                            {errors.mobileContact && <span className="text-[10px] text-red-500 font-medium mt-1 block">{errors.mobileContact.message}</span>}
                        </div>
                        <div> 
                            <Label className={labelClass}>Office Contact</Label>
                            <Input {...register("officeContact")} type="tel" className={inputClass} placeholder="+60" disabled={readOnlyUser} />
                        </div>
                    </div>

                    <Separator />

                    {/* === USER TYPE SELECTION & STAFF DETAILS === */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-2 items-start">
                        
                        {/* LEFT: User Type Selection (Compact Original Style) */}
                        <div>
                            <Label className={labelClass}>User Classification</Label>
                            <div className="flex flex-wrap gap-3 pt-1">
                                {["Staff", "Tenant", "Non-Tenant", "Owner"].map((t) => {
                                    const isActive = userType === t;
                                    return (
                                        <button
                                            key={t}
                                            type="button"
                                            disabled={readOnlyUser}
                                            onClick={() => setValue("userType", isActive ? ("" as any) : (t as any))}
                                            className={cn(
                                                "flex items-center gap-2 px-4 py-2.5 rounded-lg border text-xs font-medium transition-all duration-200",
                                                isActive 
                                                    ? "border-indigo-600 bg-indigo-50 text-indigo-700 ring-1 ring-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-300" 
                                                    : "bg-white hover:bg-gray-50 border-gray-200 text-gray-600",
                                                readOnlyUser && !isActive && "opacity-50 cursor-not-allowed"
                                            )}
                                        >
                                            <div className={cn("w-2 h-2 rounded-full", isActive ? "bg-indigo-600" : "bg-gray-300")} />
                                            {t}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>

                        {/* RIGHT: Dynamic Fields (Empty until selected) */}
                        <div className="space-y-6 min-h-[120px]">
                            
                            {/* Scenario A: STAFF Fields */}
                            {userType === "Staff" && (
                                <div className="animate-in fade-in slide-in-from-left-4 duration-300 space-y-4">
                                    <div className="bg-gray-50/50 dark:bg-zinc-900/50 p-5 rounded-xl border border-dashed border-gray-200 dark:border-zinc-800">
                                        <Label className={labelClass}>Staff Information</Label>
                                        <div className="space-y-4 mt-3">
                                            <div className="relative">
                                                <Briefcase className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                                <Input 
                                                    {...register("staffId")} 
                                                    placeholder="Enter Staff ID Number" 
                                                    disabled={readOnlyUser} 
                                                    className={cn(inputClass, "pl-10", readOnlyUser && disabledClass)} 
                                                />
                                            </div>

                                            <Select 
                                                onValueChange={(v) => setValue("department", v)} 
                                                value={watch("department")}
                                                disabled={readOnlyUser}
                                            >
                                                <SelectTrigger className={cn(inputClass, readOnlyUser && disabledClass)}>
                                                    <SelectValue placeholder="Select Department" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {departments.length > 0 ? (
                                                        departments.map((dept) => (
                                                            <SelectItem key={dept.code} value={dept.code}>
                                                                {dept.name}
                                                            </SelectItem>
                                                        ))
                                                    ) : (
                                                        <div className="p-2 text-xs text-muted-foreground text-center">No departments loaded</div>
                                                    )}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Scenario B: TENANT / NON-TENANT / OWNER Fields */}
                            {(userType === "Tenant" || userType === "Non-Tenant" || userType === "Owner") && (
                                <div className="animate-in fade-in slide-in-from-left-4 duration-300 space-y-4">
                                     <div>
                                        <Label className={labelClass}>Unit Location</Label>
                                        <div className="grid grid-cols-1 gap-4 mt-3">
                                            <div>
                                                <label className="text-xs text-muted-foreground mb-1 block">Phase / Building</label>
                                                <Select 
                                                    onValueChange={onPhaseChange} 
                                                    value={watch("phase")}
                                                    disabled={readOnlyUser || loadingPhases}
                                                >
                                                    <SelectTrigger className={cn(inputClass, "w-full", readOnlyUser && disabledClass)}>
                                                        <span className="truncate text-left block w-full"> 
                                                            <SelectValue placeholder={loadingPhases ? "Loading Phases..." : "Select Phase"} />
                                                        </span>
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {phases.map((p) => (
                                                            <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                {errors.phase && <span className="text-[10px] text-red-500">{errors.phase.message}</span>}
                                            </div>
                                            <div>
                                                <label className="text-xs text-muted-foreground mb-1 block">Unit Number</label>
                                                <Select 
                                                    onValueChange={(v) => setValue("unitNo", v, { shouldValidate: true })}
                                                    disabled={!watch("phase") || loadingUnits || readOnlyUser}
                                                    value={watch("unitNo")}
                                                >
                                                    <SelectTrigger className={cn(inputClass, readOnlyUser && disabledClass)}>
                                                        <SelectValue placeholder={loadingUnits ? "Loading..." : "Select Unit"} />
                                                    </SelectTrigger>
                                                    <SelectContent className="max-h-[200px]">
                                                        {units.map((u) => (
                                                            <SelectItem key={u.id} value={String(u.id)}>{u.name}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                {errors.unitNo && <span className="text-[10px] text-red-500">{errors.unitNo.message}</span>}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Empty State Help Text (Only if nothing selected) */}
                            {!userType && <div className="h-full w-full" />}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* === CARD 2: PARKING CONFIGURATION === */}
            <Card className="border-0 shadow-lg bg-card/50 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-8 duration-700 fill-mode-both" style={{ animationDelay: '100ms' }}>
                <CardHeader className="px-8 pt-8 pb-4 border-b border-border/40">
                    <CardTitle className="text-lg font-semibold flex items-center gap-3 text-indigo-600 dark:text-indigo-400">
                        <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                            <Car className="h-5 w-5" />
                        </div>
                        Parking Configuration
                    </CardTitle>
                </CardHeader>
                
                <CardContent className="p-8 space-y-8">
                    
                    {/* Parking Mode & Config */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                        <div>
                            <Label className={labelClass}>Parking Mode</Label>
                            <div className="flex bg-gray-100 dark:bg-zinc-800 p-1.5 rounded-lg w-fit mt-1 h-12 items-stretch">
                                <button 
                                    type="button" 
                                    onClick={() => setValue("parkingType", "Normal")}
                                    className={cn(
                                        "px-6 text-xs font-semibold rounded-md transition-all shadow-sm flex items-center justify-center",
                                            parkingType === "Normal" 
                                            ? "bg-white text-emerald-600" 
                                            : "text-muted-foreground hover:text-foreground hover:bg-black/5"
                                    )}
                                >
                                    Normal
                                </button>
                                <button 
                                    type="button" 
                                    onClick={() => setValue("parkingType", "Reserved")}
                                    className={cn(
                                        "px-6 text-xs font-semibold rounded-md transition-all shadow-sm flex flex-col items-center justify-center leading-tight",
                                        parkingType === "Reserved" 
                                            ? "bg-white text-emerald-600" 
                                            : "text-muted-foreground hover:text-foreground hover:bg-black/5"
                                    )}
                                >
                                    <span>Reserved</span>
                                    {parkingType === "Reserved" && (
                                        <span className="text-[9px] font-normal opacity-70">Surface / Basement</span>
                                    )}
                                </button>
                            </div>
                        </div>
                        
                        <div className="space-y-1.5">
                            <Label className={labelClass}>Bay No</Label>
                            <Input 
                                {...register("bayNo")} 
                                className={cn(inputClass, parkingType === "Normal" && disabledClass)} 
                                placeholder="e.g. B-102" 
                                disabled={parkingType === "Normal"}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label className={labelClass}>Season Package</Label>
                            <Select onValueChange={(v) => setValue("seasonPackage", v)} value={watch("seasonPackage")}>
                                <SelectTrigger className={inputClass}>
                                    <span className="truncate text-left block w-full pr-4">
                                        <SelectValue placeholder="Select Package" />
                                    </span>
                                </SelectTrigger>
                                <SelectContent className="max-h-[250px] max-w-[350px]">
                                    {packages.map((pkg) => (
                                        <SelectItem key={pkg.id} value={String(pkg.id)}>
                                            {pkg.name}
                                        </SelectItem>
                                    ))}
                                    {/* Fallback for Review mode if package not in list */}
                                    {watch("seasonPackage") && !packages.some(p => String(p.id) === watch("seasonPackage")) && (
                                        <SelectItem value={watch("seasonPackage") || ""}>
                                            {watch("seasonPackage")}
                                        </SelectItem>
                                    )}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Flags & Amano (Right Column in original, but here mixed for flow) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <Label className={labelClass}>Amano Card No</Label>
                                <div className="relative">
                                    <CreditCard className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                    <Input 
                                        {...register("amanoCardNo")}
                                        className={cn(inputClass, "pl-9 font-mono", !watch("isMobileQr") && disabledClass)}
                                        placeholder="Scan Card ID" 
                                        disabled={!watch("isMobileQr")}
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label className={labelClass}>Amano Expiry Date</Label>
                                <DatePicker 
                                    date={watch("amanoExpiryDate") ? new Date(watch("amanoExpiryDate")!) : undefined} 
                                    setDate={(d) => setValue("amanoExpiryDate", d ? d.toISOString() : "")}
                                    className="h-9 w-full"
                                    placeholder="Select Expiry Date"
                                    disabled={!watch("isMobileQr")}
                                />
                            </div>
                         </div>
                       <div>

                        {/* UPDATED: Modern Toggle Buttons (Replaced Checkboxes) */}
                            <div className="space-y-2 pt-1">
                                {/* Mobile QR Toggle */}
                                <button
                                    type="button"
                                    onClick={() => setValue("isMobileQr", !isMobileQr)}
                                    className={cn(
                                        "flex items-center gap-3 px-3 py-2 rounded-md border w-full transition-all duration-200 text-left hover:shadow-sm",
                                        isMobileQr 
                                            ? "border-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/10" 
                                            : "border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950"
                                    )}
                                >
                                    <Smartphone className={cn("w-4 h-4", isMobileQr ? "text-indigo-600" : "text-muted-foreground")} />
                                    <div className="flex-1 leading-none">
                                        <p className={cn("text-xs font-medium", isMobileQr ? "text-indigo-900 dark:text-indigo-200" : "text-foreground")}>
                                            Mobile QR Access
                                        </p>
                                    </div>
                                    <div className={cn(
                                        "w-4 h-4 rounded-full border flex items-center justify-center transition-colors",
                                        isMobileQr ? "border-indigo-600 bg-indigo-600" : "border-gray-300"
                                    )}>
                                        {isMobileQr && <span className="text-white text-[8px]">✓</span>}
                                    </div>
                                </button>

                                {/* Homestay Toggle */}
                                <button
                                    type="button"
                                    onClick={() => setValue("isHomestay", !isHomestay)}
                                    className={cn(
                                        "flex items-center gap-3 px-3 py-2 rounded-md border w-full transition-all duration-200 text-left hover:shadow-sm",
                                        isHomestay 
                                            ? "border-blue-500 bg-blue-50/50 dark:bg-blue-900/10" 
                                            : "border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950"
                                    )}
                                >
                                    <Home className={cn("w-4 h-4", isHomestay ? "text-blue-600" : "text-muted-foreground")} />
                                    <div className="flex-1 leading-none">
                                        <p className={cn("text-xs font-medium", isHomestay ? "text-blue-900 dark:text-blue-200" : "text-foreground")}>
                                            Homestay Unit
                                        </p>
                                    </div>
                                    <div className={cn(
                                        "w-4 h-4 rounded-full border flex items-center justify-center transition-colors",
                                        isHomestay ? "border-blue-600 bg-blue-600" : "border-gray-300"
                                    )}>
                                        {isHomestay && <span className="text-white text-[8px]">✓</span>}
                                    </div>
                                </button>

                                {/* LPR Toggle */}
                                <button
                                    type="button"
                                    onClick={() => setValue("isLpr", !isLpr)}
                                    className={cn(
                                        "flex items-center gap-3 px-3 py-2 rounded-md border w-full transition-all duration-200 text-left hover:shadow-sm",
                                        isLpr 
                                            ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/10" 
                                            : "border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950"
                                    )}
                                >
                                    <ScanLine className={cn("w-4 h-4", isLpr ? "text-emerald-600" : "text-muted-foreground")} />
                                    <div className="flex-1 leading-none">
                                        <p className={cn("text-xs font-medium", isLpr ? "text-emerald-900 dark:text-emerald-200" : "text-foreground")}>
                                            LPR Access
                                        </p>
                                    </div>
                                    <div className={cn(
                                        "w-4 h-4 rounded-full border flex items-center justify-center transition-colors",
                                        isLpr ? "border-emerald-600 bg-emerald-600" : "border-gray-300"
                                    )}>
                                        {isLpr && <span className="text-white text-[8px]">✓</span>}
                                    </div>
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    {/* REMARKS */}
                    <div className="space-y-1.5">
                        <Label className={labelClass}>Remarks</Label>
                        <Input {...register("remarks")} className={inputClass} placeholder="Any additional comments..." />
                    </div>

                    {/* Vehicles */}
                    <div>
                        <Label className={labelClass}>Registered Vehicles</Label>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                            <div>
                                <Input {...register("plate1")} className={cn(inputClass, "uppercase border-indigo-200 bg-indigo-50/10 focus:bg-white")} placeholder="Plate 1 (Required)" />
                                {errors.plate1 && <span className="text-[10px] text-red-500 font-medium mt-1 block">{errors.plate1.message}</span>}
                            </div>
                            <Input {...register("plate2")} className={cn(inputClass, "uppercase")} placeholder="Plate 2" />
                            <Input {...register("plate3")} className={cn(inputClass, "uppercase")} placeholder="Plate 3" />
                        </div>
                    </div>

                    {/* Tandem Section */}
                    <div className={cn(
                        "rounded-xl border-2 transition-all duration-300 overflow-hidden",
                        isTandemChecked 
                            ? "bg-indigo-50/40 border-indigo-100 dark:bg-indigo-900/10 dark:border-indigo-900/30" 
                            : "bg-gray-50/50 border-dashed border-gray-200"
                    )}>
                        <div className="p-4 flex items-center justify-between border-b border-gray-200/50">
                            <div className="flex items-center gap-3">
                                <Checkbox 
                                    id="tandem-check" 
                                    checked={isTandemChecked}
                                    onCheckedChange={(c) => setValue("isTandem", !!c)}
                                    className="h-5 w-5 border-2 border-indigo-300 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600"
                                />
                                <Label htmlFor="tandem-check" className="text-sm font-bold text-gray-700 dark:text-gray-200 cursor-pointer select-none flex items-center gap-2">
                                    <Users className="h-4 w-4 text-indigo-500" /> Enable Tandem (Second Holder)?
                                </Label>
                            </div>
                            <Badge variant={isTandemChecked ? "default" : "secondary"} className="text-[10px] px-3">
                                {isTandemChecked ? "Enabled" : "Optional"}
                            </Badge>
                        </div>

                        <div className={`p-6 grid grid-cols-1 md:grid-cols-2 gap-6 transition-all duration-300 ${!isTandemChecked ? "opacity-40 pointer-events-none grayscale blur-[1px]" : "opacity-100"}`}>
                            <div>
                                <Label className={labelClass}>Second Holder Email</Label>
                                <Input {...register("tandemEmail")} className={inputClass} disabled={!isTandemChecked} />
                            </div>
                            <div>
                                <Label className={labelClass}>Second Holder Name</Label>
                                <Input {...register("tandemName")} className={inputClass} disabled={!isTandemChecked} />
                            </div>
                            <div>
                                <Label className={labelClass}>NRIC / Passport</Label>
                                <Input {...register("tandemNric")} className={inputClass} disabled={!isTandemChecked} />
                            </div>
                            <div>
                                <Label className={labelClass}>Contact No.</Label>
                                <Input {...register("tandemMobile")} className={inputClass} disabled={!isTandemChecked} />
                            </div>
                            <div>
                                <Label className={labelClass}>Second Holder Vehicle</Label>
                                <Input {...register("tandemPlate1")} className={cn(inputClass, "uppercase")} placeholder="Tandem Plate" disabled={!isTandemChecked} />
                            </div>
                        </div>
                    </div>

                </CardContent>
            </Card>
        </div>
    )
}