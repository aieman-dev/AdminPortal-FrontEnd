import { NextRequest, NextResponse } from "next/server";
import { BACKEND_API_BASE } from "@/lib/config";

// Helper to handle all HTTP methods
async function handleRequest(request: NextRequest, { params }: { params: { path: string[] } }) {
  // 1. Reconstruct the backend path (e.g., "Package/create" or "support/void/search")
  // You need to await params in Next.js 15+ 
  const resolvedParams = await params;
  const path = resolvedParams.path.join("/"); 

  // 2. Construct the full Backend URL
  const query = request.nextUrl.search;
  const backendUrl = `${BACKEND_API_BASE}/api/${path}${query}`;
  
  // 3. Extract the Authorization header (JWT)
  const authHeader = request.headers.get("authorization");

  // 4. Prepare headers
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "true",
    "Authorization": authHeader || "",
  };

  try {
    // 5. Forward the request
    // We get the body for POST/PUT, but not for GET/DELETE
    const body = (request.method === "POST" || request.method === "PUT") 
      ? await request.json() 
      : undefined;

    const apiResponse = await fetch(backendUrl, {
      method: request.method,
      headers: headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    // 6. Handle the response
    const responseText = await apiResponse.text();
    let data;
    try {
        data = responseText ? JSON.parse(responseText) : {};
    } catch {
        // If backend returns HTML error (common with Ngrok/IIS errors)
        return NextResponse.json(
            { error: "Backend returned non-JSON response", details: responseText.slice(0, 200) }, 
            { status: 502 }
        );
    }

    if (!apiResponse.ok) {
      return NextResponse.json(
        { error: data.message || data.error || `Backend Error: ${apiResponse.statusText}`, ...data }, 
        { status: apiResponse.status }
      );
    }

    return NextResponse.json(data, { status: 200 });

  } catch (error) {
    console.error(`Proxy Error [${request.method} ${path}]:`, error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Export handlers for each method you need
export async function GET(req: NextRequest, ctx: any) { return handleRequest(req, ctx); }
export async function POST(req: NextRequest, ctx: any) { return handleRequest(req, ctx); }
export async function PUT(req: NextRequest, ctx: any) { return handleRequest(req, ctx); }
export async function DELETE(req: NextRequest, ctx: any) { return handleRequest(req, ctx); }