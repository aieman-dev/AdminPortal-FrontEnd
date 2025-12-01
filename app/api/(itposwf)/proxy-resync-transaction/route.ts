import { NextRequest, NextResponse } from "next/server";
import { BACKEND_API_BASE } from "@/lib/config";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json(); 
    const authHeader = request.headers.get("authorization");
    
    const { trxId } = body;

    if (!trxId) {
        return NextResponse.json({ error: "Transaction ID is required" }, { status: 400 });
    }

    const BACKEND_URL = `${BACKEND_API_BASE}/api/support/consume/transactions/resync-legacy-ticket?TrxId=${trxId}`; 

    const apiResponse = await fetch(BACKEND_URL, {
      method: "GET", 
      headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true",
        "Authorization": authHeader || "",
      },
    });

    const responseText = await apiResponse.text();
    let data;
    try {
        data = responseText ? JSON.parse(responseText) : {};
    } catch {
        data = { message: responseText || "Non-JSON response" };
    }

    if (!apiResponse.ok) {
      let errorMessage = data.message || data.error || `Backend Error: ${apiResponse.statusText}`;

      // IMPROVEMENT: Extract specific error from 'details' JSON string if available
      if (data.details) {
          try {
              const detailsObj = JSON.parse(data.details);
              if (detailsObj.ErrorMessage) {
                  errorMessage = detailsObj.ErrorMessage; // e.g. "No eligible transaction items found..."
              }
          } catch (e) {
              // If details is not valid JSON, ignore and use the default message
              console.warn("Failed to parse error details:", e);
          }
      }

      return NextResponse.json(
        { error: errorMessage }, 
        { status: apiResponse.status }
      );
    }
    
    return NextResponse.json(data, { status: 200 });

  } catch (error) {
    console.error("Resync Transaction Proxy Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}