"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { 
    Save, CheckCircle2, XCircle, ArrowLeft, Loader2, AlertCircle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useAppToast } from "@/hooks/use-app-toast"
import { carParkService } from "@/services/car-park-services"
import { carParkFormSchema, CarParkFormValues } from "@/lib/schemas/car-park"
import { CarParkForm } from "@/components/car-park/CarParkForm"
import { CarParkPhase, CarParkUnit, CarParkPackage, CarParkDepartment } from "@/type/car-park"

export default function ApplicationReviewPage() {
    const router = useRouter()
    const { id } = useParams()
    const toast = useAppToast()
    
    // Local State for Lists
    const [phases, setPhases] = useState<CarParkPhase[]>([]);
    const [units, setUnits] = useState<CarParkUnit[]>([]);
    const [seasonPackages, setSeasonPackages] = useState<CarParkPackage[]>([]);
    const [departments, setDepartments] = useState<CarParkDepartment[]>([]);
    const [loadingUnits, setLoadingUnits] = useState(false);

    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isRejectOpen, setIsRejectOpen] = useState(false)
    const [rejectReason, setRejectReason] = useState("")

    // 1. Initialize Form
    const form = useForm<CarParkFormValues>({
        resolver: zodResolver(carParkFormSchema) as any,
        defaultValues: {
            // Defaults will be overridden by useEffect
            userEmail: "", name: "", nric: "", mobileContact: "", 
            plate1: "", phase: "", unitNo: "", userType: "Staff", 
            parkingType: "Reserved", isTandem: false
        }
    });
    const { setValue, handleSubmit } = form;

    // 2. Fetch Initial Data (Mocked for now as per original file)
    useEffect(() => {
        const init = async () => {
            // Load Metadata
            const [phaseData, packageData, deptData] = await Promise.all([
                carParkService.getPhases(),
                carParkService.getPackages(),
                carParkService.getDepartments()
            ]);
            setPhases(phaseData);
            setSeasonPackages(packageData);
            setDepartments(deptData);

            // Simulate Fetching Application Data
            // In real app: await carParkService.getApplicationById(id)
            const mockData = {
                email: "system@i-city.my",
                name: "FOR TESTING ONLY",
                nric: "901010-10-1234",
                mobile: "012-3456789",
                office: "",
                company: "i-City Berhad",
                plate1: "WWA 1234",
                plate2: "",
                plate3: "",
                phase: "CityPark", // Assuming this matches an ID or Name
                unitNo: "B-10-2",
                userType: "Staff",
                staffId: "ICP1001",
                parkingMode: "Reserved",
                bayNo: "CP-B1-12",
                seasonPackage: "(CP) Maybank Staff Exclusive LG3",
                isTandem: false,
                isMobileQr: true,
                isLpr: false,
                remarks: "Pending approval"
            };

            // Populate Form
            setValue("userEmail", mockData.email);
            setValue("name", mockData.name);
            setValue("nric", mockData.nric);
            setValue("mobileContact", mockData.mobile);
            setValue("officeContact", mockData.office);
            setValue("companyName", mockData.company);
            setValue("plate1", mockData.plate1);
            setValue("plate2", mockData.plate2);
            setValue("plate3", mockData.plate3);
            
            // For Phase/Unit, we might need IDs. 
            // Assuming logic to find ID from Name exists or data returns IDs
            // setValue("phase", ...); 
            
            setValue("userType", mockData.userType as any);
            setValue("staffId", mockData.staffId);
            setValue("parkingType", mockData.parkingMode as any);
            setValue("bayNo", mockData.bayNo);
            setValue("seasonPackage", mockData.seasonPackage);
            setValue("isTandem", mockData.isTandem);
            setValue("isMobileQr", mockData.isMobileQr);
            setValue("isLpr", mockData.isLpr);
            setValue("remarks", mockData.remarks);
        };
        init();
    }, [id, setValue]);

    const handlePhaseChange = async (value: string) => {
        setValue("phase", value);
        setLoadingUnits(true);
        try {
            const data = await carParkService.getUnits(value);
            setUnits(data);
        } finally {
            setLoadingUnits(false);
        }
    };

    const handleSave = async (data: CarParkFormValues) => {
        setIsSubmitting(true);
        try {
            await new Promise(r => setTimeout(r, 1000)); // Mock API
            toast.success("Saved", "Application details updated.");
        } catch (error) {
            toast.error("Error", "Failed to save.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleApprove = async () => {
        setIsSubmitting(true);
        try {
            await carParkService.updateApplicationStatus(Number(id), "Approved");
            toast.success("Approved", "Application approved.");
            router.push("/portal/car-park/application");
        } catch (error) {
            toast.error("Error", "Approval failed.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleReject = async () => {
        if (!rejectReason) return toast.error("Required", "Enter a reason.");
        setIsSubmitting(true);
        try {
            await carParkService.updateApplicationStatus(Number(id), "Rejected", rejectReason);
            toast.info("Rejected", "Application rejected.");
            router.push("/portal/car-park/application");
        } finally {
            setIsSubmitting(false); 
            setIsRejectOpen(false);
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-80px)] w-full max-w-[1400px] mx-auto bg-gray-50/50 dark:bg-zinc-950/50">
            
            {/* HEADER */}
            <div className="flex-shrink-0 px-8 py-5 bg-background/80 backdrop-blur-md border-b z-20 flex items-center justify-between">
                <div className="flex items-center gap-4">
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

            {/* FORM CONTENT (REUSING COMPONENT) */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8 scrollbar-hide">
                <div className="max-w-5xl mx-auto space-y-8 pb-10">
                    <CarParkForm 
                        form={form} 
                        phases={phases} 
                        units={units} 
                        packages={seasonPackages} 
                        departments={departments}
                        loadingUnits={loadingUnits} 
                        onPhaseChange={handlePhaseChange}
                        readOnlyUser={true} // Locks User Info for Review Mode
                    />
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
                            placeholder="e.g. Incomplete documents..."
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