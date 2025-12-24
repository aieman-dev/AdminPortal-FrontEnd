// lib/server-api.ts
import { cookies } from "next/headers";
import { BACKEND_API_BASE } from "@/lib/config";

// This function can ONLY be used in Server Components (app/page.tsx, layout.tsx)
export async function serverFetch<T>(endpoint: string): Promise<T | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  // 1. If we are on the server, we can skip the Next.js Proxy (/api/proxy)
  // and hit the backend DIRECTLY. This is faster.
  const url = `${BACKEND_API_BASE}/api/${endpoint}`;

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token || ""}`,
        "ngrok-skip-browser-warning": "true", // Keep this if using ngrok
      },
      cache: "no-store", // Ensure fresh data every time
    });

    if (!res.ok) {
      console.error(`ServerFetch Error [${endpoint}]: ${res.status} ${res.statusText}`);
      return null;
    }

    // 2. Return data directly
    const json = await res.json();
    return json as T; // Some backends wrap data in { data: ... }, adjust if needed
  } catch (error) {
    console.error("ServerFetch Fatal:", error);
    return null;
  }
}