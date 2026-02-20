// app/api/(login)/proxy-login/route.ts
import { NextRequest, NextResponse } from "next/server";
import { BACKEND_API_BASE } from "@/lib/config";
import { cookies } from "next/headers";
import { decodeUserRole } from "@/lib/server-auth";
import { decodeJwt } from 'jose';


export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { rememberMe } = body;
    
    // 1. Target the NEW backend endpoint
    const BACKEND_URL = `${BACKEND_API_BASE}/api/auth/login`;

    console.log("------------------------------------------------");
    console.log("Attempting Login Proxy:");
    console.log("Target URL:", BACKEND_URL); 
    console.log("Environment Var:", process.env.NEXT_PUBLIC_BACKEND_API_URL);
    console.log("Config Var:", BACKEND_API_BASE);

    const apiResponse = await fetch(BACKEND_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true",
      },
      body: JSON.stringify(body),
    });

    const responseText = await apiResponse.text();
    console.log("Raw Backend Response:", responseText.slice(0, 500)); 

    let data;
    try {
        data = JSON.parse(responseText);
    } catch (e) {
        return NextResponse.json(
            { message: "Service Unavailable: Backend is offline or busy. Please check server status." }, 
            { status: 502 }
        );
    }

    //  Handle Backend Errors (Check statusCode or errorMessage)
    if (!apiResponse.ok || data.statusCode !== 200) {
      return NextResponse.json(
        { message: data.errorMessage || data.message || "Login failed" },
        { status: data.statusCode || 401 }
      );
    }

    // Safely access content
    const content = data.content || {};
    const { token, refreshToken, refreshTokenExpiry } = content;

    // Check if token exists before proceeding
    if (!token) {
        console.error("Login 500 Error: Backend returned 200 OK but no token found in response.", data);
        return NextResponse.json(
            { message: "Account setup incomplete: No access token received." }, 
            { status: 500 }
        );  
    }

    // 3. Set Secure Cookies (HttpOnly)
    const cookieStore = await cookies();
    const maxAge = rememberMe ? 60 * 60 * 24 * 7 : undefined;
    
    // Access Token (Short-lived)
    cookieStore.set("accessToken", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: maxAge,
    });

    // Session Expiry (Visible to Client)
    const expiryTime = rememberMe 
        ? Date.now() + (7 * 24 * 60 * 60 * 1000) 
        : Date.now() + (24 * 60 * 60 * 1000); 

    cookieStore.set("session_expiry", String(expiryTime), {
        httpOnly: false, 
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: maxAge,
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

    // Construct User Object (SECURE DECODING FIX)
    let user = {
        id: "0",
        email: body.email, 
        name: "User",
        role: "User",
        department: "Staff",
        roles: []
    };
    
    try {
        const userRole = decodeUserRole(token);
        
        // Manual atob/JSON.parse with secure library
        const claims = decodeJwt(token);

        user = {
            id: (claims.userId as string) || (claims.sub as string) || "0",
            email: (claims.sub as string) || body.email,
            name: (claims.name as string) || "User",
            role: (claims.role as string) || "User", 
            department: userRole,
            roles: content.roles || []
        };
    } catch (parseError) {
        console.error("Token Parsing Error:", parseError);
    }

    return NextResponse.json({ success: true, user }, { status: 200 });

  } catch (error) {
    console.error("LOGIN PROXY FAILED:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}