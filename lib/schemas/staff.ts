import { z } from "zod";

// Helper for ID (string or number -> string)
const stringOrNumber = z.union([z.string(), z.number()]).optional();

// --- 1. Staff Member Schema ---
export const StaffMemberSchema = z.object({
  // IDs
  accID: stringOrNumber,
  AccID: stringOrNumber,
  accId: stringOrNumber,

  roleID: stringOrNumber,
  RoleID: stringOrNumber,

  // Strings
  fullName: z.string().nullable().optional(),
  FullName: z.string().nullable().optional(),
  
  email: z.string().nullable().optional(),
  Email: z.string().nullable().optional(),
  
  roleName: z.string().nullable().optional(),
  RoleName: z.string().nullable().optional(),
  
  recordStatus: z.string().nullable().optional(),
  RecordStatus: z.string().nullable().optional(),
  status: z.string().nullable().optional(),
  
  createdDate: z.string().nullable().optional(),
  CreatedDate: z.string().nullable().optional(),
  
  expiryDate: z.string().nullable().optional(),
  ExpiryDate: z.string().nullable().optional(),

  receiveNotifications: z.boolean().optional(),
}).transform((raw) => {
  return {
    id: String(raw.accID ?? raw.AccID ?? raw.accId ?? "0"),
    accId: Number(raw.accID ?? raw.AccID ?? raw.accId ?? 0),
    fullName: (raw.fullName ?? raw.FullName ?? "Unknown").trim(),
    email: (raw.email ?? raw.Email ?? "N/A") || "N/A",
    roleName: (raw.roleName ?? raw.RoleName ?? "No Role") || "No Role",
    status: (raw.recordStatus ?? raw.RecordStatus ?? raw.status ?? "Active"),
    createdDate: (raw.createdDate ?? raw.CreatedDate ?? new Date().toISOString()),
    expiryDate: (raw.expiryDate ?? raw.ExpiryDate ?? ""),
    roleId: Number(raw.roleID ?? raw.RoleID ?? 0),
    receiveNotifications: raw.receiveNotifications ?? true
  };
});

// --- 2. Searched User Schema ---
export const SearchedUserSchema = z.object({
  accID: stringOrNumber,
  AccID: stringOrNumber,
  
  email: z.string().nullable().optional(),
  Email: z.string().nullable().optional(),
  
  firstName: z.string().nullable().optional(),
  FirstName: z.string().nullable().optional(),
  
  lastName: z.string().nullable().optional(),
  LastName: z.string().nullable().optional(),
  
  fullName: z.string().nullable().optional(),
  FullName: z.string().nullable().optional(),

  mobileNo: z.string().nullable().optional(),
  MobileNo: z.string().nullable().optional(),
}).transform((raw) => {
  const fName = raw.firstName ?? raw.FirstName ?? "";
  const lName = raw.lastName ?? raw.LastName ?? "";
  const directName = raw.fullName ?? raw.FullName;

  return {
    id: String(raw.accID ?? raw.AccID ?? "0"),
    accId: Number(raw.accID ?? raw.AccID ?? 0),
    email: (raw.email ?? raw.Email ?? "N/A") || "N/A",
    firstName: fName,
    lastName: lName,
    mobileNo: (raw.mobileNo ?? raw.MobileNo ?? "N/A") || "N/A",
    fullName: (directName || `${fName} ${lName}`).trim() || "Unknown User",
  };
});