// app/api/(itposwf)/proxy-manual-consume/ticket/execute/route.ts
import { NextRequest, NextResponse } from "next/server";
import { BACKEND_API_BASE } from "@/lib/config";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json(); 
    const authHeader = request.headers.get("authorization");

    // Backend URL for Manual Consume Execute (Ticket/Package)
    const BACKEND_URL = `${BACKEND_API_BASE}/api/support/consume/confirm`;

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
      const errorMessage = data.message || data.error || `Backend Error: ${apiResponse.statusText}`;

      // --- GRACEFUL ERROR HANDLING: Ticket already consumed/invalid status ---
      const alreadyConsumedPattern = /already consumed|already redeemed|expired|cannot consume|item is used/i;
      if (apiResponse.status === 500 && alreadyConsumedPattern.test(errorMessage)) {
          console.warn("Manual Consume (Ticket) detected already consumed/invalid status.");
          return NextResponse.json(
            { error: "Ticket/Package is already consumed or has an invalid status." }, 
            { status: 409 } // Use a specific status code like 409 Conflict for this domain error
          );
      }
      
      // Handle other backend errors
      return NextResponse.json(
        { error: errorMessage }, 
        { status: apiResponse.status }
      );
    }
    
    // Assuming successful response contains { message: "..." }
    return NextResponse.json(data, { status: 200 });

  } catch (error) {
    console.error("Manual Consume Execute Proxy Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}