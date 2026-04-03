import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { BACKEND_API_BASE } from "@/lib/config";
import { decodeJwt } from "jose";
import { BACKEND_ROLE_MAP, ROLES } from "@/lib/constants";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { logger } from "@/lib/logger";

// Initialize Redis and the Rate Limiter OUTSIDE the middleware function
// This ensures the connection is cached across edge invocations
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || "",
  token: process.env.UPSTASH_REDIS_REST_TOKEN || "",
});

// Create a sliding window limiter: 100 requests per 1 minute
const ratelimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(100, "1 m"),
  analytics: true, // Optional: Gives you cool charts in the Upstash dashboard
});

// ---  Decode the token to check expiration ---
async function getVerifiedPayload(token: string) {
  try {
     const payload = decodeJwt(token);
     return payload;
  } catch (e) {
    return null; 
  }
}

async function isTokenExpired(token: string) {
  const payload = await getVerifiedPayload(token);
  if (!payload || !payload.exp) return true;
  
  // Check if expiry time is in the past (with 60s buffer)
  const BUFFER_SECONDS = 60; 
  return (Math.floor(Date.now() / 1000) >= payload.exp - BUFFER_SECONDS);
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

  // --------------- SECURITY LOGIC (UPSTASH RATE LIMITING) ---------------------------
  // We only rate limit API routes and Login attempts to save Redis operations
  if (pathname.startsWith("/api") || pathname.startsWith("/login")) {
    
    // In Next.js, request.ip is available in production. Fallback to header or localhost.
    const ip =  request.headers.get("x-forwarded-for") || "127.0.0.1";
    
    try {
      const { success, limit, reset, remaining } = await ratelimit.limit(ip);

      if (!success) {
        logger.warn(`Rate limit exceeded for IP: ${ip}`);
        return new NextResponse(
          JSON.stringify({ success: false, message: "Too many requests. Please try again later." }),
          { 
            status: 429, 
            headers: { 
              "Content-Type": "application/json",
              "X-RateLimit-Limit": limit.toString(),
              "X-RateLimit-Remaining": remaining.toString(),
              "X-RateLimit-Reset": reset.toString()
            } 
          }
        );
      }
    } catch (error) {
      // Fail open: If Redis goes down, we don't want to lock everyone out of the portal
      logger.error("Upstash Redis Error:", { error });
    }
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
    logger.info("Middleware: Token expired. Clearing variable to trigger refresh.");
    accessToken = undefined; // Force refresh logic below
  }

  // AUTO-REFRESH: If Access Token missing/expired, but Refresh Token exists
  if (isPortalPage && !accessToken && refreshToken) {
    logger.info("Middleware: Attempting refresh...")

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

        logger.info("Middleware: Token refreshed successfully.");
        accessToken = newAccessToken;
    } else {
        // If backend rejects the refresh token, throw to the catch block
        throw new Error("Backend rejected refresh token");
      }
    } catch (error) {
      logger.error("Middleware: Refresh failed, forcing clean logout", { error });
      
      // Create a redirect response and nuke the bad cookies
      const failedRefreshRedirect = NextResponse.redirect(new URL("/login", request.url));
      failedRefreshRedirect.cookies.delete("accessToken");
      failedRefreshRedirect.cookies.delete("refreshToken");
      
      return failedRefreshRedirect; // Immediately stop and send to login
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
      logger.warn(`Security: Role ${role} attempted to access Restricted Path ${pathname}`);
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
