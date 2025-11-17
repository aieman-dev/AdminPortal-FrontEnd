// lib/auth.ts

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  department: "MIS" | "IT" | "THEMEPARK" | "FINANCE";
}

export interface AuthResponse {
  success: boolean;
  user?: User;
  token?: string;
  error?: string;
}

// Storage keys
const AUTH_TOKEN_KEY = "auth_token";
const USER_DATA_KEY = "user_data";

// Helper to clean up department names from API
// API returns "FINANCE_ADMIN" -> we convert to "FINANCE"
function normalizeDepartment(rawDept: string): "MIS" | "IT" | "THEMEPARK" | "FINANCE" {
  const d = rawDept?.toUpperCase() || "";
  if (d.includes("FINANCE")) return "FINANCE";
  if (d.includes("MIS")) return "MIS";
  if (d.includes("IT")) return "IT";
  if (d.includes("THEME") || d.includes("TP")) return "THEMEPARK";
  return "MIS"; // Default fallback
}

// Real API Login Function
export async function login(email: string, password: string): Promise<AuthResponse> {
  try {
    // STEP 1: Login to get the Token
    const loginResponse = await fetch("/api/proxy-login", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const loginData = await loginResponse.json();

    if (!loginResponse.ok) {
      let errorMessage = loginData.message || "Login failed";
      if (errorMessage.includes("User not found") || errorMessage.includes("IsStaff")) {
        errorMessage = "Invalid email or password, or account is not active.";
      }
      return { success: false, error: errorMessage };
    }

    const token = loginData.token;
    

    // STEP 2: Get User Details using the Token
    const meResponse = await fetch("/api/proxy-me", {
      method: "GET",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
    });

    const meData = await meResponse.json();

    if (!meResponse.ok) {
      return { success: false, error: "Login successful, but failed to load user profile." };
    }
    
    // Map the API data to your User object
    const user: User = {
      id: meData.id || "1", 
      email: meData.email || email,
      name: meData.name || "User",
      role: "User", // 'me' endpoint didn't show a role, default to User
      department: normalizeDepartment(meData.department) // Handle "FINANCE_ADMIN" -> "FINANCE"
    };

    
    // STEP 3: Save Session
    if (typeof window !== "undefined") {
      localStorage.setItem(AUTH_TOKEN_KEY, token);
      localStorage.setItem(USER_DATA_KEY, JSON.stringify(user));
      // Optional: Set a cookie for middleware if you have any
      document.cookie = `token=${token}; path=/; secure; samesite=strict`;
    }

    return {
      success: true,
      user,
      token,
    };

  } catch (error) {
    console.error("Login Error:", error);
    return {
      success: false,
      error: "Network error or server unreachable",
    };
  }
}

// Logout function - Clear local storage
export function logout(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(USER_DATA_KEY);
    // Optional: clear cookies
    document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
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
  return !!localStorage.getItem(AUTH_TOKEN_KEY);
}

// Get auth token for API requests
export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

// --- PERMISSION HELPERS ---

export function canCreatePackage(department?: string): boolean {
  const dept = department || getCurrentUser()?.department;
  // Only THEMEPARK and MIS can create packages
  return dept === "THEMEPARK" || dept === "MIS";
}

export function canViewITPOSWF(department?: string): boolean {
  const dept = department || getCurrentUser()?.department;
  // Only IT and MIS can see IT POSWF
  return dept === "IT" || dept === "MIS";
}