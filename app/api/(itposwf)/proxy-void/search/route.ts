// app/api/(itposwf)/proxy-void/search/route.ts

import { NextRequest, NextResponse } from "next/server";
import { BACKEND_API_BASE } from "@/lib/config";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json(); 
    const authHeader = request.headers.get("authorization");

    // Backend endpoint for searching voidable transactions
    const BACKEND_URL = `${BACKEND_API_BASE}/api/support/void/find`; 

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

    // --- FIX: Normalize the data structure ---
    let result: any[] = [];
    
    if (Array.isArray(data)) {
        // Handle single-level array or nested array (e.g., [ [trx] ] or [trx])
        if (data.length > 0 && Array.isArray(data[0])) {
             // If it's nested (e.g., [ [trx1, trx2] ]), flatten it.
             result = data.flat();
        } else {
             // If it's already a flat array of objects (e.g., [trx1, trx2])
             result = data;
        }
    } else if (data && typeof data === 'object') {
        // If it's a single object that should be wrapped (e.g., { trxID: ... })
        result = [data];
    }
    
    // Add the missing unique 'id' field based on backend's 'trxID' + array index
    const finalResult = result.map((item, index) => ({
        ...item,
        // The frontend `DataTable` uses 'id' for the key, creating a unique ID
        // from the transaction ID and the index to handle identical transactions.
        id: `${item.trxID}-${index}`, 
        // Ensure balanceQuantity matches the expected frontend field name
        balanceQuantity: item.balanceQty, 
        // Ensure transactionType matches the expected frontend field name
        transactionType: item.trxType,
        terminal: item.terminalID // Use terminalID from backend as terminal field
    }));

    return NextResponse.json(finalResult, { status: 200 });

  } catch (error) {
    console.error("Void Search Proxy Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}