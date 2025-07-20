import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/firebaseClient"; // uses your firebaseClient.ts

export async function middleware(req: NextRequest) {
  const token = req.cookies.get("firebaseToken")?.value;

  // If there’s no token, redirect to login
  if (!token && req.nextUrl.pathname.startsWith("/dashboard")) {
    const loginUrl = new URL("/", req.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

// Apply middleware to /dashboard routes
export const config = {
  matcher: ["/dashboard/:path*"], // applies to /dashboard and subpages
};
