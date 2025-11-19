import { NextRequest, NextResponse } from "next/server";
// Use your config file if you have it, otherwise hardcode the URL as before
import { BACKEND_API_BASE } from "@/lib/config"; 

export async function GET(request: NextRequest) {
  try {
    // Get the token from the frontend request headers
    const authHeader = request.headers.get("authorization");

    if (!authHeader) {
      return NextResponse.json({ message: "No token provided" }, { status: 401 });
    }

    const BACKEND_URL = `${BACKEND_API_BASE}/api/Account/me`;

    const apiResponse = await fetch(BACKEND_URL, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true",
        "Authorization": authHeader, // Pass the token through
      },
    });

    const data = await apiResponse.json();

    if (!apiResponse.ok) {
      return NextResponse.json(
        { message: "Failed to fetch user details" }, 
        { status: apiResponse.status }
      );
    }

    return NextResponse.json(data, { status: 200 });

  } catch (error) {
    console.error("Me Proxy Error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}