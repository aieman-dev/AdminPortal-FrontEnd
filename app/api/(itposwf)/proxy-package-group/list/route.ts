// app/api/(itposwf)/proxy-package-group/list/route.ts
import { NextRequest, NextResponse } from "next/server";
import { BACKEND_API_BASE } from "@/lib/config";

// --- NEW LIST/SEARCH PROXY: Handles POST /api/support/package-group/list ---
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const authHeader = request.headers.get("authorization");

    // The specific backend URL for IT POSWF package listing
    const BACKEND_URL = `${BACKEND_API_BASE}/api/support/package-group/list`;

    const apiResponse = await fetch(BACKEND_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true",
        "Authorization": authHeader || "",
      },
      body: JSON.stringify(body),
    });

    const responseText = await apiResponse.text();
    let data;
    try {
        data = responseText ? JSON.parse(responseText) : {};
    } catch {
        data = { error: responseText, message: "Non-JSON response" };
    }

    if (!apiResponse.ok) {
      return NextResponse.json(
        { error: data.message || data.error || `Backend Error: ${apiResponse.statusText}` }, 
        { status: apiResponse.status }
      );
    }

    // This endpoint is expected to return the full paginated response: 
    // { currentPage, pageSize, totalItems, totalPages, data: [...] }
    return NextResponse.json(data, { status: 200 });

  } catch (error) {
    console.error("IT POSWF Package List Proxy Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}