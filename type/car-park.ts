// type/car-park.ts

//general
export interface Account {
  id: string
  accId: string
  email: string
  firstName: string
  mobile: string
  createdDate: string
  accountStatus: "Active" | "Inactive" | "Suspended"
  transactions: Transaction[]
}

export interface Transaction {
  invoiceNo: string
  name: string
  amount: number
  trxType: "Credit" | "Debit"
  createdDate: string
}

export interface CarParkAccount {
    accId: string | number;
    email: string;
    firstName: string;
    mobile: string;
    accountStatus: string;
    createdDate?: string;
}

// Registration form interface
export interface CarParkRegistrationForm {
    // Search Section
    searchType: "qr" | "email";
    searchTerm: string;
  
    // Primary User Info
    userEmail: string;
    accId?: number;
    name: string;
    nric: string;
    companyName?: string;
    officeContact?: string;
    mobileContact: string;
  
    // Car Plates (Primary)
    plate1: string;
    plate2?: string;
    plate3?: string;
  
    // Tandem Holder (Second Holder)
    tandemName?: string;
    tandemNric?: string;
    tandemPlate1?: string;
    tandemPlate2?: string;
    tandemMobile?: string;
  
    // Unit Info
    phase: string;
    unitNo: string;
  
    // User Type
    userType: "Staff" | "Tenant" | "Non-Tenant" | "Owner";
    staffId?: string;
  
    // Parking Info
    parkingType: "Normal" | "Reserved";
    isTandem: boolean;
    amanoCardNo?: string;
}

// -- metadata phase and unit interfaces--
export interface CarParkPhase {
    id: number;
    name: string;
}

export interface CarParkUnit {
    id: number;
    name: string;
}

export interface CarParkPackage {
    id: number;
    name: string;
}

export interface CarParkDepartment {
    code: string;
    name: string;
}

// --- NEW: QR LISTING API INTERFACES ---

export interface CarParkPass {
    qrId: number;
    accId: number;
    name: string;
    email: string;
    staffNo: string;
    plateNo: string;
    unitNo: string;
    packageName: string;
    expiryDate: string;
    status: string;
    isLPR: boolean;
}

export interface ActivePassesPayload {
    pageNumber: number;
    pageSize: number;
    searchQuery: string;
}

export interface ActivePassesResponse {
    items: CarParkPass[];
    totalCount: number;
    pageNumber: number;
    pageSize: number;
    totalPages: number;
}

export interface CarParkCard {
    cardId: number;
    cardNo: string;
    plateNo: string;
    packageId: number;
    packageName: string;
    effectiveDate: string;
    expiryDate: string;
    status: string;
    type: string;
    isLPR: boolean;
    isTandem: boolean;
    staffNo: string; 
    bayNo: string;
    remarks: string;
    unitNo: string;
    createdDate: string; 
    createdUserId: number;
    modifiedDate: string;
    modifiedUserId: number;
}

// Parking Detail Interfaces ( Season Pass & SuperApp Visitor)
export interface ParkingDetailData {
    accId: number;
    name: string;
    email: string;
    userType: string;
    nric: string;
    mobile: string;
    company: string;
    staffId: string;
    contactOffice: string;
    contactHp: string;
    
    // Config
    seasonPackage: string;
    bayNo: string;
    parkingMode: string;
    remarks: string;

    qrId?: number;
    message?: string;

    // Unit Location
    phase?: string; 
    unitNo: string; 
    isLpr: boolean;
    isTandem: boolean;
    isHomestay: boolean;
    isMobileQr: boolean;

    // Dates
    effectiveDate: string;
    expiryDate: string;

    // Vehicles
    plate1: string;
    plate2: string;
    plate3: string;
    
    // Amano
    amanoCardNo: string;
    amanoExpiryDate: string;

    // Wallet Balance (for SuperApp Visitor)
    walletBalance?: number;
}


export interface ParkingDetailStatus {
    recordStatus: string;
    seasonStatus: string;
    iPointStatus: string;
    lastExitSeason: string;
    lastExitIPoint: string;
    createdOn: string;
    createdBy: string;
    modifiedOn: string;
    modifiedBy: string;
}

export interface ManualEntryPayload {
    accId: number;
    terminalId: number;
    direction: "In" | "Out";
    
    plateNo?: string | null;
    cardNo?: string | null;
    amount?: number;

    //force exit
    rParkingID?: string;
}


// --- PARKING HISTORY ---
export interface ParkingActivity {
    accId: number;
    rParkingID : string;
    plateNo: string;
    entryTime: string;
    exitTime: string;
    entryGate: string;
    exitGate: string;
    status: string;
    duration: string;
}

export interface ParkingHistoryPayload {
    pageNumber: number;
    pageSize: number;
    accId: number;
    startDate: string; 
    endDate: string;   
}

export interface ParkingHistoryResponse {
    items: ParkingActivity[];
    totalCount: number;
    pageNumber: number;
    pageSize: number;
    totalPages: number;
}

// --- REPORTS ---
export interface ReportDefinition {
    id: number;
    code: string; 
    name: string; 
    description: string;
    path: string; 
}

export interface ReportPayload {
    reportName: string;
    pageNumber: number;
    pageSize: number;
    parameters?: {
        AccID?: string | number | null;
        StartDate?: string | null;
        EndDate?: string | null;
        [key: string]: any; 
    };
}

export interface ReportResponse {
    items: Record<string, any>[];
    totalCount: number;
    pageNumber: number;
    pageSize: number;
    totalPages: number;
}

// Application new SuperApp
export interface CarParkApplication {
    id: number;
    applicationId: number;
    accountId: number;
    name: string;
    email: string;
    seasonPackage: string;
    documentUrl: string; 
    status: string;      
    createdDate: string;
    packageId: number;
}

export interface CarParkApplicationDetail {
    applicationId: number;
    accountId: number;
    name: string;
    ic: string;
    email: string;
    hp: string;
    company: string;
    carPlateNo: string;
    type: string;
    packageId: number;
    packageName: string;
    phaseId: number | null;
    unitId: number | null;
    unitName: string;
    bayNo: string;
    documentUrl: string;
    status: string;
    reason: string;
    createdDate: string;
}

export interface ApplicationListResponse {
    items: CarParkApplication[];
    totalCount: number;
    totalPages: number;
    pageNumber: number;
    pageSize: number;
}

export interface ApplicationUpdatePayload {
    applicationId: number;
    plateNo1: string;
    packageId: number;
    userType: string;
    phaseId: number;
    unitId: number;
    bayNo: string;
    adminStaffId: number;
}

export interface ApplicationApprovePayload {
    applicationId: number;
    accId: number;
    adminStaffId: number;
    terminalId: number;
    name: string;
    ic: string;
    company: string;
    hp: string;
    officeNo: string;
    userType: string;
    plateNo1: string;
    plateNo2: string;
    plateNo3: string;
    packageId: number;
    unitId: number;
    bayNo: string;
    isReserved: boolean;
    staffId: string;
    department: string;
    isStaffTag: boolean;
    isTandem: boolean;
    tandemEmail: string;
    tandemName: string;
    tandemIC: string;
    tandemHP: string;
    tandemPlateNo1: string;
    tandemPlateNo2: string;
    tandemPlateNo3: string;
    isLPR: boolean;
    isHomestay: boolean;
    isTransfer: boolean;
    amanoCardNo: string;
    amanoExpiryDate: string | null;
    comment: string;
    remarks: string;
}

export interface ApplicationRejectPayload {
    applicationId: number;
    adminStaffId: number;
    reason: string; 
}

// Blocked List/ Whietlist
export interface BlockedUser {
    id: string; 
    qrId: string;
    email: string;
    staffNo: string;
    carPlate: string;
    unitNo: string;
    seasonPackage: string;
    blockedDate?: string; 
    reason?: string;
}

export interface BlockedUserResponse {
    items: BlockedUser[];
    totalCount: number;
    totalPages: number;
    pageNumber: number;
    pageSize: number;
}

export interface WhitelistedUser {
    id: string; 
    qrId: string;
    email: string;
    staffNo: string;
    carPlate: string;
    unitNo: string;
    seasonPackage: string;
    whitelistedDate: string;
    remarks?: string;
}

// --- CRITICAL: Union Type for Service Return ---
// This tells TypeScript: "The result might be success (data+status), error (conflict), or nothing (null)"
export type PassDetailResult = 
    | { data: ParkingDetailData; status: ParkingDetailStatus } // Success Case
    | { error: string; qrId?: any }                            // Conflict/Error Case
    | null;