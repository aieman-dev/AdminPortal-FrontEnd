// app/api/(itposwf)/proxy-search-shopify-order/route.ts
import { NextRequest, NextResponse } from "next/server";
import { BACKEND_API_BASE } from "@/lib/config";

// --- NEW SHOPIFY ORDER SEARCH PROXY: Handles POST /api/support/vouchers/shopify-search ---
export async function POST(request: NextRequest) {
  try {
    const body = await request.json(); // Read JSON body { orderId }
    const authHeader = request.headers.get("authorization");

    // Construct the backend URL
    const BACKEND_URL = `${BACKEND_API_BASE}/api/support/vouchers/shopify-search`;

    const apiResponse = await fetch(BACKEND_URL, {
      method: "POST", // Use POST method
      headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true",
        "Authorization": authHeader || "",
      },
      body: JSON.stringify(body), // Forward the body { orderId }
    });

    const responseText = await apiResponse.text();
    let data;
    try {
        data = responseText ? JSON.parse(responseText) : {};
    } catch {
        data = { error: responseText, message: "Non-JSON response" };
    }

    if (!apiResponse.ok) {
      // Check for a specific 'not found' message that should be handled gracefully
      const notFoundMessage = "No transaction found for the given order ID";
      if (data.message && data.message.includes(notFoundMessage)) {
         return NextResponse.json({ message: notFoundMessage }, { status: 404 });
      }

      return NextResponse.json(
        { error: data.message || data.error || `Backend Error: ${apiResponse.statusText}` }, 
        { status: apiResponse.status }
      );
    }

    // Success response should return the ShopifyTrxDetail object
    return NextResponse.json(data, { status: 200 });

  } catch (error) {
    console.error("Shopify Order Search Proxy Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export function GET() {
  return NextResponse.json({ error: "Deprecated. Use POST method with JSON body." }, { status: 400 });
}