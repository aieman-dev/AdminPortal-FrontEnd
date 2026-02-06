
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

// -- metadata phase and unit interfaces--
export interface Phase {
    id: number;
    name: string;
}

export interface Unit {
    id: number;
    name: string;
}

export interface Package {
    id: number;
    name: string;
}

export interface Department {
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

 export interface CarParkDepartment {
     code: string;
     name: string;
 }

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

 //Staff Listing
 export interface StaffListItem {
    staffId: number;
    accountId: number;
    staffName: string;
    staffNo: string;
    department: string;
    status: string;
}

export interface StaffDetail {
    staffId: number;
    staffNo: string;
    accountId: number;
    accountName : string;
    email: string;
    staffName: string;
    departmentCode: string;
    createdBy: string;
    createdDate: string;
    modifiedBy: string;
    modifiedDate: string;
}

 //Qr Listing
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
 

 // ------- The Report ----------
 export interface ReportParamOption {
    label: string;
    value: string | number | null;
}

 export interface ReportParameter {
     name: string;
     label: string;
     type: "date" | "select" | "text" | "number";
     required?: boolean;
     options?: ReportParamOption[]; 
     placeholder?: string;
 }

 export interface ReportMetadata {
     reportName: string;
     friendlyName: string;
     description: string;
     parameters: ReportParameter[];
 }
 
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
         LocationID?: number | null;
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


 // --- CRITICAL: Union Type for Service Return ---
 // This tells TypeScript: "The result might be success (data+status), error (conflict), or nothing (null)"
 export type PassDetailResult = 
     | { data: ParkingDetailData; status: ParkingDetailStatus } // Success Case
     | { error: string; qrId?: any }                            // Conflict/Error Case
     | null;