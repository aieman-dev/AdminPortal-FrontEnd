// app/api/proxy-create-package/creationdata/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");

    // Forward to the REAL backend endpoint for creation data
    const BACKEND_URL = "https://endodermal-tiffaney-scalelike.ngrok-free.devapi/Package/creationdata";

    const apiResponse = await fetch(BACKEND_URL, {
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
    console.error("Proxy Creation Data Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}