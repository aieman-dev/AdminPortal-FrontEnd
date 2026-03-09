// src/app/api/proxy-upload/route.ts
import { NextRequest, NextResponse } from "next/server";
import { BACKEND_API_BASE } from "@/lib/config";
import { cookies } from "next/headers";
import { logger } from "@/lib/logger";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const cookieStore = await cookies();
    const accessToken = cookieStore.get("accessToken")?.value;

    const apiResponse = await fetch(
      `${BACKEND_API_BASE}/api/Package/upload`, 
      {
        method: "POST",
        headers: { 
            "ngrok-skip-browser-warning": "true",
            "Authorization": accessToken ? `Bearer ${accessToken}` : ""
        },
        body: formData, 
      }
    );

    if (!apiResponse.ok) {
      return NextResponse.json({ error: await apiResponse.text() }, { status: apiResponse.status });
    }
    return NextResponse.json(await apiResponse.json());
  } catch (error) {
    logger.error("Upload Proxy Error", { error });  
    return NextResponse.json(
      { error: "Upload Proxy Error" }, { status: 500 });
  }
}