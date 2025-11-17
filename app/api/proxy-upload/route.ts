// src/app/api/proxy-upload/route.ts
import { NextRequest, NextResponse } from "next/server";
import { BACKEND_API_BASE } from "@/lib/config";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const authHeader = request.headers.get("authorization"); // Get the token

    const apiResponse = await fetch(
      `${BACKEND_API_BASE}/api/Package/upload`, 
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