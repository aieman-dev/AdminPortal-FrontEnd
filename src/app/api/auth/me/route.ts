import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get("authToken");

  if (!token) {
    return NextResponse.json({ message: "Not authenticated: No token found." }, { status: 401 });
  }

  try {
    // Forward the request to the C# back-end
    const res = await fetch("https://endodermal-tiffaney-scalelike.ngrok-free.dev/api/Account/me", {
      headers: {
        // THE FIX: Send the token as a Bearer token in the Authorization header
        "Authorization": `Bearer ${token.value}`,
      },
    });

    if (!res.ok) {
        console.log(`Backend API returned ${res.status}.`);
        return NextResponse.json({ message: "Failed to fetch user from backend" }, { status: res.status });
    }

    const userData = await res.json();
    return NextResponse.json(userData);

  } catch (error) {
    console.error("API proxy error in /api/auth/me:", error);
    return NextResponse.json({ message: "An error occurred on the server." }, { status: 500 });
  }
}