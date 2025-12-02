// app/api/(itposwf)/proxy-manual-consume/retail/search/route.ts
import { NextRequest, NextResponse } from "next/server";
import { BACKEND_API_BASE } from "@/lib/config";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json(); 
    const authHeader = request.headers.get("authorization");

    // Backend URL for Retail Manual Consume Search
    const BACKEND_URL = `${BACKEND_API_BASE}/api/support/retail/search`; 

    const apiResponse = await fetch(BACKEND_URL, {
      method: "POST", 
      headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true",
        "Authorization": authHeader || "",
      },
      body: JSON.stringify(body), // Forward payload: { searchType, email, mobile, invoiceNo, terminalID, tGroupID, itemName }
    });

    const responseText = await apiResponse.text();
    let data;
    try {
        data = responseText ? JSON.parse(responseText) : {};
    } catch {
        data = { error: responseText, message: "Non-JSON response from backend" };
    }

    if (!apiResponse.ok) {
      return NextResponse.json(
        { error: data.message || data.error ||`Backend Error: ${apiResponse.statusText}` }, 
        { status: apiResponse.status }
      );
    }
    
    // Normalize the successful response fields for the frontend
    const finalData = {
        accID: data.accID, 
        // Backend uses 'rQrId', proxy renames to 'rrQRID' for reuse in the frontend interface.
        rrQRID: data.rQrId, 
        creditBalance: data.creditBalance || 0,
        items: (data.items || []).map((item: any) => ({
            // CRITICAL: Map the frontend's unique 'id' key for React's DataTable
            id: String(item.itemID), 
            ...item, // Pass all other fields as-is
        })),
        totalAmount: 0, 
        totalRewardCredit: 0,
    };
    
    return NextResponse.json(finalData, { status: 200 });

  } catch (error) {
    console.error("Retail Manual Consume Search Proxy Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}