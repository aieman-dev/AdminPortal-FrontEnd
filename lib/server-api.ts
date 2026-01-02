// lib/server-api.ts
import { cookies, headers } from "next/headers";
import { BACKEND_API_BASE } from "@/lib/config";

// This function can ONLY be used in Server Components
export async function serverFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T | null> {
  
  // 1. Try to get Token from Request Header (set by Middleware during refresh)
  const headersList = await headers();
  let token = headersList.get("x-access-token");

  // 2. If not in header, get from Cookie (standard case)
  if (!token) {
    const cookieStore = await cookies();
    token = cookieStore.get("accessToken")?.value || null;
  }

  const url = `${BACKEND_API_BASE}/api/${endpoint}`;

  try {
    const res = await fetch(url, {
      method: options.method || "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token || ""}`,
        "ngrok-skip-browser-warning": "true",
        ...options.headers, 
      },
      ...options,
      cache: "no-store",
    });

    if (!res.ok) {
      console.error(`ServerFetch Error [${endpoint}]: ${res.status} ${res.statusText}`);
      return null;
    }

    const json = await res.json();
    return json as T; 
  } catch (error) {
    console.error("ServerFetch Fatal:", error);
    return null;
  }
}