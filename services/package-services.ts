// services/package-services.ts
import { apiClient } from "@/lib/api-client";
import { PackageFormData, Package, PackageDuplicateResponse } from "@/type/packages"; 

const ENDPOINTS = {
  // Existing/Unchanged
  CREATE: "/proxy-create-package",       
  UPLOAD: "/proxy-upload",
  
  // NEW ENDPOINTS - Mapped to non-dynamic proxies
  UPDATE_STATUS: "/proxy-package-status/[id]",  // Retaining existing file name proxy
  GET_LIST: "/proxy-packageView",               // Mapped to proxy-packageView/route.ts
  GET_ONE: "/proxy-packageView/[id]",           // Mapped to proxy-packageView/[id]/route.ts
  DUPLICATE: "/proxy-package-duplicate",        // Mapped to new dedicated proxy route
};

// ... Interface and transformToFrontend function ...
interface BackendPackageDTO {
  id: number;
  name: string;           
  packageType: string;
  price: number;
  category: string;
  nationality: string;
  imageUrl?: string;      
  status: string;
  dateCreated: string;
  createdDate?: string;
  effectiveDate?: string; 
  lastValidDate?: string; 
  remark?: string;
  remark2?: string;
  submittedBy?: string;
  items?: any[];
  point?: number;
  validDays?: number;
  ageCategory?: string; 
  
  //NEW BACKEND FIELDS MAPPED HERE 
  reviewedDate?: string;
  approvedBy?: string;
  
}

const transformToFrontend = (pkg: BackendPackageDTO): Package => {
  // FIX 1: Last Valid Date logic (Next Day at 3AM)
  const start = new Date(pkg.effectiveDate ? pkg.effectiveDate.split('T')[0] : new Date());
  let end = new Date(pkg.lastValidDate ? pkg.lastValidDate.split('T')[0] : new Date());
  end.setDate(end.getDate() + 1); // Advance by 1 day
  end.setHours(3, 0, 0, 0); // Set time to 3 AM
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const calculatedDuration = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

  const rawAgeCode = pkg.ageCategory; // e.g. "C" (The code stored in the DB)
  const rawCategoryName = pkg.category; // e.g. "Child" (The descriptive name from DB)

  const displayAgeCategory = (() => {
    // If the ageCategory field already contains a full label (like "A1 - Adult"), use it.
    if (rawAgeCode && rawAgeCode.includes(' - ')) return rawAgeCode; 
    
    // If we have both a short code and a name, combine them (e.g., "C" + "Child" -> "C - Child").
    if (rawAgeCode && rawCategoryName && rawAgeCode.length <= 2) {
        return `${rawAgeCode} - ${rawCategoryName}`;
    }
    // Otherwise, fall back to whatever is most descriptive.
    return rawAgeCode || rawCategoryName || "N/A";
  })();

  // 🌟 MAPPING LOGIC: Prioritize new fields for last action details
  const finalReviewer = pkg.approvedBy ;
  const finalReviewDate = pkg.reviewedDate ;

  return {
    id: pkg.id,
    name: pkg.name,
    price: pkg.price,
    point: pkg.point, 
    imageUrl: pkg.imageUrl, 
    remark: pkg.remark,
    remark2: pkg.remark2,
    submittedBy: pkg.submittedBy,
    items: pkg.items,
    PackageName: pkg.name || "Untitled Package", 
    PackageType: pkg.packageType || "N/A",
    totalPrice: pkg.price || 0,
    // FIX 2: Use the most descriptive age category field, falling back to the generic category
    ageCategory: displayAgeCategory,
    nationality: pkg.nationality || "N/A",
    effectiveDate: pkg.effectiveDate || new Date().toISOString(),
    lastValidDate: pkg.lastValidDate || new Date().toISOString(),
    createdDate: pkg.createdDate || pkg.dateCreated || new Date().toISOString(),
    status: pkg.status || "Draft",
    imageID: pkg.imageUrl || "/packages/DefaultPackageImage.png",
    durationDays: pkg.validDays ?? calculatedDuration, 
    createdBy: pkg.submittedBy || "System", 
    packageitems: pkg.items || [], 
    tpremark: pkg.remark || "",
    reviewedBy: finalReviewer, 
    reviewedDate: finalReviewDate
  };
};

// FIX 3: Helper to extract code from the display label (e.g., "A1 - Adult" -> "A1")
const extractAgeCode = (ageCategory: string | undefined): string => {
    if (!ageCategory) return "";
    // Match: starts with one or more alphanumeric/hyphen characters, followed by a space and a hyphen
    const match = ageCategory.match(/^([A-Za-z0-9\-]+)\s*-/);
    return match ? match[1].trim() : ageCategory;
};


export const packageService = {
  uploadImage: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await apiClient.post<{ imageId: string }>(ENDPOINTS.UPLOAD, formData);
    if (!response.success || !response.data?.imageId) throw new Error(response.error || "Image upload failed");
    return response.data.imageId;
  },

  // --- UPDATED: updateStatus (Payload matches UpdateStatusRequestModel) ---
 updateStatus: async (id: number, status: "Approved" | "Rejected" | "Draft" | "Inactive", remark?: string) => {
    // Payload matches the C# UpdateStatusRequestModel structure
    const payload = { 
      Id: id, // Mandatory ID
      Status: status, // Mandatory Status
      Remark2: remark // Optional Remark2
    };
    
    // The proxy file at [id] now handles the fixed backend URL
    const response = await apiClient.put(ENDPOINTS.UPDATE_STATUS, payload);

    if (!response.success) {
      throw new Error(response.error || `Failed to ${status} package`);
    }
    return response.data;
  },

  createPackage: async (form: PackageFormData, imageId: string) => {
    // FIX 3: Get the machine-readable code for API submission
    const ageCode = extractAgeCode(form.ageCategory);
    
    //  Construct the payload with correct item structure
    const payload = {
      name: form.packageName,
      packageType: form.packageType ,
      price: form.packageType === "Entry" ? (form.totalPrice || 0) : 0,
      point: form.packageType === "Point" ? (form.totalPrice || 0) : 0,
      effectiveDate: form.effectiveDate ? new Date(form.effectiveDate).toISOString() : new Date().toISOString(),
      lastValidDate: form.lastValidDate ? new Date(form.lastValidDate).toISOString() : new Date().toISOString(),
      remark: form.tpremark || "No remarks",
      nationality: form.nationality ,
      // FIX 3: Use the extracted code for the API
      ageCategory: ageCode, 
      imageID: imageId,
      
      // This 'items' mapping is the most likely source of the 400 error.
      items: form.packageitems.map((item) => ({
        attractionId: item.attractionId, // <-- SEND THE ID (from terminalID)
        itemName: item.itemName,         // <-- Send name (just in case)
        itemType: item.itemType || "Entry", // <-- Default type
        //Send the correct value based on package type +++
        value: form.packageType === "Point" ? (item.point || 0) : (item.price || 0),
        entryQty: item.entryQty || 1,
      })),
    };

    // Debug log. Check your browser console to see exactly what is being sent.
    console.log("🚀 Sending createPackage payload:", JSON.stringify(payload, null, 2));

    const response = await apiClient.post(ENDPOINTS.CREATE, payload);
    
    // The 400 error is caught here
    if (!response.success) {
      // Log the specific error from the backend
      console.error(" Backend Error:", response.error);
      throw new Error(response.error || "Failed to create package");
    }
    return response.data;
  },

  // --- UPDATED: getPackages uses POST (Payload matches PackageFilterModel) ---
  getPackages: async (
    status: string, 
    startDate?: string, 
    endDate?: string, 
    page: number = 1,
    searchQuery: string = ""
  ): Promise<{ packages: Package[], totalPages: number, totalRecords: number }> => {
    
    // Payload matches the C# PackageFilterModel structure
    const payload = {
        Status: status,
        SearchQuery: searchQuery || null,
        PageNumber: page,
        PageSize: 30, 
        StartDate: startDate || null,
        EndDate: endDate || null,
    };
    
    // Use POST method for the new search endpoint
    const response = await apiClient.post<any>(ENDPOINTS.GET_LIST, payload);

    if (!response.success) {
      console.error("Failed to fetch packages:", response.error);
      return { packages: [], totalPages: 0, totalRecords: 0 };
    }

    // Since PackageController.cs returns a List<PackageSummaryViewModel>, we assume no pagination metadata is returned yet.
    if (response.data && Array.isArray(response.data)) {
        return {
            packages: response.data.map(transformToFrontend),
            totalPages: 1, 
            totalRecords: response.data.length,
        };
    }
    
    return { packages: [], totalPages: 0, totalRecords: 0 };
  },

  // --- UPDATED: getPackageById uses POST (Payload matches PackageDetailRequestModel) ---
  getPackageById: async (id: number, source?: string): Promise<Package | null> => {
    // Payload matches the C# PackageDetailRequestModel structure
    const payload = {
        Id: id,
        Source: source || null, // 'pending' or null
    };

    // Use POST method for the new detail endpoint
    const response = await apiClient.post<BackendPackageDTO>(ENDPOINTS.GET_ONE, payload);

    if (!response.success || !response.data) {
      console.error("Failed to fetch package:", response.error);
      return null;
    }

    return transformToFrontend(response.data);
  },

  // --- NEW FUNCTION: duplicatePackage (Typed to PackageDuplicateResponse) ---
  duplicatePackage: async (id: number): Promise<PackageDuplicateResponse> => {
      // Payload matches the C# PackageIdRequestModel structure
      const payload = { Id: id }; 
      
      // Use POST method and specify the expected response type
      const response = await apiClient.post<PackageDuplicateResponse>(ENDPOINTS.DUPLICATE, payload);
      
      if (!response.success || !response.data) {
          throw new Error(response.error || "Failed to duplicate package");
      }
      return response.data;
  }
};