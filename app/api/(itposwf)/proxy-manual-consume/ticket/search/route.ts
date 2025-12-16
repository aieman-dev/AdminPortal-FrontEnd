// app/api/(itposwf)/proxy-manual-consume/ticket/search/route.ts
import { NextRequest, NextResponse } from "next/server";
import { BACKEND_API_BASE } from "@/lib/config";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json(); 
    const authHeader = request.headers.get("authorization");
    
    // --- UPDATED: Ensure SourceType is included in the payload ---
    const backendPayload = {
      searchType: body.searchType,
      email: body.email,
      mobile: body.mobile,
      invoiceNo: body.invoiceNo,
      terminalID: body.terminalID,
      ticketType: body.ticketType,
      ticketStatus: body.ticketStatus,
      SourceType: body.SourceType, 
    };

    // Backend URL for Manual Consume Search (Ticket/Package)
    const BACKEND_URL = `${BACKEND_API_BASE}/api/support/consume/search`; 

    const apiResponse = await fetch(BACKEND_URL, {
      method: "POST", 
      headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true",
        "Authorization": authHeader || "",
      },
      body: JSON.stringify(backendPayload), // Forward explicit payload
    });

    const responseText = await apiResponse.text();
    let data;
    try {
        const parsed = responseText ? JSON.parse(responseText) : {};
        data = (parsed && typeof parsed === 'object') ? parsed : {};
    } catch {
        // If parsing fails, create a generic error object to return
        data = { error: responseText, message: "Non-JSON response from backend" };
    }

    if (!apiResponse.ok) {
      const errorMessage = data.ErrorMessage || data.message || data.error || JSON.stringify(data);

      // Check if the error is specifically "No data found"
      if (errorMessage && errorMessage.includes("No data found")) {
          // Return a structured EMPTY response with 200 OK
          return NextResponse.json({
              creditBalance: 0,
              tickets: [], // Empty array
              accID: null, 
              rrQrId: null,
              myQr: null,
              totalAmount: 0, 
              totalRewardCredit: 0,
          }, { status: 200 });
      }

      return NextResponse.json(
        { error: errorMessage || `Backend Error: ${apiResponse.statusText}` }, 
        { status: apiResponse.status }
      );
    }

    const finalData = {
        creditBalance: data.creditBalance || 0,
        tickets: (data.tickets || []).map((ticket: any) => ({
            id: String(ticket.TicketItemID), 
            ...ticket, 
        })),
        accID: data.accID, 
        rrQrId: data.rrQrId, 
        myQr: data.myQr, 
        totalAmount: 0, 
        totalRewardCredit: 0,
    };
    
    return NextResponse.json(finalData, { status: 200 });

  } catch (error) {
    console.error("Manual Consume Search Proxy Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}