// app/api/(itposwf)/proxy-manual-consume/retail/execute/route.ts
import { NextRequest, NextResponse } from "next/server";
import { BACKEND_API_BASE } from "@/lib/config";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json(); 
    const authHeader = request.headers.get("authorization");

    // Backend URL for Retail Manual Consume Execute
    const BACKEND_URL = `${BACKEND_API_BASE}/api/support/retail/consume`; 

    const apiResponse = await fetch(BACKEND_URL, {
      method: "POST", 
      headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true",
        "Authorization": authHeader || "",
      },
      body: JSON.stringify(body), // Forward execute payload
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
    
    // Assuming successful response contains { message: "...", invoiceNo: "RC-..." }
    return NextResponse.json(data, { status: 200 });

  } catch (error) {
    console.error("Retail Manual Consume Execute Proxy Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}