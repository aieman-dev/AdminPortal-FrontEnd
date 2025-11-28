// app/api/(itposwf)/proxy-deactivate/consumption-ticket/execute/route.ts

import { NextRequest, NextResponse } from "next/server";
import { BACKEND_API_BASE } from "@/lib/config";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json(); 
    const authHeader = request.headers.get("authorization");
    
    const BACKEND_URL = `${BACKEND_API_BASE}/api/support/tickets/consumption/deactivate`; 

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
      // Handle backend errors
      return NextResponse.json(
        { error: data.message || `Backend Error: ${apiResponse.statusText}` }, 
        { status: apiResponse.status }
      );
    }
    
    // Success response should return the message object.
    return NextResponse.json(data, { status: 200 });

  } catch (error) {
    console.error("Deactivate Consumption Execute Proxy Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}