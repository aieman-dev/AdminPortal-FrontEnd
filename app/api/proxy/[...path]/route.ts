// app/api/proxy/[...path]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { BACKEND_API_BASE } from "@/lib/config";
import { cookies } from "next/headers";
import { logger } from "@/lib/logger";

async function handleRequest(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const resolvedParams = await params;
  const path = resolvedParams.path.join("/"); 
  const query = request.nextUrl.search;
  const backendUrl = `${BACKEND_API_BASE}/api/${path}${query}`;
  
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("accessToken")?.value;

  // 1. Prepare Headers
  const headers = new Headers(request.headers);
  headers.set("ngrok-skip-browser-warning", "true");
  
  // Remove host headers to prevent conflicts
  headers.delete("host");
  headers.delete("connection");
  headers.delete("content-length"); // Let fetch recalculate this

  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  try {
    const method = request.method;
    const body = (method === "GET" || method === "HEAD") ? undefined : request.body;

    // 2. Stream the request directly (No Cloning, No Parsing)
    // This pipes the data straight to the backend with zero memory overhead
    const apiResponse = await fetch(backendUrl, {
      method,
      headers,
      body: body as any, // Cast to any to satisfy TS types for BodyInit
      cache: "no-store",
      // @ts-ignore - 'duplex' is a valid option in Node/Next.js fetch but missing in some type defs
      duplex: "half" 
    });

    // 3. Handle Response
    const responseBody = apiResponse.body;
    
    // Forward the status and headers exactly as received
    const newHeaders = new Headers(apiResponse.headers);
    
    // Security: Clean up headers we don't want to leak
    newHeaders.delete("www-authenticate");

    return new NextResponse(responseBody as any, {
      status: apiResponse.status,
      statusText: apiResponse.statusText,
      headers: newHeaders,
    });

  } catch (error) {
    logger.error("Proxy routing error", { path, error })
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest, ctx: any) { return handleRequest(req, ctx); }
export async function POST(req: NextRequest, ctx: any) { return handleRequest(req, ctx); }
export async function PUT(req: NextRequest, ctx: any) { return handleRequest(req, ctx); }
export async function DELETE(req: NextRequest, ctx: any) { return handleRequest(req, ctx); }
export async function PATCH(req: NextRequest, ctx: any) { return handleRequest(req, ctx); }