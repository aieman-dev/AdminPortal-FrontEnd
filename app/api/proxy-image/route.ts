import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    // Get the 'url' query parameter
    const { searchParams } = new URL(request.url);
    const imageUrl = searchParams.get("url");

    if (!imageUrl) {
      return new NextResponse("Missing 'url' query parameter", { status: 400 });
    }

    // Fetch the image from the insecure http:// server
    const response = await fetch(imageUrl);

    if (!response.ok) {
      return new NextResponse("Failed to fetch image", { status: response.status });
    }

    // Get the image data as a blob
    const imageBlob = await response.blob();
    
    // Get the original content-type (e.g., 'image/jpeg')
    const contentType = response.headers.get("content-type");

    // Send the image back to your frontend
    // We use NextResponse.blob() which is available in Next 14.2+
    // For older versions, you'd use new Response(imageBlob, ...)
    const headers = new Headers();
    if (contentType) {
      headers.set("Content-Type", contentType);
    }

    return new Response(imageBlob, { headers });

  } catch (error) {
    console.error("Image proxy error:", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}