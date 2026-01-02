// type/packages.ts

// --- FRONTEND INTERFACES (Clean, camelCase, used by Components) ---

export interface Package {
  id: number;
  name: string;
  price: number;
  point: number;
  packageType: string;
  
  // Status & Metadata
  status: string;
  imageUrl: string;
  nationality: string;
  ageCategory: string;
  ageDescription?: string;
  dayPass?: string;
  durationDays: number;
  
  // Dates
  effectiveDate: string;
  lastValidDate: string;
  createdDate: string;
  reviewedDate?: string;
  
  // People
  submittedBy: string;
  reviewedBy?: string;
  
  // Remarks
  remark: string;       // Submitter/TP Remark
  remark2?: string;     // Finance/Approver Remark
  
  // Items
  items: PackageItem[];
}

export interface PackageItem {
  attractionId?: number; 
  itemName: string;       
  price: number;         
  point: number;
  entryQty: number;
  nationality?: string;
  category?: string;
  itemType?: string;     
  image?: string;          
}

export interface PackageFormData {
  packageName: string;            
  packageType: string;     
  nationality: string;     
  ageCategory: string;     
  effectiveDate: string;   
  lastValidDate: string;   
  dayPass?: string;
  tpremark?: string;       
  imageID: File | string | null; 
  imageUrl?: string;
  packageitems: PackageItem[];
  totalPrice?: number;
}

export interface ImageItem {
    imageID: number;
    fileName: string;
    imgUrl: string;
}

export interface AgeCategory {
  ageCode: string;        
  displayText: string;    
  description?: string;
}

export interface PackageDuplicateResponse {
  message: string;
  newPackageId: number;
}

// --- BACKEND DTOs (Raw JSON from API) ---

export interface BackendPackageDTO {
    id: number;
    packageID?: number; // Sometimes backend sends this
    
    // Core Info
    name?: string;           
    PackageName?: string;    // Legacy/Alternate
    packageName?: string;    // Legacy/Alternate
    
    packageType?: string;
    PackageType?: string;
    
    price?: number;
    totalPrice?: number;
    point?: number;
    
    // Metadata
    category?: string;       // Age Code
    ageCategory?: string;
    nationality?: string;
    
    // Images
    imageUrl?: string; 
    imageID?: string;
    
    // Status & Dates
    status?: string;
    recordStatus?: string;
    createdDate?: string;
    dateCreated?: string;
    effectiveDate?: string;
    lastValidDate?: string;
    validDays?: number;
    durationDays?: number;
    dayPass?: string;
    
    // Remarks & People
    remark?: string;         // TP Remark
    tpremark?: string;
    remark2?: string;        // Finance Remark
    financeremark?: string;
    
    submittedBy?: string;
    createdBy?: string;
    createdUserEmail?: string;
    approvedBy?: string;
    reviewedDate?: string;
    
    // Items
    items?: BackendPackageItemDTO[];
    packageitems?: BackendPackageItemDTO[];
}

export interface BackendPackageItemDTO {
    attractionId?: number;
    itemName?: string;
    price?: number;
    point?: number;
    entryQty?: number;
    itemType?: string;
    nationality?: string;
    category?: string;
}

// --- PAYLOADS (For Sending Data) ---

export interface CreatePackagePayload {
    name: string;
    packageType: string;
    price: number;
    point: number;
    nationality: string | null;
    ageCategory: string;
    dayPass: string | undefined;
    effectiveDate: string | null;
    lastValidDate: string | null;
    remark: string;
    imageID: string;
    items: {
        attractionId: number | undefined;
        itemName: string;
        itemType: string;
        entryQty: number;
        value: number;
    }[];
}

export interface UpdatePackagePayload extends CreatePackagePayload {
    id: number;
}

export interface PackageFilterPayload {
    Status: string;
    SearchQuery: string | null;
    PageNumber: number;
    PageSize: number;
    StartDate: string | null;
    EndDate: string | null;
    PackageType: string | null;
}

export interface UpdateStatusPayload {
    Id: number;
    Status: string;
    Remark2?: string;
}

export interface DashboardSummaryDTO {
    ticketConsumption: number;
    pendingPackages: number;
    draftPackages: number;
    activeTerminals: number;
    totalTerminals: number;
    salesAmount: number;
    salesCount: number;
    consumeAmount: number;
    consumeCount: number;
    bestSellingPackages: {
        packageName: string;
        totalSold: number;
        totalRevenue?: number; 
    }[]; 
    weeklySalesChart: {
        date: string;
        dayName: string;
        totalAmount: number;
        isForecast?: boolean; 
    }[];
}

