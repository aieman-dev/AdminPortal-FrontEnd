"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { 
    Save, CheckCircle2, XCircle, ArrowLeft, Loader2, AlertCircle, MoreVertical
} from "lucide-react"
import { SYSTEM_TERMINAL_ID } from "@/lib/constants"
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useAppToast } from "@/hooks/use-app-toast"
import { useAuth } from "@/hooks/use-auth"
import { carParkService } from "@/services/car-park-services"
import { carParkFormSchema, CarParkFormValues } from "@/lib/schemas/car-park"
import { CarParkForm } from "@/components/modules/car-park/forms/CarParkForm"
import { CarParkPhase, CarParkUnit, CarParkPackage, CarParkDepartment } from "@/type/car-park"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function ApplicationReviewPage() {
    const router = useRouter()
    const { id } = useParams()
    const { user } = useAuth()
    const toast = useAppToast()
    
    // Local State for Lists
    const [phases, setPhases] = useState<CarParkPhase[]>([]);
    const [units, setUnits] = useState<CarParkUnit[]>([]);
    const [seasonPackages, setSeasonPackages] = useState<CarParkPackage[]>([]);
    const [departments, setDepartments] = useState<CarParkDepartment[]>([]);
    const [loadingUnits, setLoadingUnits] = useState(false);
    const [isLoadingData, setIsLoadingData] = useState(true);

    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isRejectOpen, setIsRejectOpen] = useState(false)
    const [rejectReason, setRejectReason] = useState("")

    // 1. Initialize Form
    const form = useForm<CarParkFormValues>({
        resolver: zodResolver(carParkFormSchema) as any,
        defaultValues: {
            userEmail: "",
            name: "",
            nric: "",
            mobileContact: "", 
            plate1: "", 
            phase: "", 
            unitNo: "", 
            userType: "Staff", 
            parkingType: "Reserved", 
            isTandem: false
        }
    });
    const { setValue, handleSubmit, getValues } = form;

    // 2. Fetch Initial Data (Mocked for now as per original file)
    useEffect(() => {
        const init = async () => {
            setIsLoadingData(true);
            try {
                // Load Metadata
                const [phaseData, packageData, deptData] = await Promise.all([
                    carParkService.getPhases(),
                    carParkService.getPackages(),
                    carParkService.getDepartments()
                ]);
                setPhases(phaseData);
                setSeasonPackages(packageData);
                setDepartments(deptData);

                // Fetch Real Application Data
                if (id) {
                    const appData = await carParkService.getApplicationById(Number(id));
                    
                    if (appData) {
                        // Populate Form with API Data
                        setValue("accId", appData.accountId);
                        setValue("userEmail", appData.email);
                        setValue("name", appData.name);
                        setValue("nric", appData.ic);
                        setValue("mobileContact", appData.hp);
                        setValue("companyName", appData.company);
                        setValue("plate1", appData.carPlateNo);
                        
                        // Map User Type (Ensure it matches schema enum)
                        // Note: Backend might return "Tenant", Schema expects "Staff" | "Tenant" | ...
                        const safeType = ["Staff", "Tenant", "Non-Tenant", "Owner"].includes(appData.type) 
                            ? appData.type 
                            : "Tenant"; // Fallback
                        setValue("userType", safeType as any);

                        // If it's a Staff, we don't have explicit staffId in this endpoint response yet
                        // You might need to fetch account details separately if needed, or leave blank.
                        
                        // Phase & Unit
                        if (appData.phaseId) {
                            setValue("phase", String(appData.phaseId));
                            // Fetch units for this phase immediately to populate dropdown
                            const unitList = await carParkService.getUnits(appData.phaseId);
                            setUnits(unitList);
                            
                            if (appData.unitId) {
                                setValue("unitNo", String(appData.unitId));
                            }
                        }

                        // Package & Parking Mode
                        // Logic: If bayNo exists, assume "Reserved", else "Normal"
                        const mode = appData.bayNo ? "Reserved" : "Normal";
                        setValue("parkingType", mode);
                        setValue("bayNo", appData.bayNo);
                        
                        if (appData.packageId) {
                            setValue("seasonPackage", String(appData.packageId));
                        }

                        // Defaults for flags not present in this specific API response
                        setValue("isTandem", false); 
                        setValue("isMobileQr", false); 
                        setValue("isLpr", false);
                        
                        // Populate remarks
                        // setValue("remarks", ""); // API doesn't seem to return remarks field in the example?
                    } else {
                        toast.error("Not Found", "Application details could not be loaded.");
                    }
                }
            } catch (error) {
                console.error("Init Error:", error);
                toast.error("Error", "Failed to load application data.");
            } finally {
                setIsLoadingData(false);
            }
        };
        init();
    }, [id, setValue]);

    const handlePhaseChange = async (value: string) => {
        setValue("phase", value);
        setValue("unitNo", "");
        setLoadingUnits(true);
        try {
            const data = await carParkService.getUnits(value);
            setUnits(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoadingUnits(false);
        }
    };

    const handleSave = async (data: CarParkFormValues) => {
        setIsSubmitting(true);
        try {
            const payload = {
                applicationId: Number(id),
                plateNo1: data.plate1 || "",
                packageId: Number(data.seasonPackage),
                userType: data.userType,
                phaseId: Number(data.phase),
                unitId: Number(data.unitNo),
                bayNo: data.bayNo || "",
                adminStaffId: Number(user?.id || 0)
            };

            await carParkService.updateApplication(payload);
            toast.success("Saved", "Application details updated successfully.");
        } catch (error) {
            toast.error("Error", error instanceof Error ? error.message : "Failed to save.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleApprove = async () => {
        setIsSubmitting(true);
        const data = getValues();
        
        try {
            const payload = {
                applicationId: Number(id),
                accId: Number(data.accId),
                adminStaffId: Number(user?.id || 0),
                terminalId: SYSTEM_TERMINAL_ID, 

                name: data.name,
                ic: data.nric,
                company: data.companyName || "",
                hp: data.mobileContact,
                officeNo: data.officeContact || "",
                userType: data.userType,
                
                plateNo1: data.plate1,
                plateNo2: data.plate2 || "",
                plateNo3: data.plate3 || "",
                packageId: Number(data.seasonPackage),

                unitId: Number(data.unitNo),
                bayNo: data.bayNo || "",
                isReserved: data.parkingType === "Reserved",

                staffId: data.staffId || "",
                department: data.department || "",
                isStaffTag: data.userType === 'Staff',
                
                isTandem: data.isTandem,
                tandemEmail: data.tandemEmail || "",
                tandemName: data.tandemName || "",
                tandemIC: data.tandemNric || "",
                tandemHP: data.tandemMobile || "",
                tandemPlateNo1: data.tandemPlate1 || "",
                tandemPlateNo2: "", // Not in form
                tandemPlateNo3: "", // Not in form

                isLPR: data.isLpr,
                isHomestay: data.isHomestay,
                isTransfer: data.isMobileQr, // Form label: "Conversion to Mobile QR"
                
                amanoCardNo: data.amanoCardNo || "",
                amanoExpiryDate: data.amanoExpiryDate || null,

                comment: "Approved via Portal",
                remarks: data.remarks || ""
            };

            await carParkService.approveApplication(payload);
            toast.success("Approved", "Application approved and pass registered.");
            router.push("/portal/car-park/application");
        } catch (error) {
            toast.error("Error", error instanceof Error ? error.message : "Approval failed.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleReject = async () => {
        if (!rejectReason.trim()) return toast.error("Required", "Please enter a rejection reason.");
        
        setIsSubmitting(true);
        try {
            const payload = {
                applicationId: Number(id),
                adminStaffId: Number(user?.id || 0),
                reason: rejectReason
            };

            await carParkService.rejectApplication(payload);
            toast.info("Rejected", "Application rejected successfully.");
            router.push("/portal/car-park/application");
        } catch (error) {
            toast.error("Error", error instanceof Error ? error.message : "Rejection failed.");
        } finally {
            setIsSubmitting(false); 
            setIsRejectOpen(false);
        }
    };

    if (isLoadingData) {
    return (
        <div className="flex flex-col h-[calc(100dvh-80px)] w-full max-w-[1400px] mx-auto bg-gray-50/50 dark:bg-zinc-950/50">
            {/* Header Skeleton */}
            <div className="px-8 py-4 border-b bg-background flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-md" /> {/* Back Button */}
                    <div className="space-y-2">
                        <Skeleton className="h-6 w-48" />
                        <Skeleton className="h-4 w-32" />
                    </div>
                </div>
            </div>

            {/* Form Content Skeleton */}
            <div className="flex-1 p-8 space-y-8">
                <div className="max-w-5xl mx-auto space-y-6">
                    {/* Mimic the Cards in CarParkForm */}
                    <div className="rounded-xl border bg-card p-6 space-y-6">
                        <Skeleton className="h-6 w-40" /> {/* Card Title */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-10 w-full" /></div>
                            <div className="space-y-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-10 w-full" /></div>
                            <div className="space-y-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-10 w-full" /></div>
                            <div className="space-y-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-10 w-full" /></div>
                        </div>
                    </div>
                    
                    <div className="rounded-xl border bg-card p-6 space-y-6">
                        <Skeleton className="h-6 w-40" />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-10 w-full" /></div>
                            <div className="space-y-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-10 w-full" /></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

    return (
        <div className="flex flex-col h-[calc(100dvh-80px)] w-full max-w-[1400px] mx-auto bg-gray-50/50 dark:bg-zinc-950/50">
            
            {/* HEADER */}
            <div className="flex-shrink-0 px-8 bg-background/80 backdrop-blur-md border-b z-20 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Button variant="outline" size="icon" onClick={() => router.back()}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                            Review Application <Badge variant="secondary">#{id}</Badge>
                        </h1>
                        <p className="text-sm text-muted-foreground">Verify details before approval</p>
                    </div>
                </div>
            </div>

            {/* FORM CONTENT (REUSING COMPONENT) */}
            <div className="flex-1 overflow-y-auto p-4 md:p-8 pb-32 scrollbar-hide">
                <div className="max-w-5xl mx-auto space-y-8">
                    <CarParkForm 
                        form={form} 
                        phases={phases} 
                        units={units} 
                        packages={seasonPackages} 
                        departments={departments}
                        loadingUnits={loadingUnits} 
                        onPhaseChange={handlePhaseChange}
                        readOnlyUser={true} 
                    />
                </div>
            </div>

            {/* FIXED ACTION BAR */}
            <div className="fixed bottom-0 left-0 right-0 border-t bg-background/95 backdrop-blur px-4 py-3 md:px-8 md:py-4 z-30 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                <div className="max-w-5xl mx-auto">
                    {/* DESKTOP LAYOUT (Hidden on mobile) */}
                    <div className="hidden md:flex items-center justify-between gap-4">
                        <p className="text-sm text-muted-foreground">
                            Please ensure all details are correct before approving.
                        </p>
                        <div className="flex gap-3">
                            <Button variant="outline" onClick={handleSubmit(handleSave)} disabled={isSubmitting}>
                                <Save className="mr-2 h-4 w-4" /> Save Changes
                            </Button>
                            <Button variant="destructive" onClick={() => setIsRejectOpen(true)} disabled={isSubmitting} className="bg-red-600 hover:bg-red-700">
                                <XCircle className="mr-2 h-4 w-4" /> Reject
                            </Button>
                            <Button onClick={handleApprove} disabled={isSubmitting} className="bg-green-600 hover:bg-green-700 text-white min-w-[140px]">
                                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                                Approve
                            </Button>
                        </div>
                    </div>

                    {/* MOBILE LAYOUT (Compact, Hamburger for secondary) */}
                    <div className="flex md:hidden items-center gap-3">
                        {/* 1. Hamburger for "Save" and other options */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="icon" className="h-11 w-11 shrink-0 bg-background border-input shadow-sm">
                                    <MoreVertical className="h-5 w-5 text-muted-foreground" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" side="top" className="w-48 mb-2">
                                <DropdownMenuItem onClick={handleSubmit(handleSave)} disabled={isSubmitting}>
                                    <Save className="mr-2 h-4 w-4" /> Save Changes
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {/* 2. Reject Button (Flex 1) */}
                        <Button 
                            variant="destructive" 
                            onClick={() => setIsRejectOpen(true)} 
                            disabled={isSubmitting} 
                            className="flex-1 h-11 bg-red-600/10 text-red-600 hover:bg-red-600/20 border border-red-600/20 shadow-sm"
                        >
                            <XCircle className="mr-2 h-4 w-4" /> Reject
                        </Button>

                        {/* 3. Approve Button (Flex 2 - More prominent) */}
                        <Button 
                            onClick={handleApprove} 
                            disabled={isSubmitting} 
                            className="flex-[1.5] h-11 bg-green-600 hover:bg-green-700 text-white shadow-md font-semibold"
                        >
                            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Approve"}
                        </Button>
                    </div>
                </div>
            </div>

            {/* REJECT DIALOG */}
            <Dialog open={isRejectOpen} onOpenChange={setIsRejectOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-red-600">
                             <AlertCircle className="h-5 w-5" /> Confirm Rejection
                        </DialogTitle>
                        <DialogDescription>Please provide a reason for rejecting this application.</DialogDescription>
                    </DialogHeader>
                    <div className="py-2">
                        <Label>Rejection Reason</Label>
                        <Textarea 
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            placeholder="e.g. Incomplete documents"
                            className="mt-2"
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsRejectOpen(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleReject}>Confirm Reject</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}