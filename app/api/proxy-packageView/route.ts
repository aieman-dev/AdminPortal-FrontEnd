// app/api/proxy-packageView/route.ts
import { NextRequest, NextResponse } from "next/server";
import { BACKEND_API_BASE } from "@/lib/config"; 

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    
    // Extract existing params
    const status = searchParams.get("status");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const source = searchParams.get("source");
    
    // NEW: Extract Pagination & Search params
    // Default page to 1 if not provided
    const pageNumber = searchParams.get("pageNumber") || "1";
    const searchQuery = searchParams.get("searchQuery") || "";

    const authHeader = request.headers.get("authorization");

    // Construct Backend URL
    const backendUrl = new URL(`${BACKEND_API_BASE}/api/packageView`);
    
    // Append params to backend URL
    if (status) backendUrl.searchParams.set("status", status);
    if (startDate) backendUrl.searchParams.set("startDate", startDate);
    if (endDate) backendUrl.searchParams.set("endDate", endDate);
    if (source) backendUrl.searchParams.set("source", source);
    
    // NEW: Append the new params
    backendUrl.searchParams.set("pageNumber", pageNumber);
    if (searchQuery) backendUrl.searchParams.set("searchQuery", searchQuery);

    const apiResponse = await fetch(backendUrl.toString(), {
      method: "GET",
      headers: {
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
    console.error("Proxy List Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}