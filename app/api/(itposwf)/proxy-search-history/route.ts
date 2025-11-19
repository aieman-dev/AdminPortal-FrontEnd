// app/api/(it-poswf)/proxy-search-history/route.ts
import { NextRequest, NextResponse } from "next/server";
import { BACKEND_API_BASE } from "@/lib/config";

// --- CHANGED TO POST METHOD ---
export async function POST(request: NextRequest) {
  try {
    const body = await request.json(); // Read JSON body { searchType, value }
    const authHeader = request.headers.get("authorization");

    // --- CHANGED BACKEND URL ---
    const BACKEND_URL = `${BACKEND_API_BASE}/api/support/history/search`; 

    const apiResponse = await fetch(BACKEND_URL, {
      method: "POST", // Use POST method
      headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true",
        "Authorization": authHeader || "",
      },
      body: JSON.stringify(body), // Forward the body
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

    return NextResponse.json(data, { status: 200 });

  } catch (error) {
    console.error("History Search Proxy Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export function GET() {
  return NextResponse.json({ error: "Deprecated. Use POST method with JSON body." }, { status: 400 });
}