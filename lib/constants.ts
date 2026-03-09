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

// System Terminal ID
export const SYSTEM_TERMINAL_ID = 383;

// --- BUSINESS LOGIC CONSTANTS ---

// 1. The Single Source of Truth for Frontend Logic
export const ROLES = {
  MIS_SUPER: "MIS_SUPERADMIN",
  IT_ADMIN: "IT_ADMIN",
  TP_ADMIN: "TP_ADMIN",
  FINANCE: "FINANCE",
  HR_Admin:"HR_Admin",
  CP_Admin :"CP_Admin"
} as const;

// 2. Map Backend Strings -> Frontend Roles
export const BACKEND_ROLE_MAP: Record<string, string> = {
  "ITTP_Support": ROLES.IT_ADMIN, 
  "SuperAdmin": ROLES.MIS_SUPER,
  "TP_Admin": ROLES.TP_ADMIN,
  "Finance": ROLES.FINANCE,
  "HR_Admin":ROLES.HR_Admin,
  "CP_Admin":ROLES.CP_Admin
};

// 3. UI Dropdown 
export const STAFF_ROLES = [
  { label: "IT Admin", value: "ITTP_Support" },
  { label: "MIS Superadmin", value: "SuperAdmin" },
  { label: "Finance", value: "Finance" },
  { label: "Theme Park", value: "TP_Admin" }, 
  { label: "Car Park", value: "CP_Admin" },
  { label: "Human Resources", value: "HR_Admin" }  
] as const;

export const PACKAGE_TYPE_LABELS: Record<string, string> = {
  "Entry": "Entry",
  "Point": "Point",
  "RewardP": "Reward Point"
};

export const getPackageTypeLabel = (code: string | undefined) => {
  if (!code) return "N/A";
  return PACKAGE_TYPE_LABELS[code] || code; 
};

// Nationality Codes
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

export const getDeptColor = (dept: string) => {
    const d = dept.toUpperCase();
    if (d === 'MIS') return "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/30 dark:text-indigo-400 dark:border-indigo-800";
    if (d === 'IT') return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800";
    if (d === 'HR') return "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-800";
    if (d === 'FINANCE' || d === 'FIN') return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800";
    if (d === 'TP' || d === 'OPS') return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800";
    return "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900/30 dark:text-slate-400 dark:border-slate-800";
}

// --- SYSTEM ENUMS & MAGIC STRINGS ---

export const PACKAGE_STATUS = {
  PENDING: "Pending",
  ACTIVE: "Active",
  EXPIRING_SOON: "ExpiringSoon",
  EXPIRED: "Expired",
  REJECTED: "Rejected",
  DRAFT: "Draft",
  ALL: "Show All",
} as const;

export const TIME_FILTER = {
  THIS_WEEK: "ThisWeek",
  NEXT_WEEK: "NextWeek",
} as const;

export const RECORD_STATUS = {
  ACTIVE: "Active",
  INACTIVE: "Inactive",
  SUSPENDED: "Suspended",
  BLOCKED: "Blocked",
} as const;

// --- STATUS COLORS ( Package Filter) ---
export const STATUS_COLORS: Record<string, string> = {
  Pending: "#eab308", // Yellow-500
  Active: "#16a34a",  // Green-600
  Expiring: "#f97316", // Orange-500
  Expired: "#dc2626", // Red-600
  Rejected: "#b91c1c", // Red-700
  Draft: "#4f46e5",   // Indigo-600
  "Show All": "#94a3b8" // Slate-400
};

// --- STATUS COLORS ( status badges) ---
export const STATUS_STYLES: Record<string, string> = {
    // Financial Statuses
    paid: "bg-green-500/10 text-green-600 hover:bg-green-500/20 border-green-200",
    pending: "bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20 border-yellow-200",
    failed: "bg-red-500/10 text-red-600 hover:bg-red-500/20 border-red-200",
    refund: "bg-orange-500/10 text-orange-600 hover:bg-orange-500/20 border-orange-200",
    
    // Transaction Types
    credit: "bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 border-blue-200",
    debit: "bg-gray-500/10 text-gray-600 hover:bg-gray-500/20 border-gray-200",
    purchase: "bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200", 
    consume: "bg-purple-100 text-purple-700 hover:bg-purple-200 border-purple-200", 

    // --- PACKAGE LIFECYCLE (Merged from PackageCard) ---
    active: "bg-emerald-100 text-emerald-700 border-transparent dark:bg-emerald-500/15 dark:text-emerald-400",
    draft: "bg-indigo-100 text-indigo-700 border-transparent dark:bg-indigo-500/15 dark:text-indigo-400",
    rejected: "bg-red-100 text-red-700 border-transparent dark:bg-red-500/15 dark:text-red-400",
    expiring: "bg-orange-100 text-orange-800 border-transparent dark:bg-orange-500/15 dark:text-orange-400",
    
    // Operational Statuses 
    expired: "bg-orange-100 text-orange-700 hover:bg-orange-200 border-orange-200", 
    inactive: "bg-red-100 text-red-700 hover:bg-red-200 border-red-200",
    voided: "bg-gray-100 text-gray-600 hover:bg-gray-200 border-gray-200 decoration-line-through",
    unused: "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300",

    // --- Sync Statuses (NEW) ---
    synced: "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-emerald-200", 
    error: "bg-rose-100 text-rose-700 hover:bg-rose-200 border-rose-200",

    // --- Parking Activity ---
    parked: "bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-900/30 dark:text-sky-300 dark:border-sky-800",
    completed: "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700",
    blocked: "bg-slate-800 text-slate-50 border-slate-800 hover:bg-slate-900 dark:bg-slate-200 dark:text-slate-900 dark:border-slate-200 uppercase tracking-wider font-bold",
  }



export const CONSUME_TYPES = [
  { label: "By Superapp", value: "superapp" },
  { label: "By Receipt", value: "receipt" }
] as const;

export const TICKET_TYPES = [
  { label: "Ticket", value: "ticket" },
  { label: "Credit", value: "credit" },
  { label: "Reward", value: "reward" }
] as const;

export const TICKET_STATUSES = [
  { label: "Active", value: "active" },
  { label: "Unused", value: "unused" }
] as const;

export const TERMINAL_GROUPS = [
  { label: "1 (I-City)", value: "1" },
  { label: "2 (JV Partner)", value: "2" },
  { label: "3 (Photo Booth)", value: "3" }
] as const;

export const TERMINAL_TYPES = [
    { label: "POS", value: "POS" },
    { label: "Kiosk", value: "Kiosk" },
    { label: "Mobile", value: "Mobile" },
    { label: "Web", value: "Web" },
    { label: "Consume", value: "Consume" }
];