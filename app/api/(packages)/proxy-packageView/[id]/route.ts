// app/api/(packages)/proxy-packageView/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { BACKEND_API_BASE } from "@/lib/config";

// --- NEW DETAIL PROXY: Handles POST /api/packageView/detail ---
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> } // Params unused but required by file signature
) {
  try {
    // Get ID/Source from the POST body (sent by the updated service layer)
    const body = await request.json(); 
    const authHeader = request.headers.get("authorization");

    // New backend endpoint for detail
    const BACKEND_URL = `${BACKEND_API_BASE}/api/packageView/detail`;

    const apiResponse = await fetch(BACKEND_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true",
        "Authorization": authHeader || "",
      },
      body: JSON.stringify(body), // Forward the body { Id: number, Source: string }
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
    console.error("Proxy Detail Error:", error);
    return NextResponse.json(
      { error: "Internal Proxy Error", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// Remove the old GET implementation to prevent confusion.
export function GET() {
  return NextResponse.json({ error: "Deprecated. Use POST /api/packageView/detail with ID in body." }, { status: 400 });
}