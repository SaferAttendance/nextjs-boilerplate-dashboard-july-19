import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  try {
    const { token } = await req.json();

    if (!token) {
      return NextResponse.json({ error: "No token provided" }, { status: 400 });
    }

    // Create a response object
    const response = NextResponse.json({ status: "success" });

    // Set secure, HTTP-only cookie with 1-hour expiry
    response.cookies.set("firebaseToken", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60, // 1 hour
      path: "/",
      sameSite: "strict",
    });

    return response;
  } catch (err) {
    console.error("Session error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const response = NextResponse.json({ status: "signed out" });

    // Clear the cookie
    response.cookies.set("firebaseToken", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 0, // Expire immediately
      path: "/",
      sameSite: "strict",
    });

    return response;
  } catch (err) {
    console.error("Session deletion error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
