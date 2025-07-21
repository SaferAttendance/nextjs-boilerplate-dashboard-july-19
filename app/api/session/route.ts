import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  try {
    const { token } = await req.json();

    if (!token) {
      return NextResponse.json({ error: "No token provided" }, { status: 400 });
    }

    // Set secure, HTTP-only cookie with 1-hour expiry
    cookies().set("firebaseToken", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60, // 1 hour
      path: "/",
      sameSite: "strict",
    });

    return NextResponse.json({ status: "success" });
  } catch (err) {
    console.error("Session error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    // Clear the cookie
    cookies().delete("firebaseToken");
    return NextResponse.json({ status: "signed out" });
  } catch (err) {
    console.error("Session deletion error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
