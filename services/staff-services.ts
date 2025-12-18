import { apiClient } from "@/lib/api-client";

export interface SearchedUser {
  accID: number;
  email: string;
  firstName: string;
  lastName: string;
  mobileNo: string;
  fullName: string;
}

export const staffService = {
  searchUsers: async (query: string) => {
    const response = await apiClient.post<SearchedUser[]>("/proxy-search-user", { query });
    if (!response.success) {
      throw new Error(response.error || "Failed to search users");
    }
    return response.data || [];
  },

  assignRole: async (accId: number, roleName: string) => {
    const response = await apiClient.post<{ message: string }>("/proxy-assign-role", {
      accId,
      roleName,
    });
    if (!response.success) {
      throw new Error(response.error || "Failed to assign role");
    }
    return response.data;
  },
};