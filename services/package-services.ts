// services/package-services.ts

import { apiClient } from "@/lib/api-client";
import { getAuthToken } from "@/lib/auth";
import { DEFAULT_PAGE_SIZE } from "@/lib/constants";
import { 
    Package, 
    PackageFormData, 
    ImageItem, 
    PackageDuplicateResponse, 
    PackageItem,
    BackendPackageDTO,
    CreatePackagePayload,
    PackageFilterPayload,
    UpdateStatusPayload
} from "@/type/packages"; 
import { 
    ItPoswfPackage, 
    UnsyncedPackageDTO, 
    SelectableItPoswfPackage 
} from "@/type/themepark-support";

// 1. ENDPOINTS: Direct Backend Paths (No more proxy-create-package etc.)
const ENDPOINTS = {
  CREATE: "Package/create",
  DRAFT: "Package/draft",
  SEARCH_IMAGES: "Package/images/search",
  UPLOAD: "proxy-upload", 
  BULK_DELETE: "Package/deactivate-draft",
  CREATION_DATA: "Package/creationdata",
  
  // Status & Detail
  UPDATE_STATUS: "Package/status",
  GET_LIST: "packageView/search",
  GET_ONE: "packageView/details",
  DUPLICATE: "Package/duplicate",

  // IT-POSWF Support
  GET_ITPOSWF_LIST: "support/package-group/list",
  UPDATE_ITPOSWF: "package/extend",
  BCOMPARE_SEARCH: "Package/unsynced",
  BCOMPARE_SYNC: "package/sync",
};

// --- CACHING & HELPERS ---

interface AgeCategoryMapData {
    displayText: string; 
    description: string; 
}

let ageCategoryCache: Record<string, AgeCategoryMapData> | null = null;

const getAgeCategoryMap = async (): Promise<Record<string, AgeCategoryMapData>> => {
  if (ageCategoryCache) return ageCategoryCache;
  try {
    const response = await apiClient.get<any>(ENDPOINTS.CREATION_DATA);
    if (response.success && response.data?.ageCategories) {
      const map: Record<string, AgeCategoryMapData> = {};
      response.data.ageCategories.forEach((c: any) => {
         map[c.ageCode] = { displayText: c.displayText, description: c.description || "" };
      });
      ageCategoryCache = map;
      return map;
    }
  } catch (e) { console.error("Age Cat Cache Error", e); }
  return {};
};

const extractAgeCode = (ageCategory: string | undefined): string => {
    if (!ageCategory) return "";
    const match = ageCategory.match(/^([A-Za-z0-9\-]+)\s*-/);
    return match ? match[1].trim() : ageCategory;
};

// --- TRANSFORMER: Backend DTO -> Frontend Interface ---

const transformToFrontend = (pkg: BackendPackageDTO, ageMap: Record<string, AgeCategoryMapData> = {}): Package => {
  const finalName = pkg.name || pkg.PackageName || pkg.packageName || "Untitled";
  const pType = (pkg.packageType || pkg.PackageType || '').trim();
  const isPointType = pType.toLowerCase().includes('point') && !pType.toLowerCase().includes('reward');
  
  // Price Logic: prefer 'point' field if point type, otherwise price/totalPrice
  let finalPrice = 0;
  let finalPoint = 0;

  if (isPointType) {
      finalPoint = pkg.point ?? 0;
      finalPrice = 0; 
  } else {
      finalPrice = pkg.price ?? pkg.totalPrice ?? 0;
      finalPoint = 0;
  }

  
  const rawAgeCode = pkg.ageCategory || pkg.category || "";
  const mappedAge = ageMap[rawAgeCode];
  const displayAgeCat = mappedAge?.displayText || rawAgeCode || "N/A";
  const displayAgeDesc = mappedAge?.description || "";

  
  const rawItems = pkg.items || pkg.packageitems || [];
  const finalItems: PackageItem[] = rawItems.map(item => ({
      attractionId: item.attractionId,
      itemName: item.itemName || "Unknown Item",
      price: item.price ?? 0,
      point: item.point ?? 0,
      entryQty: item.entryQty ?? 1,
      nationality: item.nationality,
      category: item.category,
      itemType: item.itemType
  }));

  return {
    id: pkg.id,
    name: finalName,
    price: finalPrice,
    point: finalPoint,
    packageType: pType || "N/A",
    
    status: pkg.status || "Draft",
    imageUrl: pkg.imageUrl || pkg.imageID || "",
    nationality: pkg.nationality || "N/A",
    
    ageCategory: displayAgeCat,
    ageDescription: displayAgeDesc,
    
    effectiveDate: pkg.effectiveDate || pkg.createdDate || "",
    lastValidDate: pkg.lastValidDate || "",
    createdDate: pkg.createdDate || pkg.dateCreated || "",
    
    submittedBy: pkg.submittedBy || pkg.createdBy || "System",
    reviewedBy: pkg.approvedBy,
    reviewedDate: pkg.reviewedDate,
    
    remark: pkg.remark || pkg.tpremark || "",
    remark2: pkg.remark2 || pkg.financeremark || "",
    
    durationDays: pkg.validDays ?? pkg.durationDays ?? 0,
    dayPass: pkg.dayPass,
    items: finalItems
  };
};

// --- SERVICE IMPLEMENTATION ---

export const packageService = {
  
  //  UPLOAD IMAGE (Still uses specific proxy for FormData)
  uploadImage: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/proxy-upload", {
        method: "POST",
        body: formData,
        headers: {
            // Manually inject token since we aren't using apiClient
            "Authorization": `Bearer ${getAuthToken()}`
        }
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || "Image upload failed");
    }
    
    return data.imageId;
  },

  //  SEARCH IMAGES
  searchImages: async (pageNumber: number = 1, pageSize: number = 50): Promise<{ images: ImageItem[], totalRecords: number }> => {
    const payload = { PageNumber: pageNumber, PageSize: pageSize };
    const response = await apiClient.post<any>(ENDPOINTS.SEARCH_IMAGES, payload);

    if (!response.success || !response.data) return { images: [], totalRecords: 0 };
    return {
        images: response.data.images || [],
        totalRecords: response.data.totalRecords || 0
    };
  },

  getCreationData: async () => {
    const response = await apiClient.get<any>(ENDPOINTS.CREATION_DATA);
    
    if (!response.success || !response.data) {
      console.error("Failed to load creation data:", response.error);
      return { attractions: [], ageCategories: [] };
    }
    
    return {
        attractions: response.data.attractions || [],
        ageCategories: response.data.ageCategories || []
    };
  },

  //  CREATE / DRAFT
  createPackage: async (form: PackageFormData, imageId: string) => {
     return packageService._submitPackage(form, imageId, ENDPOINTS.CREATE);
  },

  saveDraft: async (form: PackageFormData, imageId: string) => {
     return packageService._submitPackage(form, imageId, ENDPOINTS.DRAFT);
  },

  // Helper for Create/Draft to avoid code duplication
  _submitPackage: async (form: PackageFormData, imageId: string, endpoint: string) => {
    const isPoint = form.packageType === "Point";
    const finalPrice = form.totalPrice || 0;
    
    const payload: CreatePackagePayload = {
        name: form.packageName,
        packageType: form.packageType,
        price: isPoint ? 0 : finalPrice,
        point: isPoint ? finalPrice : 0,
        nationality: (form.nationality === "All" || form.nationality === "ALL") ? null : form.nationality,
        ageCategory: extractAgeCode(form.ageCategory),
        dayPass: form.dayPass,
        effectiveDate: form.effectiveDate ? form.effectiveDate.split('T')[0] : null,
        lastValidDate: form.lastValidDate ? form.lastValidDate.split('T')[0] : null,
        remark: form.tpremark || "No remarks",
        imageID: imageId,
        items: form.packageitems.map(item => ({
            attractionId: item.attractionId,
            itemName: item.itemName,
            itemType: item.itemType || (isPoint ? "Point" : "Entry"),
            entryQty: item.entryQty || 1,
            value: Number((item.price || item.point || 0).toFixed(2))
        }))
    };

    const response = await apiClient.post(endpoint, payload);
    if (!response.success) throw new Error(response.error || "Submission failed");
    return response.data;
  },

  //  GET LIST
  getPackages: async (
    status: string, 
    startDate?: string, 
    endDate?: string, 
    page: number = 1,
    searchQuery: string = "",
    packageType?: string
  ): Promise<{ packages: Package[], totalPages: number, totalRecords: number }> => {
    
    const ageMap = await getAgeCategoryMap();
    const PAGE_SIZE = DEFAULT_PAGE_SIZE;

    const payload: PackageFilterPayload = {
        Status: status,
        SearchQuery: searchQuery || null,
        PageNumber: page,
        PageSize: PAGE_SIZE,
        StartDate: startDate || null,
        EndDate: endDate || null,
        PackageType: packageType === "All" ? null : (packageType || null),
    };

    const response = await apiClient.post<BackendPackageDTO[]>(ENDPOINTS.GET_LIST, payload);

    if (!response.success) {
      console.error("Fetch packages failed:", response.error);
      return { packages: [], totalPages: 0, totalRecords: 0 };
    }

    const data = response.data || [];
    // Assuming backend returns list without metadata for now, calculate manually
    const totalPages = data.length === PAGE_SIZE ? page + 1 : page; 

    return {
        packages: data.map(p => transformToFrontend(p, ageMap)),
        totalPages,
        totalRecords: -1 
    };
  },

  // 5. GET DETAIL
  getPackageById: async (id: number, source?: string): Promise<Package | null> => {
    const ageMap = await getAgeCategoryMap();
    const payload = { Id: id, Source: source || null };
    
    const response = await apiClient.post<BackendPackageDTO>(ENDPOINTS.GET_ONE, payload);
    
    if (!response.success || !response.data) return null;
    return transformToFrontend(response.data, ageMap);
  },

  // 6. ACTIONS (Status, Duplicate, Delete)
  updateStatus: async (id: number, status: string, remark?: string) => {
    const payload: UpdateStatusPayload = { Id: id, Status: status, Remark2: remark };
    // NOTE: Backend endpoint is PUT /api/package/status
    const response = await apiClient.put(ENDPOINTS.UPDATE_STATUS, payload);
    if (!response.success) throw new Error(response.error || `Failed to update status to ${status}`);
    return response.data;
  },

  duplicatePackage: async (id: number): Promise<PackageDuplicateResponse> => {
    const response = await apiClient.post<PackageDuplicateResponse>(ENDPOINTS.DUPLICATE, { Id: id });
    if (!response.success || !response.data) throw new Error(response.error || "Duplicate failed");
    return response.data;
  },

  bulkDeletePackages: async (ids: number[]) => {
    const response = await apiClient.put(ENDPOINTS.BULK_DELETE, { packageIds: ids });
    if (!response.success) throw new Error(response.error || "Bulk delete failed");
    return response.data;
  },

  // 7. IT-POSWF Specifics (Legacy Support / Migration)
  getItPoswfPackages: async (searchQuery: string = "", page: number = 1) => {
    const payload = {
        Status: "Active",
        SearchQuery: searchQuery || null,
        PageNumber: page, 
        PageSize: 30, 
        StartDate: null, EndDate: null
    };
    
    const response = await apiClient.post<any>(ENDPOINTS.GET_ITPOSWF_LIST, payload);
    
    if (!response.success) return { packages: [], totalPages: 0, totalRecords: 0 };

    const rawList = response.data?.data || [];
    const packages: ItPoswfPackage[] = rawList.map((pkg: any) => ({
        id: String(pkg.packageID),
        packageId: pkg.packageID,
        packageName: pkg.packageName,
        packageType: pkg.packageType,
        price: pkg.price,
        status: pkg.recordStatus || "Unknown",
        lastValidDate: pkg.lastValidDate ? pkg.lastValidDate.split('T')[0] : "N/A",
        description: pkg.remark || "",
        createdBy: pkg.createdUserEmail,
        lastModifiedBy: pkg.modifiedUserEmail,
        createdDate: pkg.createdDate,
        modifiedDate: pkg.modifiedDate
    }));

    return {
        packages,
        totalPages: response.data?.totalPages || 1,
        totalRecords: response.data?.totalItems || 0
    };
  },

  updateItPoswfPackage: async (id: number | string, lastValidDate: string, remark: string) => {
    const payload = {
        id: Number(id),
        newLastValidDate: lastValidDate.split('T')[0],
        remark: remark
    };
    const response = await apiClient.post(ENDPOINTS.UPDATE_ITPOSWF, payload);
    if (!response.success) throw new Error(response.error || "Update failed");
    return response.data;
  },

  getUnsyncedPackages: async (packageType?: string, searchQuery: string = "") => {
      const payload = { packageType: packageType === "all" ? undefined : packageType };
      const response = await apiClient.post<UnsyncedPackageDTO[]>(ENDPOINTS.BCOMPARE_SEARCH, payload);
      
      if (!response.success || !response.data) return { success: false, error: response.error };

      let mapped: SelectableItPoswfPackage[] = response.data.map(p => ({
          id: String(p.packageID),
          packageId: p.packageID,
          packageName: p.packageName,
          packageType: p.packageType,
          price: 0,
          status: p.status,
          lastValidDate: "N/A",
          syncStatus: "Pending"
      }));

      if (searchQuery) {
          mapped = mapped.filter(p => p.packageName.toLowerCase().includes(searchQuery.toLowerCase()));
      }
      return { success: true, data: mapped };
  },

  syncPackages: async (ids: number[]) => {
      const response = await apiClient.post<{message: string}>(ENDPOINTS.BCOMPARE_SYNC, { packageIds: ids });
      if (!response.success) return { success: false, error: response.error };
      return response;
  }
};