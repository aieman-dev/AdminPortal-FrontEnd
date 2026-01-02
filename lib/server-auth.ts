import { cookies } from "next/headers";
import { BACKEND_ROLE_MAP } from "@/lib/constants";

// Helper: Decode JWT string (Pure function, safe for anywhere)
export function decodeUserRole(token: string | undefined): string {
  if (!token) return "User";
  
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    
    const payload = JSON.parse(jsonPayload);

    // Extract Role (Backend Specific Key)
    const rawRole = payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] 
                    || payload.role 
                    || "User";

    // Map to Frontend Role (e.g., ITTP_Support -> IT_ADMIN)
    return BACKEND_ROLE_MAP[rawRole] || "Staff";
  } catch (e) {
    console.error("Token decode error:", e);
    return "User";
  }
}

// Helper: Get Role directly from Server Cookies
export async function getServerUserRole() {
  const cookieStore = await cookies();
  const token = cookieStore.get("accessToken")?.value;
  return decodeUserRole(token);
}