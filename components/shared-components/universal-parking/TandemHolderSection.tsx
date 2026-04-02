"use client"

import React, { useEffect } from "react"
import { UseFormReturn } from "react-hook-form"
import { CarParkFormValues } from "@/lib/schemas/car-park"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

interface TandemHolderSectionProps {
    form: UseFormReturn<CarParkFormValues>;
    readOnlyUser?: boolean;
}

export function TandemHolderSection({ form, readOnlyUser = false }: TandemHolderSectionProps) {
    const { register, watch, setValue } = form;
    const isTandemChecked = watch("isTandem");

    const inputClass = "h-11 bg-background border-input focus:border-indigo-500 focus:ring-indigo-500/20 text-sm shadow-sm transition-all";
    const labelClass = "text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block";

    // Auto-clear tandem fields when disabled
    useEffect(() => {
        if (!isTandemChecked && !readOnlyUser) {
            setValue("tandemName", "");
            setValue("tandemNric", "");
            setValue("tandemMobile", "");
            setValue("tandemPlate1", "");
        }
    }, [isTandemChecked, setValue, readOnlyUser]);

    return (
        <div >
            <AnimatePresence>
                {isTandemChecked && (
                    <motion.div
                        initial={{ height: 0, opacity: 0, marginTop: 0 }}
                        animate={{ height: "auto", opacity: 1, marginTop: 8 }}
                        exit={{ height: 0, opacity: 0, marginTop: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="overflow-hidden"
                    >
                        <div className="rounded-lg border border-indigo-100 bg-indigo-50/30 dark:bg-indigo-900/10 p-4">
                            <Label className={cn(labelClass, "text-indigo-900 dark:text-indigo-300 mb-3")}>
                                Tandem Holder Details
                            </Label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input {...register("tandemName")} className={inputClass} placeholder="Secondary Name" disabled={readOnlyUser} />
                                <Input {...register("tandemNric")} className={inputClass} placeholder="Secondary NRIC" disabled={readOnlyUser} />
                                <Input {...register("tandemMobile")} className={inputClass} placeholder="Secondary Mobile" disabled={readOnlyUser} />
                                <Input 
                                    {...register("tandemPlate1")} 
                                    className={cn(inputClass, "uppercase")} 
                                    placeholder="Tandem Vehicle Plate" 
                                    disabled={readOnlyUser}
                                />
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}