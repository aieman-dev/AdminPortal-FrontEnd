"use client"

import React from "react"
import { UseFormReturn } from "react-hook-form"
import { Car } from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card" 
import { CarParkFormValues } from "@/lib/schemas/car-park"
import { CarParkPhase, CarParkUnit, CarParkPackage, CarParkDepartment } from "@/type/car-park"

// Import our new sub-components
import { PrimaryHolderSection } from "@/components/shared-components/universal-parking/PrimaryHolderSection"
import { ParkingConfigSection } from "@/components/shared-components/universal-parking/ParkingConfigSection"
import { VehicleRegistrationSection } from "@/components/shared-components/universal-parking/VehicleRegistrationSection"
import { TandemHolderSection } from "@/components/shared-components/universal-parking/TandemHolderSection"

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

export function UniversalParkingForm(props: UniversalParkingFormProps) {
    const isHR = props.context === "HR";

    return (
        <div className="space-y-6 pb-10">
            
            {/* CARD 1: PRIMARY HOLDER INFO */}
            <PrimaryHolderSection 
                form={props.form}
                readOnlyUser={props.readOnlyUser}
                departments={props.departments}
                phases={props.phases}
                units={props.units}
                loadingPhases={props.loadingPhases}
                loadingUnits={props.loadingUnits}
                onPhaseChange={props.onPhaseChange}
            />

            {/* CARD 2: PARKING CONFIGURATION & VEHICLES */}
            <Card className="border shadow-sm bg-card rounded-xl overflow-hidden">
                <CardHeader className="px-6 py-4 border-b bg-muted/10">
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                        <Car className="h-4 w-4 text-indigo-600" />
                        Parking Configuration
                    </CardTitle>
                </CardHeader>
                
                <CardContent className="p-6 space-y-8">
                    <ParkingConfigSection 
                        form={props.form} 
                        packages={props.packages} 
                        readOnlyUser={props.readOnlyUser} 
                    />
                    
                    <VehicleRegistrationSection 
                        form={props.form} 
                        readOnlyUser={props.readOnlyUser} 
                        isHR={isHR} 
                        onPlateConflict={props.onPlateConflict} 
                    />
                    
                    <TandemHolderSection 
                        form={props.form} 
                        readOnlyUser={props.readOnlyUser} 
                    />
                </CardContent>
            </Card>
        </div>
    )
}