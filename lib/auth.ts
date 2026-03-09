// lib/auth.ts
import { ROLES } from "./constants";
import { DashboardRole } from "@/config/dashboard";
import { logger } from "@/lib/logger";

export type Department = typeof ROLES[keyof typeof ROLES];

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  department: Department;
}

export interface AuthResponse {
  success: boolean;
  user?: User;
  token?: string;
  error?: string;
}

// Storage keys
const USER_DATA_KEY = "user_data";

// Real API Login Function
export async function login(email: string, password: string, rememberMe: boolean = false): Promise<AuthResponse> {
  try {
    const response = await fetch("/api/proxy-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, rememberMe }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      return { success: false, error: data.message || "Login failed" };
    }

    const user = data.user;

    // Save session data for UI (Token is handled by HttpOnly cookies now)
    if (typeof window !== "undefined") {
      localStorage.setItem(USER_DATA_KEY, JSON.stringify(user));
    }

    return { success: true, user };

  } catch (error) {
    logger.error("Client login request failed", { error })
    return { success: false, error: "Network error or server unreachable" };
  }
}

// Logout function - Clear local storage
export async function logout(): Promise<void> {
  if (typeof window !== "undefined") {
    localStorage.removeItem(USER_DATA_KEY);
    
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (e) {
      logger.error("Logout cleanup failed", { error: e });
    }
    
    window.location.href = "/login";
  }
}

// Get current authenticated user from storage
export function getCurrentUser(): User | null {
  if (typeof window === "undefined") return null;
  const userData = localStorage.getItem(USER_DATA_KEY);
  if (!userData) return null;
  try {
    return JSON.parse(userData) as User;
  } catch {
    return null;
  }
}

// Check if user is authenticated
export function isAuthenticated(): boolean {
  if (typeof window === "undefined") return false;
  return !!localStorage.getItem(USER_DATA_KEY);
}


// -- Role Mapper Helper ---
export function getDashboardRole(department: string | undefined): DashboardRole | undefined {
    if (!department) return undefined;

    const deptUpper = department.toUpperCase();

    // Map your departments to the Dashboard Roles
    if (deptUpper.includes("MIS")) return ROLES.MIS_SUPER;
    if (deptUpper.includes("FINANCE")) return ROLES.FINANCE;
    if (deptUpper.includes("IT")) return ROLES.IT_ADMIN;
    if (deptUpper.includes("TP")|| deptUpper.includes("THEME")) return ROLES.TP_ADMIN;
    if (deptUpper.includes("HR")) return ROLES.HR_Admin;
    if (deptUpper.includes("CP")|| deptUpper.includes("CAR")) return ROLES.CP_Admin;
    
    return undefined;
}

// --- PERMISSION HELPERS ---
// Since the API doesn't send "canViewPackages: true", we define the rules here.

export function canViewPackageManagement(department?: string): boolean {
  if (!department) return false;
  const allowed = [ROLES.MIS_SUPER, ROLES.TP_ADMIN, ROLES.FINANCE];
  return allowed.includes(department as any);
}

export function canViewThemeParkSupport(department?: string): boolean {
  if (!department) return false;
  const deptUpper = department.toUpperCase();
  return deptUpper.includes("MIS") || deptUpper.includes("IT");
}

export function canViewCarParkSupport(department?: string): boolean {
  if (!department) return false;
  return department === ROLES.MIS_SUPER || department === ROLES.CP_Admin;
}

export function canViewHRSupport(department?: string): boolean {
  if (!department) return false;
  return department === ROLES.MIS_SUPER || department === ROLES.HR_Admin;
}

export function canCreatePackage(department?: string): boolean {
  if (!department) return false;
  const allowed = [ROLES.MIS_SUPER, ROLES.TP_ADMIN];
  return allowed.includes(department as any);
}

export function canDraftPackage(department?: string): boolean {
  if (!department) return false;
  const allowed = [ROLES.MIS_SUPER, ROLES.TP_ADMIN];
  return allowed.includes(department as any);
}

export function isFinanceApprover(department?: string): boolean {
  return department === ROLES.FINANCE;
}