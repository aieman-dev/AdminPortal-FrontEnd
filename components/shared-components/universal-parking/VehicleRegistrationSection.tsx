"use client"

import React, { useState, useEffect } from "react"
import { UseFormReturn } from "react-hook-form"
import { CarParkFormValues } from "@/lib/schemas/car-park"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertTriangle, Loader2 } from "lucide-react"
import { useDebounce } from "@/hooks/use-debounce"
import { cn } from "@/lib/utils"
import { carParkService } from "@/services/car-park-services"
import { hrService } from "@/services/hr-services"
import { logger } from "@/lib/logger"

interface VehicleRegistrationSectionProps {
    form: UseFormReturn<CarParkFormValues>;
    readOnlyUser?: boolean;
    isHR: boolean;
    onPlateConflict?: (isConflicting: boolean) => void;
}

export function VehicleRegistrationSection({
    form, readOnlyUser = false, isHR, onPlateConflict
}: VehicleRegistrationSectionProps) {
    
    const { register, watch, setValue, formState: { errors } } = form;
    const plate1 = watch("plate1");
    const debouncedPlate = useDebounce(plate1, 800);
    const [isCheckingPlate, setIsCheckingPlate] = useState(false);
    const [plateConflict, setLocalPlateConflict] = useState(false);

    const inputClass = "h-11 bg-background border-input focus:border-indigo-500 focus:ring-indigo-500/20 text-sm shadow-sm transition-all";
    const labelClass = "text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block";

    // Duplicate Plate Check logic
    useEffect(() => {
        let isActive = true;
        const checkDuplicate = async () => {
            if (debouncedPlate && debouncedPlate.length > 3 && !readOnlyUser) {
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
                    logger.error("Plate check failed", { error: e });
                } finally {
                    if (isActive) setIsCheckingPlate(false);
                }
            } else {
                setLocalPlateConflict(false);
                onPlateConflict?.(false);
                setIsCheckingPlate(false);
            }
        };

        checkDuplicate();
        return () => { isActive = false; };
    }, [debouncedPlate, isHR, onPlateConflict, readOnlyUser]);

    return (
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
                            disabled={readOnlyUser}
                        />
                        {isCheckingPlate && (
                            <div className="absolute right-3 top-3.5">
                                <Loader2 className="h-4 w-4 animate-spin text-indigo-500" />
                            </div>
                        )}
                    </div>
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
                        <Input 
                            {...register("plate2")} 
                            className={cn(inputClass, "pl-8 uppercase")} 
                            placeholder="Optional" 
                            disabled={readOnlyUser}
                        />
                    </div>
                    {errors.plate2 && (
                        <span className="text-[10px] text-red-500 font-medium block">{errors.plate2.message}</span>
                    )}
                </div>

                {/* Plate 03 */}
                <div className="space-y-1.5">
                    <div className="relative">
                        <span className="absolute left-3 top-3.5 text-[10px] text-muted-foreground font-bold z-10">03</span>
                        <Input 
                            {...register("plate3")} 
                            className={cn(inputClass, "pl-8 uppercase")} 
                            placeholder="Optional" 
                            disabled={readOnlyUser}
                        />
                    </div>
                    {errors.plate3 && (
                        <span className="text-[10px] text-red-500 font-medium block">{errors.plate3.message}</span>
                    )}
                </div>
            </div>
        </div>
    );
}