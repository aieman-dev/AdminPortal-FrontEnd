"use client"

import React from "react"
import { UseFormReturn } from "react-hook-form"
import { CarParkFormValues } from "@/lib/schemas/car-park"
import { Car, CreditCard, Smartphone, Home, ScanLine, Users } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { DatePicker } from "@/components/ui/date-picker"
import { cn } from "@/lib/utils"
import { CarParkPackage } from "@/type/car-park"

// Local Toggle Button Component
function ToggleBtn({ label, checked, onChange, icon: Icon, disabled }: { label: string, checked: boolean, onChange: (c: boolean) => void, icon?: any, disabled?: boolean }) {
    return (
        <button 
            type="button"
            disabled={disabled}
            onClick={() => onChange(!checked)}
            className={cn(
                "flex items-center justify-between px-3 py-2 w-full rounded-md border cursor-pointer transition-all h-11", 
                checked 
                    ? "bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-900/20 dark:border-indigo-800 dark:text-indigo-300" 
                    : "bg-background border-border text-muted-foreground hover:bg-muted/50",
                disabled && "opacity-50 cursor-not-allowed"
            )}
        >
            <div className="flex items-center gap-2">
                {Icon && <Icon className="h-4 w-4 opacity-70" />}
                <span className="text-xs font-medium">{label}</span>
            </div>
            <div className={cn("w-4 h-4 rounded-full border flex items-center justify-center transition-colors", checked ? "bg-indigo-600 border-indigo-600" : "border-muted-foreground")}>
                {checked && <span className="text-[8px] text-white">✓</span>}
            </div>
        </button>
    )
}

interface ParkingConfigSectionProps {
    form: UseFormReturn<CarParkFormValues>;
    readOnlyUser?: boolean;
    packages: CarParkPackage[];
}

export function ParkingConfigSection({ form, readOnlyUser = false, packages }: ParkingConfigSectionProps) {
    const { register, watch, setValue } = form;
    const parkingType = watch("parkingType");
    const isTandemChecked = watch("isTandem");

    const inputClass = "h-11 bg-background border-input focus:border-indigo-500 focus:ring-indigo-500/20 text-sm shadow-sm transition-all";
    const labelClass = "text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block";
    const disabledClass = "bg-muted text-muted-foreground cursor-not-allowed opacity-70";

    return (
        <div className="space-y-8">
            {/* Parking Mode & Config */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                <div>
                    <Label className={labelClass}>Parking Mode</Label>
                    <div className="flex bg-muted/50 dark:bg-zinc-950 p-1 rounded-md h-11 border border-border/50">
                        {["Normal", "Reserved"].map((m) => (
                            <button 
                                key={m}
                                type="button" 
                                disabled={readOnlyUser}
                                onClick={() => setValue("parkingType", m as any)}
                                className={cn(
                                    "flex-1 text-xs font-medium rounded-sm transition-all duration-200",
                                    parkingType === m 
                                        ? "bg-white dark:bg-indigo-600 text-black dark:text-white shadow-md" 
                                        : "text-muted-foreground hover:text-foreground hover:bg-muted/80",
                                    readOnlyUser && "cursor-not-allowed"
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
                        className={cn(inputClass, (parkingType === "Normal" || readOnlyUser) && disabledClass)} 
                        placeholder="e.g. B-102" 
                        disabled={parkingType === "Normal" || readOnlyUser}
                    />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                    <Label className={labelClass}>Season Package</Label>
                    <Select 
                        onValueChange={(v) => setValue("seasonPackage", v)} 
                        value={watch("seasonPackage")}
                        disabled={readOnlyUser}
                    >
                        <SelectTrigger className={cn(inputClass, readOnlyUser && disabledClass)}>
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
                                className={cn(inputClass, "pl-9 font-mono", (!watch("isMobileQr") || readOnlyUser) && disabledClass)}
                                placeholder="Scan Card ID" 
                                disabled={!watch("isMobileQr") || readOnlyUser}
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
                            disabled={!watch("isMobileQr") || readOnlyUser}
                        />
                    </div>
                </div>
                    
                <div>
                    <div className="space-y-2 pt-1">
                        <ToggleBtn label="Mobile QR Access" checked={watch("isMobileQr")} onChange={(c) => setValue("isMobileQr", c)} icon={Smartphone} disabled={readOnlyUser} />
                        <ToggleBtn label="Homestay Unit" checked={watch("isHomestay")} onChange={(c) => setValue("isHomestay", c)} icon={Home} disabled={readOnlyUser} />
                        <ToggleBtn label="LPR Access" checked={watch("isLpr")} onChange={(c) => setValue("isLpr", c)} icon={ScanLine} disabled={readOnlyUser} />
                        <ToggleBtn label="Tandem (Second Holder)" checked={isTandemChecked} onChange={(c) => setValue("isTandem", c)} icon={Users} disabled={readOnlyUser} />
                    </div>
                </div>
            </div>
            
            {/* REMARKS */}
            <div className="space-y-1.5">
                <Label className={labelClass}>Remarks</Label>
                <Input 
                    {...register("remarks")} 
                    className={inputClass} 
                    placeholder="Any additional comments" 
                    disabled={readOnlyUser}
                />
            </div>
        </div>
    );
}