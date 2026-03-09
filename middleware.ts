import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { BACKEND_API_BASE } from "@/lib/config";
import { decodeJwt, jwtVerify } from "jose";
import { BACKEND_ROLE_MAP, ROLES } from "@/lib/constants";

// Note: In serverless (Vercel), this resets on cold starts, but still effective for bursts.
const rateLimitMap = new Map();

// ---  Verify and decode the token securely ---
async function getVerifiedPayload(token: string) {
  try {
     const secret = new TextEncoder().encode(process.env.JWT_SECRET || "");
     const { payload } = await jwtVerify(token, secret);
     return payload;
     
    // Fallback: Securely decode without verifying signature (Better than atob)
    //return decodeJwt(token);
  } catch (e) {
    return null; // Treat invalid tokens as expired/failed
  }
}

async function isTokenExpired(token: string) {
  const payload = await getVerifiedPayload(token);
  if (!payload || !payload.exp) return true;
  
  // Check if expiry time is in the past (with 10s buffer)
  return (Math.floor(Date.now() / 1000) >= payload.exp - 10);
}

// --- Extract Role for Edge RBAC ---
async function getUserRole(token: string) {
  const payload = await getVerifiedPayload(token);
  if (!payload) return null;

  // Extract Role using your backend's specific claim keys
  const rawRole = (payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] as string) 
                  || (payload.role as string) 
                  || "User";

  return BACKEND_ROLE_MAP[rawRole] || "Staff";
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // --------------- SECURITY LOGIC (RATE LIMITING) ---------------------------
  if (pathname.startsWith("/api")) {
    const ip = request.headers.get("x-forwarded-for") || "unknown";
    const LIMIT = 100; // Max requests per minute
    const WINDOW_MS = 60 * 1000;
    
    const now = Date.now();
    const windowStart = now - WINDOW_MS;

    const requestLog = rateLimitMap.get(ip) || [];
    
    // Filter out old requests outside the window
    const recentRequests = requestLog.filter((timestamp: number) => timestamp > windowStart);

    if (recentRequests.length >= LIMIT) {
      return new NextResponse(
        JSON.stringify({ success: false, message: "Too many requests. Please try again later." }),
        { status: 429, headers: { "Content-Type": "application/json" } }
      );
    }

    // Record current request
    recentRequests.push(now);
    rateLimitMap.set(ip, recentRequests);
  }

  // --------------- AUTHENTICATION LOGIC (Token Management) ---------------------------
  // Get Tokens from Cookies
  let accessToken = request.cookies.get("accessToken")?.value;
  const refreshToken = request.cookies.get("refreshToken")?.value;

  const isLoginPage = pathname.startsWith("/login");
  const isPortalPage = pathname.startsWith("/portal");

  let response = NextResponse.next();

  // CHECK EXPIRY: If token exists but is expired, treat it as missing
  if (accessToken && await isTokenExpired(accessToken)) {
    console.log("Middleware: Token expired. Clearing variable to trigger refresh.");
    accessToken = undefined; // Force refresh logic below
  }

  // AUTO-REFRESH: If Access Token missing/expired, but Refresh Token exists
  if (isPortalPage && !accessToken && refreshToken) {
    console.log("Middleware: Attempting refresh...")

    try {
      // Call Backend to Refresh
      const refreshResponse = await fetch(`${BACKEND_API_BASE}/api/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });

      const refreshData = await refreshResponse.json();

      if (refreshResponse.ok && refreshData.statusCode === 200) {
        const newAccessToken = refreshData.content.token;
        const newRefreshToken = refreshData.content.refreshToken;
        const newExpiry = new Date(refreshData.content.refreshTokenExpiry);

        const requestHeaders = new Headers(request.headers);
        requestHeaders.set("x-access-token", newAccessToken);

        // Continue the request with the NEW header
        const response = NextResponse.next({
          request: { headers: requestHeaders },
        });

        // Set the NEW cookies
        response.cookies.set("accessToken", newAccessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
          path: "/",
        });

        response.cookies.set("refreshToken", newRefreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
          path: "/",
          expires: newExpiry,
        });

        console.log("Middleware: Token refreshed successfully.");
        accessToken = newAccessToken;
      }
    } catch (error) {
      console.error("Middleware: Refresh failed", error);
      // If refresh fails (e.g., Backend error), fall through to logout logic
    }
  }

  // --------------- ROUTE PROTECTION CHECKS ---------------------------
  // If still no access token (and refresh failed or didn't exist), kick to login
  if (isPortalPage && !accessToken) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // If user is on login page but has access, kick to portal
  if (isLoginPage && accessToken) {
    return NextResponse.redirect(new URL("/portal", request.url));
  }

// --------------- EDGE RBAC (ROLE-BASED ACCESS CONTROL) ---------------------------
  
  if (accessToken && isPortalPage) {
    const role = await getUserRole(accessToken);

    // 1. Protect Staff Management (Only MIS Superadmin)
    if (pathname.startsWith("/portal/staff-management") && role !== ROLES.MIS_SUPER) {
      console.warn(`Security: Role ${role} attempted to access Restricted Path ${pathname}`);
      const redirectResponse = NextResponse.redirect(new URL("/portal", request.url));
      
      // Copy cookies over from the current response to the redirect response
      const newAccessCookie = response.cookies.get("accessToken");
      if (newAccessCookie) {
         redirectResponse.cookies.set(newAccessCookie);
         redirectResponse.cookies.set(response.cookies.get("refreshToken") as any);
      }
      return redirectResponse;
    }

    // 2. You can add more Edge rules here based on your lib/auth.ts logic
    // Example: Protect Package Management from IT_ADMIN
    if (pathname.startsWith("/portal/packages") && role === ROLES.IT_ADMIN) {
      const redirectResponse = NextResponse.redirect(new URL("/portal", request.url));
      const newAccessCookie = response.cookies.get("accessToken");
      if (newAccessCookie) {
         redirectResponse.cookies.set(newAccessCookie);
         redirectResponse.cookies.set(response.cookies.get("refreshToken") as any);
      }
      return redirectResponse;
    }
  }

  return response;
}

// Configure which routes to run middleware on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
