import { NextResponse } from "next/server";
import { BACKEND_API_BASE } from "@/lib/config";
import { cookies } from "next/headers";

// Force dynamic execution (no caching) so we get real-time status
export const dynamic = 'force-dynamic';

export async function GET() {
  const report = {
    status: "healthy",
    checks: [] as any[],
    timestamp: new Date().toISOString()
  };

  // --- CHECK 1: Core Backend (.NET API) ---
  const startBackend = performance.now();
  try {
    // 1. Get the token from cookies
    const cookieStore = await cookies();
    const token = cookieStore.get("accessToken")?.value;

    // 2. Prepare headers with Auth
    const headers: HeadersInit = { 
        "ngrok-skip-browser-warning": "true",
        "Content-Type": "application/json"
    };
    
    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    // 3. Call Endpoint (creationdata requires auth)
    const res = await fetch(`${BACKEND_API_BASE}/api/Package/creationdata`, { 
      method: "GET",
      signal: AbortSignal.timeout(10000), 
      headers: headers 
    });
    
    const latency = Math.round(performance.now() - startBackend);
    
    report.checks.push({
      id: "backend",
      name: "Backend API",
      status: res.ok ? "UP" : "DOWN",
      latency: `${latency}ms`,
      message: res.ok ? "Connection Stable" : `Error ${res.status}: ${res.statusText}`
    });

    if (!res.ok) report.status = "critical";

  } catch (error) {
    report.checks.push({
      id: "backend",
      name: "Backend API",
      status: "DOWN",
      latency: "N/A",
      message: error instanceof Error ? error.message : "Connection Refused"
    });
    report.status = "critical";
  }

  // --- CHECK 2: Public Internet (Can server reach outside?) ---
  const startNet = performance.now();
  try {
    // Ping Google to check if the server itself has internet
    const res = await fetch("https://www.google.com", { method: "HEAD", signal: AbortSignal.timeout(3000) });
    const latency = Math.round(performance.now() - startNet);
    
    report.checks.push({
      id: "internet",
      name: "Public Internet",
      status: res.ok ? "UP" : "DOWN",
      latency: `${latency}ms`,
      message: "Gateway Reachable"
    });
  } catch (error) {
    report.checks.push({
      id: "internet",
      name: "Public Internet",
      status: "DOWN",
      latency: "N/A",
      message: "Server offline or DNS issue"
    });
    // Internet down is 'degraded' but maybe local backend still works
    if (report.status !== "critical") report.status = "degraded"; 
  }

  return NextResponse.json(report);
}