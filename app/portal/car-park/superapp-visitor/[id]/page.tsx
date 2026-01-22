// app/portal/car-park/superapp-visitor/[id]/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useAppToast } from "@/hooks/use-app-toast"
import { ChevronRight, ArrowRightLeft, Loader2, LogIn, LogOut, Wallet } from "lucide-react"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"

// Services & Types
import { carParkService } from "@/services/car-park-services"
import { CarParkPackage, ParkingDetailData, ParkingDetailStatus } from "@/type/car-park"

// Import Components
import { ParkingStatusDetail } from "@/components/car-park/ParkingStatusDetail"
import { ParkingActivityHistory } from "@/components/car-park/ParkingActivityHistory"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"

// --- 1. DEFINE DEFAULT EMPTY STATE ---
const DEFAULT_VISITOR_DATA: ParkingDetailData = {
    accId: 0,
    name: "", email: "", nric: "", mobile: "", company: "", 
    type: "Visitor", staffId: "", contactOffice: "", contactHp: "",
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

    // Manual Entry State
    const [isEntryDialogOpen, setIsEntryDialogOpen] = useState(false)
    const [ manualDirection, setManualDirection] = useState<"In" | "Out">("In")
    const [manualAmount, setManualAmount] = useState<string>("0.00")
    const [isProcessingEntry, setIsProcessingEntry] = useState(false)

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
        try {
            // 1. Parallel Fetch: Packages and Main Pass Details
            const [packagesData,accountData, passResult] = await Promise.all([
                carParkService.getPackages(),
                carParkService.getSuperAppAccount(accId),// Uses the new endpoint that returns Account Info + Status
                carParkService.getQrListingID({ accId: accId }) 
            ]);

            if (packagesData) setPackageList(packagesData);

            // 2. Prepare Base Data
            let finalData = { ...DEFAULT_VISITOR_DATA };
            let balance = 0;

            // 3. Merge Strategy
            // Source A: SuperApp Account (Profile & ID)
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

            // Source B: Car Park Pass (Live Status & Config)
            if (passResult) {
                const { data: passData, status: passStatus } = passResult;
                
                finalData = {
                    ...finalData,
                    ...passData, 
                    name: accountData?.firstName || passData.name,
                    mobile: accountData?.mobile || passData.mobile,
                    contactHp: accountData?.mobile || passData.contactHp, 
                };

                setStatusInfo(passStatus);
            }

            // 4. Final State Update
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
        await new Promise(r => setTimeout(r, 1000));
        setIsSaving(false);
        toast.success("Updated", "Changes saved locally.");
    };

    // --- Actions ---
    const handleAssignEntry = (target: "qr" | "account") => {
        const s = (statusInfo.iPointStatus || "").toUpperCase();
        const isInside = (s.includes("PARK") || s.includes("USED")) && !s.includes("UNUSED") && !s.includes("AWAY");
        const nextDir = isInside ? "Out" : "In";
        
        if (nextDir === "In") {
            executeManualAccess("In");
        } else {
            setManualDirection("Out");
            setManualAmount("0.00");
            setIsEntryDialogOpen(true);
        }
    };

    const executeManualAccess = async (direction: "In" | "Out", amountStr: string = "0.00") => {
        setIsProcessingEntry(true);
        if (direction === "In") setSubmittingTarget("account");

        try {
            let amount = 0;
            if (direction === "Out") {
                amount = parseFloat(amountStr);
                const currentBalance = formData.walletBalance || 0;
                
                if (amount > currentBalance) {
                    toast.error("Insufficient Balance", `Amount (RM ${amount.toFixed(2)}) exceeds wallet balance (RM ${currentBalance.toFixed(2)}).`);
                    setIsProcessingEntry(false);
                    setSubmittingTarget(null);
                    return; 
                }
            }
            
            const payload: any = {
                accId: formData.accId,
                direction: direction,
                terminalId: 383, 
                adminStaffId: Number(user?.id || 999)
            };

            if (direction === "Out") {
                payload.amount = amount;
                payload.plateNo = null; 
                payload.cardNo = null;  
            }

            await carParkService.assignManualEntry(payload);
            
            toast.success("Success", `Manual ${direction} assigned successfully.`);
            setIsEntryDialogOpen(false);
            
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
                // Keep original message if parsing fails
            }

            toast.error("Action Failed", displayError);
        } finally {
            setIsProcessingEntry(false);
            setSubmittingTarget(null);
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

            <Dialog open={isEntryDialogOpen} onOpenChange={setIsEntryDialogOpen}>
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-amber-600">
                            <LogOut className="h-5 w-5" />
                            Manual Exit
                        </DialogTitle>
                        <DialogDescription>
                            Please enter the amount to deduct for this manual exit.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-4 space-y-4">
                         <div className="flex justify-between items-center text-xs bg-muted/30 p-2 rounded-lg border">
                            <span className="text-muted-foreground">Current Wallet Balance</span>
                            <div className="flex items-center gap-1 font-bold text-foreground">
                                <Wallet className="h-3.5 w-3.5 text-muted-foreground" />
                                <span>RM {(formData.walletBalance || 0).toFixed(2)}</span>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <Label className="text-sm font-semibold">Exit Payment Amount</Label>
                            <div className="relative">
                                <span className="absolute left-3 top-2.5 text-muted-foreground text-sm font-bold">RM</span>
                                <Input 
                                    type="number" 
                                    className="pl-10 h-11 text-lg font-bold" 
                                    placeholder="0.00"
                                    value={manualAmount}
                                    onChange={(e) => setManualAmount(e.target.value)}
                                    onFocus={(e) => e.target.select()}
                                />
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Enter 0 for free exit. Amount will be deducted from wallet.
                            </p>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEntryDialogOpen(false)} disabled={isProcessingEntry}>
                            Cancel
                        </Button>
                        <Button 
                            onClick={() => executeManualAccess("Out", manualAmount)} 
                            disabled={isProcessingEntry}
                            className="bg-amber-600 hover:bg-amber-700 text-white"
                        >
                            {isProcessingEntry ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowRightLeft className="mr-2 h-4 w-4" />}
                            Confirm Exit
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}