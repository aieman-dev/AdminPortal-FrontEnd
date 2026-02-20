// config/dashboard.ts
import { 
  ShoppingCart, Clock, Ticket, Users, Monitor, SquareTerminal, Car, Megaphone,
  FerrisWheel, PlusCircle,  Database, RefreshCw, TrendingUp, FileText, 
  Server, LucideIcon, FileClock, User, UserCog, Search, DollarSign ,
  Settings
} from "lucide-react";
import { ROLES } from "@/lib/constants";
import { 
  canViewThemeParkSupport, 
  canViewPackageManagement, 
  canViewCarParkSupport, 
  canViewHRSupport,
  canCreatePackage,
  isFinanceApprover
} from "@/lib/auth";

export type DashboardRole = typeof ROLES[keyof typeof ROLES];

// Define the shape of a Stat Card
export interface DashboardStat {
  id: string;
  label: string;
  icon: LucideIcon;
  color: string;
  trend?: boolean; 
}

//  Define the shape of a Quick Action Button
export interface MasterAction {
  id: string; 
  label: string;
  icon: LucideIcon;
  path: string;
  color: string;
  isVisible: (userDept: string) => boolean; 
}

export type DashboardWidget = 'performance_chart' | 'top_packages' | 'pending_list' | 'system_diagnostics' | 'kiosk_map';

// Define the shape of the Config Object
export interface RoleConfig {
  stats: DashboardStat[];
  widgets: DashboardWidget[];
}


// 2. THE MASTER LIST (Define once, use everywhere)
export const MASTER_ACTIONS: MasterAction[] = [
  // -- MIS ----
  { id: "mis_list", label: "Staff Directory", icon: Users, path: "/portal/staff-management?tab=directory", color: "text-pink-600", isVisible: (dept) => dept === ROLES.MIS_SUPER},
  { id: "mis_audit", label: "Activity Audit", icon: FileClock, path: "/portal/staff-management?tab=audit", color: "text-blue-600", isVisible: (dept) => dept === ROLES.MIS_SUPER},
  { id: "mis_broadcast", label: "Announcements", icon: Megaphone, path: "/portal/setting?tab=system", color: "text-red-600", isVisible: (dept) => dept === ROLES.MIS_SUPER},

  // --- PACKAGE MANAGEMENT ---
  { id: "pkg_create", label: "Create Package", icon: PlusCircle, path: "/portal/packages/form", color: "text-indigo-600", isVisible: (dept) => canCreatePackage(dept)},
  { id: "pkg_manage", label: "Manage Packages", icon: Ticket, path: "/portal/packages", color: "text-blue-500", isVisible: (dept) => canViewPackageManagement(dept)},
  { id: "pkg_approve", label: "Pending Approvals", icon: FileText, path: "/portal/packages?filter=Pending", color: "text-orange-600", isVisible: (dept) => isFinanceApprover(dept)},

  // --- CAR PARK ---
  { id: "cp_reg", label: "New Registration", icon: Car, path: "/portal/car-park/registration", color: "text-blue-600", isVisible: (dept) => canViewCarParkSupport(dept)},
  { id: "cp_season", label: "Season Parking", icon: Ticket, path: "/portal/car-park/season-parking", color: "text-indigo-600", isVisible: (dept) => canViewCarParkSupport(dept)},
  { id: "cp_reports", label: "Reports Center", icon: FileText, path: "/portal/car-park/reports", color: "text-orange-500", isVisible: (dept) => canViewCarParkSupport(dept)},

  // --- THEME PARK SUPPORT (IT) ---
  { id: "it_trx", label: "Transaction Master", icon: DollarSign, path: "/portal/themepark-support/transaction-master", color: "text-purple-600", isVisible: (dept) => canViewThemeParkSupport(dept)},
  { id: "it_term", label: "Attraction Master", icon: FerrisWheel, path: "/portal/themepark-support/attraction-master", color: "text-slate-600", isVisible: (dept) => canViewThemeParkSupport(dept)},
  { id: "it_acc", label: "Account Master", icon: UserCog, path: "/portal/themepark-support/account-master", color: "text-blue-600", isVisible: (dept) => canViewThemeParkSupport(dept)},
  { id: "it_ticket",label:"Ticket Master", icon: Ticket, path: "/portal/themepark-support/ticket-master", color: "text-green-600" , isVisible: (dept) => canViewThemeParkSupport(dept)},

  // --- HR / STAFF ---
  { id: "hr_list", label: "Staff Listing", icon: Users, path: "/portal/hr/staff-listing", color: "text-pink-600", isVisible: (dept) => canViewHRSupport(dept)},
  
  // --- GENERAL (Everyone) ---
  { id: "gen_profile", label: "My Profile", icon: User, path: "/portal/setting", color: "text-slate-500", isVisible: () => true},
  { id: "gen_settings", label: "Settings", icon: Settings, path: "/portal/setting", color: "text-slate-600", isVisible: () => true },
];

export const DASHBOARD_CONFIG: Record<string, RoleConfig> = {
  // --- MIS SUPERADMIN ---
  [ROLES.MIS_SUPER]: {
    stats: [
      { id: "revenue", label: "Total Revenue", icon: ShoppingCart, trend: true, color: "default" },
      { id: "kiosk_status", label: "Kiosk Status", icon: SquareTerminal, color: "dynamic" },
      { id: "pending_pkgs", label: "Pending Packages", icon: Clock, color: "text-yellow-500" },
      { id: "package_sync", label: "Package Sync", icon: RefreshCw, color: "dynamic" },
      { id: "active_terminals", label: "Active Terminals", icon: Monitor, color: "text-blue-600" },
      { id: "system_health", label: "System Status", icon: Database, color: "dynamic" },
    ],
    widgets: ['performance_chart', 'top_packages', 'pending_list', 'system_diagnostics']
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
    widgets: ['performance_chart', 'top_packages', 'pending_list']
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
    widgets: ['performance_chart', 'top_packages', 'pending_list']
  },

  // --- IT ADMIN ---
  // Role: Support & Maintenance Only. No Package Mgmt.
  [ROLES.IT_ADMIN]: {
    stats: [
      { id: "package_sync", label: "Unsynced Items", icon: RefreshCw, color: "dynamic" },
      { id: "active_terminals", label: "Active Terminals", icon: Server, color: "text-blue-600" },
      { id: "kiosk_status", label: "Kiosk Status", icon: SquareTerminal, color: "dynamic" },
      { id: "system_health", label: "System Status", icon: Database, color: "dynamic" },
    ],
    widgets: ['system_diagnostics', 'kiosk_map']
  }
};