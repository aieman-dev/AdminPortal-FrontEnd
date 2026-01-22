// services/car-park-service.ts

import { apiClient, ApiResponse } from "@/lib/api-client";
import { 
    Account,
    CarParkAccount,
    ActivePassesPayload, 
    ActivePassesResponse, 
    CarParkRegistrationForm,
    CarParkApplication,
    CarParkCard,
    CarParkDepartment,
    ParkingDetailData,
    ParkingDetailStatus,
    ParkingHistoryPayload,
    ParkingHistoryResponse,
    ManualEntryPayload,
    BlockedUser,
    WhitelistedUser
 } from "@/type/car-park";

const ENDPOINTS = {
    SEARCH_ACCOUNTS: "support/account/search",
    GET_ACCOUNT_DETAILS: "support/account/details",

    //new registration 
    VERIFY_USER: "CarPark/verify-account",
    GET_PHASES: "CarPark/metadata/phases", 
    GET_UNITS: "CarPark/metadata/units",
    GET_PACKAGES: "CarPark/metadata/packages",
    GET_DEPARTMENTS: "CarPark/metadata/departments",
    REGISTER: "CarPark/register",

    //qr listing
    QR_LISTING: "Carpark/cards/active",
    QR_ID : "Carpark/pass/detail",
    MANUAL_ENTRY: "CarPark/access/manual-entry",
    CHECK_BALANCE: "support/balance/check",
    CHECK_STATUS: "Carpark/pass/detail",
    PARKING_HISTORY: "CarPark/history",
    UPDATE_PASS: "CarPark/pass/update",
    DELETE_PASS: "CarPark/pass/delete",
    BLOCK_PASS: "CarPark/pass/block",

    // Application new SuperApp - mock endpoints
    GET_APPLICATIONS: "CarPark/applications/pending", 
    UPDATE_APPLICATION: "CarPark/applications/status",

    // Access Control - placeholders
    GET_BLACKLIST: "CarPark/access/blacklist", 
    GET_WHITELIST: "CarPark/access/whitelist"
};

const getDataObject = <T>(data: any): T => {
    return data?.content || data?.data || data || {};
};

// Ensure this mapper matches your Account interface
const mapToAccount = (raw: any): Account => ({
    id: String(raw.accID),
    accId: String(raw.accID),
    email: raw.email || "N/A",
    firstName: raw.firstName || "N/A",
    mobile: raw.mobileNo || "N/A",
    createdDate: raw.createdDate || "N/A",
    accountStatus: (raw.recordStatus as "Active" | "Inactive" | "Suspended") || "N/A",
    transactions: raw.transactionHistory || [], 
});

export const carParkService = {
    searchSuperAppAccounts: async (query: string): Promise<Account[]> => {
        const payload = { email: query }; 
        const response = await apiClient.post<any>(ENDPOINTS.SEARCH_ACCOUNTS, payload);

        if (!response.success) {
             return [];
        }

        const content = response.data?.content || response.data?.data || response.data;
        let items = [];
        
        if (Array.isArray(content)) {
            items = content;
        } else if (content && content.accID) {
            items = [content];
        }

        return items.map(mapToAccount);
    },

    getSuperAppAccount: async (accId: string | number) : Promise<Account | null> => {
        const payload = { accID: Number(accId) };
        const response = await apiClient.post<any>(ENDPOINTS.GET_ACCOUNT_DETAILS, payload);
        if (!response.success || !response.data) return null;
        const data = response.data?.content || response.data?.data || response.data;
        return mapToAccount(data);
    },

    checkBalance: async (email: string): Promise<number> => {
        try {
            const payload = { email };
            const response = await apiClient.post<any>(ENDPOINTS.CHECK_BALANCE, payload);
            
            if (response.success && response.data) {
                const content = response.data.content || response.data;
                return content.balance || 0;
            }
            return 0;
        } catch (error) {
            console.error("Balance Check Error:", error);
            return 0;
        }
    },

//-------------- Car Park POSWF---------------
    verifyUser: async (type: "qr" | "email", term: string) => {
        const payload = {
            searchValue: term,
            isEmail: type === "email"
        };

        const response = await apiClient.post<any>(ENDPOINTS.VERIFY_USER, payload);
        
        if (!response.success) throw new Error(response.error || "User verification failed");
        
        const data = response.data?.content || response.data;
        if (!data) throw new Error("No user data found");

        return {
            success: true,
            data: {
                accId: data.accId,
                email: data.email,
                name: data.userName,   
                mobile: data.mobileNo
            }
        };
    },

    getPhases: async () => {
        const response = await apiClient.get<any>(ENDPOINTS.GET_PHASES);
        if (!response.success) return [];
        return response.data?.content || [];
    },

    getUnits: async (phaseId: string | number) => {
        if (!phaseId) return [];
        const response = await apiClient.get<any>(`${ENDPOINTS.GET_UNITS}/${phaseId}`);
        if (!response.success) return [];
        return response.data?.content || [];
    },

    getPackages: async () => {
        const response = await apiClient.get<any>(ENDPOINTS.GET_PACKAGES);
        if (!response.success) return [];
        return response.data?.content || [];
    },

    getDepartments: async (): Promise<CarParkDepartment[]> => {
        const response = await apiClient.get<any>(ENDPOINTS.GET_DEPARTMENTS);
        if (!response.success) return [];
        return response.data?.content || response.data || [];
    },
    
    submitRegistration: async (form: any, adminStaffId: string | number) => {

        const cleanPlate = (p: string) => p ? p.toUpperCase().replace(/\s/g, "") : null;
        
        const payload = {
            accId: Number(form.accId), 
            name: form.name,
            ic: form.nric,
            company: form.companyName || "",
            hp: form.mobileContact,
            officeNo: form.officeContact || "",
            
            plateNo1: cleanPlate(form.plate1),
            plateNo2: cleanPlate(form.plate2),
            plateNo3: cleanPlate(form.plate3),
            
            packageId: Number(form.seasonPackage),
            userType: form.userType,
            unitId: Number(form.unitNo), 
            bayNo: form.bayNo || null,
            isReserved: form.parkingType === "Reserved",

            staffId: form.staffId || null,
            department: form.department || null,
            isStaffTag: false, 

            adminStaffId: Number(adminStaffId), 
            terminalId: 383,  //hardcoded for now 
            comment: form.comment || "Manual Registration",
            remarks: form.remarks || null,

            isHomestay: form.isHomestay || false,
            isTransfer: form.isMobileQr || false,
            isLPR: form.isLpr || false,
            amanoCardNo: form.amanoCardNo || null,
            amanoExpiryDate: form.amanoExpiryDate || null,

            isTandem: form.isTandem,
            tandemName: form.isTandem ? form.tandemName : null,
            tandemIC: form.isTandem ? form.tandemNric : null,
            tandemPlateNo1: form.isTandem ? cleanPlate(form.tandemPlate1) : null,
            tandemHP: form.isTandem ? form.tandemMobile : null,
            tandemEmail: null 
        };

        console.log("Submitting Payload:", payload); 
        console.log("Payload Data:", JSON.stringify(payload, null, 2));
        
        const response = await apiClient.post<any>(ENDPOINTS.REGISTER, payload);

        if (!response.success) {
            console.error("RAW RESPONSE:", JSON.stringify(response, null, 2));

            const content = response.data?.content;

            if (content?.errors) {
                const firstField = Object.keys(content.errors)[0];
                const firstMsg = content.errors[firstField][0];
                throw new Error(`${firstField}: ${firstMsg}`);
            }

            const specificError = response.data?.content?.error;
            const errorMessage = specificError  || response.error || "Registration failed";

            throw new Error(errorMessage);
        }
        return response.data;
    },

    getQrListing: async (pageNumber: number, pageSize: number, searchQuery: string = "") => {
        const payload: ActivePassesPayload = {
            pageNumber,
            pageSize,
            searchQuery
        };

        const response = await apiClient.post<any>(ENDPOINTS.QR_LISTING, payload);

        if (!response.success) {
            return { items: [], totalCount: 0, totalPages: 0 };
        }
        const data = response.data?.content || response.data;
        
        return {
            items: data.items || [],
            totalCount: data.totalCount || 0,
            totalPages: data.totalPages || 0,
            pageNumber: data.pageNumber || pageNumber
        } as ActivePassesResponse;
    },

    getQrListingID: async (params: { qrId?: string | number; accId?: string | number }) => {
        const payload: Record<string, string> = {};

        // PRIORITY 1: Season Parking (QrID)
        if (params.qrId) {
            payload.QrID = String(params.qrId);
        } 
        // PRIORITY 2: SuperApp Visitor (AccID) - Only if QrID is missing
        else if (params.accId) {
            payload.AccID = String(params.accId);
        }
        try {
            const response = await apiClient.post<any>(ENDPOINTS.CHECK_STATUS, payload);

            if (!response.success || !response.data) {
                return null;
            }

            const raw = response.data.content || response.data;

            // 1. Map to ParkingDetailData (Form Data)
            const data: ParkingDetailData = {
                accId: raw.accId,
                name: raw.name,
                email: raw.email,
                nric: raw.cardNo || "",
                mobile: raw.mobileNo || "",
                company: raw.company || "",

                qrId: raw.qrId || 0,
                message: raw.Message || "",

                type: raw.packageId === 0 ? "Visitor" : "Season", 
                staffId: raw.staffNo || "",
                contactOffice: raw.officeNo || "",
                contactHp: raw.mobileNo || "",
                
                seasonPackage: String(raw.packageId || ""),
                bayNo: raw.bayNo || "",
                parkingMode: raw.bayNo ? "Reserved" : "Normal",
                remarks: raw.remarks || "",

                phase: "", 
                unitNo: "", 

                isLpr: raw.isLPR || false,
                isTandem: raw.isTandem || false,
                isHomestay: raw.isHomestay || false,
                isMobileQr: raw.isTransfer || false,

                effectiveDate: raw.effectiveDate || "",
                expiryDate: raw.expiryDate || "",

                plate1: raw.plateNo1 || "",
                plate2: raw.plateNo2 || "",
                plate3: raw.plateNo3 || "",
                
                amanoCardNo: raw.amanoCardNo || "",
                amanoExpiryDate: "", 
                walletBalance: 0 
            };

            // 2. Map to ParkingDetailStatus (Status Bar)
            const status: ParkingDetailStatus = {
                recordStatus: raw.recordStatus || "Active",
                seasonStatus: raw.seasonStatus || "N/A",
                iPointStatus: raw.iPointStatus || "N/A",
                lastExitSeason: raw.seasonLastAccess || "-",
                lastExitIPoint: raw.iPointLastAccess || "-",
                createdOn: raw.createdDate,
                createdBy: raw.createdByName || "System",
                modifiedOn: raw.modifiedDate || "-",
                modifiedBy: raw.modifiedByName || "-"
            };

            return { data, status };

        } catch (error) {
            console.error("getPassDetail Error:", error);
            return null;
        }
    },

    assignManualEntry: async (payload: ManualEntryPayload) => {
        const response = await apiClient.post<any>(ENDPOINTS.MANUAL_ENTRY, payload);
        if (!response.success) {
            const errorObj: any = new Error(response.error || "Failed to assign manual entry.");
            errorObj.content = response.data?.content || response.data; 
            throw errorObj;
        }
        return response.data;
    },

    forceExit: async (rParkingID: string, accId: number, adminStaffId: number, plateNo: string) => {
        const payload: ManualEntryPayload = {
            accId,
            terminalId: 383, 
            adminStaffId,
            direction: "Out",
            plateNo,
            rParkingID, 
            amount: 0
        };

        const response = await apiClient.post(ENDPOINTS.MANUAL_ENTRY, payload);
        
        if (!response.success) {
            throw new Error(response.error || "Failed to force exit.");
        }
        return response.data;
    },

    getParkingHistory: async (payload: ParkingHistoryPayload): Promise<ParkingHistoryResponse> => {
        const response = await apiClient.post<any>(ENDPOINTS.PARKING_HISTORY, payload);

        if (!response.success) {
            // Return empty structure on failure to prevent UI crash
            return { items: [], totalCount: 0, pageNumber: 1, pageSize: 10, totalPages: 0 };
        }

        const data = response.data?.content || response.data;
        return {
            items: data.items || [],
            totalCount: data.totalCount || 0,
            pageNumber: data.pageNumber || 1,
            pageSize: data.pageSize || 10,
            totalPages: data.totalPages || 0
        };
    },

    updateSeasonPass: async (payload: any) => {
        const response = await apiClient.put<any>(ENDPOINTS.UPDATE_PASS, payload);
        
        if (!response.success) {
             const errorMsg = response.data?.message || response.error || "Failed to update pass.";
             throw new Error(errorMsg);
        }
        return response.data;
    },

    blockSeasonPass: async (cardId: number, adminStaffId: number, reason: string) => {
        const payload = { cardId, adminStaffId, reason, isBlocked: true };
        const response = await apiClient.post<any>(ENDPOINTS.BLOCK_PASS, payload);
        
        if (!response.success) {
             const content = response.data?.content || response.data;
             const errorMsg = content?.error || content?.message || response.error || "Failed to block pass.";
             throw new Error(errorMsg);
        }
        return response.data;
    },

    unblockSeasonPass: async (cardId: number, adminStaffId: number, reason: string = "Manual Unblock") => {
        const payload = { cardId, adminStaffId, reason, isBlocked: false };
        const response = await apiClient.post<any>(ENDPOINTS.BLOCK_PASS, payload);
        
        if (!response.success) {
             const content = response.data?.content || response.data;
             const errorMsg = content?.error || content?.message || response.error || "Failed to unblock pass.";
             throw new Error(errorMsg);
        }
        return response.data;
    },

    deleteSeasonPass: async (cardId: number, adminStaffId: number, reason: string) => {
        const payload = { cardId, adminStaffId, reason };
        const response = await apiClient.post<any>(ENDPOINTS.DELETE_PASS, payload);
        
        if (!response.success) {
             const content = response.data?.content || response.data;
             const errorMsg = content?.error || content?.message || response.error || "Failed to delete pass.";
             throw new Error(errorMsg);
        }
        return response.data;
    },

//-------------- Car Park SuperApp Applications ---------------

    getApplications: async (searchQuery: string = ""): Promise<CarParkApplication[]> => {

        await new Promise(r => setTimeout(r, 600)); // Simulate delay

        const mockData: CarParkApplication[] = [
            { id: 1, name: "FOR TESTING ONLY", email: "system@i-city.my", seasonPackage: "(CP) Maybank Staff Exclusive LG3", documentUrl: "https://staging.i-bhd.com/doc/1", status: "Pending" },
            { id: 2, name: "Irham Hakim", email: "system@i-city.my", seasonPackage: "(CP) CentralWalk Motorcycle", documentUrl: "", status: "Pending" },
            { id: 3, name: "sad", email: "", seasonPackage: "(CP) Centralwalk Reserved Premium P2", documentUrl: "", status: "Pending" },
            { id: 4, name: "Gsuis", email: "", seasonPackage: "(CP) CityPark for Mercu Maybank Tenant", documentUrl: "", status: "Pending" },
            { id: 5, name: "Yw", email: "", seasonPackage: "(CP) Mall Tenant (1Month) - G", documentUrl: "", status: "Pending" },
            { id: 6, name: "FOR TESTING ONLY", email: "system@i-city.my", seasonPackage: "(CP) Maybank Staff Exclusive LG3", documentUrl: "https://staging.i-bhd.com/doc/2", status: "Pending" },
        ];

        if (!searchQuery) return mockData;
        return mockData.filter(app => 
            app.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
            app.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            app.seasonPackage.toLowerCase().includes(searchQuery.toLowerCase())
        );
    },

    updateApplicationStatus: async (id: number, status: "Approved" | "Rejected", remarks?: string) => {
        // Mock API Call
        console.log(`Updating App ${id} to ${status}. Remarks: ${remarks}`);
        await new Promise(r => setTimeout(r, 800));
        return { success: true };
    },

    getBlacklist: async (searchQuery: string = ""): Promise<BlockedUser[]> => {
        // Mocking data based on your screenshot structure
        await new Promise(r => setTimeout(r, 600));
        return []; // Return empty array for now or mock data
    },

    getWhitelist: async (searchQuery: string = ""): Promise<WhitelistedUser[]> => {
        await new Promise(r => setTimeout(r, 600));
        return [];
    },
};