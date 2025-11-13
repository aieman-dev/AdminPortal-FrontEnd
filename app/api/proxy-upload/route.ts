// src/app/api/proxy-upload/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const authHeader = request.headers.get("authorization"); // Get the token

    const apiResponse = await fetch(
      " https://endodermal-tiffaney-scalelike.ngrok-free.dev/api/Package/upload", 
      {
        method: "POST",
        headers: { 
            "ngrok-skip-browser-warning": "true",
            "Authorization": authHeader || "" 
        },
        body: formData, 
      }
    );

    if (!apiResponse.ok) {
      return NextResponse.json({ error: await apiResponse.text() }, { status: apiResponse.status });
    }
    return NextResponse.json(await apiResponse.json());
  } catch (error) {
    return NextResponse.json({ error: "Upload Proxy Error" }, { status: 500 });
  }
}