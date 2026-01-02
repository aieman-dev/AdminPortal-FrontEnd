// config/dashboard.ts
import { 
  ShoppingCart, Clock, Ticket, Users, Monitor, 
  Settings, PlusCircle, ShieldAlert, ClipboardList, Database, 
  RefreshCw, TrendingUp, Activity, FileText, Server, Wallet,
  LucideIcon, AppWindow,
  CreditCard,
  UserCog,
  Search
} from "lucide-react";
import { ROLES } from "@/lib/constants";

export type DashboardRole = typeof ROLES[keyof typeof ROLES];

// 1. Define the shape of a Stat Card
export interface DashboardStat {
  id: string;
  label: string;
  icon: LucideIcon;
  color: string;
  trend?: boolean; 
}

// 2. Define the shape of a Quick Action Button
export interface DashboardAction {
  label: string;
  icon: LucideIcon;
  path: string;
  color: string;
}

// 3. Define the shape of the Config Object
export interface RoleConfig {
  stats: DashboardStat[];
  quickActions: DashboardAction[];
}

export const DASHBOARD_CONFIG: Record<string, RoleConfig> = {
  // --- MIS SUPERADMIN ---
  [ROLES.MIS_SUPER]: {
    stats: [
      { id: "revenue", label: "Total Revenue", icon: ShoppingCart, trend: true, color: "default" },
      { id: "pending_pkgs", label: "Pending Packages", icon: Clock, color: "text-yellow-500" },
      { id: "package_sync", label: "Package Sync", icon: RefreshCw, color: "dynamic" },
      { id: "active_terminals", label: "Active Terminals", icon: Monitor, color: "text-blue-600" },
      { id: "system_health", label: "System Status", icon: Database, color: "dynamic" },
    ],
    quickActions: [
      { label: "User Mgmt", icon: Users, path: "/portal/staff-management", color: "text-blue-600" },
      { label: "Create Pkg", icon: PlusCircle, path: "/portal/packages/form", color: "text-indigo-600" },
      // Placeholders for future software integration
      { label: "Software A", icon: AppWindow, path: "#", color: "text-slate-400" },
      { label: "Software B", icon: AppWindow, path: "#", color: "text-slate-400" },
    ]
  },

  // --- FINANCE ---
  // Role: View & Approve Only. No Creation. No Operations.
  [ROLES.FINANCE]: {
    stats: [
      { id: "revenue", label: "Total Revenue", icon: ShoppingCart, trend: false, color: "default" },
      { id: "pending_pkgs", label: "Pending Approval", icon: Clock, color: "text-yellow-500" },
      { id: "sales_count", label: "Sales Count", icon: Ticket, color: "default" },
      { id: "avg_trx", label: "Avg. Transaction", icon: TrendingUp, color: "text-emerald-600" },
    ],
    quickActions: [
      // The "Big Button" for their main job
      { label: "Pending Approvals", icon: FileText, path: "/portal/packages?filter=Pending", color: "text-orange-600" },
      { label: "All Packages", icon: Ticket, path: "/portal/packages", color: "text-blue-500" },
    ]
  },

  // --- TP ADMIN (OPERATIONS) ---
  // Role: Create Packages. No Approval.
  [ROLES.TP_ADMIN]: {
    stats: [
      { id: "consumption", label: "Today's Consumption", icon: Users, color: "text-indigo-600" },
      { id: "pending_pkgs", label: "Pending Packages", icon: Clock, color: "text-yellow-500" },
      { id: "sales_count", label: "Tickets Sold", icon: Ticket, color: "default" },
      { id: "drafts", label: "Draft Packages", icon: FileText, color: "text-slate-500" },
    ],
    quickActions: [
      { label: "Create Package", icon: PlusCircle, path: "/portal/packages/form", color: "text-indigo-600" },
      { label: "Manage Packages", icon: Ticket, path: "/portal/packages", color: "text-blue-500" },
    ]
  },

  // --- IT ADMIN ---
  // Role: Support & Maintenance Only. No Package Mgmt.
  [ROLES.IT_ADMIN]: {
    stats: [
      { id: "package_sync", label: "Unsynced Items", icon: RefreshCw, color: "dynamic" },
      { id: "active_terminals", label: "Active Terminals", icon: Server, color: "text-blue-600" },
      { id: "system_load", label: "System Load", icon: Activity, color: "default" },
      { id: "system_health", label: "System Status", icon: Database, color: "dynamic" },
    ],
    quickActions: [
      // Deep links to specific support tabs
      { label: "Transaction Master", icon: Search, path: "/portal/themepark-support/transaction-master", color: "text-purple-600" },
      { label: "Terminal Master", icon: Monitor, path: "/portal/themepark-support/attraction-master", color: "text-slate-600" },
      { label: "Account Master", icon: UserCog, path: "/portal/themepark-support/account-master", color: "text-blue-600" },
      { label: "Ticket Master", icon: Ticket, path: "/portal/themepark-support/ticket-master", color: "text-green-600" },
    ]
  }
};