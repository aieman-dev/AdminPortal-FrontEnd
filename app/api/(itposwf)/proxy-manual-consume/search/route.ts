import { NextRequest, NextResponse } from "next/server";
import { BACKEND_API_BASE } from "@/lib/config";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json(); 
    const authHeader = request.headers.get("authorization");
    const backendPayload = body;

    // Backend URL for Manual Consume Search
    const BACKEND_URL = `${BACKEND_API_BASE}/api/support/consume/search`; 

    const apiResponse = await fetch(BACKEND_URL, {
      method: "POST", 
      headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true",
        "Authorization": authHeader || "",
      },
      body: JSON.stringify(backendPayload), 
    });

    const responseText = await apiResponse.text();
    let data;
    try {
        data = responseText ? JSON.parse(responseText) : {};
    } catch {
        // If parsing fails, create a generic error object to return
        data = { error: responseText, message: "Non-JSON response from backend" };
    }

    if (!apiResponse.ok) {
      return NextResponse.json(
        { error: data.message || data.error ||`Backend Error: ${apiResponse.statusText}` }, 
        { status: apiResponse.status }
      );
    }

    const finalData = {
        creditBalance: data.creditBalance || 0,
        tickets: (data.tickets || []).map((ticket: any) => ({
            // CRITICAL: Map the frontend's unique 'id' key for React's DataTable
            id: String(ticket.TicketItemID), 
            ...ticket, // Pass all other PascalCase fields as-is
        })),
        // Initialize these to 0 as they are not present in the search response
        totalAmount: 0, 
        totalRewardCredit: 0,
    };
    
    return NextResponse.json(finalData, { status: 200 });

  } catch (error) {
    console.error("Manual Consume Search Proxy Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}