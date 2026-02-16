// services/package-services.ts

import { apiClient, ApiResponse, getContent, getDataObject } from "@/lib/api-client";
import { getAuthToken } from "@/lib/auth";
import { DEFAULT_PAGE_SIZE } from "@/lib/constants";
import { DashboardSummaryDTO } from "@/type/packages";
import { 
    Package, 
    PackageFormData, 
    ImageItem, 
    PackageDuplicateResponse, 
    PackageItem,
    BackendPackageDTO,
    CreatePackagePayload,
    UpdatePackagePayload,
    PackageFilterPayload,
    UpdateStatusPayload
} from "@/type/packages"; 
import { 
    ItPoswfPackage, 
    UnsyncedPackageDTO, 
    SelectableItPoswfPackage 
} from "@/type/themepark-support";
import { transformToFrontend, AgeCategoryMapData } from "@/lib/transformers/package-transformer";

// 1. ENDPOINTS: Direct Backend Paths 
const ENDPOINTS = {
  // Dashboard
  DASHBOARD_SUMMARY: "Package/dashboard-summary",

  // Creation
  CREATE: "Package/create",
  EDIT: "",
  DRAFT: "Package/draft",
  BULK_SUBMIT: "Package/submitDraft",
  SEARCH_IMAGES: "Package/images/search",
  UPLOAD: "proxy-upload", 
  BULK_DELETE: "Package/deactivate-draft",
  CREATION_DATA: "Package/creationdata",
  
  // Status & Detail
  UPDATE_STATUS: "Package/status",
  GET_LIST: "packageView/search",
  GET_ONE: "packageView/detail",
  DUPLICATE: "Package/duplicate",

  // IT-POSWF Support
  PACKAGE_LISTING: "support/package-group/list",
  PACKAGE_EXTEND: "package/extend",
  BCOMPARE_SEARCH: "Package/unsynced",
  BCOMPARE_SYNC: "package/sync",
};

// --- CACHING & HELPERS ---
let ageCategoryCache: Record<string, AgeCategoryMapData> | null = null;

const getAgeCategoryMap = async (): Promise<Record<string, AgeCategoryMapData>> => {
  if (ageCategoryCache) return ageCategoryCache;
  try {
    const response = await apiClient.get<any>(ENDPOINTS.CREATION_DATA);
    const data = getDataObject<any>(response.data);
    if (response.success && data?.ageCategories) {
      const map: Record<string, AgeCategoryMapData> = {};
      data.ageCategories.forEach((c: any) => {
         if(c.ageCode) map[c.ageCode] = { displayText: c.displayText, description: c.description || "" };
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

// --- SERVICE IMPLEMENTATION ---

export const packageService = {

  //  DASHBOARD SUMMARY
  getDashboardSummary: async (filter: string = "ThisWeek"): Promise<DashboardSummaryDTO | null> => {
    const response = await apiClient.get<DashboardSummaryDTO>(`Package/dashboard-summary?filter=${filter}`);
    if (!response.success) throw new Error(response.error);
    return response.data!;
  },
  
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

    const data = response.data;
    const content = data.content || data;
    return {
        images: content.images || [],
        totalRecords: content.totalRecords || 0
    };
  },

  getCreationData: async () => {
    const response = await apiClient.get<any>(ENDPOINTS.CREATION_DATA);
    
    if (!response.success || !response.data) {
      console.error("Failed to load creation data:", response.error);
      return { attractions: [], ageCategories: [] };
    }
    
    const data = getDataObject<any>(response.data); 
    
    return {
        attractions: data.attractions || [],
        ageCategories: data.ageCategories || []
    };
  },

  //  CREATE / DRAFT / UPDATE
  createPackage: async (form: PackageFormData, imageId: string) => {
     return packageService._submitPackage(form, imageId, ENDPOINTS.CREATE);
  },

  saveDraft: async (form: PackageFormData, imageId: string, id?: number) => {
     return packageService._submitPackage(form, imageId, ENDPOINTS.DRAFT, id);
  },

  updatePackage: async (id: number, form: PackageFormData, imageId: string) => {
     return packageService._submitPackage(form, imageId, `${ENDPOINTS.EDIT}/${id}`, id);
  },

  // Helper for Create/Draft to avoid code duplication
  _submitPackage: async (form: PackageFormData, imageId: string, endpoint: string, id?: number) => {
    const isPoint = form.packageType === "Point";
    const finalPrice = form.totalPrice || 0;
    
    const basePayload: CreatePackagePayload = {
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

    let finalPayload: CreatePackagePayload | UpdatePackagePayload = basePayload;
    if (id) {
        finalPayload = { ...basePayload, id };
    }

    const response = endpoint.includes("update") 
    ? await apiClient.put(endpoint, finalPayload) 
    : await apiClient.post(endpoint, finalPayload);
    if (!response.success) throw new Error(response.error || "Submission failed");
    return response.data;
  },

  // Placeholder for Submit Draft API
  submitDraft: async (ids: number[]) => {
    const payload = { packageIds: ids };

    try {
        const response = await apiClient.post(ENDPOINTS.BULK_SUBMIT, payload) as any;
        
        if (response.statusCode === 400 || response.success === false) {
            const error: any = new Error(response.message || "Submission failed");
            
            error.content = response.content; 
            error.response = { data: response }; 
            
            throw error;
        }

        return response.data;

    } catch (error) {
        throw error;
    }
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

    const response = await apiClient.post<any>(ENDPOINTS.GET_LIST, payload);

    if (!response.success) {
      console.error("Fetch packages failed:", response.error);
      return { packages: [], totalPages: 0, totalRecords: 0 };
    }

    const rawData = response.data;
    let dataArray: BackendPackageDTO[] = getContent<BackendPackageDTO>(rawData);
    const totalRecords = rawData?.content?.size || 0;
    const totalPages = totalRecords > 0 ? Math.ceil(totalRecords / PAGE_SIZE) : 1;

    return {
        packages: dataArray.map(p => transformToFrontend(p, ageMap)),
        totalPages, 
        totalRecords
    }
  },

  // 5. GET DETAIL
  getPackageById: async (id: number, source?: string): Promise<Package | null> => {
    const ageMap = await getAgeCategoryMap();
    const payload = { Id: id, Source: source || null };
    
    const response = await apiClient.post<any>(ENDPOINTS.GET_ONE, payload);
    
    if (!response.success || !response.data) return null;
    const data = getDataObject<BackendPackageDTO>(response.data);
    return transformToFrontend(data, ageMap);
  },

  // 6. ACTIONS (Status, Duplicate, Delete)
  updateStatus: async (id: number, status: string, remark?: string) => {
    const payload: UpdateStatusPayload = { Id: id, Status: status, Remark2: remark };
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
  getPackagesListing: async (searchQuery: string = "", page: number = 1) => {
    const payload = {
        Status: "Active",
        SearchQuery: searchQuery || null,
        PageNumber: page, 
        PageSize: 30, 
        StartDate: null, EndDate: null
    };
    
    const response = await apiClient.post<any>(ENDPOINTS.PACKAGE_LISTING, payload);
    
    if (!response.success) return { packages: [], totalPages: 0, totalRecords: 0 };

    const root = response.data?.content || response.data;
    const rawList = Array.isArray(root) ? root : (root?.data || []);
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
        totalPages: root?.totalPages || 1,
        totalRecords: root?.totalItems || 0
    };
  },

  updatePackagesExtend: async (id: number | string, lastValidDate: string, remark: string) => {
    const payload = {
        id: Number(id),
        newLastValidDate: lastValidDate.split('T')[0],
        remark: remark
    };
    const response = await apiClient.post(ENDPOINTS.PACKAGE_EXTEND, payload);
    if (!response.success) throw new Error(response.error || "Update failed");
    return response.data;
  },

  getUnsyncedPackages: async (packageType?: string, searchQuery: string = "") => {
      const payload = { packageType: packageType === "all" ? undefined : packageType };
      const response = await apiClient.post<UnsyncedPackageDTO[]>(ENDPOINTS.BCOMPARE_SEARCH, payload);
      
      if (!response.success || !response.data) return { success: false, error: response.error };

      const rawList = getContent<UnsyncedPackageDTO>(response.data);
      let mapped: SelectableItPoswfPackage[] = rawList.map(p => ({
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