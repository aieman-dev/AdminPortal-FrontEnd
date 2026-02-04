
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

 // ------- The Full Metadata Response Object----------
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