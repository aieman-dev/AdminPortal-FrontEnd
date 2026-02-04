// services/car-park-service.ts

import { apiClient, ApiResponse } from "@/lib/api-client";
import { SYSTEM_TERMINAL_ID } from "@/lib/constants";
import { getContent, getDataObject} from "@/lib/api-client"
import { 
    Account,
    ActivePassesPayload, 
    ActivePassesResponse, 
    CarParkDepartment,
    ParkingActivity,
    ReportMetadata,
    ReportDefinition,
    ReportPayload,
    ReportResponse,
 } from "@/type/hr";

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
   
    //Reports
    EXECUTE_REPORT: "CarPark/report",
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

export const hrService = {
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

//-------------- Car Park Reports ---------------
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