/* middleware.ts */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/* Protect every /dashboard/* route */
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get("firebaseToken")?.value;

  /* 1 – block if not logged in */
  if (!token && pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  /* 2 – check role with Xano (Xano validates the token) */
  try {
    const base = process.env.NEXT_PUBLIC_XANO_BASE!;
    const res  = await fetch(
      `${base}/admin_dashboard_userDetails`,
      { headers: { Authorization: `Bearer ${token}` } }  // GET by default
    );

    if (!res.ok) throw new Error(`Xano ${res.status}`);
    const data: { role?: string } = await res.json();

    if (data.role !== "admin") {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }
  } catch (err) {
    console.error("Role check failed:", err);
    return NextResponse.redirect(new URL("/", req.url));
  }

  /* 3 – let the request through */
  return NextResponse.next();
}

/* Apply only to dashboard paths */
export const config = { matcher: ["/dashboard/:path*"] };
