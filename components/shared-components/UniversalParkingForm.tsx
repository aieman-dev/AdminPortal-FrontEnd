"use client"

import { useState, useEffect } from "react"
import React from "react"
import { UseFormReturn } from "react-hook-form"
import { CarParkFormValues } from "@/lib/schemas/car-park"
import { formatNRIC, formatMobile } from "@/lib/formatter"
import { 
    User, Car, MapPin, Briefcase, CreditCard, Smartphone, Home, ScanLine, Users, AlertTriangle, Loader2
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { DatePicker } from "@/components/ui/date-picker"
import { EmailAutocomplete } from "@/components/ui/email-autocomplete"
import { useDebounce } from "@/hooks/use-debounce"
import { cn } from "@/lib/utils"
import { CarParkPhase, CarParkUnit, CarParkPackage, CarParkDepartment } from "@/type/car-park"
import { carParkService } from "@/services/car-park-services"
import { hrService } from "@/services/hr-services"

interface UniversalParkingFormProps {
    form: UseFormReturn<CarParkFormValues>;
    context: "HR" | "CP"; 
    phases: CarParkPhase[];
    units: CarParkUnit[];
    packages: CarParkPackage[];
    departments?: CarParkDepartment[];
    loadingUnits?: boolean;
    loadingPhases?: boolean;
    onPhaseChange: (phaseId: string) => void;
    readOnlyUser?: boolean; 
    onPlateConflict?: (isConflicting: boolean) => void;
}

export function UniversalParkingForm({ 
    form, context, phases, units, packages, departments = [],
    loadingUnits = false, loadingPhases = false, onPhaseChange,
    readOnlyUser = false, onPlateConflict
}: UniversalParkingFormProps) {
    
    const { register, watch, setValue, formState: { errors } } = form;
    const userType = watch("userType");
    const parkingType = watch("parkingType");
    const isTandemChecked = watch("isTandem");

    const plate1 = watch("plate1");
    const debouncedPlate = useDebounce(plate1, 800);
    const [isCheckingPlate, setIsCheckingPlate] = useState(false);
    const [plateConflict, setLocalPlateConflict] = useState(false);


    const isHR = context === "HR";

    // Styles
    const inputClass = "h-11 bg-background border-input focus:border-indigo-500 focus:ring-indigo-500/20 text-sm shadow-sm transition-all";
    const labelClass = "text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block";
    const disabledClass = "bg-muted text-muted-foreground cursor-not-allowed opacity-70";

    // Shared Duplicate Plate Check logic
    useEffect(() => {
        let isActive = true;
        const checkDuplicate = async () => {
            if (debouncedPlate && debouncedPlate.length > 3) {
                setIsCheckingPlate(true); 
                try {
                    const service = isHR ? hrService : carParkService;
                    const res = await service.getQrListing(1, 1, debouncedPlate);
                    if (isActive) {
                    const isConflict = res.totalCount > 0;
                    setLocalPlateConflict(isConflict);
                    onPlateConflict?.(isConflict);
                    }
                } catch (e) {
                    console.error("Plate check failed", e);
                } finally {
                    if (isActive) setIsCheckingPlate(false);
                }
            } else {
                setLocalPlateConflict(false);
                onPlateConflict?.(false);
                setIsCheckingPlate(false)
            }
        };

        checkDuplicate();
        return () => { isActive = false; };
    }, [debouncedPlate, isHR, onPlateConflict]);

    useEffect(() => {
    if (!isTandemChecked) {
        setValue("tandemName", "");
        setValue("tandemNric", "");
        setValue("tandemMobile", "");
        setValue("tandemPlate1", "");
    }
}, [isTandemChecked, setValue]);

    return (
        <div className="space-y-6 pb-10">
            {/* === CARD 1: PRIMARY HOLDER INFO === */}
            <Card className="border shadow-sm bg-card">
                <CardHeader className="px-6 py-4 border-b bg-muted/10">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-base font-semibold flex items-center gap-2">
                            <User className="h-4 w-4 text-indigo-600" />
                            Primary Holder Information
                        </CardTitle>
                        {readOnlyUser && <Badge variant="outline" className="text-xs font-normal">Read-Only Mode</Badge>}
                    </div>
                </CardHeader>
                
                <CardContent className="p-6 grid gap-6">
                    {/* Account Email (Read Only) */}
                    <div>
                        <Label className={labelClass}>Account Email</Label>
                        <EmailAutocomplete 
                            {...register("userEmail")} 
                            value={watch("userEmail")} 
                            readOnly={readOnlyUser} 
                            className={cn(inputClass, "bg-muted/30 border-border text-muted-foreground")} 
                        />
                        {errors.userEmail && <span className="text-[10px] text-red-500 font-medium mt-1">{errors.userEmail.message}</span>}
                    </div>

                    {/* Personal Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        <div>
                            <Label className={labelClass}>Full Name <span className="text-red-500">*</span></Label>
                            <Input {...register("name")} className={inputClass} placeholder="Full Name" disabled={readOnlyUser} />
                            {errors.name && <span className="text-[10px] text-red-500 font-medium mt-1 block">{errors.name.message}</span>}
                        </div>
                        <div>
                        <Label className={labelClass}>NRIC / Passport <span className="text-red-500">*</span></Label>
                        <Input 
                            {...register("nric",{
                                onBlur: (e) => setValue("nric", formatNRIC(e.target.value), { shouldValidate: true })
                            })} 
                            className={inputClass} 
                            placeholder="ID Number" 
                            disabled={readOnlyUser} 
                        />
                        {errors.nric && <p className="text-[10px] text-red-500 font-medium mt-1">{errors.nric.message}</p>}
                    </div>
                        <div>
                            <Label className={labelClass}>Company Name</Label>
                            <Input 
                                {...register("companyName")} 
                                className={inputClass} 
                                placeholder="Company (Optional)" 
                                disabled={readOnlyUser} />
                        </div>
                    </div>

                    {/* Contact Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                            <Label className={labelClass}>Mobile No. (H/P) <span className="text-red-500">*</span></Label>
                            <Input 
                                {...register("mobileContact", {
                                    onBlur: (e) => setValue("mobileContact", formatMobile(e.target.value), { shouldValidate: true })
                                })}
                                type="tel" className={inputClass} 
                                placeholder="+60" 
                                disabled={readOnlyUser} 
                            />
                            {errors.mobileContact && <span className="text-[10px] text-red-500 font-medium mt-1 block">{errors.mobileContact.message}</span>}
                        </div>
                        <div> 
                            <Label className={labelClass}>Office Contact</Label>
                            <Input 
                                {...register("officeContact")} 
                                type="tel" 
                                className={inputClass} 
                                placeholder="+03" 
                                disabled={readOnlyUser} 
                            />
                        </div>
                    </div>

                    <Separator />

                    {/* === USER TYPE SELECTION & STAFF DETAILS === */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                        
                        {/* LEFT: User Type Selection */}
                        <div>
                            <Label className={labelClass}>User Classification</Label>
                            <div className="flex flex-wrap gap-2 pt-1">
                                {["Staff", "Tenant", "Non-Tenant", "Owner"].map((t) => {
                                    const isActive = userType === t;
                                    return (
                                        <button
                                            key={t}
                                            type="button"
                                            disabled={readOnlyUser}
                                            onClick={() => setValue("userType", isActive ? ("" as any) : (t as any))}
                                            className={cn(
                                                "flex items-center gap-2 px-3 py-2 rounded-md border text-xs font-medium transition-all duration-200 h-11", 
                                                isActive 
                                                    ? "border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-300" 
                                                    : "bg-background hover:bg-muted border-input text-muted-foreground",
                                                readOnlyUser && !isActive && "opacity-50 cursor-not-allowed"
                                            )}
                                        >
                                            <div className={cn("w-2 h-2 rounded-full", isActive ? "bg-indigo-600" : "bg-muted-foreground/30")} />
                                            {t}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>

                        {/* RIGHT: Dynamic Fields */}
                        <div className="space-y-4">
                            {userType === "Staff" && (
                                <div className="animate-in fade-in slide-in-from-left-4 duration-300 bg-muted/30 p-4 rounded-lg border border-border/50">
                                    <Label className={labelClass}>Staff Information</Label>
                                    <div className="space-y-3 mt-2">
                                        <div className="relative">
                                            <Briefcase className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                                            <Input 
                                                {...register("staffId")} 
                                                placeholder="Enter Staff ID Number" 
                                                disabled={readOnlyUser} 
                                                className={cn(inputClass, "pl-9", readOnlyUser && disabledClass)} 
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
                                                {/* FIX: Added index to key to allow duplicate codes */}
                                                {departments.map((dept, index) => (
                                                    <SelectItem key={`${dept.code}-${index}`} value={dept.code}>
                                                        {dept.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            )}

                            {(userType === "Tenant" || userType === "Non-Tenant" || userType === "Owner") && (
                                <div className="animate-in fade-in slide-in-from-left-4 duration-300">
                                     <div>
                                        <Label className={labelClass}><MapPin className="h-3 w-3 inline mr-1" /> Unit Location</Label>
                                        <div className="grid grid-cols-2 gap-3 mt-1">
                                            <div>
                                                <Select 
                                                    onValueChange={onPhaseChange} 
                                                    value={watch("phase")}
                                                    disabled={readOnlyUser || loadingPhases}
                                                >
                                                    <SelectTrigger className={cn(inputClass, readOnlyUser && disabledClass)}>
                                                        <SelectValue placeholder={loadingPhases ? "Loading..." : "Phase"} />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {phases.map((p) => (
                                                            <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div>
                                                <Select 
                                                    onValueChange={(v) => setValue("unitNo", v, { shouldValidate: true })}
                                                    disabled={!watch("phase") || loadingUnits || readOnlyUser}
                                                    value={watch("unitNo")}
                                                >
                                                    <SelectTrigger className={cn(inputClass, readOnlyUser && disabledClass)}>
                                                        <SelectValue placeholder={loadingUnits ? "Loading..." : "Unit"} />
                                                    </SelectTrigger>
                                                    <SelectContent className="max-h-[200px]">
                                                        {units.map((u) => (
                                                            <SelectItem key={u.id} value={String(u.id)}>{u.name}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>


            {/* === CARD 2: PARKING CONFIGURATION === */}
            <Card className="border shadow-sm bg-card">
                <CardHeader className="px-6 py-4 border-b bg-muted/10">
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                        <Car className="h-4 w-4 text-indigo-600" />
                        Parking Configuration
                    </CardTitle>
                </CardHeader>
                
                <CardContent className="p-6 space-y-8">
                    
                    {/* Parking Mode & Config */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                        <div>
                            <Label className={labelClass}>Parking Mode</Label>
                            <div className="flex bg-muted/50 dark:bg-zinc-950 p-1 rounded-md h-11 border border-border/50">
                                {["Normal", "Reserved"].map((m) => (
                                    <button 
                                        key={m}
                                        type="button" 
                                        onClick={() => setValue("parkingType", m as any)}
                                        className={cn(
                                            "flex-1 text-xs font-medium rounded-sm transition-all duration-200",
                                            parkingType === m 
                                                ? "bg-white dark:bg-indigo-600 text-black dark:text-white shadow-md" 
                                                : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
                                        )}
                                    >
                                        {m}
                                    </button>
                                ))}
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

                        <div className="space-y-1.5 md:col-span-2">
                            <Label className={labelClass}>Season Package</Label>
                            <Select onValueChange={(v) => setValue("seasonPackage", v)} value={watch("seasonPackage")}>
                                <SelectTrigger className={inputClass}>
                                    <SelectValue placeholder="Select Package" />
                                </SelectTrigger>
                                <SelectContent className="max-h-[250px]">
                                    {packages.map((pkg) => (
                                        <SelectItem key={pkg.id} value={String(pkg.id)}>
                                            {pkg.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <Separator />

                    {/* Flags & Amano */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <Label className={labelClass}>Amano Card No</Label>
                                <div className="relative">
                                    <CreditCard className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
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
                                    className={cn(inputClass, "w-full")}
                                    placeholder="Select Expiry Date"
                                    disabled={!watch("isMobileQr")}
                                />
                            </div>
                         </div>
                         
                       <div>
                            {/* Modern Toggle Buttons */}
                            <div className="space-y-2 pt-1">
                                <ToggleBtn 
                                    label="Mobile QR Access" 
                                    checked={watch("isMobileQr")} 
                                    onChange={(c) => setValue("isMobileQr", c)} 
                                    icon={Smartphone} 
                                />
                                <ToggleBtn 
                                    label="Homestay Unit" 
                                    checked={watch("isHomestay")} 
                                    onChange={(c) => setValue("isHomestay", c)} 
                                    icon={Home} 
                                />
                                <ToggleBtn 
                                    label="LPR Access" 
                                    checked={watch("isLpr")} 
                                    onChange={(c) => setValue("isLpr", c)} 
                                    icon={ScanLine} 
                                />
                                <ToggleBtn 
                                    label="Tandem (Second Holder)" 
                                    checked={isTandemChecked} 
                                    onChange={(c) => setValue("isTandem", c)} 
                                    icon={Users}
                                />
                            </div>
                        </div>
                    </div>
                    
                    {/* REMARKS */}
                    <div className="space-y-1.5">
                        <Label className={labelClass}>Remarks</Label>
                        <Input {...register("remarks")} className={inputClass} placeholder="Any additional comments..." />
                    </div>

                    {/* Vehicles */}
                    <div className="space-y-1.5">
                        <Label className={labelClass}>Registered Vehicles</Label>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-1.5">
                            
                            {/* Plate 01 */}
                            <div className="space-y-1.5">
                                <div className="relative">
                                    <span className="absolute left-3 top-3.5 text-[10px] text-muted-foreground font-bold z-10">01</span>
                                    <Input 
                                        {...register("plate1", {
                                            onBlur: (e) => {
                                                const normalized = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
                                                setValue("plate1", normalized, { shouldValidate: true });
                                            }
                                        })}
                                        className={cn(
                                            inputClass, 
                                            "pl-8 uppercase", 
                                            plateConflict && "border-amber-500 ring-1 ring-amber-500 shadow-[0_0_0_2px_rgba(245,158,11,0.1)]"
                                        )} 
                                        placeholder="Required" 
                                    />
                                    {isCheckingPlate && (
                                        <div className="absolute right-3 top-3.5">
                                            <Loader2 className="h-4 w-4 animate-spin text-indigo-500" />
                                        </div>
                                    )}
                                </div>
                                {/* Removed absolute positioning so it pushes the next input down */}
                                {plateConflict && (
                                    <div className="flex items-start gap-1 text-[10px] font-bold text-amber-600 leading-tight">
                                        <AlertTriangle className="h-3 w-3 shrink-0" />
                                        <span>This plate is already registered to another active account</span>
                                    </div>
                                )}
                                {errors.plate1 && (
                                    <span className="text-[10px] text-red-500 font-medium block">
                                        {errors.plate1.message}
                                    </span>
                                )}
                            </div>

                            {/* Plate 02 */}
                            <div className="space-y-1.5">
                                <div className="relative">
                                    <span className="absolute left-3 top-3.5 text-[10px] text-muted-foreground font-bold z-10">02</span>
                                    <Input {...register("plate2")} className={cn(inputClass, "pl-8 uppercase")} placeholder="Optional" />
                                </div>
                                {errors.plate2 && (
                                    <span className="text-[10px] text-red-500 font-medium block">
                                        {errors.plate2.message}
                                    </span>
                                )}
                            </div>

                            {/* Plate 03 */}
                            <div className="space-y-1.5">
                                <div className="relative">
                                    <span className="absolute left-3 top-3.5 text-[10px] text-muted-foreground font-bold z-10">03</span>
                                    <Input {...register("plate3")} className={cn(inputClass, "pl-8 uppercase")} placeholder="Optional" />
                                </div>
                                {errors.plate3 && (
                                    <span className="text-[10px] text-red-500 font-medium block">
                                        {errors.plate3.message}
                                    </span>
                                )}
                            </div>

                        </div>
                    </div>

                    {/* Tandem Section (Conditional) */}
                    <AnimatePresence>
                        {isTandemChecked && (
                            <motion.div
                                initial={{ height: 0, opacity: 0, marginTop: 0 }}
                                animate={{ height: "auto", opacity: 1, marginTop: 8 }}
                                exit={{ height: 0, opacity: 0, marginTop: 0 }}
                                transition={{ duration: 0.3, ease: "easeInOut" }}
                                className="overflow-hidden" // Prevents layout jitter during animation
                            >
                                <div className="rounded-lg border border-indigo-100 bg-indigo-50/30 dark:bg-indigo-900/10 p-4">
                                    <Label className={cn(labelClass, "text-indigo-900 dark:text-indigo-300 mb-3")}>
                                        Tandem Holder Details
                                    </Label>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <Input {...register("tandemName")} className={inputClass} placeholder="Secondary Name" />
                                        <Input {...register("tandemNric")} className={inputClass} placeholder="Secondary NRIC" />
                                        <Input {...register("tandemMobile")} className={inputClass} placeholder="Secondary Mobile" />
                                        <Input 
                                            {...register("tandemPlate1")} 
                                            className={cn(inputClass, "uppercase")} 
                                            placeholder="Tandem Vehicle Plate" 
                                        />
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                </CardContent>
            </Card>
        </div>
    )
}


function ToggleBtn({ label, checked, onChange, icon: Icon }: { label: string, checked: boolean, onChange: (c: boolean) => void, icon?: any }) {
    return (
        <div 
            onClick={() => onChange(!checked)}
            className={cn(
                "flex items-center justify-between px-3 py-2 rounded-md border cursor-pointer transition-all hover:shadow-sm h-11", 
                checked 
                    ? "bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-900/20 dark:border-indigo-800 dark:text-indigo-300" 
                    : "bg-background border-border text-muted-foreground hover:bg-muted/50"
            )}
        >
            <div className="flex items-center gap-2">
                {Icon && <Icon className="h-4 w-4 opacity-70" />}
                <span className="text-xs font-medium">{label}</span>
            </div>
            <div className={cn("w-4 h-4 rounded-full border flex items-center justify-center transition-colors", checked ? "bg-indigo-600 border-indigo-600" : "border-muted-foreground")}>
                {checked && <span className="text-[8px] text-white">✓</span>}
            </div>
        </div>
    )
}
