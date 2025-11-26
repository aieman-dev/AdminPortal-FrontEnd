import { NextRequest, NextResponse } from "next/server";
import { BACKEND_API_BASE } from "@/lib/config";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json(); 
    const authHeader = request.headers.get("authorization");

    // Backend URL for Terminal Search
    const BACKEND_URL = `${BACKEND_API_BASE}/api/support/consume/terminals`; 

    const apiResponse = await fetch(BACKEND_URL, {
      method: "POST", 
      headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true",
        "Authorization": authHeader || "",
      },
      body: JSON.stringify(body), // Payload: { SearchQuery: "..." }
    });

    const responseText = await apiResponse.text();
    let data;
    try {
        // Attempt to parse the text as JSON
        data = responseText ? JSON.parse(responseText) : {};
    } catch {
        // If parsing fails, this means the backend returned non-JSON (e.g., HTML/error page)
        console.error("Terminal Search Proxy Parsing Error: Non-JSON response received.");
        return NextResponse.json(
          { error: "Backend returned invalid JSON. It may be an HTML error page. Check backend server.", details: responseText.slice(0, 100) },
          { status: 502 } // Use 502 Bad Gateway to indicate upstream issue
        );
    }


    if (!apiResponse.ok) {
      return NextResponse.json(
        { error: data.message || `Backend Error: ${apiResponse.statusText}` }, 
        { status: apiResponse.status }
      );
    }
    
    // Assuming the response is an array of objects that need field mapping 
    // to match the frontend's 'Terminal' interface:
    const mappedTerminals = (Array.isArray(data) ? data : []).map(terminal => ({
        id: terminal.terminalID ? String(terminal.terminalID) : String(Math.random()), // Map terminalID to 'id'
        terminalName: terminal.terminal || 'N/A', // Map 'terminal' to 'terminalName'
        uuid: terminal.uuid || '', 
        terminalType: terminal.terminalType || 'POS', // Assuming default type
        status: terminal.status || 'Active', 
        modifiedDate: terminal.modifiedDate || 'N/A',
    }));

    return NextResponse.json(mappedTerminals, { status: 200 });

  } catch (error) {
    console.error("Terminal Search Proxy Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}