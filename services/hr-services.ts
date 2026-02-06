// services/hr-services.ts

import { apiClient, ApiResponse } from "@/lib/api-client";
import { SYSTEM_TERMINAL_ID } from "@/lib/constants";
import { getContent, getDataObject} from "@/lib/api-client"
import { 
    Account,
    ActivePassesPayload, 
    ActivePassesResponse, 
    CarParkDepartment,
    ReportPayload,
    ReportResponse,
    StaffListItem,
    StaffDetail,
    PassDetailResult,
    ParkingDetailData,
    ParkingDetailStatus,
    ManualEntryPayload,
    ParkingHistoryPayload,
    ParkingHistoryResponse
 } from "@/type/hr";

const ENDPOINTS = {
    // Shared / Account Lookup
    SEARCH_ACCOUNTS: "support/account/search",
    GET_ACCOUNT_DETAILS: "support/account/details",

    //metadata
    GET_DEPARTMENTS: "CarPark/metadata/departments",
    GET_PHASES: "CarPark/metadata/phases", 
    GET_UNITS: "CarPark/metadata/units",
    GET_PACKAGES: "CarPark/metadata/packages",
    
    // Feature 1: New Staff Tagging (Non-CP)
    VERIFY_USER: "CarPark/verify-account",
    SUBMIT_TAG: "staff/create",

    // Feature 2: Staff Listing (Directory)
    STAFF_LIST: "staff/list",
    STAFF_DETAIL: "staff", 
    STAFF_UPDATE: "staff/update",
    STAFF_DELETE: "staff/delete",

    // Feature 3: New Staff Registration (With Car Park)
    REGISTER: "CarPark/register",

    // Feature 4: Staff Parking List (Season Pass / Visitor)
    QR_LISTING: "Carpark/cards/active",
    CHECK_STATUS: "Carpark/pass/detail",
    MANUAL_ENTRY: "CarPark/access/manual-entry",
    CHECK_BALANCE: "support/balance/check",
    PARKING_HISTORY: "CarPark/history",
    UPDATE_PASS: "CarPark/pass/update",
    DELETE_PASS: "CarPark/pass/delete",
    BLOCK_PASS: "CarPark/pass/block",
   
    // Feature 5: Reports
    EXECUTE_REPORT: "CarPark/report",
};

// --- MAPPERS ---
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

const cleanAccessDate = (str: string | undefined) => {
    if (!str) return "-";
    return str.replace(/^(Last (Exit|Entry):\s*)/i, "").trim();
};


{/*--------------------- Hr POSWF -------------------------------*/}
export const hrService = {

    // SHARED UTILITIES & ACCOUNT LOOKUP
    searchSuperAppAccounts: async (query: string): Promise<Account[]> => {
        const payload = { email: query }; 
        const response = await apiClient.post<any>(ENDPOINTS.SEARCH_ACCOUNTS, payload);

        if (!response.success) return [];

        const content = response.data?.content || response.data?.data || response.data;
        let items = [];
        
        if (Array.isArray(content)) items = content;
        else if (content && content.accID) items = [content];

        return items.map(mapToAccount);
    },

    getSuperAppAccount: async (accId: string | number) : Promise<Account | null> => {
        const payload = { accID: Number(accId) };
        const response = await apiClient.post<any>(ENDPOINTS.GET_ACCOUNT_DETAILS, payload);
        if (!response.success || !response.data) return null;
        const data = response.data?.content || response.data?.data || response.data;
        return mapToAccount(data);
    },

    // =========================================================
    //  NEW STAFF TAGGING (NON-CP)
    verifyUser: async (type: "qr" | "email", term: string) => {
        const payload = { searchValue: term, isEmail: type === "email" };
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

    getDepartments: async (): Promise<CarParkDepartment[]> => {
        const response = await apiClient.get<any>(ENDPOINTS.GET_DEPARTMENTS);
        if (!response.success) return [];
        return response.data?.content || response.data || [];
    },

    submitStaffTag: async (data: { email: string, fullName: string, hp?: string, staffNo: string, department: string }) => {
        const payload = {
            email: data.email,
            name: data.fullName,
            staffNo: data.staffNo,
            departmentCode: data.department,
        };

        const response = await apiClient.post<any>(ENDPOINTS.SUBMIT_TAG, payload);

        if (!response.success) {
             const content = response.data?.content;
             const errorMessage = content?.message || response.error || "Staff tagging failed";
             throw new Error(errorMessage);
        }
        return response.data;
    },


    // =========================================================
    // STAFF LISTING (DIRECTORY)
    getStaffList: async (pageNumber: number = 1, pageSize: number = 20, searchQuery: string = "") => {
        const payload = {
            searchQuery: searchQuery || "", 
            pageNumber: pageNumber,
            pageSize: pageSize
        };

        const response = await apiClient.post<any>(ENDPOINTS.STAFF_LIST, payload);
        
        if (!response.success || !response.data) {
            return { items: [], totalCount: 0, totalPages: 0 };
        }
        
        const content = getDataObject<any>(response.data);
        
        return {
            items: content.staff || [],
            totalCount: content.totalRecords || 0,
            totalPages: Math.ceil((content.totalRecords || 0) / pageSize),
            pageNumber: content.pageNumber || 1
        };
    },

    getStaffDetail: async (staffId: number): Promise<StaffDetail | null> => {
        const response = await apiClient.get<any>(`${ENDPOINTS.STAFF_DETAIL}/${staffId}`);
        if (!response.success || !response.data) return null;
        return getDataObject<StaffDetail>(response.data);
    },

    
    //updateStaff: async (payload: UpdateStaffPayload) => {
    //    const response = await apiClient.put(ENDPOINTS.STAFF_UPDATE, payload);
    //    if (!response.success) throw new Error(response.error || "Update failed");
    //    return response.data;
    //},

    //deleteStaff: async (staffId: number) => {
    //    const response = await apiClient.delete(`${ENDPOINTS.STAFF_DELETE}/${staffId}`);
    //    if (!response.success) throw new Error(response.error || "Delete failed");
    //    return response.data;
    //},
    


    // =========================================================
    // NEW STAFF REGISTRATION (WITH PARKING)
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
            terminalId: SYSTEM_TERMINAL_ID,  
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
        
        const response = await apiClient.post<any>(ENDPOINTS.REGISTER, payload);

        if (!response.success) {
            const content = response.data?.content;
            if (content?.errors) {
                const firstField = Object.keys(content.errors)[0];
                const firstMsg = content.errors[firstField][0];
                throw new Error(`${firstField}: ${firstMsg}`);
            }
            const specificError = response.data?.content?.error;
            throw new Error(specificError || response.error || "Registration failed");
        }
        return response.data;
    },

    // =========================================================
    // STAFF PARKING LIST (SEASON PASS & VISITOR)
    
    getQrListing: async (pageNumber: number, pageSize: number, searchQuery: string = "") => {
        const payload: ActivePassesPayload = { pageNumber, pageSize, searchQuery };
        const response = await apiClient.post<any>(ENDPOINTS.QR_LISTING, payload);

        if (!response.success) return { items: [], totalCount: 0, totalPages: 0 };
        const data = response.data?.content || response.data;
        
        return {
            items: data.items || [],
            totalCount: data.totalCount || 0,
            totalPages: data.totalPages || 0,
            pageNumber: data.pageNumber || pageNumber
        } as ActivePassesResponse;
    },

    getQrListingID: async (params: { qrId?: string | number; accId?: string | number }): Promise<PassDetailResult> => {
        const payload: Record<string, string> = {};
        if (params.qrId) payload.QrID = String(params.qrId);
        else if (params.accId) payload.AccID = String(params.accId);

        try {
            const response = await apiClient.post<any>(ENDPOINTS.CHECK_STATUS, payload);

            if (!response.success) {
                const errorData = response.data; 
                const errContent = errorData?.content || errorData;
                const errMsg = response.error || errContent?.error || "";
                
                if (!params.qrId && (errMsg.includes("Conflict") || errMsg.includes("Active Pass Found"))) {
                    return { error: "CONFLICT_SEASON_PASS", qrId: errContent?.qrId }; 
                }
                return null;
            }

            const raw = response.data.content || response.data;

            const data: ParkingDetailData = {
                accId: raw.accId,
                name: raw.name,
                email: raw.email,
                nric: raw.cardNo || "",
                mobile: raw.mobileNo || "",
                company: raw.company || "",
                qrId: raw.qrId || 0,
                message: raw.Message || "",
                userType: raw.userType || "", 
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

            const status: ParkingDetailStatus = {
                recordStatus: raw.recordStatus || "Active",
                seasonStatus: raw.seasonStatus || "N/A",
                iPointStatus: raw.iPointStatus || "N/A",
                lastExitSeason: cleanAccessDate(raw.seasonLastAccess),
                lastExitIPoint: cleanAccessDate(raw.IPointLastAccess),
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

    // Wallet & History
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
            return 0;
        }
    },

    getParkingHistory: async (payload: ParkingHistoryPayload): Promise<ParkingHistoryResponse> => {
        const apiPayload = {
            pageNumber: payload.pageNumber,
            pageSize: payload.pageSize,
            accId: payload.accId,
            startDate: payload.startDate,
            endDate: payload.endDate
        };
        const response = await apiClient.post<any>(ENDPOINTS.PARKING_HISTORY, apiPayload);
        if (!response.success) return { items: [], totalCount: 0, pageNumber: 1, pageSize: 10, totalPages: 0 };
        
        const data = response.data?.content || response.data;
        return {
            items: data.items || [],
            totalCount: data.totalCount || 0,
            pageNumber: data.pageNumber || 1,
            pageSize: data.pageSize || 10,
            totalPages: data.totalPages || 0
        };
    },

    // Pass Actions
    assignManualEntry: async (payload: ManualEntryPayload) => {
        const response = await apiClient.post<any>(ENDPOINTS.MANUAL_ENTRY, payload);
        if (!response.success) {
            const errorObj: any = new Error(response.error || "Failed to assign manual entry.");
            errorObj.content = response.data?.content || response.data; 
            throw errorObj;
        }
        return response.data;
    },

    updateSeasonPass: async (payload: any) => {
        const response = await apiClient.put<any>(ENDPOINTS.UPDATE_PASS, payload);
        if (!response.success) throw new Error(response.error || "Failed to update pass.");
        return response.data;
    },

    blockSeasonPass: async (cardId: number, reason: string) => {
        const payload = { cardId, reason, isBlocked: true };
        const response = await apiClient.post<any>(ENDPOINTS.BLOCK_PASS, payload);
        if (!response.success) throw new Error(response.error || "Failed to block pass.");
        return response.data;
    },

    unblockSeasonPass: async (cardId: number, adminStaffId: number, reason: string = "Manual Unblock") => {
        const payload = { cardId, adminStaffId, reason, isBlocked: false };
        const response = await apiClient.post<any>(ENDPOINTS.BLOCK_PASS, payload);
        if (!response.success) throw new Error(response.error || "Failed to unblock pass.");
        return response.data;
    },

    deleteSeasonPass: async (cardId: number, adminStaffId: number, reason: string) => {
        const payload = { cardId, adminStaffId, reason };
        const response = await apiClient.post<any>(ENDPOINTS.DELETE_PASS, payload);
        if (!response.success) throw new Error(response.error || "Failed to delete pass.");
        return response.data;
    },

    // =========================================================
    //  REPORTS
    generateReport: async (payload: ReportPayload): Promise<ReportResponse> => {
        const response = await apiClient.post<any>(ENDPOINTS.EXECUTE_REPORT, payload);
        if (!response.success || !response.data) {
             return { items: [], totalCount: 0, pageNumber: 1, pageSize: 10, totalPages: 0 };
        }
        const content = getDataObject<any>(response.data);
        return {
            items: content.items || [],
            totalCount: content.totalCount || 0,
            pageNumber: content.pageNumber || 1,
            pageSize: content.pageSize || 10,
            totalPages: content.totalPages || 0
        };
    },
};