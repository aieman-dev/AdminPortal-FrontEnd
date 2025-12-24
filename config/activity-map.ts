import { 
  LogIn, LogOut, Shield, 
  FileText, CheckCircle2, XCircle, 
  RefreshCw, Wallet, Ticket, Calendar,
  UserPlus, UserCog, Activity, AlertCircle
} from "lucide-react";
import { ActivityConfig, ActionType } from "@/type/activity-log";

// The Dictionary: Maps "Code" -> "UI Look"
export const ACTIVITY_MAP: Record<string, ActivityConfig> = {
  
  // --- AUTHENTICATION ---
  AUTH_LOGIN: {
    icon: LogIn,
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-100 dark:bg-blue-900/30",
    label: "System Login"
  },
  AUTH_PASSWORD_CHANGE: {
    icon: Shield,
    color: "text-purple-600 dark:text-purple-400",
    bg: "bg-purple-100 dark:bg-purple-900/30",
    label: "Security Update"
  },

  // --- PACKAGES ---
  PKG_CREATE: {
    icon: FileText,
    color: "text-indigo-600 dark:text-indigo-400",
    bg: "bg-indigo-100 dark:bg-indigo-900/30",
    label: "Created Package"
  },
  PKG_APPROVE: {
    icon: CheckCircle2,
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-100 dark:bg-emerald-900/30",
    label: "Approved Package"
  },
  PKG_REJECT: {
    icon: XCircle,
    color: "text-red-600 dark:text-red-400",
    bg: "bg-red-100 dark:bg-red-900/30",
    label: "Rejected Package"
  },

  // --- TRANSACTIONS ---
  TRX_VOID: {
    icon: XCircle,
    color: "text-red-600 dark:text-red-400",
    bg: "bg-red-100 dark:bg-red-900/30",
    label: "Voided Transaction"
  },
  TRX_RESYNC: {
    icon: RefreshCw,
    color: "text-cyan-600 dark:text-cyan-400",
    bg: "bg-cyan-100 dark:bg-cyan-900/30",
    label: "Resynced Data"
  },
  TRX_CONSUME: {
    icon: Wallet,
    color: "text-green-600 dark:text-green-400",
    bg: "bg-green-100 dark:bg-green-900/30",
    label: "Manual Consume"
  },

  // --- TICKETS ---
  TICKET_DEACTIVATE: {
    icon: Ticket,
    color: "text-rose-600 dark:text-rose-400",
    bg: "bg-rose-100 dark:bg-rose-900/30",
    label: "Deactivated Ticket"
  },
  TICKET_EXTEND: {
    icon: Calendar,
    color: "text-orange-600 dark:text-orange-400",
    bg: "bg-orange-100 dark:bg-orange-900/30",
    label: "Extended Expiry"
  },

  // --- STAFF ---
  STAFF_CREATE: {
    icon: UserPlus,
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-100 dark:bg-blue-900/30",
    label: "Created User"
  },
  STAFF_ROLE_UPDATE: {
    icon: UserCog,
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-100 dark:bg-amber-900/30",
    label: "Updated Role"
  }
};

// Fallback for unknown/new types that haven't been mapped yet
export const DEFAULT_ACTIVITY: ActivityConfig = {
  icon: Activity,
  color: "text-gray-500",
  bg: "bg-gray-100 dark:bg-gray-800",
  label: "System Activity"
};