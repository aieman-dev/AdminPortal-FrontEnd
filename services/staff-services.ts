// services/staff-services.ts

import { apiClient, ApiResponse } from "@/lib/api-client";
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
  STAFF_LIST: "account/roles/list",
  GET_ME: "Account/me",

  AUDIT_LOG_ALL: "AuditLog/all",
  AUDIT_LOG_USER: "AuditLog/user",
};

// --- HELPER: Safely extract array from new wrapper format ---
const getContent = <T>(data: any): T[] => {
    if (data?.content && Array.isArray(data.content)) return data.content;
    if (data?.data && Array.isArray(data.data)) return data.data; // Legacy fallback
    if (Array.isArray(data)) return data;
    return [];
};

const getDataObject = <T>(data: any): T => {
    return data?.content || data?.data || data || {};
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
        // Join roles array into a single string for display
        roleName: Array.isArray(data.roles) ? data.roles.join(", ") : (data.roles || "User"),
        status: data.status || "Active",
        createdDate: data.createdDate
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

  assignRole: async (accId: number, roles: string, password: string): Promise<{ message: string }> => {
    const payload: AssignRolePayload = { accId, roles, password };
    const response = await apiClient.post<{ message: string }>(ENDPOINTS.ASSIGN_ROLE, payload);
    
    if (!response.success) {
        throw new Error(response.error || "Failed to assign role");
    }
    return response.data!;
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