// app/api/(itposwf)/proxy-activate-balance-details/route.ts
import { NextRequest, NextResponse } from "next/server";
import { BACKEND_API_BASE } from "@/lib/config";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json(); // Expects { email: string }
    const authHeader = request.headers.get("authorization");

    // Backend endpoint provided by the user
    const BACKEND_URL = `${BACKEND_API_BASE}/api/support/activatebalance/details`; 

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
    
    // Success response should return the BalanceDetail object
    return NextResponse.json(data, { status: 200 });

  } catch (error) {
    console.error("Activate Balance Details Proxy Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}