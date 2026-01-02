import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  const cookieStore = await cookies();

  // Force delete the cookies
  cookieStore.delete("accessToken");
  cookieStore.delete("refreshToken");

  return NextResponse.json({ success: true });
}