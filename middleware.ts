import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const token = req.cookies.get("firebaseToken")?.value;

  if (!token && req.nextUrl.pathname.startsWith("/dashboard")) {
    const loginUrl = new URL("/", req.url);
    return NextResponse.redirect(loginUrl);
  }

  // ✅ Pass token directly to Xano for verification and role check
  try {
    const xanoRes = await fetch(
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
      console.warn("Blocked non-admin user");
      const unauthorizedUrl = new URL("/unauthorized", req.url);
      return NextResponse.redirect(unauthorizedUrl);
    }

    return NextResponse.next();
  } catch (err) {
    console.error("Error verifying user:", err);
    const loginUrl = new URL("/", req.url);
    return NextResponse.redirect(loginUrl);
  }
}

export const config = {
  matcher: ["/dashboard/:path*", "/landing", "/teacher-search"],
};
