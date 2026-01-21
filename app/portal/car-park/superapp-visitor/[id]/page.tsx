"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams, useSearchParams } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useAppToast } from "@/hooks/use-app-toast"
import { ChevronRight } from "lucide-react"

// Services & Types
import { carParkService } from "@/services/car-park-services"
import { CarParkPackage,  ParkingDetailData, ParkingDetailStatus } from "@/type/car-park"

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
    const [packageList, setPackageList] = useState<CarParkPackage[]>([])

    // Data State (Matches Props Interface)
    const [formData, setFormData] = useState<ParkingDetailData>({
        accId: 0,
        name: "", email: "", nric: "", mobile: "", company: "", 
        type: "Staff", staffId: "", contactOffice: "", contactHp: "",
        seasonPackage: "", bayNo: "", parkingMode: "Reserved", remarks: "",
        isLpr: false, isTandem: false, isHomestay: false, isMobileQr: false,
        effectiveDate: "", expiryDate: "",
        plate1: "", plate2: "", plate3: "",
        amanoCardNo: "", amanoExpiryDate: "",
        // Added required fields for type compatibility
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
            const [cardsData, packagesData] = await Promise.all([
                carParkService.getQrListingID(qrId),    
                carParkService.getPackages()          
            ]);

            if (packagesData) setPackageList(packagesData);

            if (cardsData && cardsData.length > 0) {
                const data = cardsData[0] as any; 

                const userEmail = data.email || "";

                let fetchedBalance = 0;
                if (userEmail && userEmail !== "N/A") {
                    fetchedBalance = await carParkService.checkBalance(userEmail);
                }

                setFormData(prev => ({
                    ...prev,
                    accId: data.accId || Number(accId) || 0,
                    name: data.name || "",
                    email: data.email || "N/A",
                    nric: data.cardNo || "", 
                    mobile: data.mobileNo || "", 
                    contactHp: data.mobileNo || "",
                    contactOffice: data.officeNo || "",
                    company: data.company || "",
                    
                    seasonPackage: String(data.packageId || ""),
                    unitNo: data.bayNo ? data.bayNo.split('-').pop() : (data.unitNo || ""),
                    staffId: data.staffNo || "",
                    bayNo: data.bayNo || "",
                    parkingMode: data.bayNo ? "Reserved" : "Normal",
                    remarks: data.remarks || "",
                    
                    isLpr: data.isLPR || false,
                    isTandem: data.isTandem || false,
                    isHomestay: data.isHomestay || false,
                    isMobileQr: data.isTransfer || false, 

                    effectiveDate: data.effectiveDate || "",
                    expiryDate: data.expiryDate || "",

                    walletBalance: fetchedBalance,

                    plate1: data.plateNo1 || "",
                    plate2: data.plateNo2 || "",
                    plate3: data.plateNo3 || "",
                    
                    amanoCardNo: data.amanoCardNo || "",
                    amanoExpiryDate: data.amanoExpiryDate || ""
                }));

                setStatusInfo({
                    recordStatus: data.recordStatus || "Inactive", 
                    seasonStatus: data.seasonStatus || "Inactive",
                    iPointStatus: data.iPointStatus || "Inactive",
                    lastExitSeason: data.seasonLastAccess || "-",
                    lastExitIPoint: data.iPointLastAccess || "-",
                    createdOn: data.createdDate || "-",
                    createdBy: data.createdByName || "System", 
                    modifiedOn: data.modifiedDate || "-",
                    modifiedBy: data.modifiedByName || "-"
                });
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
        // Simulate API call using formData
        await new Promise(r => setTimeout(r, 1000));
        setIsSaving(false);
        toast.success("Updated", "User details saved successfully.");
        // In real app: await carParkService.updateQrListing(formData);
    };

    const handleDataChange = (updates: Partial<ParkingDetailData>) => {
        setFormData(prev => ({ ...prev, ...updates }));
    };

    return (
        <div className="max-w-[1600px] mx-auto p-6">
             {/* BREADCRUMBS */}
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

            {/* RENDER COMPONENT */}
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

            <div className="w-full mt-8 ">
                {formData.accId ? (
                    <ParkingActivityHistory accId={formData.accId} />
                ) : (
                    <div className="h-64 border rounded-xl bg-muted/10 animate-pulse" />
                )}
            </div>
        </div>
    )
}