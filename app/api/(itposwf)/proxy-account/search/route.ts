import { NextRequest, NextResponse } from "next/server";
import { BACKEND_API_BASE } from "@/lib/config";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json(); 
    const authHeader = request.headers.get("authorization");

    // Backend URL for Account Search
    const BACKEND_URL = `${BACKEND_API_BASE}/api/support/account/search`; 

    const apiResponse = await fetch(BACKEND_URL, {
      method: "POST", 
      headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true",
        "Authorization": authHeader || "",
      },
      body: JSON.stringify(body), // Payload: { email: "..." }
    });

    const data = await apiResponse.json();

    if (!apiResponse.ok) {
      return NextResponse.json(
        { error: data.message || `Backend Error: ${apiResponse.statusText}` }, 
        { status: apiResponse.status }
      );
    }
    
    // The endpoint often returns a single object if a search term is exact, 
    // but for search/list pages, we normalize to an array for the frontend table.
    const rawResult = Array.isArray(data) ? data : (data && data.accID ? [data] : []);

    // FIX: Add mapping for 'id' field, which the frontend table uses as the key.
    const result = rawResult.map((account: any) => ({
        // Use accID as the unique ID for the frontend component key/routing
        id: String(account.accID), 
        accId: account.accID, 
        email: account.email,
        firstName: account.firstName,
        mobile: account.mobileNo, // Frontend service maps mobileNo -> mobile
        createdDate: account.createdDate,
        accountStatus: account.recordStatus, // Frontend service maps recordStatus -> accountStatus
        // All other required fields are present and correctly cased or mapped in the service layer.
    }));

    return NextResponse.json(result, { status: 200 });

  } catch (error) {
    console.error("Account Search Proxy Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}