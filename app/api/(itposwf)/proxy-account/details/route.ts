// app/api/(itposwf)/proxy-account/details/route.ts
import { NextRequest, NextResponse } from "next/server";
import { BACKEND_API_BASE } from "@/lib/config";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json(); // Expects { accID: number }
    const authHeader = request.headers.get("authorization");

    // Backend URL for Account Details
    const BACKEND_URL = `${BACKEND_API_BASE}/api/support/account/details`; 

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
    
    // FIX: Check if the returned data is an empty object or null, 
    // which indicates "not found" even if the HTTP status is 200 OK.
    if (!data || !data.accID) { 
        return NextResponse.json(
            { error: "Account details not found in backend response." }, 
            { status: 404 } 
        );
    }

    // If the data is valid, return it.
    return NextResponse.json(data, { status: 200 });

  } catch (error) {
    console.error("Account Details Proxy Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}