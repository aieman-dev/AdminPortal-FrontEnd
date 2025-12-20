// lib/constants.ts

export const APP_NAME = "Theme Park Portal"
export const APP_VERSION = "1.0.0"

// API Configuration
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "/api"
export const API_TIMEOUT = 30000 // 30 seconds

// Authentication
export const AUTH_TOKEN_KEY = "auth_token"
export const USER_DATA_KEY = "user_data"
export const SESSION_TIMEOUT = 24 * 60 * 60 * 1000 // 24 hours

// Pagination
export const DEFAULT_PAGE_SIZE = 30
export const MAX_PAGE_SIZE = 100

// File Upload
export const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
export const ALLOWED_FILE_TYPES = ["image/jpeg", "image/png", "image/gif", "application/pdf"]

// --- BUSINESS LOGIC CONSTANTS ---

// Staff Roles (Used in StaffAccountModal)
export const STAFF_ROLES = [
  { label: "IT Admin", value: "IT" },
  { label: "MIS Superadmin", value: "MIS" },
  { label: "Finance", value: "Finance" },
  { label: "Theme Park / Operations", value: "TP" }
] as const;

// Nationality Codes (Used in PackageForm & Details)
export const NATIONALITY_OPTIONS = [
  { label: "Malaysian", value: "L" },
  { label: "International", value: "F" },
  { label: "All", value: "All" }
] as const;

export const getNationalityLabel = (code: string | undefined) => {
  if (!code || code === "N/A") return "All";
  const found = NATIONALITY_OPTIONS.find(n => n.value === code);
  return found ? found.label : code;
};