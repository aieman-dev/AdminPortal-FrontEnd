// type/staff.ts
import { ActionType } from "@/type/activity-log";

// --- FRONTEND INTERFACES ---

export interface StaffMember {
  id: string; 
  accId: number;
  fullName: string;
  email: string;
  roleName: string;
  status: string; 
  createdDate: string;
  roleId?: number;
  receiveNotifications?: boolean;
}

export interface ExtendedStaffMember extends StaffMember {
    lastAction?: {
        description: string;
        timestamp: string;
        type: ActionType; 
    }
}

export interface SearchedUser {
  id: string; 
  accId: number;
  email: string;
  firstName: string;
  lastName: string;
  mobileNo: string;
  fullName: string;
}

// --- NEW AUDIT LOG INTERFACES ---

export interface AuditLog {
  id: number;
  actionType: string; 
  module: string;     
  description: string;
  userId: string;
  userName: string;
  timestamp: string;
}

export interface AuditLogResponse {
  pageNumber: number;
  pageSize: number;
  totalRecords: number;
  logs: AuditLog[];
}

// --- BACKEND DTOs (Data Transfer Objects) ---
// Matches the raw JSON from the ASP.NET Backend

export interface BackendStaffDTO {
  accID: number;
  roleName: string;
  recordStatus: string;
  email: string;
  fullName: string;
  createdDate: string;
  roleID?: number;
  receiveNotifications?: boolean;
}

export interface BackendSearchedUserDTO {
  accID: number;
  email: string;
  firstName: string;
  lastName: string;
  mobileNo: string;
  fullName: string;
}

export interface AssignRolePayload {
  accId: number;
  roles: string; 
  password: string;
}

export interface StaffListPayload {
  Query: string;
}

export interface SearchUserPayload {
  query: string;
}