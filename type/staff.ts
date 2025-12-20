// type/staff.ts

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
}

export interface StaffListPayload {
  Query: string;
}

export interface SearchUserPayload {
  query: string;
}