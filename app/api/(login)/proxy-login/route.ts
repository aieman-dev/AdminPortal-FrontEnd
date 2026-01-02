// app/api/(login)/proxy-login/route.ts
import { NextRequest, NextResponse } from "next/server";
import { BACKEND_API_BASE } from "@/lib/config";
import { cookies } from "next/headers";
import { BACKEND_ROLE_MAP } from "@/lib/constants";
import { decodeUserRole } from "@/lib/server-auth";

// Helper to decode JWT payload without external libraries
function parseJwt(token: string) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // 1. Target the NEW backend endpoint
    const BACKEND_URL = `${BACKEND_API_BASE}/api/auth/login`;

    const apiResponse = await fetch(BACKEND_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true",
      },
      body: JSON.stringify(body),
    });

    const data = await apiResponse.json();

    // 2. Handle Backend Errors (Check statusCode or errorMessage)
    if (!apiResponse.ok || data.statusCode !== 200) {
      return NextResponse.json(
        { message: data.errorMessage || data.message || "Login failed" },
        { status: data.statusCode || 401 }
      );
    }

    const { token, refreshToken, refreshTokenExpiry } = data.content;

    // CRITICAL FIX: Check if token exists before proceeding
    if (!token) {
        console.error("Login 500 Error: Backend returned 200 OK but no token found in response.", data);
        return NextResponse.json(
            { message: "Account setup incomplete: No access token received." }, 
            { status: 500 }
        );
    }

    // 3. Set Secure Cookies (HttpOnly)
    const cookieStore = await cookies();
    
    // Access Token (Short-lived)
    cookieStore.set("accessToken", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
    });

    // Refresh Token (Long-lived)
    if (refreshToken) {
        const expiryDate = new Date(refreshTokenExpiry);
        cookieStore.set("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            path: "/",
            expires: expiryDate,
        });
    }

    let user = {
        id: "0",
        email: body.email, // Fallback to requested email
        name: "User",
        role: "User",
        department: "Staff",
        roles: []
    };
    
    try {
        const userRole = decodeUserRole(token);
        
        // Manual Decode for Claims (Safe Version)
        const base64Url = token.split('.')[1];
        if (base64Url) {
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
            const claims = JSON.parse(jsonPayload);

            user = {
                id: claims?.userId || claims?.sub || "0",
                email: claims?.sub || body.email,
                name: claims?.name || "User",
                role: claims?.role || "User", 
                department: userRole,
                roles: data.content?.roles || []
            };
        }
    } catch (parseError) {
        console.error("Token Parsing Error:", parseError);
        // We don't return 500 here; we let them in with default/fallback data 
        // because the cookie was successfully set.
    }

    return NextResponse.json({ success: true, user }, { status: 200 });

  } catch (error) {
    console.error("Login Proxy Error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}