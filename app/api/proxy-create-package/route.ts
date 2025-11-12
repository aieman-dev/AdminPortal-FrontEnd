// src/app/api/proxy-create-package/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Get auth header from the client request
    const authHeader = request.headers.get("authorization");

    // Forward to the REAL backend
    const BACKEND_URL = "https://hazel-nonpungent-yun.ngrok-free.dev/api/Package/create";

    const apiResponse = await fetch(BACKEND_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true", 
        "Authorization": authHeader || "",
      },
      body: JSON.stringify(body),
    });

    // Parse backend response safely
    const responseText = await apiResponse.text();
    let data;
    try {
        data = responseText ? JSON.parse(responseText) : {};
    } catch {
        data = { message: responseText || "No content" };
    }

    // Return response to frontend
    return NextResponse.json(data, { status: apiResponse.status });

  } catch (error) {
    console.error("Proxy Error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}