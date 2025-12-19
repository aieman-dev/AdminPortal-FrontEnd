import { apiClient } from "@/lib/api-client";

export interface SearchedUser {
  accID: number;
  email: string;
  firstName: string;
  lastName: string;
  mobileNo: string;
  fullName: string;
}

// Interface matching the response in image_aef2ab.jpg
export interface StaffMember {
  accID: number;
  roleName: string;
  recordStatus: string;
  email: string;
  fullName: string;
  createdDate: string;
  roleID?: number; // Optional based on JSON
}

export const staffService = {
  // Existing Search (for Modal)
  searchUsers: async (query: string) => {
    // FIX: Ensure no double /api prefix
    const response = await apiClient.post<SearchedUser[]>("/proxy-search-user", { query });
    if (!response.success) throw new Error(response.error || "Failed to search users");
    return response.data || [];
  },

  // Existing Assign (for Modal)
  assignRole: async (accId: number, roles: string) => {
    const response = await apiClient.post<{ message: string }>("/proxy-assign-role", {
      accId,
      roles,
    });
    if (!response.success) throw new Error(response.error || "Failed to assign role");
    return response.data;
  },

  // --- NEW: Get Staff List ---
  getStaffList: async (query: string = "") => {
    const payload = { Query: query };
    
    const response = await apiClient.post<StaffMember[]>("/proxy-staff-list", payload);
    
    if (!response.success) {
      throw new Error(response.error || "Failed to fetch staff list");
    }
    return response.data || [];
  }
};