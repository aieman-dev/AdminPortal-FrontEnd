// app/portal/hr/registration/page.tsx
"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm, SubmitHandler } from "react-hook-form" 
import { zodResolver } from "@hookform/resolvers/zod"
import { Mail, QrCode, RefreshCw, Loader2, ArrowRight, CheckCircle2, User, Car } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { LoadingButton } from "@/components/ui/loading-button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { useAppToast } from "@/hooks/use-app-toast"
import { useBeforeUnload } from "@/hooks/use-before-unload";
import { Phase, Unit, Package, Department } from "@/type/hr"
import { hrService } from "@/services/hr-services"
import { cn } from "@/lib/utils"
import { carParkFormSchema, CarParkFormValues } from "@/lib/schemas/car-park"
import { NavigationGuard } from "@/components/portal/navigation-guard" 
import { useNavigation } from "@/context/navigation-context"
import { UniversalParkingForm } from "@/components/shared-components/UniversalParkingForm"


export default function HRRegistrationPage() {
    const router = useRouter()
    const { user } = useAuth()
    const toast = useAppToast()
    const { setIsDirty, pendingPath, setPendingPath } = useNavigation()
    const [isVerifying, setIsVerifying] = useState(false)

    // Lookup Data
    const [phases, setPhases] = useState<Phase[]>([])
    const [units, setUnits] = useState<Unit[]>([])
    const [seasonPackages, setSeasonPackages] = useState<Package[]>([])
    const [departments, setDepartments] = useState<Department[]>([])
    const [hasPlateConflict, setHasPlateConflict] = useState(false);
    
    const [loadingPhases, setLoadingPhases] = useState(true)
    const [loadingUnits, setLoadingUnits] = useState(false)

    // Submission State
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isConfirmOpen, setIsConfirmOpen] = useState(false)
    const [formDataToSubmit, setFormDataToSubmit] = useState<CarParkFormValues | null>(null)

    // 1. Load Initial Data
    useEffect(() => {
        const loadMetadata = async () => {
            setLoadingPhases(true)
            try {
                const [pkgData, deptData, phasesData] = await Promise.all([
                    hrService.getPackages(),
                    hrService.getDepartments(),
                    hrService.getPhases()
                ])
                setSeasonPackages(pkgData)
                setDepartments(deptData)
                setPhases(phasesData)
            } catch (error) {
                console.error("Failed to load metadata", error)
            } finally {
                setLoadingPhases(false)
            }
        }
        loadMetadata()
    }, [])

    // 2. Initialize Form (Forced UserType: Staff)
    const form = useForm<CarParkFormValues>({
        resolver: zodResolver(carParkFormSchema) as any,
        defaultValues: {
            searchType: "email",
            searchTerm: "",
            userEmail: "",
            name: "",
            nric: "",
            mobileContact: "",
            plate1: "",
            userType: "Staff", // <--- LOCKED TO STAFF
            parkingType: "Reserved",
            bayNo: "",
            seasonPackage: "",
            remarks: "",
            isMobileQr: false,
            isHomestay: false, 
            isLpr: false,
            isTandem: false,
            phase: "",
            unitNo: "",
            staffId: "",
            department: ""
        }
    })

    const { isDirty } = form.formState;

    useEffect(() => {
        setIsDirty(isDirty)
        return () => setIsDirty(false) 
    }, [isDirty, setIsDirty])

    useBeforeUnload(isDirty);
    
    const { register, handleSubmit, watch, setValue, reset, getValues } = form
    const searchType = watch("searchType")

    const handlePhaseChange = async (value: string) => {
        setValue("phase", value, { shouldValidate: true })
        setValue("unitNo", "") 
        setUnits([])
        setLoadingUnits(true)
        try {
            const data = await hrService.getUnits(value)
            setUnits(data)
        } catch (error) {
            toast.error("Error", "Failed to load units")
        } finally {
            setLoadingUnits(false)
        }
    }

    const handleVerify = async () => {
        const type = getValues("searchType")
        const term = getValues("searchTerm")
        if (!term || !type) { 
            toast.info("Input Required", "Please select a search mode and enter a term.") 
            return 
        }
        setIsVerifying(true)
        try {
            const result = await hrService.verifyUser(type, term)
            if (result.success && result.data) {
                const d = result.data
                setValue("accId", d.accId)
                setValue("userEmail", d.email, { shouldValidate: true })
                setValue("name", d.name, { shouldValidate: true })
                setValue("mobileContact", d.mobile, { shouldValidate: true })
                toast.success("Verified", "User data populated.")
            }
        } catch (error) {
            toast.error("Failed", "User not found.")
        } finally {
            setIsVerifying(false)
        }
    }

    const handleClear = () => {
        reset({
            searchType: "email",
            searchTerm: "",
            userType: "Staff", // Keep as Staff
            parkingType: "Reserved",
            isTandem: false
        })
        toast.info("Reset", "Form cleared.")
    }

    const onPreSubmit: SubmitHandler<CarParkFormValues> = (data) => {
        setFormDataToSubmit(data)
        setIsConfirmOpen(true)
    }

    const handleFinalSubmit = async () => {
        if (!formDataToSubmit) return
        setIsSubmitting(true)
        try {
            const adminId = user?.id || 0
            // Reuse existing service, it handles "Staff" userType correctly
            await hrService.submitRegistration(formDataToSubmit, adminId)
            toast.success("Registration Successful", "New staff parking registered.")
            handleClear()
            setIsConfirmOpen(false)
        } catch (error) {
            toast.error("Error", error instanceof Error ? error.message : "Submission failed.")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="flex flex-col h-[calc(100vh-80px)] w-full max-w-[1400px] mx-auto overflow-hidden bg-gray-50/50 dark:bg-zinc-950/50">
            
            {/* HEADER */}
            <div className="flex-shrink-0 px-4 md:px-8 py-4 bg-background/80 backdrop-blur-md border-b z-20 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">New Staff Registration</h1>
                    <p className="text-sm text-muted-foreground mt-1">Register new staff members and assign parking</p>
                </div>

                {/* SEARCH BAR */}
                <div className="flex items-center gap-3 bg-white dark:bg-zinc-900 p-1.5 rounded-xl border shadow-sm w-full md:w-auto">
                    <div className="flex bg-gray-100 dark:bg-zinc-800 rounded-lg p-1">
                        <button type="button" onClick={() => setValue("searchType", "email")} className={cn("px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-2", searchType === 'email' ? "bg-white dark:bg-zinc-700 text-foreground shadow-sm" : "text-muted-foreground")}>
                            <Mail size={14} /> Email
                        </button>
                        <button type="button" onClick={() => setValue("searchType", "qr")} className={cn("px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-2", searchType === 'qr' ? "bg-white dark:bg-zinc-700 text-foreground shadow-sm" : "text-muted-foreground")}>
                            <QrCode size={14} /> QR
                        </button>
                    </div>
                    <div className="w-px h-6 bg-border" />
                    <Input 
                        placeholder={searchType === "email" ? "staff@icity.com" : "QR Code"} 
                        {...register("searchTerm")}
                        className="h-9 border-0 bg-transparent focus-visible:ring-0 w-full md:w-[250px] text-sm shadow-none pl-0"
                        onKeyDown={(e) => e.key === "Enter" && handleVerify()}
                    />
                    <Button type="button" onClick={handleVerify} disabled={isVerifying} size="sm" className="h-8 bg-primary text-primary-foreground hover:bg-primary/90">
                        {isVerifying ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Verify"}
                    </Button>
                </div>
            </div>

            {/* FORM AREA */}
            <div className="flex-1 overflow-y-auto p-4 md:p-8 scrollbar-hide">
                <div className="max-w-5xl mx-auto space-y-8 pb-24 md:pb-10">
                    <UniversalParkingForm 
                        context="HR" 
                        form={form} 
                        phases={phases} 
                        units={units} 
                        packages={seasonPackages} 
                        departments={departments}
                        loadingUnits={loadingUnits} 
                        loadingPhases={loadingPhases}
                        onPhaseChange={handlePhaseChange}
                        onPlateConflict={setHasPlateConflict}
                        readOnlyUser={false} 
                    />

                    <div className="hidden md:flex justify-end gap-4 pt-4 border-t">
                        <Button type="button" variant="outline" onClick={handleClear} className="h-11 px-8">
                            <RefreshCw className="mr-2 h-4 w-4" /> Clear Form
                        </Button>
                        <LoadingButton 
                            type="submit" 
                            onClick={handleSubmit(onPreSubmit)} 
                            isLoading={isSubmitting} 
                            loadingText="Processing..."
                            icon={ArrowRight}
                            disabled={hasPlateConflict}
                            className="h-11 px-10 bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg"
                        >
                            Proceed
                        </LoadingButton>
                    </div>
                </div>
            </div>

            {/* MOBILE ACTION BAR */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 border-t bg-background/95 backdrop-blur px-4 py-3 z-30 shadow-up">
                <div className="flex gap-3">
                    <Button type="button" variant="outline" onClick={handleClear} className="flex-1 h-11">
                        <RefreshCw className="mr-2 h-4 w-4" /> Clear
                    </Button>
                    <Button 
                        type="submit" 
                        onClick={handleSubmit(onPreSubmit)} 
                        disabled={isSubmitting || hasPlateConflict} 
                        className="flex-[2] h-11 bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg"
                    >
                        Proceed
                    </Button>
                </div>
            </div>

            {/* CONFIRMATION DIALOG */}
            <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-green-600"/> Confirm Staff Registration</DialogTitle>
                        <DialogDescription>Review details before submitting.</DialogDescription>
                    </DialogHeader>
                    {formDataToSubmit && (
                        <div className="space-y-4 py-2">
                             <div className="grid grid-cols-2 gap-4 text-sm">
                                <div><p className="text-xs text-muted-foreground font-bold">Name</p><p>{formDataToSubmit.name}</p></div>
                                <div><p className="text-xs text-muted-foreground font-bold">Staff ID</p><p>{formDataToSubmit.staffId || "-"}</p></div>
                                <div><p className="text-xs text-muted-foreground font-bold">Email</p><p className="truncate">{formDataToSubmit.userEmail}</p></div>
                                <div><p className="text-xs text-muted-foreground font-bold">Plate</p><Badge variant="outline">{formDataToSubmit.plate1}</Badge></div>
                             </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsConfirmOpen(false)}>Back</Button>
                        <Button onClick={handleFinalSubmit} disabled={isSubmitting} className="bg-primary text-primary-foreground hover:bg-primary/90">Confirm</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <NavigationGuard isOpen={!!pendingPath} onConfirm={() => { setPendingPath(null); setIsDirty(false); router.push(pendingPath!); }} onCancel={() => setPendingPath(null)} />
        </div>
    )
}