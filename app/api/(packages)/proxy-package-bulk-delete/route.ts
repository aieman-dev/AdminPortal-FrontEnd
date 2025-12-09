// app/api/(packages)/proxy-package-bulk-delete/route.ts
import { NextRequest, NextResponse } from "next/server";
import { BACKEND_API_BASE } from "@/lib/config";

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json(); // Expects { packageIds: number[] }
    const authHeader = request.headers.get("authorization");

    // Endpoint from your screenshot
    const BACKEND_URL = `${BACKEND_API_BASE}/api/Package/deactivate-draft`; 

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
        data = responseText ? JSON.parse(responseText) : { message: "No content" };
    } catch {
        data = { error: responseText, message: "Non-JSON response" };
    }

    if (!apiResponse.ok) {
      return NextResponse.json(
        { error: data.message || `Backend Error: ${apiResponse.statusText}` }, 
        { status: apiResponse.status }
      );
    }

    return NextResponse.json(data, { status: 200 });

  } catch (error) {
    console.error("Bulk Delete Proxy Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}