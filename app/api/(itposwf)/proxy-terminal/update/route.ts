// app/api/(itposwf)/proxy-terminal/update-uuid/route.ts
import { NextRequest, NextResponse } from "next/server";
import { BACKEND_API_BASE } from "@/lib/config";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json(); // Expects { TerminalID: number, NewUUID: string }
    const authHeader = request.headers.get("authorization");

    // Backend URL for Terminal UUID Update (based on image_0d3d1b.jpg)
    const BACKEND_URL = `${BACKEND_API_BASE}/api/support/consume/terminals/update-uuid`; 

    const apiResponse = await fetch(BACKEND_URL, {
      method: "POST", 
      headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true",
        "Authorization": authHeader || "",
      },
      body: JSON.stringify(body), // Forward the body
    });

    const data = await apiResponse.json();

    if (!apiResponse.ok) {
      return NextResponse.json(
        { error: data.message || `Backend Error: ${apiResponse.statusText}` }, 
        { status: apiResponse.status }
      );
    }
    
    // The backend response is expected to be a simple message object
    return NextResponse.json(data, { status: 200 });

  } catch (error) {
    console.error("Terminal UUID Update Proxy Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}