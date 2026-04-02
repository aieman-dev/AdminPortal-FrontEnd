"use client"

import React from "react"
import { UseFormReturn } from "react-hook-form"
import { CarParkFormValues } from "@/lib/schemas/car-park"
import { formatNRIC, formatMobile } from "@/lib/formatter"
import { User, MapPin, Briefcase } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { EmailAutocomplete } from "@/components/ui/email-autocomplete"
import { cn } from "@/lib/utils"
import { CarParkPhase, CarParkUnit, CarParkDepartment } from "@/type/car-park"

interface PrimaryHolderSectionProps {
    form: UseFormReturn<CarParkFormValues>;
    readOnlyUser?: boolean;
    departments?: CarParkDepartment[];
    phases: CarParkPhase[];
    units: CarParkUnit[];
    loadingPhases?: boolean;
    loadingUnits?: boolean;
    onPhaseChange: (phaseId: string) => void;
}

export function PrimaryHolderSection({
    form,
    readOnlyUser = false,
    departments = [],
    phases,
    units,
    loadingPhases = false,
    loadingUnits = false,
    onPhaseChange
}: PrimaryHolderSectionProps) {
    
    const { register, watch, setValue, formState: { errors } } = form;
    const userType = watch("userType");

    // Shared Styles
    const inputClass = "h-11 bg-background border-input focus:border-indigo-500 focus:ring-indigo-500/20 text-sm shadow-sm transition-all";
    const labelClass = "text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block";
    const disabledClass = "bg-muted text-muted-foreground cursor-not-allowed opacity-70";

    return (
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
                {/* Account Email (Read Only mapping) */}
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

                {/* === USER TYPE SELECTION & CONDITIONAL FIELDS === */}
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

                    {/* RIGHT: Dynamic Fields (Staff vs Tenant) */}
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
    );
}