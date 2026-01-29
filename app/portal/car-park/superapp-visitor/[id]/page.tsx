"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useAppToast } from "@/hooks/use-app-toast"
import { ChevronRight, ArrowRightLeft, Loader2, LogOut, Wallet, LogIn, AlertTriangle, ExternalLink } from "lucide-react"
import { SYSTEM_TERMINAL_ID } from "@/lib/constants"

// Services & Types
import { carParkService } from "@/services/car-park-services"
import { CarParkPackage, ParkingDetailData, ParkingDetailStatus } from "@/type/car-park"
import { cn } from "@/lib/utils"

// Import Components
import { ParkingStatusDetail } from "@/components/car-park/ParkingStatusDetail"
import { ParkingActivityHistory } from "@/components/car-park/ParkingActivityHistory"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { SeasonPassConflictOverlay } from "@/components/car-park/overlays/SeasonPassConflictoverlay"

const DEFAULT_VISITOR_DATA: ParkingDetailData = {
    accId: 0,
    name: "", email: "", nric: "", userType: "", mobile: "", company: "", 
    staffId: "", contactOffice: "", contactHp: "",
    seasonPackage: "", bayNo: "", parkingMode: "Normal", remarks: "",
    isLpr: false, isTandem: false, isHomestay: false, isMobileQr: false,
    effectiveDate: "", expiryDate: "",
    plate1: "", plate2: "", plate3: "",
    amanoCardNo: "", amanoExpiryDate: "",
    unitNo: "", phase: "",
    walletBalance: 0
};

export default function SuperAppVisitorDetail() {
    const router = useRouter()
    const params = useParams()
    const { user } = useAuth()
    
    const accId = params?.id as string
    const toast = useAppToast()

    // --- State ---
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [submittingTarget, setSubmittingTarget] = useState<"qr" | "account" | null>(null)
    const [packageList, setPackageList] = useState<CarParkPackage[]>([])

    // Manual Entry State (Unified for In/Out)
    const [isManualEntryOpen, setIsManualEntryOpen] = useState(false)
    const [manualDirection, setManualDirection] = useState<"In" | "Out">("In")
    const [manualAmount, setManualAmount] = useState<string>("0.00")
    const [manualTerminalId, setManualTerminalId] = useState(String(SYSTEM_TERMINAL_ID))
    const [manualRemarks, setManualRemarks] = useState("")
    const [isProcessingEntry, setIsProcessingEntry] = useState(false)

    // Season Pass Conflict State
    const [hasActiveSeasonPass, setHasActiveSeasonPass] = useState(false)
    const [seasonPassQrId, setSeasonPassQrId] = useState<string | null>(null)

    // Data State
    const [formData, setFormData] = useState<ParkingDetailData>(DEFAULT_VISITOR_DATA)

    const [statusInfo, setStatusInfo] = useState<ParkingDetailStatus>({
        recordStatus: "Active", 
        seasonStatus: "N/A", 
        iPointStatus: "Checking...", 
        lastExitSeason: "-", 
        lastExitIPoint: "-",
        createdOn: "-", 
        createdBy: "System", 
        modifiedOn: "-", 
        modifiedBy: "-"
    })

    const fetchData = async () => {
        if (!accId) return;
        setIsLoading(true);
        setHasActiveSeasonPass(false);
        setSeasonPassQrId(null);

        try {
            const [packagesData, accountData, passResult] = await Promise.all([
                carParkService.getPackages(),
                carParkService.getSuperAppAccount(accId),
                carParkService.getQrListingID({ accId: accId }) 
            ]);

            if (packagesData) setPackageList(packagesData);

            let finalData = { ...DEFAULT_VISITOR_DATA };
            let balance = 0;

            if (accountData) {
                finalData = {
                    ...finalData,
                    accId: Number(accountData.accId),
                    name: accountData.firstName, 
                    email: accountData.email,
                    contactHp: accountData.mobile,
                };

                if (accountData.email && accountData.email !== "N/A") {
                    balance = await carParkService.checkBalance(accountData.email);
                }
            }

            // Handle Pass Result or Conflict Error
            if (passResult) {
                if ('error' in passResult && passResult.error === "CONFLICT_SEASON_PASS") {
                    // CONFLICT DETECTED
                    setHasActiveSeasonPass(true);
                    setSeasonPassQrId(passResult.qrId);
                    setStatusInfo(prev => ({ ...prev, iPointStatus: "Season Pass Active" }));
                } else if ('data' in passResult) {
                    // Normal Success
                    const { data: passData, status: passStatus } = passResult as any;
                    finalData = {
                        ...finalData,
                        ...passData, 
                        name: accountData?.firstName || passData.name,
                        mobile: accountData?.mobile || passData.mobile,
                        contactHp: accountData?.mobile || passData.contactHp, 
                    };
                    setStatusInfo(passStatus);
                }
            }

            setFormData({
                ...finalData,
                walletBalance: balance
            });

            if (!accountData && !passResult) {
                 toast.error("Not Found", "No records found for this Account ID.");
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
    }, [accId]);

    const handleDataChange = (updates: Partial<ParkingDetailData>) => {
        setFormData(prev => ({ ...prev, ...updates }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        // Simulate save
        await new Promise(r => setTimeout(r, 1000));
        setIsSaving(false);
        toast.success("Updated", "Changes saved locally.");
    };

    // --- Actions ---
    const handleAssignEntry = (target: "qr" | "account") => {
        const s = (statusInfo.iPointStatus || "").toUpperCase();
        const isInside = (s.includes("PARK") || s.includes("USED")) && !s.includes("UNUSED") && !s.includes("AWAY");
        const nextDir = isInside ? "Out" : "In";
        
        setSubmittingTarget(target);
        setManualDirection(nextDir);
        setManualAmount("0.00");
        setManualTerminalId(String(SYSTEM_TERMINAL_ID))
        setManualRemarks("");
        setIsManualEntryOpen(true);
    };

    const executeManualAccess = async () => {
        setIsProcessingEntry(true);

        try {
            let amount = 0;
            if (manualDirection === "Out") {
                amount = parseFloat(manualAmount);
                const currentBalance = formData.walletBalance || 0;
                
                if (amount > currentBalance) {
                    toast.error("Insufficient Balance", `Amount (RM ${amount.toFixed(2)}) exceeds wallet balance (RM ${currentBalance.toFixed(2)}).`);
                    setIsProcessingEntry(false);
                    return; 
                }
            }
            
            const payload = {
                accId: formData.accId,
                plateNo: formData.plate1 || "", 
                cardNo: formData.amanoCardNo || "",
                direction: manualDirection,
                terminalId: parseInt(manualTerminalId) || SYSTEM_TERMINAL_ID, 
                amount: amount,
                rParkingId: 0, // Should be fetched if needed, but 0 is safe for generic entry
                remarks: manualRemarks || `Manual ${manualDirection} via Portal`
            };

            // Cast to any to align with generic service payload type if strictly checking casing
            await carParkService.assignManualEntry(payload as any);
            
            toast.success("Success", `Manual ${manualDirection} assigned successfully.`);
            setIsManualEntryOpen(false);
            setSubmittingTarget(null);
            
            setTimeout(() => { fetchData(); }, 800);

        } catch (error :any) {
            let displayError = error.message || "Failed to assign entry.";
            try {
                if (error.content && error.content.error) {
                    displayError = error.content.error;
                } else if (displayError.includes("error =")) {
                    const match = displayError.match(/error\s*=\s*([^,}]+)/);
                    if (match && match[1]) {
                        displayError = match[1].trim();
                    }
                }
            } catch (e) {
                // Keep original
            }
            toast.error("Action Failed", displayError);
            setSubmittingTarget(null);
        } finally {
            setIsProcessingEntry(false);
        }
    };

    const navigateToSeasonPass = () => {
        if (seasonPassQrId) {
            router.push(`/portal/car-park/season-parking/${seasonPassQrId}?accId=${accId}`);
        }
    };

    return (
        <div className="max-w-[1600px] mx-auto p-6">
             <div className="flex flex-wrap items-center text-sm text-muted-foreground mb-4 gap-y-2">
                <span className="hover:text-foreground cursor-pointer">Car Park</span>
                <ChevronRight className="h-4 w-4 mx-2" />
                <Button variant="link" className="p-0 h-auto text-muted-foreground hover:text-foreground" onClick={() => router.push('/portal/car-park/superapp-visitor')}>
                    SuperApp Visitor
                </Button>
                <ChevronRight className="h-4 w-4 mx-2" />
                <span className="font-medium text-foreground flex items-center gap-2 whitespace-nowrap">
                    Account Detail <Badge variant="outline">ID: {accId}</Badge>
                </span>
            </div>

            {/* --- WRAP CONTENT IN RELATIVE DIV FOR OVERLAY --- */}
            <div className="relative min-h-[600px] rounded-xl">
                
                {/* 1. OVERLAY BLOCKER */}
                {hasActiveSeasonPass && (
                    <SeasonPassConflictOverlay 
                        qrId={seasonPassQrId} 
                        onRedirect={navigateToSeasonPass} 
                    />
                )}

                {/* 2. MAIN CONTENT (BLURRED/DISABLED IF BLOCKED) */}
                <div className={cn(
                    "transition-all duration-300", 
                    hasActiveSeasonPass && "opacity-20 pointer-events-none grayscale blur-[1px] select-none"
                )}>
                    <ParkingStatusDetail 
                        mode="superapp"
                        data={formData}
                        status={statusInfo}
                        packages={packageList}
                        phases={[]} 
                        units={[]} 
                        isLoading={isLoading}
                        isSaving={isSaving}
                        submittingTarget={submittingTarget}
                        onDataChange={handleDataChange}
                        onSave={handleSave}
                        onAssignEntry={handleAssignEntry}
                    />
                    
                    <div className="w-full mt-4"> 
                        {formData.accId ? (
                            <ParkingActivityHistory accId={formData.accId} />
                        ) : (
                            <div className="h-64 border rounded-xl bg-muted/10 animate-pulse" />
                        )}
                    </div>
                </div>
            </div>

            {/* DIALOGS (Outside the relative wrapper so they aren't blocked) */}
            <Dialog open={isManualEntryOpen} onOpenChange={(open) => {
                if(!open && !isProcessingEntry) {
                    setIsManualEntryOpen(false);
                    setSubmittingTarget(null);
                }
            }}>
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle className={`flex items-center gap-2 ${manualDirection === 'Out' ? 'text-amber-600' : 'text-emerald-600'}`}>
                            {manualDirection === 'Out' ? <LogOut className="h-5 w-5" /> : <LogIn className="h-5 w-5" />}
                            Manual {manualDirection}
                        </DialogTitle>
                        <DialogDescription>Configure manual access details.</DialogDescription>
                    </DialogHeader>

                    <div className="py-4 space-y-4">
                         {manualDirection === "Out" && (
                             <div className="flex justify-between items-center text-xs bg-muted/30 p-2 rounded-lg border">
                                <span className="text-muted-foreground">Current Wallet Balance</span>
                                <div className="flex items-center gap-1 font-bold text-foreground">
                                    <Wallet className="h-3.5 w-3.5 text-muted-foreground" />
                                    <span>RM {(formData.walletBalance || 0).toFixed(2)}</span>
                                </div>
                            </div>
                         )}

                        <div className="space-y-2">
                            <Label className="text-sm font-semibold">Terminal ID</Label>
                            <Input 
                                type="number" 
                                placeholder="e.g. 383"
                                value={manualTerminalId}
                                onChange={(e) => setManualTerminalId(e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground">Default Gate: {SYSTEM_TERMINAL_ID}</p>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-sm font-semibold">Remarks</Label>
                            <Textarea 
                                placeholder="Reason for manual entry..."
                                value={manualRemarks}
                                onChange={(e) => setManualRemarks(e.target.value)}
                                className="resize-none h-20"
                            />
                        </div>

                        {manualDirection === "Out" && (
                            <div className="space-y-2">
                                <Label className="text-sm font-semibold">Deduction Amount</Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2.5 text-muted-foreground text-sm font-bold">RM</span>
                                    <Input 
                                        type="number" 
                                        className="pl-10 h-11 text-lg font-bold" 
                                        placeholder="0.00"
                                        value={manualAmount}
                                        onChange={(e) => setManualAmount(e.target.value)}
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground">Enter 0 for free exit.</p>
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => { setIsManualEntryOpen(false); setSubmittingTarget(null); }} disabled={isProcessingEntry}>Cancel</Button>
                        <Button onClick={executeManualAccess} disabled={isProcessingEntry} className={manualDirection === 'Out' ? "bg-amber-600 hover:bg-amber-700 text-white" : "bg-emerald-600 hover:bg-emerald-700 text-white"}>
                            {isProcessingEntry ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowRightLeft className="mr-2 h-4 w-4" />}
                            Confirm {manualDirection}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}