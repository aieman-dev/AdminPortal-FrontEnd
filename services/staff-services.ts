// services/staff-services.ts

import { logger } from "@/lib/logger";
import { apiClient, ApiResponse, getContent, getDataObject } from "@/lib/api-client";
import { StaffMemberSchema, SearchedUserSchema } from "@/lib/schemas/staff";
import { 
  StaffMember, 
  SearchedUser, 
  BackendStaffDTO, 
  BackendSearchedUserDTO,
  AssignRolePayload,
  StaffListPayload,
  SearchUserPayload,
  AuditLogResponse,
  AuditLogListPayload,
  GetMeResponse,
  GenericMessageResponse,
  UpdateRolePayload,
  ResetPasswordPayload,
  
} from "@/type/staff";
import { get } from "lodash";

// ENDPOINTS: Pointing to actual Backend Routes
const ENDPOINTS = {
  SEARCH_USER: "account/roles/search-user",
  ASSIGN_ROLE: "account/roles/assign",
  UPDATE_ROLE: "account/roles/update",
  RESET_PASSWORD: "account/roles/reset-portal-password",
  STAFF_LIST: "account/roles/list",
  GET_ME: "Account/me",

  AUDIT_LOG_LIST: "AuditLog/list",
  AUDIT_LOG_USER: "AuditLog/user",
  AUDIT_MODULES: "AuditLog/modules"
};


// MAPPERS: Normalize Data here
const mapToStaff = (raw: unknown): StaffMember => {
  const result = StaffMemberSchema.safeParse(raw);
  if (!result.success) {
    logger.warn("Zod Mapping Mismatch", { type: "StaffMember", error: result.error });
    return {
      id: "ERR",
      accId: 0,
      fullName: "Data Error",
      email: "Error",
      roleName: "Error",
      status: "Error",
      createdDate: "",
      expiryDate: ""
    };
  }
  return result.data;
};

const mapToSearchedUser = (raw: unknown): SearchedUser => {
  const result = SearchedUserSchema.safeParse(raw);
  if (!result.success) {
    logger.warn("Zod Mapping Mismatch", { type: "SearchedUser", error: result.error });
    return {
      id: "0",
      accId: 0,
      email: "Error",
      firstName: "",
      lastName: "",
      mobileNo: "",
      fullName: "Invalid Data"
    };
  }
  return result.data;
};

// SERVICE IMPLEMENTATION
export const staffService = {
  getMe: async (): Promise<StaffMember> => {
    const response = await apiClient.get<{ content: GetMeResponse }>(ENDPOINTS.GET_ME);
    
    if (!response.success || !response.data) {
        throw new Error(response.error || "Failed to load user profile");
    }

    const data = getDataObject<GetMeResponse>(response.data);

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
    const response = await apiClient.post<{ content: BackendSearchedUserDTO[] }>(ENDPOINTS.SEARCH_USER, payload);
    
    if (!response.success || !response.data) {
        throw new Error(response.error || "Failed to search users");
    }
    
    const rawList = getContent<BackendSearchedUserDTO>(response.data);
    return rawList.map(mapToSearchedUser);
  },

  assignRole: async (accId: number, roles: string, password: string, expiryDate?: Date | null): Promise<GenericMessageResponse> => {
    const formattedDate = expiryDate ? expiryDate.toISOString() : "";
    const payload: AssignRolePayload = { accId, roles, password, expiryDate: formattedDate };
    const response = await apiClient.post<{ content: GenericMessageResponse }>(ENDPOINTS.ASSIGN_ROLE, payload);
    
    if (!response.success) {
        throw new Error(response.error || "Failed to assign role");
    }
    return getDataObject<GenericMessageResponse>(response.data);
  },

  updateStaffRole: async (payload: UpdateRolePayload): Promise<GenericMessageResponse> => {
      const response = await apiClient.post<{ content: GenericMessageResponse }>(ENDPOINTS.UPDATE_ROLE, payload);
      
      if (!response.success) {
          throw new Error(response.error || "Failed to update staff role");
      }
      return getDataObject<GenericMessageResponse>(response.data);
  },

  resetStaffPassword: async (payload: ResetPasswordPayload) : Promise<GenericMessageResponse> => {
      const response = await apiClient.post<{ content: GenericMessageResponse }>(ENDPOINTS.RESET_PASSWORD, payload);
      
      if (!response.success) {
          throw new Error(response.error || "Failed to reset password");
      }
      return getDataObject<GenericMessageResponse>(response.data);
  },

  getStaffList: async (query: string = ""): Promise<StaffMember[]> => {
    const payload: StaffListPayload = { Query: query };
    const response = await apiClient.post<{ content: BackendStaffDTO[] }>(ENDPOINTS.STAFF_LIST, payload);
    
    if (!response.success || !response.data) {
      logger.warn("Staff list fetch returned empty/failed", { error: response.error })
      throw new Error(response.error || "Failed to fetch staff list.");
    }
    
    const rawList = getDataObject<BackendStaffDTO[]>(response.data);
    return rawList.map(mapToStaff);
  },

  getAllAuditLogs: async (payload: AuditLogListPayload): Promise<AuditLogResponse | null> => {
    const response = await apiClient.post<{ content: AuditLogResponse }>(ENDPOINTS.AUDIT_LOG_LIST, payload);
    if (!response.success || !response.data) {
      throw new Error(response.error || "Failed to fetch audit logs.");
    }

    const content = getDataObject<AuditLogResponse>(response.data);
    const totalRecords = content.totalRecords || 0;
    const pageSize = content.pageSize || payload.pageSize;
    const totalPages = Math.ceil(totalRecords / pageSize);

    return {
        pageNumber: content.pageNumber,
        pageSize: content.pageSize,
        totalRecords: totalRecords,
        totalPages: totalPages, 
        logs: content.logs || []
    };
  },

  getUserAuditLogs: async (userId: string | number, page: number = 1, size: number = 20): Promise<AuditLogResponse | null> => {
    const response = await apiClient.get<{ content: AuditLogResponse }>(`${ENDPOINTS.AUDIT_LOG_USER}/${userId}?page=${page}&size=${size}`);
    if (!response.success || !response.data) {
      throw new Error(response.error || "Failed to fetch user audit logs.");
    }
    return getDataObject<AuditLogResponse>(response.data);
  },

  getAuditModules: async (): Promise<string[]> => {
    try {
      const response = await apiClient.get<{ content: string[] }>(ENDPOINTS.AUDIT_MODULES);
      if (!response.success || !response.data) {
        throw new Error(response.error || "Failed to fetch audit modules.");
      }
      return getDataObject<string[]>(response.data);

    } catch (error) {
      logger.error("Failed to fetch audit modules", { error });
      return [];
    }
  }
};