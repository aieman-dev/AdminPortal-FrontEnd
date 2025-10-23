import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Define public routes that don't require authentication
const publicRoutes = ["/login"]

// Define protected routes that require authentication
const protectedRoutes = ["/portal"]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Check if the route is protected
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route))

  // Check if the route is public
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route))

  // Get auth token from cookie or header (for future backend integration)
  const authToken = request.cookies.get("auth_token")?.value

  // If accessing protected route without token, redirect to login
  if (isProtectedRoute && !authToken) {
    // Note: In production, validate token with backend here
    // For now, we rely on client-side localStorage check
    return NextResponse.next()
  }

  // If accessing login while authenticated, redirect to portal
  if (isPublicRoute && pathname === "/login" && authToken) {
    return NextResponse.redirect(new URL("/portal", request.url))
  }

  return NextResponse.next()
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
