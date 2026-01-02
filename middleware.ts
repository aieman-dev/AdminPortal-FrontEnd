import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { BACKEND_API_BASE } from "@/lib/config";

// Note: In serverless (Vercel), this resets on cold starts, but still effective for bursts.
const rateLimitMap = new Map();

function isTokenExpired(token: string) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (!payload.exp) return false;
    // Check if expiry time is in the past (with 10s buffer)
    return (Math.floor(Date.now() / 1000) >= payload.exp - 10);
  } catch (e) {
    return true; // Treat invalid tokens as expired
  }
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

  // CHECK EXPIRY: If token exists but is expired, treat it as missing
  if (accessToken && isTokenExpired(accessToken)) {
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
        return response;
      }
    } catch (error) {
      console.error("Middleware: Refresh failed", error);
      // If refresh fails (e.g., Backend error), fall through to logout logic
    }
  }

  // 3. Standard Checks (Identical to before)
  
  // If still no access token (and refresh failed or didn't exist), kick to login
  if (isPortalPage && !accessToken) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // If user is on login page but has access, kick to portal
  if (isLoginPage && accessToken) {
    return NextResponse.redirect(new URL("/portal", request.url));
  }

  return NextResponse.next();
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
