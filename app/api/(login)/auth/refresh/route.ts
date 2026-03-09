import { NextRequest, NextResponse } from "next/server";
import { BACKEND_API_BASE } from "@/lib/config";
import { cookies } from "next/headers";
import { logger } from "@/lib/logger";

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get("refreshToken")?.value;

  // Retrieve the (potentially expired) access token
  const accessToken = cookieStore.get("accessToken")?.value;

  if (!refreshToken) {
    return NextResponse.json({ message: "No refresh token" }, { status: 401 });
  }

  try {
    const res = await fetch(`${BACKEND_API_BASE}/api/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${accessToken || ""}` },
      body: JSON.stringify({ refreshToken, token: accessToken }),
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
      sameSite: "lax",
      path: "/",
    });

    if (newRefresh) {
        cookieStore.set("refreshToken", newRefresh, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            path: "/",
            expires: new Date(refreshTokenExpiry),
        });
    }

    const newExpiryTimestamp = Date.now() + (24 * 60 * 60 * 1000);
    cookieStore.set("session_expiry", String(newExpiryTimestamp), {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    logger.error("Token refresh failed", { error })
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}