// app/api/proxy/[...path]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { BACKEND_API_BASE } from "@/lib/config";
import { cookies } from "next/headers";

// Helper to handle all HTTP methods
async function handleRequest(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const resolvedParams = await params;
  const path = resolvedParams.path.join("/"); 

  const query = request.nextUrl.search;
  const backendUrl = `${BACKEND_API_BASE}/api/${path}${query}`;
  
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("accessToken")?.value

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "true",
  };

  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }

  try {
    let body: any = undefined;
    if (request.method === "POST" || request.method === "PUT") {
        try {
            const text = await request.text();
            // Only parse if string is not empty to avoid JSON parse error
            if (text) {
                body = JSON.parse(text);
            }
        } catch (e) {
            console.warn("Failed to parse request body, proceeding with undefined body.");
            body = undefined;
        }
    }

    // 2. Forward Request
    const apiResponse = await fetch(backendUrl, {
      method: request.method,
      headers: headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      cache: "no-store",
    });

    const responseText = await apiResponse.text();
    let data;
    try {
        data = responseText ? JSON.parse(responseText) : {};
    } catch {
        return NextResponse.json(
            { error: "Backend returned non-JSON response", details: responseText.slice(0, 200) }, 
            { status: 502 }
        );
    }

    if (apiResponse.status === 401) {
       return NextResponse.json({ error: "Unauthorized or Token Expired" }, { status: 401 });
    }

    if (!apiResponse.ok) {
      return NextResponse.json(
        { error: data.message || data.error || `Backend Error: ${apiResponse.statusText}`, ...data }, 
        { status: apiResponse.status }
      );
    }

    const nextResponse = NextResponse.json(data, { status: 200 });
    const setCookieHeader = apiResponse.headers.get("Set-Cookie");

    if (setCookieHeader) {
        // Forward the cookie to the browser
        // Note: You might need to adjust domain/path if backend sets them strictly
        nextResponse.headers.set("Set-Cookie", setCookieHeader);
    }

    return nextResponse;

  } catch (error) {
    console.error(`Proxy Error [${request.method} ${path}]:`, error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest, ctx: any) { return handleRequest(req, ctx); }
export async function POST(req: NextRequest, ctx: any) { return handleRequest(req, ctx); }
export async function PUT(req: NextRequest, ctx: any) { return handleRequest(req, ctx); }
export async function DELETE(req: NextRequest, ctx: any) { return handleRequest(req, ctx); }