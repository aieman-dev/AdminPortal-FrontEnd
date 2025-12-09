// services/package-services.ts
import { apiClient, ApiResponse } from "@/lib/api-client";
import { PackageFormData, ImageItem, Package, PackageDuplicateResponse, PackageItem } from "@/type/packages"; 
import { ItPoswfPackage, UnsyncedPackageDTO, SelectableItPoswfPackage } from "../type/themepark-support";


const ENDPOINTS = {
  // Existing/Unchanged
  CREATE: "/proxy-create-package",
  SEARCH_IMAGES: "/proxy-image-search",
  UPLOAD: "/proxy-upload",
  DRAFT:"/proxy-create-package/draft", 
  BULK_DELETE: "/proxy-package-bulk-delete",
  CREATION_DATA: "/proxy-create-package/creationdata",
  
  // NEW ENDPOINTS - Mapped to non-dynamic proxies
  UPDATE_STATUS: "/proxy-package-status/[id]",  
  GET_LIST: "/proxy-packageView",               
  GET_ONE: "/proxy-packageView/[id]",           
  DUPLICATE: "/proxy-package-duplicate",        

  GET_ITPOSWF_LIST: "/proxy-package-group/list",
  UPDATE_ITPOSWF: "/proxy-package-group/update",
  BCOMPARE_SEARCH :"/proxy-bcompare/search",
  BCOMPARE_SYNC : "/proxy-bcompare/sync",
};

interface AgeCategoryMapData {
    displayText: string; // "A1 - Adult"
    description: string; // "Aged 11-59"
}

let ageCategoryCache: Record<string, AgeCategoryMapData> | null = null;

const getAgeCategoryMap = async (): Promise<Record<string, AgeCategoryMapData>> => {
  if (ageCategoryCache) return ageCategoryCache;
  
  try {
    // Fetch the definition list (same as Step 1 dropdown)
    const response = await apiClient.get<any>(ENDPOINTS.CREATION_DATA);
    if (response.success && response.data?.ageCategories) {
      const map: Record<string, AgeCategoryMapData> = {};
      response.data.ageCategories.forEach((c: any) => {
         // Map Code (A1) -> Display Text (A1 - Adult)
         map[c.ageCode] = c.displayText;
      });
      ageCategoryCache = map;
      return map;
    }
  } catch (e) {
    console.error("Failed to fetch age categories for mapping", e);
  }
  return {};
};

// --- FIX: DEFINITION OF BackendPackageDTO ---
interface BackendPackageDTO {
    id: number;
    name?: string;           
    packageType?: string;
    price?: number;
    category?: string;
    nationality?: string;
    imageUrl?: string;      
    status?: string;
    dateCreated?: string;
    createdDate?: string;
    effectiveDate?: string; 
    lastValidDate?: string; 
    dayPass?: string;
    remark?: string;
    remark2?: string;
    submittedBy?: string;
    items?: any[];
    point?: number;
    validDays?: number;
    ageCategory?: string; 
    reviewedDate?: string;
    approvedBy?: string;
    
    PackageName?: string; 
    totalPrice?: number;
    PackageType?: string; 
    imageID?: string;
    packageitems?: any[];
   

    // from IT-POSWF list response
    recordStatus?: string; 
    packageID?: string | number;
    packageName?: string;
    modifiedDate?: string;
    createdUserEmail?: string; 
    modifiedUserEmail?: string;
     
}
// ---------------------------------------------


const transformToFrontend = (pkg: BackendPackageDTO, ageMap: Record<string, AgeCategoryMapData> = {}): Package => {
  const effDateStr = pkg.effectiveDate || pkg.createdDate;
  const lastValidDateStr = pkg.lastValidDate;
   
  const rawAgeCode =pkg.ageCategory || pkg.category || "";
  const mappedData = ageMap[rawAgeCode];
  
  // DYNAMIC MAPPING: Use the map if available, otherwise fallback to code or legacy logic
  const displayAgeCategory = mappedData?.displayText || rawAgeCode || pkg.category || "N/A";
  const displayAgeDesc = mappedData?.description || "";

  // MAPPING LOGIC: Prioritize new fields for last action details
  const finalReviewer = pkg.approvedBy ;
  const finalReviewDate = pkg.reviewedDate ;
  const finalName = pkg.name || pkg.packageName || pkg.PackageName || "Untitled Package";
  
  const pType = (pkg.packageType || pkg.PackageType || '').toLowerCase();
  const isPointType = pType.includes('point') && !pType.includes('reward');

  const finalPrice = (isPointType && pkg.point !== undefined && pkg.point !== 0)
      ? pkg.point 
      : pkg.price ?? pkg.totalPrice ?? 0;
  
  const finalType = pkg.packageType || pkg.PackageType || "N/A";
  const finalStatus = pkg.status || "Draft";
  const finalImage = pkg.imageUrl || pkg.imageID || "/packages/DefaultPackageImage.png";

  // FIX 4: Ensure Package Items are mapped and defaulted correctly.
  // Note: packageitems is cast to any[] since it's defined as any[] on BackendPackageDTO now.
  const finalItems = (pkg.items as PackageItem[] || pkg.packageitems as PackageItem[] || []).map(item => ({
      ...item,
      price: item.price ?? 0,
      point: item.point ?? 0,
      entryQty: item.entryQty ?? 1,
      itemName: item.itemName || "Unknown Item",
  }));

  return {
    id: pkg.id,
    name: finalName,
    price: finalPrice, // Corrected value here
    point: pkg.point, 
    imageUrl: finalImage, 
    remark: pkg.remark,
    remark2: pkg.remark2,
    submittedBy: pkg.submittedBy,
    items: finalItems, // Correct camelCase field for details
    PackageName: finalName, // Legacy mapping
    PackageType: finalType, // Legacy mapping
    totalPrice: finalPrice, // Legacy mapping
    ageCategory: displayAgeCategory,
    ageDescription: displayAgeDesc,
    nationality: pkg.nationality || "N/A",
    effectiveDate: effDateStr, 
    lastValidDate: lastValidDateStr,
    createdDate: pkg.createdDate || pkg.dateCreated || new Date().toISOString(),
    status: finalStatus, // Use robust status
    imageID: finalImage, // Legacy mapping
    durationDays: pkg.validDays ?? 0, 
    createdBy: pkg.submittedBy || "System", 
    packageitems: finalItems, // Legacy mapping
    tpremark: pkg.remark || "",
    reviewedBy: finalReviewer, 
    reviewedDate: finalReviewDate,
    dayPass: pkg.dayPass, // Pass the dayPass field
  };
};


// FIX 3: Helper to extract code from the display label (e.g., "A1 - Adult" -> "A1")
const extractAgeCode = (ageCategory: string | undefined): string => {
    if (!ageCategory) return "";
    const match = ageCategory.match(/^([A-Za-z0-9\-]+)\s*-/);
    return match ? match[1].trim() : ageCategory;
};

const transformToItPoswfPackage = (pkg: BackendPackageDTO): ItPoswfPackage => {
  return {
    id: pkg.id ? String(pkg.id) : pkg.packageID ? String(pkg.packageID) : "N/A", 
    packageId: (pkg.packageID ?? pkg.id) as string | number, 
    packageName: pkg.packageName || pkg.name || "Untitled Package", 
    packageType: pkg.packageType || "N/A",
    price: pkg.price ?? 0,
    lastValidDate: pkg.lastValidDate || "N/A",
    description: pkg.remark || "No description", 
    status: pkg.recordStatus || pkg.status || "Unknown",
    createdBy: pkg.createdUserEmail,
    lastModifiedBy: pkg.modifiedUserEmail,
    createdDate: pkg.createdDate,
    modifiedDate: pkg.modifiedDate
  };
};

const transformToSelectablePackage = (pkg: UnsyncedPackageDTO): SelectableItPoswfPackage => {
    // Note: Data like price and date is often missing from the /unsynced endpoint. 
    // We set dummy/N/A values where necessary for the SelectableItPoswfPackage interface.
    return {
        id: String(pkg.packageID), 
        packageId: pkg.packageID,
        packageName: pkg.packageName,
        packageType: pkg.packageType,
        price: 0, // Not provided by unsynced API
        status: pkg.status,
        lastValidDate: "N/A", // Not provided by unsynced API
        syncStatus: "Pending", // Default sync status for unsynced list
    } as SelectableItPoswfPackage;
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

bulkDeletePackages: async (ids: number[]) => {
    const payload = { packageIds: ids };
    const response = await apiClient.put(ENDPOINTS.BULK_DELETE, payload);
    
    if (!response.success) {
        throw new Error(response.error || "Failed to delete selected packages.");
    }
    return response.data;
  },

  searchImages: async (pageNumber: number = 1, pageSize: number = 50): Promise<{ images: ImageItem[], totalRecords: number }> => {
    const payload = { 
        PageNumber: pageNumber, 
        PageSize: pageSize 
    };
    
    const response = await apiClient.post<any>(ENDPOINTS.SEARCH_IMAGES, payload);

    if (!response.success || !response.data) {
      console.error("Failed to search images:", response.error);
      return { images: [], totalRecords: 0 };
    }

    return {
        images: response.data.images || [],
        totalRecords: response.data.totalRecords || 0
    };
  },

  createPackage: async (form: PackageFormData, imageId: string) => {
    const ageCode = extractAgeCode(form.ageCategory);
    const typeLower = form.packageType.toLowerCase();
    const isPoint = form.packageType === "Point";

    const rawValue = form.totalPrice || 0;
    const formattedValue = Number(rawValue.toFixed(2));

    let finalNationality = form.nationality;
    if (finalNationality === "All" || finalNationality === "ALL") {
        finalNationality = null as any;
        }

    const mappedItems = form.packageitems.map((item) => {
        const itemVal = item.price || item.point || 0;
        return {
            attractionId: item.attractionId, 
            itemName: item.itemName,         
            itemType: item.itemType || (isPoint ? "Point" : "Entry"),
            entryQty: item.entryQty || 1,
            value: Number(itemVal.toFixed(2)), 
        };
    });
     
        const payload = {
        name: form.packageName,
        packageType: form.packageType,
        effectiveDate: form.effectiveDate ? form.effectiveDate.split('T')[0] : null,
        lastValidDate: form.lastValidDate ? form.lastValidDate.split('T')[0] : null,
        remark: form.tpremark || "No remarks",
        nationality: finalNationality,
        dayPass: form.dayPass,
        ageCategory: extractAgeCode(form.ageCategory), 
        imageID: imageId,
        items: mappedItems,
        price: isPoint ? 0 : formattedValue, 
        point: isPoint ? formattedValue : 0
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

// --- NEW FUNCTION: saveDraft ---
  saveDraft: async (form: PackageFormData, imageId: string) => {
    const ageCode = extractAgeCode(form.ageCategory);
    const typeLower = form.packageType.toLowerCase();
    const isPoint = form.packageType === "Point";

    const rawValue = form.totalPrice || 0;
    const formattedValue = Number(rawValue.toFixed(2));

    let finalNationality = form.nationality;
    if (finalNationality === "All" || finalNationality === "ALL") {
        finalNationality = null as any;
        }
    
    const mappedItems = form.packageitems.map((item) => {
        const itemVal = item.price || item.point || 0;
        return {
            attractionId: item.attractionId, 
            itemName: item.itemName,         
            itemType: item.itemType || (isPoint ? "Point" : "Entry"),
            entryQty: item.entryQty || 1,
            value: Number(itemVal.toFixed(2)), 
        };
    });
      
    const payload = {
        name: form.packageName,
        packageType: form.packageType,
        effectiveDate: form.effectiveDate ? form.effectiveDate.split('T')[0] : null,
        lastValidDate: form.lastValidDate ? form.lastValidDate.split('T')[0] : null,
        remark: form.tpremark || "No remarks",
        nationality: finalNationality,
        dayPass: form.dayPass,
        ageCategory: extractAgeCode(form.ageCategory), 
        imageID: imageId,
        items: mappedItems,
        price: isPoint ? 0 : formattedValue, 
        point: isPoint ? formattedValue : 0
    };

    console.log("💾 Sending saveDraft payload:", JSON.stringify(payload, null, 2));

    const response = await apiClient.post(ENDPOINTS.DRAFT, payload); 
    
    if (!response.success) {
      console.error(" Backend Error:", response.error);
      throw new Error(response.error || "Failed to save draft package");
    }
    return response.data;
  },

  // --- UPDATED: getPackages uses POST (Payload matches PackageFilterModel) ---
  getPackages: async (
    status: string, 
    startDate?: string, 
    endDate?: string, 
    page: number = 1,
    searchQuery: string = "",
    packageType?: string
  ): Promise<{ packages: Package[], totalPages: number, totalRecords: number }> => {
    
    const ageMap = await getAgeCategoryMap();

    const localTransform = (pkg: any): Package => {
        return transformToFrontend(pkg as BackendPackageDTO, ageMap);
    };
    
    // Payload matches the C# PackageFilterModel structure
    const payload = {
        Status: status,
        SearchQuery: searchQuery || null,
        PageNumber: page,
        PageSize: 30, 
        StartDate: startDate || null,
        EndDate: endDate || null,
        PackageType: packageType === "All" ? null : packageType,
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
            packages: response.data.map(localTransform),
            totalPages: 1, 
            totalRecords: response.data.length,
        };
    }
    
    return { packages: [], totalPages: 0, totalRecords: 0 };
  },

// --- STANDARD FUNCTIONS ---
  getPackageById: async (id: number, source?: string): Promise<Package | null> => {
    const ageMap = await getAgeCategoryMap();

    const localTransformDetail = (pkg: any): Package => {
        return transformToFrontend(pkg as BackendPackageDTO, ageMap);
    };

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

    return localTransformDetail(response.data);
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
  },


  // --- ----------------------------ItPoswfPackage------------------------------------- ---
  
  getItPoswfPackages: async ( // <--- NEW FUNCTION
    searchQuery: string = ""
  ): Promise<{ packages: ItPoswfPackage[], totalPages: number, totalRecords: number }> => {
    const transformToItPoswfPackage = (pkg: any): ItPoswfPackage => {
        return {
            id: String(pkg.packageID), 
            packageId: pkg.packageID,
            packageName: pkg.packageName,
            packageType: pkg.packageType,
            price: pkg.price,
            status: pkg.recordStatus || pkg.status || "Unknown",
        } as ItPoswfPackage;
    };
    
    // CRITICAL FIX: Explicitly set Status to "Active" (as required by the backend for searching)
    const statusFilter = "Active"; 
    
    const payload = {
        Status: statusFilter, // Required for the IT POSWF search to return results
        SearchQuery: searchQuery || null,
        PageNumber: 1, 
        PageSize: 30, 
        StartDate: null,
        EndDate: null,
    };
    
    const response = await apiClient.post<any>(ENDPOINTS.GET_ITPOSWF_LIST, payload);

    if (!response.success) {
      console.error("Failed to fetch IT POSWF packages:", response.error);
      return { packages: [], totalPages: 0, totalRecords: 0 };
    }

    const rawPackages = response.data?.data || [];
    const totalPages = response.data?.totalPages || 1;
    const totalRecords = response.data?.totalItems || rawPackages.length;

    if (Array.isArray(rawPackages)) {
        return {
            packages: rawPackages.map(transformToItPoswfPackage), // <--- USE NEW TRANSFORMER
            totalPages: totalPages, 
            totalRecords: totalRecords,
        };
    }
    
    return { packages: [], totalPages: 0, totalRecords: 0 };
  },

  updateItPoswfPackage: async (
    id: string | number,
    lastValidDate: string, // ISO string from the input
    remark: string
  ): Promise<any> => {
    const payload = {
      id: Number(id), // Ensure ID is sent as a number
      // FIX: Send only the date part, matching the successful Postman structure
      newLastValidDate: lastValidDate.split('T')[0], 
      remark: remark,
    };

    // Use POST method for the update
    const response = await apiClient.post(ENDPOINTS.UPDATE_ITPOSWF, payload);

    if (!response.success) {
      throw new Error(response.error || `Failed to update package ID ${id}`);
    }
    // Returns { "message": "Updated Successfully" } or similar
    return response.data; 
  },

  getUnsyncedPackages: async (
    packageType?: "Entry" | "Point" | "Reward" | "all", // Type is now explicitly broad
    searchQuery: string = "" 
    ): Promise<ApiResponse<SelectableItPoswfPackage[]>> => {
    const transformToSelectablePackage = (pkg: UnsyncedPackageDTO): SelectableItPoswfPackage => {
        // Note: Data like price and date is often missing from the /unsynced endpoint. 
        // We set dummy/N/A values where necessary for the SelectableItPoswfPackage interface.
        return {
            id: String(pkg.packageID), 
            packageId: pkg.packageID,
            packageName: pkg.packageName,
            packageType: pkg.packageType,
            price: 0, // Not provided by unsynced API
            status: pkg.status,
            lastValidDate: "N/A", // Not provided by unsynced API
            syncStatus: "Pending", // Default sync status for unsynced list
        } as SelectableItPoswfPackage;
    };
      
      const payload = {
          packageType: packageType === "all" ? undefined : packageType,
      };
      
      const response = await apiClient.post<UnsyncedPackageDTO[]>(ENDPOINTS.BCOMPARE_SEARCH, payload);
  
      if (!response.success || !response.data) {
        return { success: false, error: response.error || "Failed to fetch unsynced packages." };
      }
      
      let mappedData = response.data.map(transformToSelectablePackage);
      
      // Apply client-side search filtering if needed
      if (searchQuery) {
          mappedData = mappedData.filter(p => p.packageName.toLowerCase().includes(searchQuery.toLowerCase()));
      }
  
      return {
          success: true,
          data: mappedData,
      };
    },
  	
  	// ADDED: Function for executing the sync action
  	syncPackages: async (packageIds: number[]): Promise<ApiResponse<{ message: string }>> => {
        const payload = {
            packageIds: packageIds,
        };
        
        const response = await apiClient.post<{ message: string }>(ENDPOINTS.BCOMPARE_SYNC, payload);
        
        if (!response.success) {
            return { success: false, error: response.error || "Failed to execute package sync." };
        }
        return response;
    },
};