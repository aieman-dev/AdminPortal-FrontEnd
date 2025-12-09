// app/api/(packages)/proxy-image/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const imageUrl = searchParams.get("url");

    if (!imageUrl) {
      return new NextResponse("Missing 'url' query parameter", { status: 400 });
    }

    // 1. Extract the Authorization header from the incoming request
    const authHeader = request.headers.get("authorization");

    // 2. Prepare headers for the backend request
    const fetchHeaders: HeadersInit = {};
    if (authHeader) {
        fetchHeaders["Authorization"] = authHeader;
    }
    // Add ngrok skip warning just in case
    fetchHeaders["ngrok-skip-browser-warning"] = "true";

    // 3. Fetch from backend WITH the headers
    const response = await fetch(imageUrl, {
        headers: fetchHeaders
    });

    if (!response.ok) {
      return new NextResponse("Failed to fetch image", { status: response.status });
    }

    const imageBlob = await response.blob();
    const contentType = response.headers.get("content-type");

    const headers = new Headers();
    if (contentType) {
      headers.set("Content-Type", contentType);
    }
    // Set cache control to improve performance
    headers.set("Cache-Control", "public, max-age=31536000, immutable");

    return new Response(imageBlob, { headers });

  } catch (error) {
    console.error("Image proxy error:", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}