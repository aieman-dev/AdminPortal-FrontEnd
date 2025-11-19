// app/api/(packages)/proxy-package-status/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { BACKEND_API_BASE } from "@/lib/config";

// --- NEW STATUS UPDATE PROXY: Handles PUT /api/package/status ---
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> } // Params unused but required by file signature
) {
  try {
    const body = await request.json(); // Expects { Id: number, Status: "Approved", Remark2: "..." }
    const authHeader = request.headers.get("authorization");

    // New backend endpoint for status update (non-dynamic URL)
    const BACKEND_URL = `${BACKEND_API_BASE}/api/package/status`;

    const apiResponse = await fetch(BACKEND_URL, {
      method: "PUT",
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
        data = responseText ? JSON.parse(responseText) : { success: true, message: "No content" };
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
    console.error("Proxy Status Update Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// Remove other HTTP methods for clarity.
export function GET() {
    return NextResponse.json({ error: "Deprecated" }, { status: 400 });
}
export function DELETE() {
    return NextResponse.json({ error: "Deprecated" }, { status: 400 });
}