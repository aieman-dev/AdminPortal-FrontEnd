import { LucideIcon } from "lucide-react";

// 1. The "Master List" of all possible actions in your system
// Add to this list whenever you build a new feature.
export type ActionType = 
  // Auth
  | "AUTH_LOGIN"
  | "AUTH_LOGOUT"
  | "AUTH_PASSWORD_CHANGE"
  
  // Package Management
  | "PKG_CREATE"
  | "PKG_UPDATE"
  | "PKG_APPROVE"
  | "PKG_REJECT"
  
  // Transaction Master
  | "TRX_VOID"
  | "TRX_RESYNC"
  | "TRX_CONSUME"
  
  // Ticket Master
  | "TICKET_DEACTIVATE"
  | "TICKET_EXTEND"
  
  // Staff
  | "STAFF_CREATE"
  | "STAFF_ROLE_UPDATE";

// 2. The Config Object Structure (What the UI needs to render)
export interface ActivityConfig {
  icon: LucideIcon;
  color: string; // Text color class (e.g., "text-red-600")
  bg: string;    // Background color class (e.g., "bg-red-100")
  label: string; // Default human-readable label
}

// 3. The Data Structure (What your API/Mock data looks like)
export interface UserActivity {
  type: ActionType | string; // Allow string fallback for safety
  description: string;
  timestamp: string;
}