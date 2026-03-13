"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useAppToast } from "@/hooks/use-app-toast"
import { Ban, Unlock, LogIn, LogOut, Loader2 } from "lucide-react"
import { Breadcrumb, BreadcrumbItem, BreadcrumbSeparator, BreadcrumbList, BreadcrumbLink, BreadcrumbPage } from "@/components/ui/breadcrumb"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { SYSTEM_TERMINAL_ID } from "@/lib/constants"
import { cn, isUserInside } from "@/lib/utils"
import { carParkService } from "@/services/car-park-services"
import { CarParkPackage,  ParkingDetailData, ParkingDetailStatus, CarParkPhase, CarParkUnit } from "@/type/car-park"

// Import existing UI components
import { ParkingStatusDetail } from "@/components/modules/car-park/ParkingStatusDetail"
import { ParkingActivityHistory } from "@/components/modules/car-park/ParkingActivityHistory"
import { SystemDiagnostics } from "@/components/portal/system-diagnostics"

interface SeasonParkingDetailViewProps {
    qrId: string;
    backPath: string;     // Custom back link (e.g. to HR list or CP list)
    backLabel: string;    // Custom breadcrumb text
    moduleName: string;   // "HR" or "Car Park"
}

export function SeasonParkingDetailView({ qrId, backPath, backLabel, moduleName }: SeasonParkingDetailViewProps) {
    const router = useRouter()
    const searchParams = useSearchParams() 
    const { user } = useAuth()
    const toast = useAppToast()
    
    const accId = searchParams.get("accId")

    // --- State Logic (Extracted from original page) ---
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [submittingTarget, setSubmittingTarget] = useState<"qr" | "account" | null>(null)
    
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

    const [isManualEntryOpen, setIsManualEntryOpen] = useState(false)
    const [manualDirection, setManualDirection] = useState<"In" | "Out">("In")
    const [manualTerminalId, setManualTerminalId] = useState(String(SYSTEM_TERMINAL_ID))
    const [isProcessingEntry, setIsProcessingEntry] = useState(false)

    const [formData, setFormData] = useState<ParkingDetailData>({
        accId: 0, name: "", email: "", nric: "", userType: "", mobile: "", company: "", 
        staffId: "", contactOffice: "", contactHp: "", seasonPackage: "", bayNo: "", 
        parkingMode: "Reserved", remarks: "", isLpr: false, isTandem: false, 
        isHomestay: false, isMobileQr: false, effectiveDate: "", expiryDate: "",
        plate1: "", plate2: "", plate3: "", amanoCardNo: "", amanoExpiryDate: "",
        unitNo: "", phase: ""
    })

    const [statusInfo, setStatusInfo] = useState<ParkingDetailStatus>({
        recordStatus: "Active", seasonStatus: "Active", iPointStatus: "Active",
        lastExitSeason: "-", lastExitIPoint: "-", createdOn: "-", createdBy: "-", 
        modifiedOn: "-", modifiedBy: "-"
    })

    // --- Fetch Logic ---
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

            if (passResult && 'data' in passResult) {
                const { data, status } = passResult;
                
                // Load Units if phase is present
                if (data.phase) {
                     const unitsData = await carParkService.getUnits(data.phase);
                     setUnits(unitsData);
                }

                let fetchedBalance = 0;
                if (data.email && data.email !== "N/A") {
                    fetchedBalance = await carParkService.checkBalance(data.email);
                }

                setFormData(prev => ({
                    ...prev,
                    ...data, 
                    walletBalance: fetchedBalance,
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

    useEffect(() => { fetchData(); }, [qrId]);

    const handlePhaseChange = async (phaseId: string) => {
        setFormData(prev => ({ ...prev, phase: phaseId, unitNo: "" })); 
        setLoadingUnits(true);
        try {
            const unitsData = await carParkService.getUnits(phaseId);
            setUnits(unitsData);
        } catch (error) { console.error(error); } finally { setLoadingUnits(false); }
    };

    // --- Actions ---
    const handleAssignEntry = async (target: "qr" | "account") => {
        const currentStatus = target === "qr" ? statusInfo.seasonStatus : statusInfo.iPointStatus;
        const isInside = isUserInside(currentStatus);
        setSubmittingTarget(target);
        setManualDirection(isInside ? "Out" : "In");
        setManualTerminalId(String(SYSTEM_TERMINAL_ID)); 
        setIsManualEntryOpen(true); 
    };

    const executeManualEntry = async () => {
        if (!formData.accId) return toast.error("Error", "Account ID missing.");
        setIsProcessingEntry(true);
        try {
            await carParkService.assignManualEntry({
                accId: formData.accId,
                plateNo: formData.plate1 || "", 
                cardNo: formData.amanoCardNo || "",
                rParkingID: "",
                terminalId: parseInt(manualTerminalId) || SYSTEM_TERMINAL_ID, 
                direction: manualDirection,
                amount : 0,
            });
            toast.success("Success", `Status updated to ${manualDirection === 'In' ? 'PARK/USED' : 'AWAY/UNUSED'}`);
            setIsManualEntryOpen(false);
            setSubmittingTarget(null);
            await fetchData(); 
        } catch (error) {
            toast.error("Failed", error instanceof Error ? error.message : "Update failed.");
        } finally {
            setIsProcessingEntry(false);
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
                userType: formData.userType,
                unitId: Number(formData.unitNo) || 0, 
                bayNo: formData.bayNo,
                isReserved: formData.parkingMode === "Reserved",
                staffId: formData.staffId || null,
                department: null, 
                isStaffTag: false, 
                adminStaffId: Number(user?.id || 0),
                terminalId: SYSTEM_TERMINAL_ID,
                comment: `Updated via ${moduleName} Portal`,
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
            toast.error("Error", error instanceof Error ? error.message : "Failed to save changes.");
        } finally {
            setIsSaving(false);
        }
    };

    // ... (Block/Unblock/Delete Logic same as original, just calling carParkService)
     const confirmBlock = async () => {
        if (!blockReason.trim()) return toast.error("Required", "Please provide a reason.");
        setIsProcessingBlock(true);
        try {
            await carParkService.blockSeasonPass(Number(qrId), blockReason);
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

    const confirmDelete = async () => {
        if (!deleteReason.trim()) return toast.error("Required", "Please provide a reason.");
        setIsDeleting(true);
        try {
            await carParkService.deleteSeasonPass(Number(qrId), Number(user?.id || 0), deleteReason);
            toast.success("Deleted", "Season pass deactivated successfully.");
            router.push(backPath); 
        } catch (error) {
            toast.error("Delete Failed", error instanceof Error ? error.message : "Action failed.");
        } finally {
            setIsDeleting(false);
            setIsDeleteOpen(false);
        }
    }

    return (
        <div className="max-w-[1600px] mx-auto p-6">
             <div className="shrink-0 flex items-center justify-between border-b px-0 lg:px-4 py-3 bg-background/95 backdrop-blur z-20 lg:mb-4">
                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem>{moduleName}</BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem><BreadcrumbLink href={backPath}>{backLabel}</BreadcrumbLink></BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem><BreadcrumbPage>Account Detail | <Badge variant="outline"> ( {accId} ) </Badge></BreadcrumbPage></BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
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
                onDataChange={(updates) => setFormData(prev => ({ ...prev, ...updates }))}
                onPhaseChange={handlePhaseChange}
                onAssignEntry={handleAssignEntry}
                onSave={handleSave}
                onBlock={() => { setBlockReason(""); setIsBlockOpen(true); }}
                onUnblock={() => setIsUnblockOpen(true)}
                onDelete={() => setIsDeleteOpen(true)}
            >
                <div className="w-full mt-0"> 
                    {formData.accId ? (
                        <>
                        <ParkingActivityHistory accId={formData.accId} />
                        <SystemDiagnostics className="mt-4" />
                        </>
                    ) : (
                        <div className="h-64 border rounded-xl bg-muted/10 animate-pulse" />
                    )}
                </div>
            </ParkingStatusDetail>

            {/* MANUAL ENTRY DIALOG */}
            <Dialog open={isManualEntryOpen} onOpenChange={(open) => { if (!open && !isProcessingEntry) { setIsManualEntryOpen(false); setSubmittingTarget(null); }}}>
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle className={`flex items-center gap-2 ${manualDirection === 'Out' ? 'text-amber-600' : 'text-emerald-600'}`}>
                            {manualDirection === 'Out' ? <LogOut className="h-5 w-5" /> : <LogIn className="h-5 w-5" />}
                            Manual {manualDirection}
                        </DialogTitle>
                        <DialogDescription>Assign a manual {manualDirection.toLowerCase()} event.</DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <div className="space-y-2">
                            <Label>Terminal ID</Label>
                            <Input value={manualTerminalId} onChange={(e) => setManualTerminalId(e.target.value)} type="tel" />
                            <p className="text-xs text-muted-foreground">Default Gate: 383</p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => { setIsManualEntryOpen(false); setSubmittingTarget(null); }}>Cancel</Button>
                        <Button onClick={executeManualEntry} disabled={isProcessingEntry} className={manualDirection === 'Out' ? "bg-amber-600 hover:bg-amber-700 text-white" : "bg-emerald-600 hover:bg-emerald-700 text-white"}>
                            {isProcessingEntry ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Confirm"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* BLOCK / UNBLOCK / DELETE DIALOGS */}
            <Dialog open={isBlockOpen} onOpenChange={setIsBlockOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="text-amber-600 flex items-center gap-2"><Ban className="h-5 w-5" /> Block Season Pass</DialogTitle>
                        <DialogDescription>This will immediately suspend access for this user.</DialogDescription>
                    </DialogHeader>
                    <div className="py-2 space-y-2">
                        <Label>Reason <span className="text-red-500">*</span></Label>
                        <Textarea value={blockReason} onChange={(e) => setBlockReason(e.target.value)} className="resize-none"/>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsBlockOpen(false)} disabled={isProcessingBlock}>Cancel</Button>
                        <Button variant="destructive" onClick={confirmBlock} disabled={isProcessingBlock}>{isProcessingBlock ? "Blocking..." : "Confirm Block"}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isUnblockOpen} onOpenChange={setIsUnblockOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="text-emerald-600 flex items-center gap-2"><Unlock className="h-5 w-5" /> Unblock Season Pass</DialogTitle>
                        <DialogDescription>User will regain access immediately.</DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsUnblockOpen(false)} disabled={isProcessingBlock}>Cancel</Button>
                        <Button className="bg-emerald-600 text-white" onClick={confirmUnblock} disabled={isProcessingBlock}>{isProcessingBlock ? "Unblocking..." : "Confirm"}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="text-red-600">Delete Season Pass</DialogTitle>
                        <DialogDescription>This action cannot be undone.</DialogDescription>
                    </DialogHeader>
                    <div className="py-2 space-y-2">
                        <Label>Reason</Label>
                        <Textarea value={deleteReason} onChange={(e) => setDeleteReason(e.target.value)} />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDeleteOpen(false)} disabled={isDeleting}>Cancel</Button>
                        <Button variant="destructive" onClick={confirmDelete} disabled={isDeleting}>{isDeleting ? "Deleting..." : "Confirm Delete"}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}