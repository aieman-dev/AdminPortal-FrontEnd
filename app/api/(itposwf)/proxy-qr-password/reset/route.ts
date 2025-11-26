import { NextRequest, NextResponse } from "next/server";
import { BACKEND_API_BASE } from "@/lib/config";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json(); 
    const authHeader = request.headers.get("authorization");

    // Live Backend Endpoint for RESET password
    const BACKEND_URL = `${BACKEND_API_BASE}/api/support/securitynumber/reset`; 

    const apiResponse = await fetch(BACKEND_URL, {
      method: "POST", 
      headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true",
        "Authorization": authHeader || "",
      },
      body: JSON.stringify(body), 
    });

    const data = await apiResponse.json();

    if (!apiResponse.ok) {
      return NextResponse.json(
        { error: data.message || `Backend Error: ${apiResponse.statusText}` }, 
        { status: apiResponse.status }
      );
    }

    // Map the success response (e.g., {"invoiceNo": "...", "data": {"newSecurityNumber": "..."}})
    // to the PasswordData interface { invoiceNo, currentPassword }
    const newPassword = data.data?.newSecurityNumber || data.newSecurityNumber; 
    
    const mappedData = {
        invoiceNo: data.data?.invoiceNo || body.invoiceNo,
        currentPassword: newPassword // Use the new password field
    };

    return NextResponse.json(mappedData, { status: 200 });

  } catch (error) {
    console.error("QR Password Reset Proxy Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}