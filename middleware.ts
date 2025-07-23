import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Edge middleware to protect /dashboard/* routes:
 * 1) Must have firebaseToken cookie
 * 2) Ask Xano if the user is an admin
 * If checks fail, redirect to login or /unauthorized.
 */

export async function middleware(req: NextRequest) {
  const token = req.cookies.get("firebaseToken")?.value;

  // 1) Redirect to login if unauthenticated
  if (!token && req.nextUrl.pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // 2) Verify role via Xano (Xano validates the token server-side)
  try {
    const base = process.env.NEXT_PUBLIC_XANO_BASE!; // set in Vercel
    const res = await fetch(
      `${base}/admin_dashboard_userDetails`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (!res.ok) throw new Error(`Xano ${res.status}`);

    const data = await res.json();            // { role: "admin" | ... }
    if (data.role !== "admin") {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }
  } catch (err) {
    console.error("Role check failed:", err);
    return NextResponse.redirect(new URL("/", req.url));
  }

  // 3) All good – continue
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
