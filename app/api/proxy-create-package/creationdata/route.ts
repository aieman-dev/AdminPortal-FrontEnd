//app/api/proxy-create-package/creationdata/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    // Use the domain from your Postman screenshot
    const BACKEND_URL = "https://endodermal-tiffaney-scalelike.ngrok-free.dev/api/Package/creationdata";

    const apiResponse = await fetch(BACKEND_URL, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true",
        "Authorization": authHeader || "",
      },
    });

    if (!apiResponse.ok) {
      return NextResponse.json({ error: "Failed to fetch data" }, { status: apiResponse.status });
    }

    const data = await apiResponse.json();
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}