import { apiClient } from "./api-client";
import { PackageFormData } from "@/type/packages";

export const api = {
  //  Package Related Endpoints
  packages: {
    create: (data: PackageFormData) => {
      // You can do data transformation here if needed
      return apiClient.post('/proxy-create-package', data);
    },
    
    uploadImage: (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      // apiClient automatically handles FormData headers now!
      return apiClient.post<{ imageId: string }>('/proxy-upload', formData);
    },

    getAll: () => apiClient.get('/packages'),
    getById: (id: string) => apiClient.get(`/packages/${id}`),
  },

  //  Auth Related Endpoints (Example)
  auth: {
    login: (credentials: any) => apiClient.post('/auth/login', credentials),
    logout: () => apiClient.post('/auth/logout', {}),
  },

  //  Ticket Related Endpoints (Example)
  tickets: {
    void: (id: string) => apiClient.post(`/tickets/${id}/void`, {}),
  }
};