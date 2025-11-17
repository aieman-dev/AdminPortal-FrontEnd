// src/app/api/proxy-packageView/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { BACKEND_API_BASE } from "@/lib/config";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authHeader = request.headers.get("authorization");

    // Get Query Params (e.g., ?source=pending) from the incoming request
    const searchParams = request.nextUrl.searchParams.toString();

    // Construct the REAL Backend URL with the query params
    // Updated to your new domain: endodermal-tiffaney-scalelike.ngrok-free.dev
    const BACKEND_URL = `${BACKEND_API_BASE}/api/packageView/${id}${
      searchParams ? `?${searchParams}` : ""
    }`;

    const apiResponse = await fetch(BACKEND_URL, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true",
        "Authorization": authHeader || "",
      },
    });

    if (!apiResponse.ok) {
      return NextResponse.json(
        { error: `Backend Error: ${apiResponse.statusText}` }, 
        { status: apiResponse.status }
      );
    }

    const data = await apiResponse.json();
    return NextResponse.json(data, { status: 200 });

  } catch (error) {
    console.error("Proxy Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}