"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm, SubmitHandler } from "react-hook-form" 
import { zodResolver } from "@hookform/resolvers/zod"
import { Mail, QrCode, RefreshCw, Loader2, ArrowRight, CheckCircle2, User, Car, Save } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { useAppToast } from "@/hooks/use-app-toast"
import { useBeforeUnload } from "@/hooks/use-before-unload";
import { CarParkPhase, CarParkUnit, CarParkPackage, CarParkDepartment } from "@/type/car-park"
import { carParkService } from "@/services/car-park-services"
import { cn } from "@/lib/utils"
import { carParkFormSchema, CarParkFormValues } from "@/lib/schemas/car-park"
import { CarParkForm } from "@/components/modules/car-park/forms/CarParkForm"
import { NavigationGuard } from "@/components/portal/navigation-guard" 
import { useNavigation } from "@/context/navigation-context"

export default function NewRegistrationPage() {
    const router = useRouter()
    const { user } = useAuth()
    const toast = useAppToast()
    const { setIsDirty, pendingPath, setPendingPath } = useNavigation()
    const [isVerifying, setIsVerifying] = useState(false)

    // Lookup Data
    const [phases, setPhases] = useState<CarParkPhase[]>([])
    const [units, setUnits] = useState<CarParkUnit[]>([])
    const [seasonPackages, setSeasonPackages] = useState<CarParkPackage[]>([])
    const [departments, setDepartments] = useState<CarParkDepartment[]>([])
    const [hasPlateConflict, setHasPlateConflict] = useState(false);
    
    const [loadingPhases, setLoadingPhases] = useState(true)
    const [loadingUnits, setLoadingUnits] = useState(false)

    // Submission State
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isConfirmOpen, setIsConfirmOpen] = useState(false)
    const [formDataToSubmit, setFormDataToSubmit] = useState<CarParkFormValues | null>(null)
    const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

    // Prevent body scroll on mount (legacy requirement)
    useEffect(() => {
        document.body.style.overflow = "hidden"
        return () => { document.body.style.overflow = "auto" }
    }, [])

    // 1. Load Initial Data
    useEffect(() => {
        const loadPhases = async () => {
            setLoadingPhases(true)
            try {
                const data = await carParkService.getPhases()
                setPhases(data)
            } catch (error) {
                console.error("Failed to load phases", error)
            } finally {
                setLoadingPhases(false)
            }
        }

        const loadMetadata = async () => {
            try {
                // Fetch packages AND departments in parallel
                const [pkgData, deptData] = await Promise.all([
                    carParkService.getPackages(),
                    carParkService.getDepartments()
                ])
                setSeasonPackages(pkgData)
                setDepartments(deptData)
            } catch (error) {
                console.error("Failed to load metadata", error)
            }
        }

        loadPhases()
        loadMetadata()
    }, [])

    // 2. Initialize Form with Shared Schema
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
            userType: "Owner",
            parkingType: "Reserved",
            bayNo: "",
            seasonPackage: "",
            remarks: "",
            isMobileQr: false,
            isHomestay: false, 
            isLpr: false,
            amanoExpiryDate: "",
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

    // 3. Handle Phase Change (Fetches Units)
    const handlePhaseChange = async (value: string) => {
        setValue("phase", value, { shouldValidate: true })
        setValue("unitNo", "") 
        setUnits([])
        
        setLoadingUnits(true)
        try {
            const data = await carParkService.getUnits(value)
            setUnits(data)
        } catch (error) {
            console.error("Failed to load units", error)
            toast.error("Error", "Failed to load units")
        } finally {
            setLoadingUnits(false)
        }
    }

    // 4. Verify User Handler
    const handleVerify = async () => {
        const type = getValues("searchType")
        const term = getValues("searchTerm")

        if (!term || !type) { 
            toast.info("Input Required", "Please select a search mode and enter a term.") 
            return 
        }

        setIsVerifying(true)
        try {
            const result = await carParkService.verifyUser(type, term)
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
            userType: "Owner",
            parkingType: "Reserved",
            isTandem: false,
            isMobileQr: false,
            isHomestay: false,
            isLpr: false
        })
        toast.info("Reset", "Form cleared.")
    }

    // 5. Submit Handlers
    const onPreSubmit: SubmitHandler<CarParkFormValues> = (data) => {
        setFormDataToSubmit(data)
        setIsConfirmOpen(true)
    }

    const handleFinalSubmit = async () => {
        if (!formDataToSubmit) return
        setIsSubmitting(true)
        try {
            const adminId = user?.id || 0
            await carParkService.submitRegistration(formDataToSubmit, adminId)
            toast.success("Registration Successful", "New season pass created.")
            form.reset()
            setIsConfirmOpen(false)
            handleClear()
        } catch (error) {
            toast.error("Error", error instanceof Error ? error.message : "Submission failed.")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="flex flex-col h-[calc(100vh-80px)] w-full max-w-[1400px] mx-auto overflow-hidden bg-gray-50/50 dark:bg-zinc-950/50">
            
            {/* 1. STICKY HEADER (SEARCH) */}
            <div className="flex-shrink-0 px-4 md:px-8 py-4 md:py-5 bg-background/80 backdrop-blur-md border-b z-20 flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in slide-in-from-top-2 duration-500">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">New Registration</h1>
                    <p className="text-sm text-muted-foreground mt-1">Manage parking access and user details</p>
                </div>

                {/* SEARCH TOGGLE & BAR */}
                <div className="flex items-center gap-3 bg-white dark:bg-zinc-900 p-1.5 rounded-xl border shadow-sm w-full md:w-auto">
                    <div className="flex bg-gray-100 dark:bg-zinc-800 rounded-lg p-1">
                        <button
                            type="button"
                            onClick={() => setValue("searchType", "email")}
                            className={cn(
                                "px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-2",
                                searchType === 'email' ? "bg-white dark:bg-zinc-700 text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <Mail size={14} /> Email
                        </button>
                        <button
                            type="button"
                            onClick={() => setValue("searchType", "qr")}
                            className={cn(
                                "px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-2",
                                searchType === 'qr' ? "bg-white dark:bg-zinc-700 text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <QrCode size={14} /> QR
                        </button>
                    </div>
                    
                    <div className="w-px h-6 bg-border" />
                    
                    <div className="relative">
                        <Input 
                            placeholder={searchType === "email" ? "user@example.com" : "QR Code"} 
                            {...register("searchTerm")}
                            className="h-9 border-0 bg-transparent focus-visible:ring-0 w-full md:w-[280px] text-sm shadow-none pl-0"
                            onKeyDown={(e) => e.key === "Enter" && handleVerify()}
                        />
                    </div>

                    <Button 
                        type="button" onClick={handleVerify} disabled={isVerifying} size="sm" 
                        className="h-8 px-5 bg-primary text-primary-foreground hover:bg-primary/90 font-medium rounded-lg shadow-sm transition-transform active:scale-95"
                    >
                        {isVerifying ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Verify"}
                    </Button>
                </div>
            </div>

            {/* 2. REUSABLE FORM CONTENT */}
            <div className="flex-1 overflow-y-auto p-4 md:p-8 scrollbar-hide">
                <div className="max-w-5xl mx-auto space-y-8 pb-24 md:pb-10">
                    
                    {/* Pass Form and Lists to Shared Component */}
                    <CarParkForm 
                        form={form} 
                        phases={phases} 
                        units={units} 
                        packages={seasonPackages} 
                        departments={departments}
                        loadingUnits={loadingUnits} 
                        loadingPhases={loadingPhases}
                        onPhaseChange={handlePhaseChange}
                        onPlateConflict={setHasPlateConflict}
                    />

                    {/* --- DESKTOP ACTIONS (Original Way) --- */}
                    {/* Hidden on mobile, Flex on medium screens and up */}
                    <div className="hidden md:flex justify-end gap-4 pt-4 border-t">
                        <Button 
                            type="button" 
                            variant="outline" 
                            onClick={handleClear} 
                            className="h-11 px-8 rounded-xl border-gray-300 hover:bg-gray-100 text-gray-600"
                        >
                            <RefreshCw className="mr-2 h-4 w-4" /> Clear Form
                        </Button>
                        <Button 
                            type="submit" 
                            onClick={handleSubmit(onPreSubmit)} 
                            disabled={isSubmitting || hasPlateConflict} 
                            className={cn(
                                "h-11 px-10 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg transition-all hover:scale-[1.02] active:scale-95",
                                hasPlateConflict && "opacity-50 cursor-not-allowed" 
                            )}
                        >
                            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowRight className="mr-2 h-4 w-4" />} 
                            Proceed
                        </Button>
                    </div>

                </div>
            </div>

            {/* --- MOBILE STICKY ACTION BAR (New) --- */}
            {/* Visible on mobile, Hidden on medium screens and up */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 border-t bg-background/95 backdrop-blur px-4 py-3 z-30 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                <div className="flex gap-3">
                    <Button 
                        type="button" 
                        variant="outline" 
                        onClick={handleClear} 
                        className="flex-1 h-11 border-gray-300 text-gray-600"
                    >
                        <RefreshCw className="mr-2 h-4 w-4" /> Clear
                    </Button>
                    <Button 
                        type="submit" 
                        onClick={handleSubmit(onPreSubmit)} 
                        disabled={isSubmitting || hasPlateConflict} 
                        className={cn(
                            "flex-[2] h-11 bg-black hover:bg-gray-800 text-white shadow-lg transition-all",
                            hasPlateConflict && "opacity-50 cursor-not-allowed"
                        )}
                    >
                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowRight className="mr-2 h-4 w-4" />} 
                        Proceed
                    </Button>
                </div>
            </div>

            {/* 3. CONFIRMATION DIALOG */}
            <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
                <DialogContent className="sm:max-w-xl p-0 overflow-hidden">
                    <DialogHeader className="p-6 bg-muted/20 border-b">
                        <DialogTitle className="flex items-center gap-2 text-xl">
                            <CheckCircle2 className="h-6 w-6 text-green-600" /> Confirm Registration
                        </DialogTitle>
                        <DialogDescription>Please review the details below before submitting.</DialogDescription>
                    </DialogHeader>
                    
                    {formDataToSubmit && (
                       <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto scrollbar-hide">
                            {/* Section 1: User Profile */}
                            <div className="space-y-3">
                                <h4 className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest flex items-center gap-2">
                                    <User className="h-3 w-3" /> Personal Information
                                </h4>
                                <div className="grid grid-cols-2 gap-4 bg-muted/30 p-4 rounded-xl border border-border/50">
                                    <div><p className="text-[10px] text-muted-foreground uppercase font-bold">Full Name</p><p className="font-medium text-sm">{formDataToSubmit.name}</p></div>
                                    <div><p className="text-[10px] text-muted-foreground uppercase font-bold">NRIC</p><p className="font-medium text-sm">{formDataToSubmit.nric}</p></div>
                                    <div className="col-span-2"><p className="text-[10px] text-muted-foreground uppercase font-bold">Email</p><p className="font-medium text-sm truncate">{formDataToSubmit.userEmail}</p></div>
                                </div>
                            </div>

                            {/* Section 2: Parking Plan */}
                            <div className="space-y-3">
                                <h4 className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest flex items-center gap-2">
                                    <Car className="h-3 w-3" /> Parking & Location
                                </h4>
                                <div className="grid grid-cols-2 gap-4 bg-muted/30 p-4 rounded-xl border border-border/50">
                                    <div>
                                        <p className="text-[10px] text-muted-foreground uppercase font-bold">Unit</p>
                                        <p className="font-medium text-sm">
                                            {/* Map ID to Name */}
                                            {phases.find(p => String(p.id) === formDataToSubmit.phase)?.name || "N/A"} - {formDataToSubmit.unitNo}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-muted-foreground uppercase font-bold">Package</p>
                                        <p className="font-medium text-sm truncate">
                                            {seasonPackages.find(pkg => String(pkg.id) === formDataToSubmit.seasonPackage)?.name || "N/A"}
                                        </p>
                                    </div>
                                    <div className="col-span-2">
                                        <p className="text-[10px] text-muted-foreground uppercase font-bold">Registered Plates</p>
                                        <div className="flex flex-wrap gap-2 mt-1">
                                            <Badge variant="secondary" className="font-mono text-xs px-2 py-0.5">{formDataToSubmit.plate1}</Badge>
                                            {formDataToSubmit.plate2 && <Badge variant="outline" className="font-mono text-xs px-2 py-0.5">{formDataToSubmit.plate2}</Badge>}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
)}
                    <DialogFooter className="p-4 border-t bg-muted/10 gap-2">
                        <Button 
                            variant="outline" 
                            onClick={() => setIsConfirmOpen(false)} 
                            disabled={isSubmitting}>
                            Back to Edit
                        </Button>

                        <Button 
                            onClick={handleFinalSubmit} 
                            disabled={isSubmitting} 
                            className="min-w-[140px] bg-black hover:bg-gray-800 text-white shadow-lg">
                            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="mr-2 h-4 w-4" />} 
                            Confirm Submit
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <NavigationGuard 
                isOpen={!!pendingPath} 
                onConfirm={() => {
                    const path = pendingPath;
                    setPendingPath(null); 
                    setIsDirty(false); 
                    router.push(path!); 
                }}
                onCancel={() => setPendingPath(null)} 
            />
        </div>
    )
}