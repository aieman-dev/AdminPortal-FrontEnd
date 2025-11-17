// app/api/proxy-login/route.ts
import { NextRequest, NextResponse } from "next/server";
import { BACKEND_API_BASE } from "@/lib/config";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const BACKEND_URL = `${BACKEND_API_BASE}/api/Account/login`;

    console.log(`🔵 Proxying login request to: ${BACKEND_URL}`);

    const apiResponse = await fetch(BACKEND_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true",
      },
      body: JSON.stringify(body),
    });

    // 1. Check the Content-Type header
    const contentType = apiResponse.headers.get("content-type");
    
    // 2. Handle Non-JSON responses (HTML errors, etc.)
    if (!contentType || !contentType.includes("application/json")) {
      const text = await apiResponse.text();
      console.error("🔴 Backend returned Non-JSON response:");
      console.error(text.slice(0, 500)); // Log the first 500 chars to see the HTML error

      return NextResponse.json(
        { 
          message: "Backend Error: The server returned HTML instead of JSON. Check your Ngrok URL.",
          details: text.slice(0, 100) // Send a preview to the frontend
        },
        { status: 502 } // Bad Gateway
      );
    }

    const data = await apiResponse.json();

    if (!apiResponse.ok) {
      return NextResponse.json(
        { message: data.message || "Login failed" }, 
        { status: apiResponse.status }
      );
    }

    return NextResponse.json(data, { status: 200 });

  } catch (error) {
    console.error("Login Proxy Error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}