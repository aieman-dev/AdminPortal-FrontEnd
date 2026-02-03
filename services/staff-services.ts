// services/staff-services.ts

import { apiClient, ApiResponse, getContent, getDataObject } from "@/lib/api-client";
import { 
  StaffMember, 
  SearchedUser, 
  BackendStaffDTO, 
  BackendSearchedUserDTO,
  AssignRolePayload,
  StaffListPayload,
  SearchUserPayload,
  AuditLogResponse
} from "@/type/staff";

// ENDPOINTS: Pointing to actual Backend Routes
const ENDPOINTS = {
  SEARCH_USER: "account/roles/search-user",
  ASSIGN_ROLE: "account/roles/assign",
  UPDATE_ROLE: "account/roles/update",
  RESET_PASSWORD: "account/roles/reset-portal-password",
  STAFF_LIST: "account/roles/list",
  GET_ME: "Account/me",

  AUDIT_LOG_ALL: "AuditLog/all",
  AUDIT_LOG_USER: "AuditLog/user",
};


// MAPPERS: Normalize Data here
const mapToStaff = (raw: BackendStaffDTO): StaffMember => ({
  id: String(raw.accID), 
  accId: raw.accID,
  fullName: raw.fullName || "Unknown",
  email: raw.email || "N/A",
  roleName: raw.roleName || "No Role",
  status: raw.recordStatus || "Active",
  createdDate: raw.createdDate,
  expiryDate: raw.expiryDate || "",
  roleId: raw.roleID,
  receiveNotifications : raw.receiveNotifications
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
  getMe: async (): Promise<StaffMember> => {
    const response = await apiClient.get<any>(ENDPOINTS.GET_ME);
    
    if (!response.success || !response.data) {
        throw new Error(response.error || "Failed to load user profile");
    }

    const data = getDataObject<any>(response.data);

    // Map Account/me response to StaffMember interface
    return {
        id: String(data.userId),
        accId: data.userId,
        fullName: `${data.firstName || ""} ${data.lastName || ""}`.trim(),
        email: data.email,
        roleName: Array.isArray(data.roles) ? data.roles.join(", ") : (data.roles || "User"),
        status: data.status || "Active",
        createdDate: data.createdDate,
        expiryDate : data.expiryDate
    };
  },
  
  searchUsers: async (query: string): Promise<SearchedUser[]> => {
    const payload: SearchUserPayload = { query };
    const response = await apiClient.post<any>(ENDPOINTS.SEARCH_USER, payload);
    
    if (!response.success || !response.data) {
        throw new Error(response.error || "Failed to search users");
    }
    
    const rawList = getContent<BackendSearchedUserDTO>(response.data);
    return rawList.map(mapToSearchedUser);
  },

  assignRole: async (accId: number, roles: string, password: string, expiryDate?: Date | null): Promise<{ message: string }> => {
    const formattedDate = expiryDate ? expiryDate.toISOString() : null;
    const payload: AssignRolePayload = { accId, roles, password, expiryDate: formattedDate };
    const response = await apiClient.post<{ message: string }>(ENDPOINTS.ASSIGN_ROLE, payload);
    
    if (!response.success) {
        throw new Error(response.error || "Failed to assign role");
    }
    return response.data!;
  },

  updateStaffRole: async (payload: { RoleID: number | string, RoleName: string, ExpiryDate: string | null, RecordStatus: string }) => {
      const response = await apiClient.post<{ message: string }>(ENDPOINTS.UPDATE_ROLE, payload);
      
      if (!response.success) {
          throw new Error(response.error || "Failed to update staff role");
      }
      return response.data;
  },

  resetStaffPassword: async (accId: number | string, newPassword: string) => {
      const payload = { AccID: accId, NewPassword: newPassword };
      const response = await apiClient.post<{ message: string }>(ENDPOINTS.RESET_PASSWORD, payload);
      
      if (!response.success) {
          throw new Error(response.error || "Failed to reset password");
      }
      return response.data;
  },

  getStaffList: async (query: string = ""): Promise<StaffMember[]> => {
    const payload: StaffListPayload = { Query: query };
    const response = await apiClient.post<any>(ENDPOINTS.STAFF_LIST, payload);
    
    if (!response.success || !response.data) {
      console.warn("Staff list fetch failed or empty:", response.error);
      return [];
    }
    
    const rawList = getContent<BackendStaffDTO>(response.data);
    return rawList.map(mapToStaff);
  },

  getAllAuditLogs: async (page: number = 1, size: number = 10): Promise<AuditLogResponse | null> => {
    const response = await apiClient.get<any>(`${ENDPOINTS.AUDIT_LOG_ALL}?page=${page}&size=${size}`);
    if (!response.success || !response.data) return null;
    return getDataObject<AuditLogResponse>(response.data);
  },

  getUserAuditLogs: async (userId: string | number, page: number = 1, size: number = 20): Promise<AuditLogResponse | null> => {
    const response = await apiClient.get<any>(`${ENDPOINTS.AUDIT_LOG_USER}/${userId}?page=${page}&size=${size}`);
    if (!response.success || !response.data) return null;
    return getDataObject<AuditLogResponse>(response.data);
  }
};