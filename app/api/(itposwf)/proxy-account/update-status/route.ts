// app/api/(itposwf)/proxy-account/update-status/route.ts
import { NextRequest, NextResponse } from "next/server";
import { BACKEND_API_BASE } from "@/lib/config";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json(); // Expects { AccID: number, NewStatus: "Active" | "Inactive" }
    const authHeader = request.headers.get("authorization");

    const BACKEND_URL = `${BACKEND_API_BASE}/api/support/account/update-status`; 

    const apiResponse = await fetch(BACKEND_URL, {
      method: "POST", 
      headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true",
        "Authorization": authHeader || "",
      },
      body: JSON.stringify(body), 
    });

    const data = await apiResponse.json();

    if (!apiResponse.ok) {
      return NextResponse.json(
        { error: data.message || `Backend Error: ${apiResponse.statusText}` }, 
        { status: apiResponse.status }
      );
    }
    
    return NextResponse.json(data, { status: 200 });

  } catch (error) {
    console.error("Account Status Update Proxy Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}