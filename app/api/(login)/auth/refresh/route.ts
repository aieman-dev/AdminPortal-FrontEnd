import { NextRequest, NextResponse } from "next/server";
import { BACKEND_API_BASE } from "@/lib/config";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get("refreshToken")?.value;

  if (!refreshToken) {
    return NextResponse.json({ message: "No refresh token" }, { status: 401 });
  }

  try {
    // Call Backend Refresh
    const res = await fetch(`${BACKEND_API_BASE}/api/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    const data = await res.json();

    if (data.statusCode !== 200) {
      return NextResponse.json({ message: "Refresh failed" }, { status: 401 });
    }

    // Update Cookies with NEW tokens
    const { token, refreshToken: newRefresh, refreshTokenExpiry } = data.content;

    cookieStore.set("accessToken", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
    });

    cookieStore.set("refreshToken", newRefresh, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      expires: new Date(refreshTokenExpiry),
    });

    const newExpiryTimestamp = Date.now() + (24 * 60 * 60 * 1000);

    cookieStore.set("session_expiry", String(newExpiryTimestamp), {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}