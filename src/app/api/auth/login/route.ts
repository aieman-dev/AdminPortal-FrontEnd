import { NextResponse } from "next/server";

export async function POST(req: Request) {
  // Read 'email' and 'password' (lowercase) from the front-end
  const { email, password } = await req.json();

  try {
    // Forward to your C# back-end, sending 'Email' and 'Password' (PascalCase)
    const res = await fetch("https://endodermal-tiffaney-scalelike.ngrok-free.dev/api/Account/login", { // Ensure this URL is correct
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ Email: email, Password: password }), // <-- THE FIX IS HERE
    });

    if (!res.ok) {
      const errorData = await res.json();
      return NextResponse.json({ message: errorData.message || "Invalid credentials" }, { status: 401 });
    }

    const data = await res.json();

    // Set the token received from the C# API into an HttpOnly cookie
    const response = NextResponse.json({ success: true });
    response.cookies.set({
      name: "authToken",
      value: data.token,
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24, // 24 hours
    });

    return response;

  } catch (error) {
    console.error("API proxy error:", error);
    return NextResponse.json({ message: "An error occurred on the server." }, { status: 500 });
  }
}