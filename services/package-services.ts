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

const TEST_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJUUEBlbWFpbC5jb20iLCJ1c2VySWQiOiIzIiwibmFtZSI6IlRQVGVzdCIsImRlcGFydG1lbnQiOiJUUF9BRE1JTiIsImp0aSI6Ijg3ZjM0M2IwLTQyODctNDgyMS04MmZkLWU0Y2U4MTRlZWMwMSIsImV4cCI6MTc2MzE4OTYyMiwiaXNzIjoiaHR0cHM6Ly9sb2NhbGhvc3Q6NzAyOSIsImF1ZCI6Imh0dHA6Ly9sb2NhbGhvc3Q6NTE3MyJ9.H5XFgA2nGhYrAlK7Du06R4CKJIsVvk9uErWJ9QPOQBM";

export const getAuthToken = () => `Bearer ${TEST_TOKEN}`;

const getHeaders = () => ({
  Authorization: getAuthToken()
});

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
}

const transformToFrontend = (pkg: BackendPackageDTO): Package => {
  const start = new Date(pkg.effectiveDate || new Date());
  const end = new Date(pkg.lastValidDate || new Date());
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
    PackageName: pkg.name || "Untitled Package", 
    PackageType: pkg.packageType || "N/A",
    totalPrice: pkg.price || 0,
    ageCategory: pkg.category || "N/A",
    nationality: pkg.nationality || "N/A",
    effectiveDate: pkg.effectiveDate || new Date().toISOString(),
    lastValidDate: pkg.lastValidDate || new Date().toISOString(),
    createdDate: pkg.createdDate || pkg.dateCreated || new Date().toISOString(),
    status: pkg.status || "Draft",
    imageID: pkg.imageUrl || "/packages/DefaultPackageImage.png",
    durationDays: pkg.validDays ?? calculatedDuration, 
    createdBy: pkg.submittedBy || "System", 
    packageitems: pkg.items || [], 
    tpremark: pkg.remark || ""
  };
};


export const packageService = {
  uploadImage: async (file: File): Promise<string> => {
    // ... (same as before)
    const formData = new FormData();
    formData.append("file", file);
    const response = await apiClient.post<{ imageId: string }>(ENDPOINTS.UPLOAD, formData, getHeaders());
    if (!response.success || !response.data?.imageId) throw new Error(response.error || "Image upload failed");
    return response.data.imageId;
  },

  createPackage: async (form: PackageFormData, imageId: string) => {
    // + UPDATED: Construct the payload with correct item structure
    const payload = {
      name: form.packageName,
      packageType: form.packageType || "Entry",
      price: form.packageType === "Price" ? (form.totalPrice || 0) : 0,
      point: form.packageType === "Point" ? (form.totalPrice || 0) : 0,
      effectiveDate: form.effectiveDate ? new Date(form.effectiveDate).toISOString() : new Date().toISOString(),
      lastValidDate: form.lastValidDate ? new Date(form.lastValidDate).toISOString() : new Date().toISOString(),
      remark: form.tpremark || "No remarks",
      nationality: form.nationality || "MY",
      ageCategory: form.ageCategory || "A1",
      imageID: imageId,
      
      // + UPDATED: This 'items' mapping is the most likely source of the 400 error.
      items: form.packageitems.map((item) => ({
        attractionId: item.attractionId, // <-- SEND THE ID (from terminalID)
        itemName: item.itemName,         // <-- Send name (just in case)
        itemType: item.itemType || "Entry", // <-- Default type
        // +++ FIX: Send the correct value based on package type +++
        value: form.packageType === "Point" ? (item.point || 0) : (item.price || 0),
        entryQty: item.entryQty || 1,
      })),
    };

    // + ADDED: Debug log. Check your browser console to see exactly what is being sent.
    console.log("🚀 Sending createPackage payload:", JSON.stringify(payload, null, 2));

    const response = await apiClient.post(ENDPOINTS.CREATE, payload, getHeaders());
    
    // The 400 error is caught here
    if (!response.success) {
      // + UPDATED: Log the specific error from the backend
      console.error("❌ Backend Error:", response.error);
      throw new Error(response.error || "Failed to create package");
    }
    return response.data;
  },

  getPackages: async (status: string, startDate?: string, endDate?: string): Promise<Package[]> => {
    // ... (same as before)
    const response = await apiClient.get<BackendPackageDTO[]>(ENDPOINTS.GET_LIST(status, startDate, endDate), getHeaders());
    if (!response.success) {
      console.error("Failed to fetch packages:", response.error);
      return [];
    }
    return (response.data || []).map(transformToFrontend);
  },

  getPackageById: async (id: number, source?: string): Promise<Package | null> => {
    // ... (same as before)
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