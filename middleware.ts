import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/firebaseClient"; // your firebaseClient.ts

export async function middleware(req: NextRequest) {
  const token = req.cookies.get("firebaseToken")?.value;

  // Redirect to login if no Firebase token
  if (!token && req.nextUrl.pathname.startsWith("/dashboard")) {
    const loginUrl = new URL("/", req.url);
    return NextResponse.redirect(loginUrl);
  }

  // ✅ Verify token with Firebase
  // ✅ Pass token directly to Xano for verification and role check
  try {
    const decodedToken = await auth.verifyIdToken(token);
    const email = decodedToken.email;

    // ✅ Call Xano API to check role
    const xanoRes = await fetch(
      `https://x8ki-letl-twmt.n7.xano.io/api:wWEItDWL/admin_dashboard_userDetails?email=${email}`
      `https://your-xano.com/admin_dashboard_userDetails`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // Pass token as Bearer
        },
      }
    );

    const userData = await xanoRes.json();

    if (userData.role !== "admin") {
      console.warn("Blocked non-admin user:", email);
      console.warn("Blocked non-admin user");
      const unauthorizedUrl = new URL("/unauthorized", req.url);
      return NextResponse.redirect(unauthorizedUrl);
    }

    // ✅ User is admin, let them through
    return NextResponse.next();
  } catch (err) {
    console.error("Error verifying Firebase token or role:", err);
    console.error("Error verifying user:", err);
    const loginUrl = new URL("/", req.url);
    return NextResponse.redirect(loginUrl);
  }
}

// Apply middleware to /dashboard routes
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/landing",
    "/teacher-search"
  ],
  matcher: ["/dashboard/:path*", "/landing", "/teacher-search"],
};
