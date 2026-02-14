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
    let finalBody: BodyInit | null | undefined = undefined;
    let requestContentType = request.headers.get("content-type");

    if (["POST", "PUT", "PATCH"].includes(request.method)) {

        // SCENARIO A: Client explicitly says "This is JSON"
        if (requestContentType?.includes("application/json")) {
            try {
                const jsonBody = await request.json();
                finalBody = JSON.stringify(jsonBody);
            } catch (e) {
                console.warn("Client sent content-type:json but body was invalid.");
                finalBody = null; 
            }
        }

        // SCENARIO B: Client didn't specify JSON (Could be "Forgetful Client" OR "File Upload")
        else {
            try {
                // ⚠️ SAFETY CHECK: Don't clone huge files (e.g., > 5MB) to save RAM
                const contentLength = Number(request.headers.get("content-length") || "0");
                
                if (contentLength > 0 && contentLength < 5 * 1024 * 1024) { 
                    // Attempt to peek inside using a CLONE
                    const clone = request.clone();
                    const jsonBody = await clone.json(); // Try parsing the clone
                    
                    // SUCCESS! It was JSON disguised with the wrong label.
                    console.log("Recovered JSON from forgetful client:", jsonBody);
                    finalBody = JSON.stringify(jsonBody);
                    
                    // Force the header to be correct for the backend
                    if (!headers["Content-Type"]) {
                        (headers as any)["Content-Type"] = "application/json";
                    }
                } else {
                    throw new Error("Too big or empty");
                }
            } catch (e) {
                // FAIL! It wasn't JSON (or was too big). 
                // We assume it's a File/Binary.
                // We use the ORIGINAL stream.
                finalBody = request.body; 
                
                // Important: Remove 'Content-Type: application/json' from our default headers
                // so the browser/backend can auto-detect the boundary for files.
                delete (headers as any)["Content-Type"];
                
                // Forward the original content type if it exists
                if (requestContentType) {
                    (headers as any)["Content-Type"] = requestContentType;
                }
            }
        }
    }

    // 2. Forward Request
    const apiResponse = await fetch(backendUrl, {
      method: request.method,
      headers: headers,
      body: finalBody,
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
export async function PATCH(req: NextRequest, ctx: any) { return handleRequest(req, ctx); }