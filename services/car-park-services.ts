// services/car-park-service.ts

import { apiClient, ApiResponse } from "@/lib/api-client";
import { SYSTEM_TERMINAL_ID } from "@/lib/constants";
import { getContent, getDataObject} from "@/lib/api-client"
import { 
    Account,
    CarParkAccount,
    ActivePassesPayload, 
    ActivePassesResponse, 
    CarParkRegistrationForm,
    CarParkApplication,
    CarParkCard,
    CarParkPass,
    CarParkDepartment,
    ParkingDetailData,
    PassDetailResult,
    ParkingDetailStatus,
    ParkingHistoryPayload,
    ParkingHistoryResponse,
    ParkingActivity,
    ManualEntryPayload,
    ReportMetadata,
    ReportDefinition,
    ReportPayload,
    ReportResponse,
    ApplicationListResponse,
    CarParkApplicationDetail,
    ApplicationUpdatePayload,
    ApplicationApprovePayload,
    ApplicationRejectPayload,
    BlockedUserResponse,
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

    //Reports
    GET_REPORTS: "CarPark/report/list",
    GET_REPORT_META: "CarPark/report",
    EXECUTE_REPORT: "CarPark/report",

    // Application new SuperApp 
    GET_APPLICATIONS: "CarPark/applications/pending", 
    GET_APPLICATION_DETAIL: "CarPark/applications",
    UPDATE_APPLICATION: "CarPark/applications/update",
    APPROVE_APPLICATION: "CarPark/application/approve",
    REJECT_APPLICATION: "CarPark/application/reject",

    // Access Control - placeholders
    GET_BLACKLIST: "CarPark/access/blacklist", 
    GET_WHITELIST: "CarPark/access/whitelist"
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

// FIX: Mapper for Parking Activity to handle response keys (camelCase from your JSON)
const mapToParkingActivity = (raw: any): ParkingActivity => ({
    accId: raw.accId || raw.AccId,
    rParkingID: String(raw.rParkingID || raw.RParkingID || raw.id), 
    plateNo: raw.plateNo || raw.PlateNo,
    entryTime: raw.entryTime || raw.EntryTime,
    exitTime: raw.exitTime || raw.ExitTime,
    entryGate: raw.entryGate || raw.EntryGate,
    exitGate: raw.exitGate || raw.ExitGate,
    status: raw.status || raw.Status,
    duration: raw.duration || raw.Duration
});

const cleanAccessDate = (str: string | undefined) => {
    if (!str) return "-";
    return str.replace(/^(Last (Exit|Entry):\s*)/i, "").trim();
};

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

    getQrListingID: async (params: { qrId?: string | number; accId?: string | number }): Promise<PassDetailResult> => {
        const payload: Record<string, string> = {};

        if (params.qrId) {
            payload.QrID = String(params.qrId);
        } 
        else if (params.accId) {
            payload.AccID = String(params.accId);
        }

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

            // 2. Map to ParkingDetailStatus (Status Bar)
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
            terminalId: SYSTEM_TERMINAL_ID, 
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
        const apiPayload = {
            pageNumber: payload.pageNumber,
            pageSize: payload.pageSize,
            accId: payload.accId,
            startDate: payload.startDate,
            endDate: payload.endDate
        };

        const response = await apiClient.post<any>(ENDPOINTS.PARKING_HISTORY, apiPayload);

        if (!response.success) {
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

    blockSeasonPass: async (cardId: number, reason: string) => {
        const payload = { cardId, reason, isBlocked: true };
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

//-------------- Car Park Reports ---------------
    getReports: async (): Promise<ReportDefinition[]> => {
            const response = await apiClient.get<any>(ENDPOINTS.GET_REPORTS);
            
            if (!response.success) {
                return [];
            }

            const rawList = getContent<any>(response.data);

            return rawList.map((item, index) => ({
                id: index + 1,
                code: item.reportName,
                name: item.friendlyName,
                description: item.description || "System generated report",
                path: `/${item.reportName}` 
            }));
        },

        getReportMetadata: async (reportName: string, options?: RequestInit): Promise<ReportMetadata | null> => {
        const url = `${ENDPOINTS.GET_REPORT_META}/${reportName}/meta`;
        
        const response = await apiClient.get<any>(url, options);
        
        if (!response.success || !response.data) return null;

        const rootContent = response.data?.content || response.data;
        const actualData = rootContent?.content || rootContent;

        return actualData as ReportMetadata;
    },

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

//-------------- Car Park SuperApp Applications ---------------

    getApplications: async (pageNumber: number, pageSize: number, searchQuery: string = ""): Promise<ApplicationListResponse> => {
        const payload = {
            pageNumber,
            pageSize,
            searchQuery: searchQuery || ""
        };

        try {
            const response = await apiClient.post<any>(ENDPOINTS.GET_APPLICATIONS, payload);

            if (!response.success) {
                return { items: [], totalCount: 0, totalPages: 0, pageNumber: 1, pageSize: 10 };
            }

            const data = getDataObject<any>(response.data);
            const rawItems = data.items || [];

            const items = rawItems.map((item: any) => ({
                id: item.applicationId, // Map for DataTable key
                applicationId: item.applicationId,
                accountId: item.accountId,
                name: item.name,
                email: item.email,
                seasonPackage: item.seasonPackage,
                documentUrl: item.documentUrl || "",
                status: item.status,
                createdDate: item.createdDate,
                packageId: item.packageId
            }));

            return {
                items,
                totalCount: data.totalCount || 0,
                totalPages: data.totalPages || 0,
                pageNumber: data.pageNumber || 1,
                pageSize: data.pageSize || 10
            };
        } catch (error) {
            console.error("Get Applications Error:", error);
            return { items: [], totalCount: 0, totalPages: 0, pageNumber: 1, pageSize: 10 };
        }
    },

    getApplicationById: async (id: string | number): Promise<CarParkApplicationDetail | null> => {
        const response = await apiClient.get<any>(`${ENDPOINTS.GET_APPLICATION_DETAIL}/${id}`);
        
        if (!response.success || !response.data) {
            return null;
        }

        const content = getDataObject<any>(response.data);
        
        return {
            applicationId: content.applicationId,
            accountId: content.accountId,
            name: content.name,
            ic: content.ic,
            email: content.email,
            hp: content.hp,
            company: content.company,
            carPlateNo: content.carPlateNo,
            type: content.type,
            packageId: content.packageId,
            packageName: content.packageName,
            phaseId: content.phaseId,
            unitId: content.unitId,
            unitName: content.unitName,
            bayNo: content.bayNo,
            documentUrl: content.documentUrl,
            status: content.status,
            reason: content.reason,
            createdDate: content.createdDate
        };
    },

    updateApplication: async (payload: ApplicationUpdatePayload) => {
        const response = await apiClient.post<any>(ENDPOINTS.UPDATE_APPLICATION, payload);
        if (!response.success) {
             throw new Error(response.error || "Failed to update application.");
        }
        return response.data;
    },

    approveApplication: async (payload: ApplicationApprovePayload) => {
        const response = await apiClient.post<any>(ENDPOINTS.APPROVE_APPLICATION, payload);
        if (!response.success) {
             throw new Error(response.error || "Failed to approve application.");
        }
        return response.data;
    },

    rejectApplication: async (payload: ApplicationRejectPayload) => {
        const apiPayload = {
            applicationId: payload.applicationId,
            adminStaffId: payload.adminStaffId,
            reason: payload.reason 
        };
        
        const response = await apiClient.post<any>(ENDPOINTS.REJECT_APPLICATION, apiPayload);
        if (!response.success) {
             throw new Error(response.error || "Failed to reject application.");
        }
        return response.data;
    },

    getBlacklist: async (pageNumber: number = 1, pageSize: number = 10): Promise<BlockedUserResponse> => {
        const payload = {
            reportName: "report_CarPark_BlockedList",
            pageNumber,
            pageSize
        };

        const response = await apiClient.post<any>(ENDPOINTS.EXECUTE_REPORT, payload);
        const emptyResult = { items: [], totalCount: 0, totalPages: 0, pageNumber, pageSize };

        if (!response.success || !response.data) {
             return emptyResult;
        }

        const content = getDataObject<any>(response.data);
        const rawItems = content.items || [];

        const items = rawItems.map((item: any) => ({
            id: String(item.CardID),
            qrId: String(item.CardID),
            email: item.Email || "N/A",
            staffNo: item.StaffNo || "-",
            carPlate: item.CarPlate || "-",
            unitNo: item.UnitName || "-",
            seasonPackage: item.SeasonPackage || "-",
            blockedDate: "N/A",
            reason: "Blocked"
        }));

        return {
            items,
            totalCount: content.totalCount || 0,
            totalPages: content.totalPages || 0,
            pageNumber: content.pageNumber || pageNumber,
            pageSize: content.pageSize || pageSize
        };
    },

    getWhitelist: async (searchQuery: string = ""): Promise<WhitelistedUser[]> => {
        await new Promise(r => setTimeout(r, 600));
        return [];
    },
};