// services/package-services.ts
import { apiClient } from "@/lib/api-client";
import { PackageFormData, Package } from "@/type/packages"; 

const ENDPOINTS = {
  CREATE: "/proxy-create-package",
  UPLOAD: "/proxy-upload",
  GET_LIST: (status: string, start?: string, end?: string) => {
    let url = `/proxy-packageView?status=${encodeURIComponent(status)}`;
    if (start) url += `&startDate=${encodeURIComponent(start)}`;
    if (end) url += `&endDate=${encodeURIComponent(end)}`;

    // Automatically check the 'testingpending' table for these statuses
    if (["Pending", "Draft", "Rejected"].includes(status)) {
      url += `&source=pending`;
    }
    return url;
  },
  GET_ONE: (id: string | number, source?: string) => {
    let url = `/proxy-packageView/${id}`;
    if (source) {
      url += `?source=${encodeURIComponent(source)}`;
    }
    return url;
  },
};

const TEST_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJUUEBlbWFpbC5jb20iLCJ1c2VySWQiOiIzIiwibmFtZSI6IlRQVGVzdCIsImRlcGFydG1lbnQiOiJUUF9BRE1JTiIsImp0aSI6IjIwOTUzYTkxLTZjM2EtNGQ5ZC1hOWQ1LTNiMjI5OGIzNjk5ZiIsImV4cCI6MTc2MzA4NTA5MywiaXNzIjoiaHR0cHM6Ly9sb2NhbGhvc3Q6NzAyOSIsImF1ZCI6Imh0dHA6Ly9sb2NhbGhvc3Q6NTE3MyJ9.1JfZcRxqI-sAJy-3sIo_YnUgSTC4vWTun3sDXPKVHiA";

const getHeaders = () => ({
  Authorization: `Bearer ${TEST_TOKEN}`
});

// <--- CHANGED: Matched fields to your Postman JSON response
interface BackendPackageDTO {
  id: number;
  name: string;           
  packageType: string;
  price: number;
  category: string;
  nationality: string;
  imageUrl?: string;      
  status: string;
  dateCreated: string; // Note: Check if JSON returns 'createdDate' or 'dateCreated'
  createdDate?: string; // Added fallback based on common discrepancies
  
  // <--- CHANGED: Use effectiveDate/lastValidDate instead of startDate/endDate
  effectiveDate?: string; 
  lastValidDate?: string; 
  
  remark?: string;
  remark2?: string;
  submittedBy?: string;
  items?: any[];
  point?: number;
  validDays?: number; // API might return this directly
}

const transformToFrontend = (pkg: BackendPackageDTO): Package => {
  // <--- CHANGED: Read from effectiveDate/lastValidDate
  const start = new Date(pkg.effectiveDate || new Date());
  const end = new Date(pkg.lastValidDate || new Date());
  
  // Calculate duration if validDays is missing from API
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const calculatedDuration = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

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

    // Legacy Fields
    PackageName: pkg.name || "Untitled Package", 
    PackageType: pkg.packageType || "N/A",
    totalPrice: pkg.price || 0,
    ageCategory: pkg.category || "N/A",
    nationality: pkg.nationality || "N/A",
    
    // <--- CHANGED: Map correct date fields
    effectiveDate: pkg.effectiveDate || new Date().toISOString(),
    lastValidDate: pkg.lastValidDate || new Date().toISOString(),
    
    createdDate: pkg.createdDate || pkg.dateCreated || new Date().toISOString(),
    status: pkg.status || "Draft",
    imageID: pkg.imageUrl || "/packages/DefaultPackageImage.png",
    
    // <--- CHANGED: Prefer API validDays if available
    durationDays: pkg.validDays ?? calculatedDuration, 
    
    createdBy: pkg.submittedBy || "System", 
    packageitems: pkg.items || [], 
    tpremark: pkg.remark || ""
  };
};

export const packageService = {
  uploadImage: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await apiClient.post<{ imageId: string }>(ENDPOINTS.UPLOAD, formData, getHeaders());
    if (!response.success || !response.data?.imageId) throw new Error(response.error || "Image upload failed");
    return response.data.imageId;
  },

  createPackage: async (form: PackageFormData, imageId: string) => {
    // Ensure your create payload uses the fields the backend expects
    const payload = {
      name: form.packageName,
      packageType: form.packageType || "Entry",
      price: form.totalPrice || 0,
      point: 0,
      effectiveDate: form.effectiveDate ? `${form.effectiveDate}T00:00:00` : new Date().toISOString(),
      lastValidDate: form.lastValidDate ? `${form.lastValidDate}T00:00:00` : new Date().toISOString(),
      remark: form.tpremark || "No remarks",
      nationality: form.nationality || "MY",
      ageCategory: form.ageCategory || "A1",
      imageID: imageId,
      items: form.packageitems.map((item) => ({
        itemName: item.itemName,
        itemType: item.itemType || "Entry",
        value: item.price || 0,
        entryQty: item.entryQty || 1,
      })),
    };

    const response = await apiClient.post(ENDPOINTS.CREATE, payload, getHeaders());
    if (!response.success) throw new Error(response.error || "Failed to create package");
    return response.data;
  },

  getPackages: async (status: string, startDate?: string, endDate?: string): Promise<Package[]> => {
    const response = await apiClient.get<BackendPackageDTO[]>(ENDPOINTS.GET_LIST(status, startDate, endDate), getHeaders());
    if (!response.success) {
      console.error("Failed to fetch packages:", response.error);
      return [];
    }
    return (response.data || []).map(transformToFrontend);
  },

  getPackageById: async (id: number, source?: string): Promise<Package | null> => {
    const response = await apiClient.get<BackendPackageDTO>(
      ENDPOINTS.GET_ONE(id, source),
      getHeaders()
    );

    if (!response.success || !response.data) {
      console.error("Failed to fetch package:", response.error);
      return null;
    }

    return transformToFrontend(response.data);
  }
};