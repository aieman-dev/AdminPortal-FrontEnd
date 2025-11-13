// app/api/proxy-packageView/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    // Get 'status' from query string (e.g., ?status=Active)
    const { searchParams } = request.nextUrl;
    const status = searchParams.get("status");
    const startDate = searchParams.get("startDate"); 
    const endDate = searchParams.get("endDate");
    const source = searchParams.get("source");
    const authHeader = request.headers.get("authorization");

    // Construct Backend URL: /api/packageView?status={status}
    const backendUrl = new URL("https://endodermal-tiffaney-scalelike.ngrok-free.dev/api/packageView");
    if (status) {backendUrl.searchParams.set("status", status);}
    if (startDate) backendUrl.searchParams.set("startDate", startDate); 
    if (endDate) backendUrl.searchParams.set("endDate", endDate);
    if (source) backendUrl.searchParams.set("source", source);

    const apiResponse = await fetch(backendUrl.toString(), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true",
        "Authorization": authHeader || "",
      },
    });

    if (!apiResponse.ok) {
      return NextResponse.json(
        { error: `Backend Error: ${apiResponse.statusText}` }, 
        { status: apiResponse.status }
      );
    }

    const data = await apiResponse.json();
    return NextResponse.json(data, { status: 200 });

  } catch (error) {
    console.error("Proxy List Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}