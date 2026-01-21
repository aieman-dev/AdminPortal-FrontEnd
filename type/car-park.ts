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
    nric: string;
    mobile: string;
    company: string;
    type: string;
    staffId: string;
    contactOffice: string;
    contactHp: string;
    
    // Config
    seasonPackage: string;
    bayNo: string;
    parkingMode: string;
    remarks: string;

    // Unit Location
    // Optional: Only for UI state management in Edit form
    phase?: string; 
    unitNo: string; 
    // Flags
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


// --- PARKING HISTORY ---
export interface ParkingActivity {
    accId: number;
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

// Application new SuperApp
export interface CarParkApplication {
    id: number;
    name: string;
    email: string;
    seasonPackage: string;
    documentUrl: string; 
    status: string;      
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
    blockedDate: string;
    reason?: string;
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