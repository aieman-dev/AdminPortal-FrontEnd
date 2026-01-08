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
  remark: string;
  remark2?: string;
  
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
    name: string;           
    packageType: string;
    price: number;
    point: number;
    ageCategory?: string;
    nationality: string;
    imageUrl: string; 
    status: string;
    createdDate?: string;
    effectiveDate?: string;
    lastValidDate?: string;
    validDays?: number;
    dayPass?: number;
    remark?: string;
    remark2?: string;
    submittedBy: string;
    approvedBy: string;
    reviewedDate?: string;
    items?: BackendPackageItemDTO[];
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

