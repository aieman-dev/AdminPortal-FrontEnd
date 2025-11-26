import { NextRequest, NextResponse } from "next/server";
import { BACKEND_API_BASE } from "@/lib/config";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json(); 
    const authHeader = request.headers.get("authorization");

    // Backend endpoint for finding extendable tickets
    const BACKEND_URL = `${BACKEND_API_BASE}/api/support/ticketdate/find`; 

    const apiResponse = await fetch(BACKEND_URL, {
      method: "POST", 
      headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true",
        "Authorization": authHeader || "",
      },
      body: JSON.stringify(body), // Payload: { invoiceNo: "..." }
    });

    const responseText = await apiResponse.text();
    let data: any; // Use 'any' for the initial parsed result

    try {
        data = responseText ? JSON.parse(responseText) : null;
    } catch {
        // Case: Backend returned non-JSON response (e.g., HTML error)
        data = { error: responseText, message: "Non-JSON response" };
    }

    if (!apiResponse.ok) {
      // FIX 1: Safely access error properties.
      const errorMessage = data?.message || data?.error || `Backend Error: ${apiResponse.statusText}`;
      
      return NextResponse.json(
        { error: errorMessage }, 
        { status: apiResponse.status }
      );
    }

    // Success Path: API is OK. Ensure data is returned as an array.
    let result: any[] = [];
    if (Array.isArray(data)) {
        result = data;
    } else if (data) {
        // Case: Backend returned a single object successfully (e.g., if only one transaction is found)
        result = [data];
    }

    // Returns an array of transaction records (or an empty array)
    return NextResponse.json(result, { status: 200 });

  } catch (error) {
    console.error("Extend Expiry Find Proxy Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}