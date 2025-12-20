// services/staff-services.ts

import { apiClient, ApiResponse } from "@/lib/api-client";
import { 
  StaffMember, 
  SearchedUser, 
  BackendStaffDTO, 
  BackendSearchedUserDTO,
  AssignRolePayload,
  StaffListPayload,
  SearchUserPayload
} from "@/type/staff";

// ENDPOINTS: Pointing to actual Backend Routes
const ENDPOINTS = {
  SEARCH_USER: "account/roles/search-user",
  ASSIGN_ROLE: "account/roles/assign",
  STAFF_LIST: "account/roles/list",
};

// MAPPERS: Normalize Data here
const mapToStaff = (raw: BackendStaffDTO): StaffMember => ({
  id: String(raw.accID), // Ensure unique ID string
  accId: raw.accID,
  fullName: raw.fullName || "Unknown",
  email: raw.email || "N/A",
  roleName: raw.roleName || "No Role",
  status: raw.recordStatus || "Active",
  createdDate: raw.createdDate,
  roleId: raw.roleID,
});

const mapToSearchedUser = (raw: BackendSearchedUserDTO): SearchedUser => ({
  id: String(raw.accID),
  accId: raw.accID,
  email: raw.email,
  firstName: raw.firstName,
  lastName: raw.lastName,
  mobileNo: raw.mobileNo,
  fullName: raw.fullName || `${raw.firstName} ${raw.lastName}`,
});

// SERVICE IMPLEMENTATION
export const staffService = {
  
  searchUsers: async (query: string): Promise<SearchedUser[]> => {
    const payload: SearchUserPayload = { query };
    
    const response = await apiClient.post<BackendSearchedUserDTO[]>(ENDPOINTS.SEARCH_USER, payload);
    
    if (!response.success || !response.data) {
        throw new Error(response.error || "Failed to search users");
    }
    
    return response.data.map(mapToSearchedUser);
  },

  // Assign a role to a user
  assignRole: async (accId: number, roles: string): Promise<{ message: string }> => {
    const payload: AssignRolePayload = { accId, roles };
    
    const response = await apiClient.post<{ message: string }>(ENDPOINTS.ASSIGN_ROLE, payload);
    
    if (!response.success) {
        throw new Error(response.error || "Failed to assign role");
    }
    return response.data!;
  },

  // Get list of existing staff
  getStaffList: async (query: string = ""): Promise<StaffMember[]> => {
    const payload: StaffListPayload = { Query: query };
    
    const response = await apiClient.post<BackendStaffDTO[]>(ENDPOINTS.STAFF_LIST, payload);
    
    if (!response.success || !response.data) {
      console.warn("Staff list fetch failed or empty:", response.error);
      return [];
    }
    
    return response.data.map(mapToStaff);
  }
};