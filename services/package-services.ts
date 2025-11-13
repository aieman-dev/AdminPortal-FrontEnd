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
    return url;
  },
  GET_ONE: (id: string | number) => `/proxy-packageView/${id}`, 
};

const TEST_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJUUEBlbWFpbC5jb20iLCJ1c2VySWQiOiIzIiwibmFtZSI6IlRQVGVzdCIsImRlcGFydG1lbnQiOiJUUF9BRE1JTiIsImp0aSI6ImE2YjQyYTgxLTFiYTAtNDQ3MS1iZWFmLTIyZWU2NTRmOTgzNiIsImV4cCI6MTc2MzAwNDczMywiaXNzIjoiaHR0cHM6Ly9sb2NhbGhvc3Q6NzAyOSIsImF1ZCI6Imh0dHA6Ly9sb2NhbGhvc3Q6NTE3MyJ9.Xv6y4QB0xxdIT1zMKSXXnZM60uOTYfsPnOqoTm__yek";

const getHeaders = () => ({
  Authorization: `Bearer ${TEST_TOKEN}`
});

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
  startDate?: string;
  endDate?: string;
}

//  
const transformToFrontend = (pkg: BackendPackageDTO): Package => {
  const start = new Date(pkg.startDate || new Date());
  const end = new Date(pkg.endDate || new Date());
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const duration = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

  return {
    id: pkg.id,
    PackageName: pkg.name || "Untitled Package", 
    PackageType: pkg.packageType || "N/A",
    totalPrice: pkg.price || 0,
    ageCategory: pkg.category || "N/A",
    nationality: pkg.nationality || "N/A",
    effectiveDate: pkg.startDate || new Date().toISOString(),
    lastValidDate: pkg.endDate || new Date().toISOString(),
    createdDate: pkg.dateCreated || new Date().toISOString(),
    status: pkg.status || "Draft",
    imageID: pkg.imageUrl || "/packages/DefaultPackageImage.png",
    durationDays: duration || 0,
    createdBy: "System", 
    packageitems: [], 
    tpremark: ""
  };
};

export const packageService = {
  uploadImage: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await apiClient.post<{ imageId: string }>(
      ENDPOINTS.UPLOAD, 
      formData, 
      getHeaders() 
    );

    if (!response.success || !response.data?.imageId) {
      throw new Error(response.error || "Image upload failed");
    }

    return response.data.imageId;
  },

  createPackage: async (form: PackageFormData, imageId: string) => {
    const payload = {
      name: form.packageName || "Untitled Package",
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

    const response = await apiClient.post(
      ENDPOINTS.CREATE, 
      payload, 
      getHeaders()
    );

    if (!response.success) {
      throw new Error(response.error || "Failed to create package");
    }

    return response.data;
  },

  getPackages: async (status: string, startDate?: string, endDate?: string): Promise<Package[]> => {
    const response = await apiClient.get<BackendPackageDTO[]>(
        ENDPOINTS.GET_LIST(status, startDate, endDate),
        getHeaders()
    );

    if (!response.success) {
      console.error("Failed to fetch packages:", response.error);
      return [];
    }

    return (response.data || []).map(transformToFrontend);
  },

  getPackageById: async (id: number): Promise<Package | null> => {
    const response = await apiClient.get<BackendPackageDTO>(
      ENDPOINTS.GET_ONE(id),
      getHeaders()
    );

    if (!response.success || !response.data) {
      console.error("Failed to fetch package:", response.error);
      return null;
    }

    return transformToFrontend(response.data);
  }
};