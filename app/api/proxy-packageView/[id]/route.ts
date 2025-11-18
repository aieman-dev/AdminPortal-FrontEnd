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

    const BACKEND_URL = `${BACKEND_API_BASE}/api/packageView/${id}${
      searchParams ? `?${searchParams}` : ""
    }`;

    console.log(`🔵 [Proxy] Fetching: ${BACKEND_URL}`);

    const apiResponse = await fetch(BACKEND_URL, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true",
        "Authorization": authHeader || "",
      },
    });

    // 1. Check Content-Type to prevent crashing on HTML/Text responses
    const contentType = apiResponse.headers.get("content-type");
    const isJson = contentType && contentType.includes("application/json");

    if (!apiResponse.ok) {
      // If backend returns an error, try to read it safely
      const errorBody = isJson ? await apiResponse.json() : await apiResponse.text();
      console.error(`🔴 [Backend Error ${apiResponse.status}]:`, errorBody);

      return NextResponse.json(
        { 
          error: `Backend Error (${apiResponse.status})`, 
          details: errorBody 
        }, 
        { status: apiResponse.status }
      );
    }

    // 2. Safe Parsing for Success Responses
    if (isJson) {
      const data = await apiResponse.json();
      return NextResponse.json(data, { status: 200 });
    } else {
      const text = await apiResponse.text();
      console.warn("⚠️ Backend returned 200 OK but not JSON:", text.substring(0, 100));
      return NextResponse.json({ message: "Non-JSON response received", content: text }, { status: 200 });
    }

  } catch (error) {
    console.error("💥 [Proxy Exception]:", error);
    return NextResponse.json(
      { error: "Internal Proxy Error", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}