import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Edge middleware to protect /dashboard/* routes.
 * 1. Ensure firebaseToken cookie exists
 * 2. Ask Xano for user role (Xano validates token)
 * 3. Allow only admin users
 *
 * NOTE: No firebase/auth import – Edge runtime cannot bundle it.
 */

export async function middleware(req: NextRequest) {
  const token = req.cookies.get("firebaseToken")?.value;

  /* 1. Block unauthenticated users on any /dashboard path */
  if (!token && req.nextUrl.pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  /* 2. Ask Xano for role  */
  try {
    const base = process.env.NEXT_PUBLIC_XANO_BASE!;
    const url  = `${base}/admin_dashboard_userDetails`;

    const res  = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      // Endpoint is GET-by-token; change to POST if your Xano expects it
    });

    if (!res.ok) throw new Error(`Xano ${res.status}`);

    const data = await res.json(); // expects { role:"admin" | "teacher" | ... }

    /* 3. Allow only admins */
    if (data.role !== "admin") {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }
  } catch (err) {
    console.error("Role check failed:", err);
    return NextResponse.redirect(new URL("/", req.url));
  }

  /* 4. Success → continue */
  return NextResponse.next();
}

/* Runs on every /dashboard route */
export const config = {
  matcher: ["/dashboard/:path*"],
};
