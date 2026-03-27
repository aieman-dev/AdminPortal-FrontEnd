import { cookies } from "next/headers";
import { BACKEND_ROLE_MAP } from "@/lib/constants";
import { decodeJwt } from "jose";
import { logger } from "@/lib/logger"

// Helper: Decode JWT string (Pure function, safe for anywhere)
export function decodeUserRole(token: string | undefined): string {
  if (!token) return "User";
  
  try {
    const payload = decodeJwt(token);
    
    // Extract Role (Backend Specific Key)
    const rawRole = (payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] as string)
                    || (payload.role as string) 
                    || "User";

    // Map to Frontend Role (e.g., ITTP_Support -> IT_ADMIN)
    return BACKEND_ROLE_MAP[rawRole] || "Staff";
  } catch (e) {
    logger.error("Token decode error:", { error: e });
    return "User";
  }
}

// Helper: Get Role directly from Server Cookies
export async function getServerUserRole() {
  const cookieStore = await cookies();
  const token = cookieStore.get("accessToken")?.value;
  return decodeUserRole(token);
}