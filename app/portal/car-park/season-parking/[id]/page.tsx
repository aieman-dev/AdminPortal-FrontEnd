"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams, useSearchParams } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useAppToast } from "@/hooks/use-app-toast"
import { ChevronRight, Ban, Unlock } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

// Services & Types
import { carParkService } from "@/services/car-park-services"
import { CarParkPackage,  ParkingDetailData, ParkingDetailStatus, CarParkPhase, CarParkUnit } from "@/type/car-park"

// Import the extracted component
import { ParkingStatusDetail } from "@/components/car-park/ParkingStatusDetail"
import { ParkingActivityHistory } from "@/components/car-park/ParkingActivityHistory"

export default function EditQrPage() {
    const router = useRouter()
    const params = useParams()
    const searchParams = useSearchParams() 
    const { user } = useAuth()
    
    const qrId = params?.id as string
    const accId = searchParams.get("accId")
    const toast = useAppToast()

    // --- State ---
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [submittingTarget, setSubmittingTarget] = useState<"qr" | "account" | null>(null)
    
    // Lists
    const [packageList, setPackageList] = useState<CarParkPackage[]>([])
    const [phases, setPhases] = useState<CarParkPhase[]>([])
    const [units, setUnits] = useState<CarParkUnit[]>([])
    const [loadingUnits, setLoadingUnits] = useState(false)

    const [isBlockOpen, setIsBlockOpen] = useState(false)
    const [isUnblockOpen, setIsUnblockOpen] = useState(false)
    const [blockReason, setBlockReason] = useState("")
    const [isProcessingBlock, setIsProcessingBlock] = useState(false)

    const [isDeleteOpen, setIsDeleteOpen] = useState(false)
    const [deleteReason, setDeleteReason] = useState("")
    const [isDeleting, setIsDeleting] = useState(false)

    // Data State
    const [formData, setFormData] = useState<ParkingDetailData>({
        accId: 0,
        name: "", email: "", nric: "", mobile: "", company: "", 
        type: "Staff", staffId: "", contactOffice: "", contactHp: "",
        seasonPackage: "", bayNo: "", parkingMode: "Reserved", remarks: "",
        isLpr: false, isTandem: false, isHomestay: false, isMobileQr: false,
        effectiveDate: "", expiryDate: "",
        plate1: "", plate2: "", plate3: "",
        amanoCardNo: "", amanoExpiryDate: "",
        unitNo: "", phase: ""
    })

    const [statusInfo, setStatusInfo] = useState<ParkingDetailStatus>({
        recordStatus: "Active", 
        seasonStatus: "Active", 
        iPointStatus: "Active",
        lastExitSeason: "-", 
        lastExitIPoint: "-",
        createdOn: "-", 
        createdBy: "-", 
        modifiedOn: "-", 
        modifiedBy: "-"
    })

    // --- Fetch Data ---
    const fetchData = async () => {
        if (!qrId) return;
        setIsLoading(true);
        try {
            const [passResult, packagesData, phasesData] = await Promise.all([
                carParkService.getQrListingID({ qrId: qrId }),    
                carParkService.getPackages(),
                carParkService.getPhases()
            ]);

            if (packagesData) setPackageList(packagesData);
            if (phasesData) setPhases(phasesData);

            if (passResult) {
                const { data, status } = passResult;

            let fetchedBalance = 0;
                if (data.email && data.email !== "N/A") {
                    fetchedBalance = await carParkService.checkBalance(data.email);
                }

                // 3. Update State directly
                setFormData(prev => ({
                    ...prev,
                    ...data, 
                    walletBalance: fetchedBalance,
                    phase: prev.phase,
                    unitNo: data.unitNo || prev.unitNo 
                }));

                setStatusInfo(status);
            }
        } catch (error) {
            console.error("Load Error:", error);
            toast.error("Error", "Failed to load details.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [qrId]);

    // Handle Phase Change -> Fetch Units
    const handlePhaseChange = async (phaseId: string) => {
        setFormData(prev => ({ ...prev, phase: phaseId, unitNo: "" })); 
        setLoadingUnits(true);
        try {
            const unitsData = await carParkService.getUnits(phaseId);
            setUnits(unitsData);
        } catch (error) {
            console.error("Failed to load units", error);
        } finally {
            setLoadingUnits(false);
        }
    };

    // --- Actions ---
    const handleAssignEntry = async (target: "qr" | "account") => {
        const targetAccId = formData.accId;
        if (!targetAccId) return toast.error("Error", "Account ID missing.");

        const currentStatus = target === "qr" ? statusInfo.seasonStatus : statusInfo.iPointStatus;
        const s = (currentStatus || "").toUpperCase();
        const isInside = (s.includes("PARK") || s.includes("USED")) && !s.includes("UNUSED") && !s.includes("AWAY");
        const direction = isInside ? "Out" : "In"; 

        setSubmittingTarget(target); 

        try {
            const isQr = target === "qr";
            const payload = {
                accId: targetAccId,
                terminalId: 383, 
                adminStaffId: Number(user?.id || 0), 
                direction: direction as "In" | "Out",
                remarks: `Manual ${direction} (${target.toUpperCase()}) via Portal`,
                cardNo: isQr ? formData.nric : "", 
                plateNo: isQr ? formData.plate1 : ""
            };

            await carParkService.assignManualEntry(payload);
            const newStatus = direction === 'In' ? 'PARK/USED' : 'AWAY/UNUSED';
            toast.success("Success", `Status updated to ${direction === 'In' ? 'PARK/USED' : 'AWAY/UNUSED'}`);
            await fetchData(); 

        } catch (error) {
            toast.error("Failed", error instanceof Error ? error.message : "Update failed.");
        } finally {
            setSubmittingTarget(null); 
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const payload = {
                cardId: Number(qrId),
                isLPR: formData.isLpr,
                accId: formData.accId,
                name: formData.name,
                ic: formData.nric,
                company: formData.company,
                hp: formData.contactHp,
                officeNo: formData.contactOffice,
                
                plateNo1: formData.plate1,
                plateNo2: formData.plate2 || null,
                plateNo3: formData.plate3 || null,
                
                packageId: Number(formData.seasonPackage),
                userType: formData.type,
                unitId: Number(formData.unitNo) || 0, 
                bayNo: formData.bayNo,
                isReserved: formData.parkingMode === "Reserved",
                
                staffId: formData.staffId || null,
                department: null, 
                isStaffTag: false, 
                
                adminStaffId: Number(user?.id || 0),
                terminalId: 383,
                comment: "Updated via Portal",
                remarks: formData.remarks || null,
                
                isHomestay: formData.isHomestay,
                isTransfer: formData.isMobileQr,
                amanoCardNo: formData.amanoCardNo || null,
                amanoExpiryDate: formData.amanoExpiryDate || null,
                
                isTandem: formData.isTandem,
                tandemEmail: null 
            };

            const response = await carParkService.updateSeasonPass(payload);
            
            toast.success("Updated", response.message || "Pass updated successfully.");
            await fetchData(); 

        } catch (error) {
            console.error("Update Error:", error);
            toast.error("Error", error instanceof Error ? error.message : "Failed to save changes.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDataChange = (updates: Partial<ParkingDetailData>) => {
        setFormData(prev => ({ ...prev, ...updates }));
    };

    const handleBlock = () => {
        setBlockReason("") 
        setIsBlockOpen(true)
    }

    const handleUnblock = () => {
        setIsUnblockOpen(true)
    }

    const confirmBlock = async () => {
        if (!blockReason.trim()) {
            toast.error("Required", "Please provide a reason for blocking.");
            return;
        }
        
        setIsProcessingBlock(true);
        try {
            await carParkService.blockSeasonPass(Number(qrId), Number(user?.id || 0), blockReason);
            toast.success("Blocked", "Season pass blocked successfully.");
            await fetchData(); 
            setIsBlockOpen(false);
        } catch (error) {
            toast.error("Block Failed", error instanceof Error ? error.message : "Action failed.");
        } finally {
            setIsProcessingBlock(false);
        }
    }

    const confirmUnblock = async () => {
        setIsProcessingBlock(true);
        try {
            await carParkService.unblockSeasonPass(Number(qrId), Number(user?.id || 0));
            toast.success("Unblocked", "Season pass reactivated.");
            await fetchData(); 
            setIsUnblockOpen(false);
        } catch (error) {
            toast.error("Unblock Failed", error instanceof Error ? error.message : "Action failed.");
        } finally {
            setIsProcessingBlock(false);
        }
    }

    const handleDelete = () => {
        setIsDeleteOpen(true)
    }

    const confirmDelete = async () => {
        if (!deleteReason.trim()) {
            toast.error("Required", "Please provide a reason for deletion.");
            return;
        }
        
        setIsDeleting(true);
        try {
            await carParkService.deleteSeasonPass(Number(qrId), Number(user?.id || 0), deleteReason);
            toast.success("Deleted", "Season pass deactivated successfully.");
            router.push('/portal/car-park/season-parking'); // Redirect after delete
        } catch (error) {
            toast.error("Delete Failed", error instanceof Error ? error.message : "Action failed.");
        } finally {
            setIsDeleting(false);
            setIsDeleteOpen(false);
        }
    }

    return (
        <div className="max-w-[1600px] mx-auto p-6">
             <div className="flex flex-wrap items-center text-sm text-muted-foreground mb-4 gap-y-2">
                <span className="hover:text-foreground cursor-pointer">Car Park</span>
                <ChevronRight className="h-4 w-4 mx-2" />
                <Button variant="link" className="p-0 h-auto text-muted-foreground hover:text-foreground" onClick={() => router.push('/portal/car-park/season-parking')}>
                    Season Parking
                </Button>
                <ChevronRight className="h-4 w-4 mx-2" />
                <span className="font-medium text-foreground flex items-center gap-2 whitespace-nowrap">
                    Account Detail <Badge variant="outline">ID: {accId}</Badge>
                </span>
            </div>

            <ParkingStatusDetail 
                mode="season"
                data={formData}
                status={statusInfo}
                packages={packageList}
                phases={phases}
                units={units}
                loadingUnits={loadingUnits}
                isLoading={isLoading}
                isSaving={isSaving}
                submittingTarget={submittingTarget}
                onDataChange={handleDataChange}
                onPhaseChange={handlePhaseChange}
                onAssignEntry={handleAssignEntry}
                onSave={handleSave}
                onBlock={handleBlock}
                onUnblock={handleUnblock}
                onDelete={handleDelete}
            >

            <div className="w-full mt-0"> 
                    {formData.accId ? (
                        <ParkingActivityHistory accId={formData.accId} />
                    ) : (
                        <div className="h-64 border rounded-xl bg-muted/10 animate-pulse" />
                    )}
                </div>
            </ParkingStatusDetail>

            {/*BLOCK DIALOG */}
            <Dialog open={isBlockOpen} onOpenChange={setIsBlockOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="text-amber-600 flex items-center gap-2">
                            <Ban className="h-5 w-5" />
                            Block Season Pass
                        </DialogTitle>
                        <DialogDescription>
                            This will immediately suspend access for this user. You can unblock them later from the Access Control menu.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-2 space-y-2">
                        <Label>Reason for Blocking <span className="text-red-500">*</span></Label>
                        <Textarea 
                            value={blockReason} 
                            onChange={(e) => setBlockReason(e.target.value)} 
                            placeholder="e.g. Payment overdue, Policy violation..."
                            className="resize-none"
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsBlockOpen(false)} disabled={isProcessingBlock}>Cancel</Button>
                        <Button variant="destructive" onClick={confirmBlock} disabled={isProcessingBlock}>
                            {isProcessingBlock ? "Blocking..." : "Confirm Block"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isUnblockOpen} onOpenChange={setIsUnblockOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="text-emerald-600 flex items-center gap-2">
                            <Unlock className="h-5 w-5" /> Unblock Season Pass
                        </DialogTitle>
                        <DialogDescription>
                            Are you sure you want to unblock this pass? The user will regain access immediately.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsUnblockOpen(false)} disabled={isProcessingBlock}>Cancel</Button>
                        <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={confirmUnblock} disabled={isProcessingBlock}>
                            {isProcessingBlock ? "Unblocking..." : "Confirm Unblock"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* DELETE DIALOG */}
            <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="text-red-600">Delete Season Pass</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this pass? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-2 space-y-2">
                        <Label>Reason</Label>
                        <Textarea 
                            value={deleteReason} 
                            onChange={(e) => setDeleteReason(e.target.value)} 
                            placeholder="e.g. Resigned, Terminated, User Request..."
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDeleteOpen(false)} disabled={isDeleting}>Cancel</Button>
                        <Button variant="destructive" onClick={confirmDelete} disabled={isDeleting}>
                            {isDeleting ? "Deleting..." : "Confirm Delete"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}