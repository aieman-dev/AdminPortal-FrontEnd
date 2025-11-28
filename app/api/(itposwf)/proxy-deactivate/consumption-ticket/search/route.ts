// app/api/(itposwf)/proxy-deactivate-consumption/search/route.ts
import { NextRequest, NextResponse } from "next/server";
import { BACKEND_API_BASE } from "@/lib/config";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json(); 
    const authHeader = request.headers.get("authorization");
    
    // Maps to: POST https://hippiest-unfightable-bree.ngrok-free.dev/api/support/tickets/consumption/search
    const BACKEND_URL = `${BACKEND_API_BASE}/api/support/tickets/consumption/search`; 

    const apiResponse = await fetch(BACKEND_URL, {
      method: "POST", 
      headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true",
        "Authorization": authHeader || "",
      },
      // Ensure payload uses null for optional fields
      body: JSON.stringify({
          ticketNo: body.ticketNo || null, 
          invoiceNo: body.invoiceNo || null,
      }), 
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
    console.error("Deactivate Consumption Search Proxy Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}